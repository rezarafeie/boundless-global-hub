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
    console.log('🔐 Manual payment approval function called');
    
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

    const { enrollmentId, action, approvedBy } = body; // action: 'approve' or 'reject'

    if (!enrollmentId || !action) {
      throw new Error('Missing required fields: enrollmentId and action are required');
    }

    // Get the enrollment
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      console.error('❌ Enrollment not found:', fetchError);
      throw new Error('Enrollment not found');
    }

    console.log('✅ Enrollment found:', enrollment.email, enrollment.courses?.title);

    if (enrollment.payment_method !== 'manual') {
      throw new Error('This enrollment is not a manual payment');
    }

    // Update enrollment status based on action
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.manual_payment_status = 'approved';
      updateData.payment_status = 'completed';
      updateData.approved_by = approvedBy || 'admin';
      updateData.approved_at = new Date().toISOString();
    } else if (action === 'reject') {
      updateData.manual_payment_status = 'rejected';
      updateData.payment_status = 'failed';
    } else {
      throw new Error('Invalid action. Must be "approve" or "reject"');
    }

    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollmentId)
      .select('*, courses(*)')
      .single();

    if (updateError) {
      console.error('❌ Failed to update enrollment:', updateError);
      throw new Error(`Failed to update enrollment: ${updateError.message}`);
    }

    console.log(`✅ Enrollment ${action}d successfully:`, updatedEnrollment.id);

    // If approved, send enrollment email
    if (action === 'approve') {
      try {
        console.log('📧 Sending approval email...');
        
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            enrollmentId: updatedEnrollment.id
          })
        });

        if (emailResponse.ok) {
          console.log('✅ Approval email sent successfully');
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ Approval email failed:', emailResponse.status, errorText);
        }
      } catch (emailError) {
        console.error('❌ Approval email error (non-blocking):', emailError);
      }

      // Send webhook for approved enrollment
      try {
        console.log('📤 Sending enrollment approval webhook...');

        const webhookPayload = {
          event_type: 'enrollment_manual_payment_approved',
          timestamp: new Date().toISOString(),
          data: {
            enrollment: updatedEnrollment,
            user: {
              name: enrollment.full_name,
              email: enrollment.email,
              phone: enrollment.phone,
              country_code: enrollment.country_code || '+98'
            },
            course: enrollment.courses,
            approved_by: approvedBy || 'admin'
          }
        };

        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'enrollment_manual_payment_approved',
            payload: webhookPayload
          })
        });

        if (webhookResponse.ok) {
          console.log('✅ Enrollment approval webhook sent successfully');
        } else {
          const errorText = await webhookResponse.text();
          console.error('❌ Approval webhook failed:', webhookResponse.status, errorText);
        }
      } catch (webhookError) {
        console.error('❌ Approval webhook error (non-blocking):', webhookError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        enrollment: updatedEnrollment,
        message: `Enrollment ${action}d successfully`
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