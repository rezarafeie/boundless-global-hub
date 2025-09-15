
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

    // Validate required fields - handle both null and undefined
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

    console.log('✅ Validation passed, creating enrollment...');

    // Try to find existing chat_user by email first, then by phone if not provided
    let resolvedChatUserId = chat_user_id;
    if (!resolvedChatUserId) {
      console.log('🔍 Looking for existing chat_user...');
      
      // First try to find by email (more reliable)
      let existingUser = null;
      try {
        const { data: emailUser, error: emailError } = await supabase
          .from('chat_users')
          .select('id, phone, email, name, full_name')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        
        console.log('Email lookup result:', { emailUser, emailError });
        
        if (emailUser) {
          existingUser = emailUser;
          console.log('🔗 Found existing user by email:', existingUser.id);
        } else if (!emailError) {
          // If not found by email, try by phone
          const { data: phoneUser, error: phoneError } = await supabase
            .from('chat_users')
            .select('id, phone, email, name, full_name')
            .eq('phone', phone.trim())
            .maybeSingle();
          
          console.log('Phone lookup result:', { phoneUser, phoneError });
          
          if (phoneUser) {
            existingUser = phoneUser;
            console.log('🔗 Found existing user by phone:', existingUser.id);
          }
        }
      } catch (lookupError) {
        console.error('❌ Error during user lookup:', lookupError);
      }
      
      if (existingUser) {
        resolvedChatUserId = existingUser.id;
        console.log('✅ Using existing chat_user:', resolvedChatUserId);
        
        // Update existing user with any missing information
        const updateData: any = {};
        if (!existingUser.email && email) {
          updateData.email = email.trim().toLowerCase();
        }
        if (!existingUser.phone && phone) {
          updateData.phone = phone.trim();
        }
        if (!existingUser.name || !existingUser.full_name) {
          updateData.name = full_name.trim();
          updateData.full_name = full_name.trim();
          updateData.first_name = full_name.trim().split(' ')[0];
          updateData.last_name = full_name.trim().split(' ').slice(1).join(' ') || '';
        }
        
        if (Object.keys(updateData).length > 0) {
          console.log('🔄 Updating existing user with missing data:', updateData);
          try {
            const { error: updateError } = await supabase
              .from('chat_users')
              .update(updateData)
              .eq('id', existingUser.id);
            
            if (updateError) {
              console.warn('⚠️ Could not update existing user:', updateError);
            } else {
              console.log('✅ User updated successfully');
            }
          } catch (updateError) {
            console.warn('⚠️ Exception during user update:', updateError);
          }
        }
      } else {
        // Create new chat_user only if none exists
        console.log('👤 Creating new chat_user...');
        try {
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
            // If user creation fails due to duplicate, try to find the user one more time
            if (createUserError.code === '23505') {
              console.log('🔄 Duplicate detected during creation, finding existing user...');
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
        } catch (createError) {
          console.error('❌ Exception during user creation:', createError);
          throw createError;
        }
      }
    }

    // Ensure we have a chat_user_id before proceeding
    if (!resolvedChatUserId) {
      throw new Error('Could not resolve or create chat_user');
    }
    
    console.log('👤 Using chat_user_id:', resolvedChatUserId);

    // Check if enrollment already exists for this user and course
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, payment_status')
      .eq('course_id', course_id)
      .eq('chat_user_id', resolvedChatUserId)
      .maybeSingle();

    if (existingEnrollment) {
      console.log('📋 Found existing enrollment:', existingEnrollment.id);
      
      // Return the existing enrollment instead of creating a new one
      const { data: fullEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', existingEnrollment.id)
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

    // Determine final payment status - free courses should be 'completed'
    const finalPaymentStatus = payment_amount === 0 ? 'completed' : (payment_status || 'pending');

    // Create enrollment record with service role privileges
    const { data: createdEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        course_id,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        payment_amount: Number(payment_amount), // Ensure it's a number
        payment_status: finalPaymentStatus,
        payment_method: payment_method || 'manual',
        manual_payment_status: manual_payment_status || null,
        receipt_url,
        chat_user_id: resolvedChatUserId,
        country_code: country_code || '+98'
      })
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

    // Always send enrollment_created webhook
    try {
      console.log('📤 Sending enrollment_created webhook...');
      console.log('🎯 Free course enrollment details:', {
        payment_amount: createdEnrollment.payment_amount,
        payment_status: createdEnrollment.payment_status,
        payment_method: createdEnrollment.payment_method
      });

      const webhookPayload = {
        event_type: 'enrollment_created',
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
          // Add explicit markers for free course enrollments
          is_free_enrollment: createdEnrollment.payment_amount === 0,
          enrollment_type: createdEnrollment.payment_amount === 0 ? 'free' : 'paid'
        }
      };

      const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: 'enrollment_created',
          payload: webhookPayload
        })
      });

      if (webhookResponse.ok) {
        console.log('✅ Enrollment created webhook sent successfully');
      } else {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook failed:', webhookResponse.status, errorText);
      }
    } catch (webhookError) {
      console.error('❌ Webhook error (non-blocking):', webhookError);
    }

    // For free courses (payment_amount = 0), also create SpotPlayer license if enabled
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
