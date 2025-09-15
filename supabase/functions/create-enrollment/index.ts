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
      chat_user_id,
      country_code,
      payment_status
    } = body;

    // Validate required fields
    if (!course_id || !full_name || !email || !phone || (payment_amount === null || payment_amount === undefined)) {
      console.error('❌ Validation failed. Missing fields:', {
        course_id: !!course_id,
        full_name: !!full_name,
        email: !!email,
        phone: !!phone,
        payment_amount: payment_amount !== null && payment_amount !== undefined
      });
      throw new Error('Missing required fields: course_id, full_name, email, phone, payment_amount are required');
    }

    console.log('✅ Validation passed, processing enrollment...');

    // Find or create chat_user
    let resolvedChatUserId = chat_user_id;
    
    if (!resolvedChatUserId) {
      console.log('🔍 Looking for existing chat_user by email...');
      
      // First check by email
      const { data: existingUser } = await supabase
        .from('chat_users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        resolvedChatUserId = existingUser.id;
        console.log('✅ Found existing user by email, using ID:', resolvedChatUserId);
      } else {
        console.log('🔍 No user found by email, checking by phone...');
        
        // If not found by email, check by phone
        const { data: phoneUser } = await supabase
          .from('chat_users')
          .select('id')
          .eq('phone', phone.trim())
          .maybeSingle();
        
        if (phoneUser) {
          resolvedChatUserId = phoneUser.id;
          console.log('✅ Found existing user by phone, using ID:', resolvedChatUserId);
        } else {
          console.log('👤 Creating new chat_user...');
          
          // Create new user
          const { data: newUser, error: createUserError } = await supabase
            .from('chat_users')
            .insert({
              name: full_name.trim(),
              phone: phone.trim(),
              email: email.trim().toLowerCase(),
              first_name: full_name.trim().split(' ')[0],
              last_name: full_name.trim().split(' ').slice(1).join(' ') || '',
              full_name: full_name.trim(),
              country_code: country_code || '+98',
              signup_source: 'enrollment',
              is_approved: true,
              role: 'user'
            })
            .select('id')
            .single();
          
          if (createUserError) {
            console.error('❌ Error creating chat_user:', createUserError);
            
            // Handle duplicate email/phone errors by finding the existing user
            if (createUserError.code === '23505') {
              console.log('🔄 Duplicate detected, finding existing user...');
              const { data: foundUser } = await supabase
                .from('chat_users')
                .select('id')
                .or(`phone.eq.${phone.trim()},email.eq.${email.trim().toLowerCase()}`)
                .single();
              
              if (foundUser) {
                resolvedChatUserId = foundUser.id;
                console.log('🔗 Using existing user after duplicate error:', resolvedChatUserId);
              } else {
                throw new Error('Could not find or create user after duplicate error');
              }
            } else {
              throw createUserError;
            }
          } else if (newUser) {
            resolvedChatUserId = newUser.id;
            console.log('✅ Created new chat_user:', resolvedChatUserId);
          }
        }
      }
    }

    if (!resolvedChatUserId) {
      throw new Error('Could not resolve or create chat_user');
    }
    
    console.log('👤 Using chat_user_id:', resolvedChatUserId);

    // Check if enrollment already exists by email and phone (more comprehensive check)
    const { data: existingEnrollmentByEmail } = await supabase
      .from('enrollments')
      .select('id, payment_status, chat_user_id')
      .eq('course_id', course_id)
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingEnrollmentByEmail) {
      console.log('📋 Found existing enrollment by email:', existingEnrollmentByEmail.id);
      
      const { data: fullEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', existingEnrollmentByEmail.id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          enrollment: fullEnrollment,
          message: 'User already enrolled in this course'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Also check by phone
    const { data: existingEnrollmentByPhone } = await supabase
      .from('enrollments')
      .select('id, payment_status, chat_user_id')
      .eq('course_id', course_id)
      .eq('phone', phone.trim())
      .maybeSingle();

    if (existingEnrollmentByPhone) {
      console.log('📋 Found existing enrollment by phone:', existingEnrollmentByPhone.id);
      
      const { data: fullEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', existingEnrollmentByPhone.id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          enrollment: fullEnrollment,
          message: 'User already enrolled in this course'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Determine final payment status
    const finalPaymentStatus = payment_amount === 0 ? 'completed' : (payment_status || 'pending');

    console.log('🎯 Creating new enrollment...');

    // Create enrollment record - use existing user's actual data to avoid trigger conflicts
    let enrollmentData;
    if (resolvedChatUserId) {
      // Get the actual user data to ensure consistency
      const { data: actualUser } = await supabase
        .from('chat_users')
        .select('phone, email, name, full_name')
        .eq('id', resolvedChatUserId)
        .single();
      
      console.log('📋 Using actual user data for enrollment:', actualUser);
      
      enrollmentData = {
        course_id,
        full_name: actualUser?.full_name || actualUser?.name || full_name.trim(),
        email: actualUser?.email || email.trim().toLowerCase(),
        phone: actualUser?.phone || phone.trim(),
        payment_amount: Number(payment_amount),
        payment_status: finalPaymentStatus,
        payment_method: payment_method || 'manual',
        manual_payment_status: manual_payment_status || null,
        receipt_url,
        chat_user_id: resolvedChatUserId,
        country_code: country_code || '+98'
      };
    } else {
      enrollmentData = {
        course_id,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        payment_amount: Number(payment_amount),
        payment_status: finalPaymentStatus,
        payment_method: payment_method || 'manual',
        manual_payment_status: manual_payment_status || null,
        receipt_url,
        country_code: country_code || '+98'
      };
    }

    const { data: createdEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollmentError) {
      console.error('❌ Enrollment creation error:', enrollmentError);
      throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
    }

    console.log('✅ Enrollment created successfully:', createdEnrollment);

    // Get course details for webhook
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single();

    // Get user details
    let userData = null;
    if (resolvedChatUserId) {
      const { data: userInfo } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', resolvedChatUserId)
        .single();
      userData = userInfo;
    }

    // Send enrollment email for completed payments (free courses or completed payments)
    if (createdEnrollment.payment_status === 'completed') {
      try {
        console.log('📧 Sending enrollment email for completed payment...');
        
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enrollmentId: createdEnrollment.id })
        });

        if (emailResponse.ok) {
          console.log('✅ Enrollment email sent successfully');
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ Enrollment email failed:', errorText);
        }
      } catch (emailError) {
        console.error('❌ Enrollment email error (non-blocking):', emailError);
      }
    }

    // Send enrollment webhook
    try {
      console.log('📤 Sending enrollment_created webhook...');

      const eventType = createdEnrollment.payment_method === 'manual' && createdEnrollment.payment_status === 'pending' 
        ? 'enrollment_manual_payment_submitted'
        : 'enrollment_created';

      const webhookPayload = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        data: {
          enrollment: createdEnrollment,
          user: userData || {
            name: full_name,
            email: email,
            phone: phone,
            country_code: country_code || '+98'
          },
          course: courseData,
          is_free_enrollment: createdEnrollment.payment_amount === 0,
          enrollment_type: createdEnrollment.payment_amount === 0 ? 'free' : 'paid',
          is_manual_payment: createdEnrollment.payment_method === 'manual'
        }
      };

      const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: eventType,
          payload: webhookPayload
        })
      });

      if (webhookResponse.ok) {
        console.log('✅ Enrollment webhook sent successfully');
      } else {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook failed:', webhookResponse.status, errorText);
      }
    } catch (webhookError) {
      console.error('❌ Webhook error (non-blocking):', webhookError);
    }

    // Create SpotPlayer license for free courses if enabled
    if (payment_amount === 0 && courseData?.is_spotplayer_enabled) {
      try {
        console.log('🎮 Creating SpotPlayer license for free course...');
        
        const licenseResponse = await fetch(`${supabaseUrl}/functions/v1/create-spotplayer-license`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            enrollmentId: createdEnrollment.id,
            userFullName: full_name,
            userPhone: phone,
            courseId: course_id
          })
        });

        if (licenseResponse.ok) {
          console.log('✅ SpotPlayer license created for free course');
        } else {
          const errorText = await licenseResponse.text();
          console.error('❌ SpotPlayer license creation failed:', errorText);
        }
      } catch (licenseError) {
        console.error('❌ SpotPlayer license error (non-blocking):', licenseError);
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