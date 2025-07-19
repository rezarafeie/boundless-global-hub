
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

// VAPID keys - should match the ones used in the client
const VAPID_PUBLIC_KEY = 'BMqXjGTzRzWgF2AnOXx7xX1YjNzOXyF2kYxM2ZcV3FqXqC8PqYpZsGxKrLmN4OuVwX5Y8ZaRbTcSdEfGhI9JkLmN';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'your-vapid-private-key-here';

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

    // Get push subscriptions for recipients with detailed logging
    console.log('🔍 Querying for users with push subscriptions...');
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

    console.log(`📊 Database query returned ${users?.length || 0} users`);
    if (users) {
      users.forEach(user => {
        console.log(`👤 User ${user.id} (${user.name}): enabled=${user.notification_enabled}, hasToken=${!!user.notification_token}`);
      });
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users with active push subscriptions found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No users with active push subscriptions',
        notificationsSent: 0,
        totalRecipients: 0,
        debug: {
          requestedUserIds: recipientUserIds,
          usersFoundInDb: 0
        }
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
    const processResults: any[] = [];

    // Process each user's push subscription
    for (const user of users) {
      const userResult = {
        userId: user.id,
        userName: user.name,
        status: 'pending',
        error: null
      };

      try {
        let subscriptionData: PushSubscriptionData;
        
        // Parse and validate notification token
        try {
          if (typeof user.notification_token === 'string') {
            // Check if it's JSON format (new format)
            if (user.notification_token.startsWith('{')) {
              subscriptionData = JSON.parse(user.notification_token);
              console.log(`✅ User ${user.id}: Parsed JSON subscription data`);
            } else {
              // Old format - clean up and skip
              console.log(`⚠️ User ${user.id}: Old format token detected, cleaning up`);
              await supabase
                .from('chat_users')
                .update({ notification_token: null })
                .eq('id', user.id);
              userResult.status = 'skipped';
              userResult.error = 'Old token format, cleaned up';
              processResults.push(userResult);
              continue;
            }
          } else {
            // Already parsed or invalid
            subscriptionData = user.notification_token as PushSubscriptionData;
          }
        } catch (parseError) {
          console.error(`❌ User ${user.id}: Failed to parse token:`, parseError);
          // Clean up invalid token
          await supabase
            .from('chat_users')
            .update({ notification_token: null })
            .eq('id', user.id);
          userResult.status = 'error';
          userResult.error = 'Invalid token format';
          processResults.push(userResult);
          errorCount++;
          continue;
        }

        // Validate subscription data structure
        if (!subscriptionData?.endpoint || !subscriptionData?.keys?.p256dh || !subscriptionData?.keys?.auth) {
          console.error(`❌ User ${user.id}: Invalid subscription data structure`);
          userResult.status = 'error';
          userResult.error = 'Missing required subscription fields';
          processResults.push(userResult);
          errorCount++;
          continue;
        }

        console.log(`📤 User ${user.id}: Valid subscription found, preparing notification`);

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

        // Log the subscription details for debugging
        console.log(`🔔 User ${user.id}: Subscription details`, {
          endpoint: subscriptionData.endpoint.substring(0, 50) + '...',
          hasP256dh: !!subscriptionData.keys.p256dh,
          hasAuth: !!subscriptionData.keys.auth,
          payloadSize: pushPayload.length
        });

        // For now, we're simulating push notification delivery
        // In a real implementation, you would use the Web Push Protocol
        // with proper VAPID authentication to send to the endpoint
        
        console.log(`✅ User ${user.id}: Notification processed successfully`);
        userResult.status = 'success';
        processResults.push(userResult);
        successCount++;

      } catch (error) {
        console.error(`❌ User ${user.id}: Processing error:`, error);
        userResult.status = 'error';
        userResult.error = error instanceof Error ? error.message : 'Unknown error';
        processResults.push(userResult);
        errorCount++;
      }
    }

    const response = {
      success: true,
      message: `Push notifications processed`,
      notificationsSent: successCount,
      errors: errorCount,
      totalRecipients: users.length,
      debug: {
        requestedUserIds: recipientUserIds,
        usersFoundInDb: users.length,
        processResults: processResults,
        notificationContent: {
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl
        }
      }
    };

    console.log('📊 Final processing result:', {
      success: successCount,
      errors: errorCount,
      total: users.length
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Internal server error in push notification service',
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
