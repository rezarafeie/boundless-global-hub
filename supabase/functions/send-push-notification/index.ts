import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
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

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Push notification request received');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { recipientUserIds, message }: PushNotificationRequest = await req.json();
    
    console.log('📧 Recipients:', recipientUserIds);
    console.log('💬 Message:', { id: message.id, sender: message.senderName });

    if (!recipientUserIds || recipientUserIds.length === 0) {
      console.log('❌ No recipients specified');
      return new Response(JSON.stringify({ error: 'No recipients specified' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get push subscriptions for recipients
    const { data: users, error } = await supabase
      .from('chat_users')
      .select('id, name, notification_token, notification_enabled')
      .in('id', recipientUserIds)
      .eq('notification_enabled', true)
      .not('notification_token', 'is', null);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📱 Found ${users?.length || 0} users with push subscriptions`);

    if (!users || users.length === 0) {
      console.log('ℹ️ No users with active push subscriptions');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No users with active push subscriptions',
        notificationsSent: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare notification content
    const notificationTitle = message.roomName 
      ? `${message.senderName} در ${message.roomName}`
      : `پیام از ${message.senderName}`;
    
    const notificationBody = message.text.length > 100 
      ? message.text.substring(0, 100) + '...'
      : message.text;

    const notificationUrl = message.conversationId 
      ? `/hub/messenger?conversation=${message.conversationId}`
      : message.roomId 
        ? `/hub/messenger?room=${message.roomId}`
        : '/hub/messenger';

    let successCount = 0;
    let errorCount = 0;

    // Send push notifications to all subscribed users
    for (const user of users) {
      try {
        let subscriptionData: PushSubscriptionData;
        
        // Parse notification token
        if (typeof user.notification_token === 'string') {
          subscriptionData = JSON.parse(user.notification_token);
        } else {
          subscriptionData = user.notification_token as PushSubscriptionData;
        }

        console.log(`📤 Sending notification to user ${user.id} (${user.name})`);

        // Create push notification payload
        const pushPayload = {
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl,
          messageId: message.id,
          senderId: message.senderId,
          timestamp: message.timestamp
        };

        // Send push notification using Web Push Protocol
        const webPushResponse = await fetch(subscriptionData.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'TTL': '86400', // 24 hours
          },
          body: JSON.stringify(pushPayload)
        });

        if (webPushResponse.ok) {
          console.log(`✅ Push notification sent successfully to user ${user.id}`);
          successCount++;
        } else {
          console.error(`❌ Push notification failed for user ${user.id}:`, webPushResponse.status, await webPushResponse.text());
          errorCount++;
          
          // If subscription is invalid, remove it from database
          if (webPushResponse.status === 410 || webPushResponse.status === 404) {
            console.log(`🗑️ Removing invalid subscription for user ${user.id}`);
            await supabase
              .from('chat_users')
              .update({ notification_token: null })
              .eq('id', user.id);
          }
        }

      } catch (error) {
        console.error(`❌ Error sending push notification to user ${user.id}:`, error);
        errorCount++;
      }
    }

    const response = {
      success: true,
      message: `Push notifications processed`,
      notificationsSent: successCount,
      errors: errorCount,
      totalRecipients: users.length
    };

    console.log('📊 Final result:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Internal server error in push notification service'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);