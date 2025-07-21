
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { supabase } from "../_shared/supabase.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SpotPlayerRequest {
  enrollmentId: string;
  userFullName: string;
  userPhone: string;
  courseId: string;
}

interface SpotPlayerResponse {
  _id: string;
  key: string;
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentId, userFullName, userPhone, courseId }: SpotPlayerRequest = await req.json();

    console.log('Creating SpotPlayer license for enrollment:', enrollmentId);

    // Get course details including SpotPlayer course ID and test license setting
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('spotplayer_course_id, is_spotplayer_enabled, create_test_license')
      .eq('id', courseId)
      .single();

    if (courseError) {
      throw new Error(`Failed to fetch course: ${courseError.message}`);
    }

    if (!course.is_spotplayer_enabled) {
      throw new Error('SpotPlayer is not enabled for this course');
    }

    if (!course.spotplayer_course_id) {
      throw new Error('SpotPlayer course ID is not configured for this course');
    }

    // Create unique watermark by combining phone and enrollment ID (last 8 chars)
    const uniqueWatermark = `${userPhone}-${enrollmentId.slice(-8)}`;

    // Prepare SpotPlayer API request
    const spotPlayerRequestBody = {
      test: course.create_test_license || false, // Use test mode if enabled in course settings
      course: [course.spotplayer_course_id],
      name: userFullName,
      watermark: {
        texts: [
          {
            text: uniqueWatermark
          }
        ]
      }
    };

    console.log('Sending request to SpotPlayer API:', spotPlayerRequestBody);

    // Call SpotPlayer API
    const spotPlayerResponse = await fetch('https://panel.spotplayer.ir/license/edit/', {
      method: 'POST',
      headers: {
        '$API': 'YoCd0Z5K5OkR/vQFituZuQSpiAcnlg==',
        '$LEVEL': '-1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spotPlayerRequestBody)
    });

    if (!spotPlayerResponse.ok) {
      const errorText = await spotPlayerResponse.text();
      throw new Error(`SpotPlayer API error: ${spotPlayerResponse.status} - ${errorText}`);
    }

    const spotPlayerData: SpotPlayerResponse = await spotPlayerResponse.json();
    console.log('SpotPlayer API response:', spotPlayerData);

    // Construct the full video access URL
    const fullVideoUrl = `https://dl.spotplayer.ir${spotPlayerData.url}`;

    // Update enrollment with SpotPlayer license data
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        spotplayer_license_id: spotPlayerData._id,
        spotplayer_license_key: spotPlayerData.key,
        spotplayer_license_url: fullVideoUrl
      })
      .eq('id', enrollmentId);

    if (updateError) {
      console.error('Failed to update enrollment with license data:', updateError);
      
      // Log error to license_errors table
      await supabase
        .from('license_errors')
        .insert({
          enrollment_id: enrollmentId,
          course_id: courseId,
          error_message: `Failed to update enrollment: ${updateError.message}`,
          api_response: JSON.stringify(spotPlayerData)
        });

      throw new Error(`Failed to update enrollment: ${updateError.message}`);
    }

    console.log('Successfully created SpotPlayer license and updated enrollment');

    // Send webhook for Rafiei Player license generation
    try {
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (*),
          chat_users:chat_user_id (*)
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollmentData) {
        const webhookPayload = {
          event_type: 'rafiei_player_license_generated',
          timestamp: new Date().toISOString(),
          data: {
            enrollment: enrollmentData,
            user: enrollmentData.chat_users,
            course: enrollmentData.courses,
            license: {
              id: spotPlayerData._id,
              key: spotPlayerData.key,
              url: fullVideoUrl
            }
          }
        };

        // Send webhook using enhanced webhook manager
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'rafiei_player_license_generated',
            payload: webhookPayload
          })
        });

        console.log('Rafiei Player license webhook sent successfully');
      }
    } catch (webhookError) {
      console.error('Failed to send Rafiei Player license webhook:', webhookError);
      // Don't fail the license creation if webhook fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        license: {
          id: spotPlayerData._id,
          key: spotPlayerData.key,
          url: fullVideoUrl
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('SpotPlayer license creation error:', error);

    // Try to log error to database if we have enrollment info
    try {
      const { enrollmentId, courseId } = await req.json();
      if (enrollmentId && courseId) {
        await supabase
          .from('license_errors')
          .insert({
            enrollment_id: enrollmentId,
            course_id: courseId,
            error_message: error.message,
            api_response: null
          });
      }
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
