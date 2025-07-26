import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { eventType, payload, enrollment, user, course } = body;

    console.log('📤 Processing webhook request for event:', eventType);

    // Handle both new format (eventType + payload) and legacy format (enrollment + user + course)
    let finalEventType = eventType;
    let finalPayload = payload;

    if (!eventType && enrollment && course) {
      // Legacy format - convert to new format and add admin access link
      finalEventType = 'enrollment_created';
      const enhancedUser = enhanceUserData(user);
      const baseUrl = 'https://academy.rafiei.net';
      const adminAccessLink = `${baseUrl}/admin-enrollment-details?id=${enrollment.id}`;
      
      finalPayload = {
        event_type: 'enrollment_created',
        timestamp: new Date().toISOString(),
        data: { 
          enrollment, 
          user: enhancedUser, 
          course,
          admin_access_link: adminAccessLink
        }
      };
    }

    if (!finalEventType || !finalPayload) {
      throw new Error('Invalid webhook request format');
    }

    // Get active webhook configurations for this event type
    // If payload contains course information, filter by course-specific webhooks
    let webhookQuery = supabase
      .from('webhook_configurations')
      .select('*')
      .eq('event_type', finalEventType)
      .eq('is_active', true);

    // If we have course data in the payload, include course-specific webhooks
    if (finalPayload?.data?.course?.id) {
      webhookQuery = webhookQuery.or(`course_id.is.null,course_id.eq.${finalPayload.data.course.id}`);
    } else {
      // If no course data, only get global webhooks (course_id is null)
      webhookQuery = webhookQuery.is('course_id', null);
    }

    const { data: webhookConfigs, error: configError } = await webhookQuery;

    if (configError) {
      console.error('Error fetching webhook configurations:', configError);
      throw configError;
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      console.log(`No active webhooks found for event type: ${finalEventType}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No active webhooks configured for event: ${finalEventType}`,
          webhooks_sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${webhookConfigs.length} active webhook(s) for event: ${finalEventType}`);

    // Send webhook to each configured endpoint
    const webhookResults = await Promise.allSettled(
      webhookConfigs.map(async (config) => {
        try {
          // Enhance user data if payload contains user data
          let enhancedPayload = finalPayload;
          if (finalPayload?.data?.user) {
            enhancedPayload = {
              ...finalPayload,
              data: {
                ...finalPayload.data,
                user: enhanceUserData(finalPayload.data.user)
              }
            };
          }
          
          // Merge payload with body template if provided
          let finalWebhookPayload = enhancedPayload;
          if (config.body_template) {
            finalWebhookPayload = mergeTemplate(config.body_template, enhancedPayload);
          }

          // Send webhook
          const webhookResponse = await fetch(config.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.headers || {})
            },
            body: JSON.stringify(finalWebhookPayload),
          });

          const responseBody = await webhookResponse.text();
          const success = webhookResponse.ok;

          // Log webhook execution
          await supabase
            .from('webhook_logs')
            .insert({
              webhook_config_id: config.id,
              event_type: finalEventType,
              payload: finalPayload,
              response_status: webhookResponse.status,
              response_body: responseBody,
              success: success,
              error_message: success ? null : `HTTP ${webhookResponse.status}: ${responseBody}`
            });

          if (!success) {
            throw new Error(`Webhook failed with status ${webhookResponse.status}: ${responseBody}`);
          }

          console.log(`✅ Webhook sent successfully to ${config.name} (${config.url})`);
          return { success: true, config: config.name };

        } catch (error) {
          console.error(`❌ Webhook failed for ${config.name}:`, error);
          
          // Log error
          await supabase
            .from('webhook_logs')
            .insert({
              webhook_config_id: config.id,
              event_type: finalEventType,
              payload: finalPayload,
              response_status: 0,
              response_body: '',
              success: false,
              error_message: error.message
            });

          return { success: false, config: config.name, error: error.message };
        }
      })
    );

    const successCount = webhookResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failedCount = webhookResults.length - successCount;

    console.log(`📊 Webhook summary: ${successCount} succeeded, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processing completed',
        webhooks_sent: successCount,
        webhooks_failed: failedCount,
        results: webhookResults.map(result => 
          result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
        )
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to process webhook',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Helper function to enhance user data with firstname and lastname
function enhanceUserData(userData: any): any {
  if (!userData) return userData;

  const enhanced = { ...userData };
  
  // If we have full_name but not firstname/lastname, split them
  if (userData.full_name && (!userData.firstname || !userData.lastname)) {
    const nameParts = userData.full_name.trim().split(' ');
    enhanced.firstname = nameParts[0] || '';
    enhanced.lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  
  // If we have first_name/last_name but not firstname/lastname, map them
  if (userData.first_name && !enhanced.firstname) {
    enhanced.firstname = userData.first_name;
  }
  if (userData.last_name && !enhanced.lastname) {
    enhanced.lastname = userData.last_name;
  }
  
  // If we have name but not full_name or firstname/lastname, use it
  if (userData.name && !enhanced.full_name && !enhanced.firstname) {
    enhanced.full_name = userData.name;
    const nameParts = userData.name.trim().split(' ');
    enhanced.firstname = nameParts[0] || '';
    enhanced.lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }

  return enhanced;
}

// Helper function to merge template with payload
function mergeTemplate(template: any, payload: any): any {
  if (typeof template === 'string') {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      return getNestedValue(payload, path.trim()) || match;
    });
  }
  
  if (Array.isArray(template)) {
    return template.map(item => mergeTemplate(item, payload));
  }
  
  if (typeof template === 'object' && template !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = mergeTemplate(value, payload);
    }
    return result;
  }
  
  return template;
}

// Helper function to get nested value from object using path string
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}