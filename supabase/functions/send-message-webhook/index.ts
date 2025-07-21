import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MessageData {
  id: number;
  sender_id: number;
  message: string;
  room_id?: number;
  recipient_id?: number;
  conversation_id?: number;
  topic_id?: number;
  created_at: string;
  media_url?: string;
  message_type?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Message webhook function called');
    
    const { messageData } = await req.json();
    
    if (!messageData) {
      console.error('❌ No message data provided');
      return new Response(
        JSON.stringify({ error: 'Message data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📨 Processing message webhook for message ID:', messageData.id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sender information with email
    const { data: senderData, error: senderError } = await supabase
      .from('chat_users')
      .select('name, phone, email')
      .eq('id', messageData.sender_id)
      .single();

    if (senderError) {
      console.error('❌ Error fetching sender data:', senderError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sender data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine message type and context
    let chatType = 'unknown';
    let chatName = '';
    let topicName = '';
    let receiverEmail = '';

    if (messageData.room_id) {
      chatType = 'group';
      
      // Get room name
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('id', messageData.room_id)
        .single();
      
      chatName = roomData?.name || 'Unknown Room';
      
      // Get topic name if topic_id exists
      if (messageData.topic_id) {
        const { data: topicData } = await supabase
          .from('chat_topics')
          .select('title')
          .eq('id', messageData.topic_id)
          .single();
        
        topicName = topicData?.title || '';
      }
    } else if (messageData.recipient_id) {
      chatType = 'private';
      
      // Get recipient name and email - prefer user with email if multiple exist
      const { data: recipientData } = await supabase
        .from('chat_users')
        .select('name, email, phone')
        .eq('id', messageData.recipient_id)
        .single();
      
      chatName = recipientData?.name || 'Unknown User';
      receiverEmail = recipientData?.email || '';
      
      // If no email found, try to find a user with the same phone but with email
      if (!receiverEmail && recipientData?.phone) {
        const normalizedPhone = recipientData.phone.replace(/^0/, ''); // Remove leading 0
        
        const { data: alternateUser } = await supabase
          .from('chat_users')
          .select('email')
          .or(`phone.eq.${recipientData.phone},phone.eq.${normalizedPhone},phone.eq.0${normalizedPhone}`)
          .not('email', 'is', null)
          .limit(1)
          .single();
        
        if (alternateUser?.email) {
          receiverEmail = alternateUser.email;
          console.log(`📧 Found alternate user email for phone ${recipientData.phone}: ${receiverEmail}`);
        }
      }
    } else if (messageData.conversation_id) {
      chatType = 'support';
      chatName = 'Support';
      
      // For support conversations, get receiver email based on conversation type
      if (messageData.sender_id === 1) {
        // Message from support to user - get user email
        const { data: conversationData } = await supabase
          .from('support_conversations')
          .select('user_id')
          .eq('id', messageData.conversation_id)
          .single();
        
        if (conversationData) {
          const { data: userData } = await supabase
            .from('chat_users')
            .select('email')
            .eq('id', conversationData.user_id)
            .single();
          
          receiverEmail = userData?.email || '';
        }
      } else {
        // Message from user to support - receiver is support (no specific email)
        receiverEmail = 'support@company.com'; // or leave empty
      }
    }

    // Get webhook configurations for message_sent event
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('event_type', 'message_sent')
      .eq('is_active', true);

    if (configError) {
      console.error('❌ Error fetching webhook configurations:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhook configurations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      console.log('ℹ️ No active message webhooks found');
      return new Response(
        JSON.stringify({ message: 'No active webhooks for message_sent' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Found ${webhookConfigs.length} webhook(s) to send`);

    // Send webhooks to all configured endpoints
    const webhookPromises = webhookConfigs.map(async (config) => {
      try {
        console.log(`📤 Sending webhook to ${config.name} (${config.url})`);
        
        const payload = {
          message_content: messageData.message,
          sender_name: senderData.name || 'Unknown',
          sender_phone: senderData.phone || '',
          sender_email: senderData.email || '',
          receiver_email: receiverEmail || '',
          chat_type: chatType,
          chat_name: chatName,
          topic_name: topicName,
          timestamp: messageData.created_at,
          triggered_from: 'database_trigger',
          media_url: messageData.media_url || '',
          media_type: messageData.message_type || '',
          message_type: messageData.media_url ? 'media' : 'text'
        };

        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(payload).toString()
        });

        const responseText = await response.text();
        const success = response.ok;

        // Log the webhook attempt
        await supabase
          .from('webhook_logs')
          .insert({
            webhook_config_id: config.id,
            event_type: 'message_sent',
            payload: payload,
            response_status: response.status,
            response_body: responseText,
            success: success,
            error_message: success ? null : `HTTP ${response.status}: ${responseText}`
          });

        if (success) {
          console.log(`✅ Webhook sent successfully to ${config.name}`);
        } else {
          console.error(`❌ Webhook failed to ${config.name}: ${response.status} ${responseText}`);
        }

        return { config: config.name, success };
      } catch (error) {
        console.error(`❌ Error sending webhook to ${config.name}:`, error);
        return { config: config.name, success: false, error: error.message };
      }
    });

    const results = await Promise.all(webhookPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📊 Webhook summary: ${successful} succeeded, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Message webhooks processed: ${successful} succeeded, ${failed} failed`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})