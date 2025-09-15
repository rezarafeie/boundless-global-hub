import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentId, action, adminNotes } = await req.json();

    if (!enrollmentId || !action || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing manual payment ${action} for enrollment:`, enrollmentId);

    // Get enrollment details
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses!inner(
          id, title, slug, redirect_url, support_activation_required,
          telegram_activation_required, smart_activation_enabled,
          smart_activation_telegram_link, telegram_channel_link,
          support_link, gifts_link, enable_course_access,
          woocommerce_create_access, is_spotplayer_enabled,
          spotplayer_course_id
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return new Response(
        JSON.stringify({ error: 'Enrollment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update enrollment based on action
    const updateData: any = {
      manual_payment_status: action === 'approve' ? 'approved' : 'rejected',
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.payment_status = 'completed';
      updateData.approved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollmentId);

    if (updateError) {
      console.error('Error updating enrollment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update enrollment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send enrollment email if approved
    if (action === 'approve') {
      try {
        console.log('Sending enrollment email for approved manual payment...');
        
        const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-enrollment-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enrollmentId })
        });

        if (emailResponse.ok) {
          console.log('Enrollment email sent successfully');
        } else {
          const errorText = await emailResponse.text();
          console.error('Failed to send enrollment email:', errorText);
        }
      } catch (emailError) {
        console.error('Error sending enrollment email (non-blocking):', emailError);
      }

      // Send approval webhook
      try {
        console.log('Sending manual payment approval webhook...');
        
        const webhookPayload = {
          event_type: 'enrollment_manual_payment_approved',
          timestamp: new Date().toISOString(),
          data: {
            enrollment: { ...enrollment, ...updateData },
            user: {
              name: enrollment.full_name,
              email: enrollment.email,
              phone: enrollment.phone,
              country_code: enrollment.country_code
            },
            course: enrollment.courses,
            admin_notes: adminNotes
          }
        };

        const webhookResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'enrollment_manual_payment_approved',
            payload: webhookPayload
          })
        });

        if (webhookResponse.ok) {
          console.log('Manual payment approval webhook sent successfully');
        } else {
          const errorText = await webhookResponse.text();
          console.error('Failed to send approval webhook:', errorText);
        }
      } catch (webhookError) {
        console.error('Error sending approval webhook (non-blocking):', webhookError);
      }
    } else {
      // Send rejection webhook
      try {
        console.log('Sending manual payment rejection webhook...');
        
        const webhookPayload = {
          event_type: 'enrollment_manual_payment_rejected',
          timestamp: new Date().toISOString(),
          data: {
            enrollment: { ...enrollment, ...updateData },
            user: {
              name: enrollment.full_name,
              email: enrollment.email,
              phone: enrollment.phone,
              country_code: enrollment.country_code
            },
            course: enrollment.courses,
            admin_notes: adminNotes
          }
        };

        const webhookResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'enrollment_manual_payment_rejected',
            payload: webhookPayload
          })
        });

        if (webhookResponse.ok) {
          console.log('Manual payment rejection webhook sent successfully');
        } else {
          const errorText = await webhookResponse.text();
          console.error('Failed to send rejection webhook:', errorText);
        }
      } catch (webhookError) {
        console.error('Error sending rejection webhook (non-blocking):', webhookError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Manual payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Manual payment approval error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});