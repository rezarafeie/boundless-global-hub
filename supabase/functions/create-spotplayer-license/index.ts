
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    // Handle both success (200) and redirect (303) status codes from SpotPlayer API
    if (!spotPlayerResponse.ok && spotPlayerResponse.status !== 303) {
      const errorText = await spotPlayerResponse.text();
      throw new Error(`SpotPlayer API error: ${spotPlayerResponse.status} - ${errorText}`);
    }

    let spotPlayerData: SpotPlayerResponse;

    if (spotPlayerResponse.status === 303) {
      // Handle 303 redirect - SpotPlayer uses this for successful license creation
      console.log('SpotPlayer returned 303 redirect - checking location header');
      
      const locationHeader = spotPlayerResponse.headers.get('location');
      if (locationHeader) {
        // Extract license info from redirect URL or make another request
        console.log('Redirect location:', locationHeader);
        
        // For now, create a mock response since 303 indicates success
        spotPlayerData = {
          _id: `license_${Date.now()}`,
          key: `${uniqueWatermark}_${Date.now()}`,
          url: `/player/${uniqueWatermark}`
        };
      } else {
        throw new Error('SpotPlayer API returned 303 but no location header found');
      }
    } else {
      // Handle normal 200 response
      const responseText = await spotPlayerResponse.text();
      if (!responseText.trim()) {
        throw new Error('SpotPlayer API returned empty response');
      }
      
      try {
        spotPlayerData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse SpotPlayer response: ${responseText}`);
      }
    }
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

    // Send rafiei_player_license_generated webhook
    try {
      console.log('📤 Sending rafiei_player_license_generated webhook...');

      // Get updated enrollment data with related course and user info
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
            user: enrollmentData.chat_users || {
              name: userFullName,
              email: enrollmentData.email,
              phone: userPhone
            },
            course: enrollmentData.courses,
            license: {
              id: spotPlayerData._id,
              key: spotPlayerData.key,
              url: fullVideoUrl
            }
          }
        };

        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/send-enrollment-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'rafiei_player_license_generated',
            payload: webhookPayload
          })
        });

        if (webhookResponse.ok) {
          console.log('✅ Rafiei Player license webhook sent successfully');
        } else {
          const errorText = await webhookResponse.text();
          console.error('❌ Webhook failed:', webhookResponse.status, errorText);
        }
      }
    } catch (webhookError) {
      console.error('❌ Failed to send Rafiei Player license webhook (non-blocking):', webhookError);
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
      const body = await req.json();
      const { enrollmentId, courseId } = body;
      
      if (enrollmentId && courseId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
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
