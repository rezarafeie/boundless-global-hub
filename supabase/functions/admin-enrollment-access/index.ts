import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

interface AdminAccessRequest {
  enrollmentId: string;
  action?: 'approve' | 'reject';
  notes?: string;
  adminId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentId, action, notes, adminId } = await req.json() as AdminAccessRequest;

    if (!enrollmentId) {
      return new Response(
        JSON.stringify({ error: 'Enrollment ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get enrollment details with course information
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          slug,
          redirect_url,
          is_spotplayer_enabled,
          spotplayer_course_id,
          woocommerce_create_access,
          support_link,
          telegram_channel_link,
          gifts_link,
          enable_course_access,
          support_activation_required,
          telegram_activation_required,
          smart_activation_enabled,
          smart_activation_telegram_link
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      console.error('Error fetching enrollment:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Enrollment not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If this is an action request (approve/reject)
    if (action && (action === 'approve' || action === 'reject')) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (action === 'approve') {
        updateData.manual_payment_status = 'approved';
        updateData.payment_status = 'completed';
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = adminId || 'admin_webhook';
      } else {
        updateData.manual_payment_status = 'rejected';
        updateData.payment_status = 'rejected';
      }

      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error: updateError } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollmentId);

      if (updateError) {
        console.error('Error updating enrollment:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update enrollment' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get updated enrollment data
      const { data: updatedEnrollment } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            slug,
            redirect_url,
            is_spotplayer_enabled,
            spotplayer_course_id,
            woocommerce_create_access,
            support_link,
            telegram_channel_link,
            gifts_link,
            enable_course_access,
            support_activation_required,
            telegram_activation_required,
            smart_activation_enabled,
            smart_activation_telegram_link
          )
        `)
        .eq('id', enrollmentId)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Enrollment ${action}d successfully`,
          enrollment: updatedEnrollment 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return enrollment details for viewing
    return new Response(
      JSON.stringify({ 
        success: true, 
        enrollment 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Admin enrollment access error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});