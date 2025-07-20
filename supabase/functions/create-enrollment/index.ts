
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Create enrollment function called');
    
    // Create Supabase client with service role for elevated privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (req.method !== 'POST') {
      throw new Error('Only POST method allowed');
    }

    const body = await req.json();
    console.log('📥 Request body received:', body);

    const {
      course_id,
      full_name,
      email,
      phone,
      payment_amount,
      payment_method,
      manual_payment_status,
      receipt_url,
      chat_user_id
    } = body;

    // Validate required fields
    if (!course_id || !full_name || !email || !phone || !payment_amount) {
      throw new Error('Missing required fields');
    }

    console.log('✅ Validation passed, creating enrollment...');

    // Try to find existing chat_user by phone or email if not provided
    let resolvedChatUserId = chat_user_id;
    if (!resolvedChatUserId) {
      const { data: existingUser } = await supabase
        .from('chat_users')
        .select('id')
        .or(`phone.eq.${phone.trim()},email.eq.${email.trim().toLowerCase()}`)
        .single();
      
      if (existingUser) {
        resolvedChatUserId = existingUser.id;
        console.log('🔗 Found existing chat_user:', resolvedChatUserId);
      }
    }

    // Create enrollment record with service role privileges
    const { data: createdEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        course_id,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        payment_amount,
        payment_status: 'pending',
        payment_method: payment_method || 'manual',
        manual_payment_status: manual_payment_status || 'pending',
        receipt_url,
        chat_user_id: resolvedChatUserId
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('❌ Enrollment creation error:', enrollmentError);
      throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
    }

    console.log('✅ Enrollment created successfully:', createdEnrollment);

    // If enrollment is successful (completed payment), send webhook
    if (createdEnrollment.payment_status === 'completed' || createdEnrollment.payment_status === 'success') {
      try {
        // Get course details
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', course_id)
          .single();

        // Get user details if chat_user_id exists
        let userData = null;
        if (resolvedChatUserId) {
          const { data: userInfo } = await supabase
            .from('chat_users')
            .select('*')
            .eq('id', resolvedChatUserId)
            .single();
          userData = userInfo;
        }

        // Send webhook
        const webhookPayload = {
          enrollment: createdEnrollment,
          user: userData || {
            name: full_name,
            email: email,
            phone: phone
          },
          course: courseData
        };

        console.log('📤 Sending enrollment webhook...');

        // Call webhook directly to Make.com
        const webhookResponse = await fetch('https://hook.us1.make.com/m9ita6qaswo7ysgx0c4vy1c34kl0x9ij', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            event_type: 'course_enrollment_success',
            user_data: userData || {
              name: full_name,
              email: email,
              phone: phone
            },
            course_data: courseData,
            enrollment_data: createdEnrollment
          }),
        });

        if (webhookResponse.ok) {
          console.log('✅ Webhook sent successfully!');
        } else {
          console.error('❌ Webhook failed:', webhookResponse.status, await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error('❌ Webhook error (non-blocking):', webhookError);
        // Don't fail the enrollment if webhook fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        enrollment: createdEnrollment,
        message: 'Enrollment created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
