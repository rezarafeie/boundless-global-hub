import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Testing enrollment email system...');
    
    // Test enrollment ID
    const enrollmentId = 'e1919b83-0dec-499c-85bd-6d8457f98eba';
    
    // Get enrollment details
    console.log('📋 Fetching enrollment details...');
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (title, description, redirect_url)
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      console.error('❌ Enrollment error:', enrollmentError);
      throw new Error('Enrollment not found');
    }
    
    console.log('✅ Enrollment found:', {
      id: enrollment.id,
      email: enrollment.email,
      course: enrollment.courses?.title,
      status: enrollment.payment_status
    });

    // Get Gmail credentials
    console.log('📧 Checking Gmail credentials...');
    const { data: credentials, error: credError } = await supabase
      .from('gmail_credentials')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (credError || !credentials) {
      console.error('❌ Gmail credentials error:', credError);
      throw new Error('Gmail not configured');
    }
    
    console.log('✅ Gmail credentials found:', credentials.email_address);

    // Get email template
    console.log('📝 Fetching email template...');
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .is('course_id', null)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();

    if (templateError || !template) {
      console.error('❌ Template error:', templateError);
      throw new Error('No email template found');
    }
    
    console.log('✅ Template found:', template.name);

    // Actually send a test email
    console.log('📧 Sending test email...');
    try {
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-enrollment-email', {
        body: { enrollmentId: enrollment.id }
      });

      if (emailError) {
        console.error('❌ Email sending failed:', emailError);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Email sending failed: ${emailError.message}`,
          enrollment: {
            id: enrollment.id,
            email: enrollment.email,
            course: enrollment.courses?.title,
            status: enrollment.payment_status
          },
          gmail: credentials.email_address,
          template: template.name
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Test email sent successfully:', emailResult);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Test email sent successfully',
        enrollment: {
          id: enrollment.id,
          email: enrollment.email,
          course: enrollment.courses?.title,
          status: enrollment.payment_status
        },
        gmail: credentials.email_address,
        template: template.name,
        emailResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (emailSendError) {
      console.error('❌ Email sending exception:', emailSendError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Email sending exception: ${emailSendError.message}`,
        enrollment: {
          id: enrollment.id,
          email: enrollment.email,
          course: enrollment.courses?.title,
          status: enrollment.payment_status
        },
        gmail: credentials.email_address,
        template: template.name
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});