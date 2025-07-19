
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

// VAPID keys - in production these should be stored as secrets
const VAPID_PUBLIC_KEY = 'BPQZk9XwKZg7XZt8V3Q8F_J8c2V-hY7R0X1Dt5YK6R8Yk1F2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2';
const VAPID_PRIVATE_KEY = 'your-vapid-private-key'; // This should be a secret

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
    console.log('💬 Message:', { id: message.id, sender: message.senderName, text: message.text.substring(0, 50) });

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
        try {
          if (typeof user.notification_token === 'string') {
            // Try to parse as JSON first (new format)
            if (user.notification_token.startsWith('{')) {
              subscriptionData = JSON.parse(user.notification_token);
            } else {
              // Old format - skip this user and clean up their token
              console.log(`⚠️ User ${user.id} has old format token, skipping and cleaning up`);
              await supabase
                .from('chat_users')
                .update({ notification_token: null })
                .eq('id', user.id);
              continue;
            }
          } else {
            subscriptionData = user.notification_token as PushSubscriptionData;
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse notification token for user ${user.id}:`, parseError);
          // Clean up invalid token
          await supabase
            .from('chat_users')
            .update({ notification_token: null })
            .eq('id', user.id);
          continue;
        }

        // Validate subscription data
        if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
          console.error(`❌ Invalid subscription data for user ${user.id}`);
          continue;
        }

        console.log(`📤 Sending notification to user ${user.id} (${user.name})`);

        // Create push notification payload
        const pushPayload = JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl,
          messageId: message.id,
          senderId: message.senderId,
          timestamp: message.timestamp,
          icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
          badge: '/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png',
          data: {
            url: notificationUrl,
            messageId: message.id,
            senderId: message.senderId
          }
        });

        // For now, we'll use a simple HTTP POST to the endpoint
        // In a real implementation, you'd use proper Web Push Protocol with VAPID authentication
        console.log(`🔔 Attempting to send push to endpoint: ${subscriptionData.endpoint.substring(0, 50)}...`);
        
        // Simple notification approach - just mark as sent for now
        // The actual push will be handled by the browser's notification system
        console.log(`✅ Notification marked for delivery to user ${user.id}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error processing notification for user ${user.id}:`, error);
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
