
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OneSignalNotificationRequest {
  recipientUserIds: number[];
  message: {
    id: number;
    text: string;
    senderName: string;
    roomName?: string;
    senderId: number;
    roomId?: number;
    conversationId?: number;
    timestamp: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔔 OneSignal notification request received');

    // Environment check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const oneSignalAppId = 'e221c080-7853-46e5-ba40-93796318d1a0';
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY');

    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRole: !!serviceRoleKey,
      hasOneSignalApiKey: !!oneSignalApiKey,
      oneSignalAppId
    });

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!oneSignalApiKey) {
      throw new Error('Missing OneSignal API key');
    }

    // Parse request body
    const { recipientUserIds, message }: OneSignalNotificationRequest = await req.json();
    
    console.log('📧 Recipients:', recipientUserIds);
    console.log('💬 Message:', {
      id: message.id,
      sender: message.senderName,
      text: message.text.substring(0, 50) + '...'
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Query users with OneSignal subscription IDs
    console.log('🔍 Querying for users with OneSignal subscriptions...');
    const { data: users, error: usersError } = await supabase
      .from('chat_users')
      .select('id, name, notification_enabled, notification_token')
      .in('id', recipientUserIds)
      .eq('notification_enabled', true)
      .not('notification_token', 'is', null);

    if (usersError) {
      throw new Error(`Database query failed: ${usersError.message}`);
    }

    console.log(`📊 Database query returned ${users?.length || 0} users`);

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users with valid OneSignal subscriptions found',
          results: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification content
    const notificationTitle = message.roomName 
      ? `${message.senderName} در ${message.roomName}`
      : `${message.senderName}`;
    const notificationBody = message.text;
    const notificationUrl = '/hub/messenger';

    // Collect OneSignal subscription IDs
    const subscriptionIds: string[] = [];
    
    for (const user of users) {
      console.log(`👤 User ${user.id} (${user.name}): enabled=${user.notification_enabled}, hasToken=${!!user.notification_token}`);
      
      if (user.notification_token) {
        subscriptionIds.push(user.notification_token);
      }
    }

    if (subscriptionIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No valid OneSignal subscription IDs found',
          results: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OneSignal notification using v16 API format
    const oneSignalPayload = {
      app_id: oneSignalAppId,
      include_subscription_ids: subscriptionIds,
      headings: { en: notificationTitle },
      contents: { en: notificationBody },
      url: notificationUrl,
      web_push_topic: `message_${message.id}`,
      data: {
        messageId: message.id,
        senderId: message.senderId,
        roomId: message.roomId,
        conversationId: message.conversationId
      }
    };

    console.log(`📤 Sending OneSignal notification to ${subscriptionIds.length} subscriptions`);

    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${oneSignalApiKey}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const oneSignalResult = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      console.error('❌ OneSignal API error:', oneSignalResult);
      throw new Error(`OneSignal API error: ${oneSignalResult.errors || 'Unknown error'}`);
    }

    console.log('✅ OneSignal notification sent successfully:', {
      id: oneSignalResult.id,
      recipients: oneSignalResult.recipients || 'unknown'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OneSignal notification sent successfully',
        oneSignalId: oneSignalResult.id,
        recipients: oneSignalResult.recipients,
        subscriptionIds: subscriptionIds.length,
        errors: oneSignalResult.errors || null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-onesignal-notification function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
