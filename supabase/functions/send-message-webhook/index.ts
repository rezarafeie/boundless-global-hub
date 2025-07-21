
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function urlEncode(str: string): string {
  return str.replace(/[^a-zA-Z0-9-_.~]/g, (match) => {
    return '%' + match.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageData } = await req.json();
    console.log('Processing webhook for message:', messageData.id);

    // Get sender information with prioritization for users with email
    const { data: senderData, error: senderError } = await supabase
      .from('chat_users')
      .select('name, phone, email')
      .eq('id', messageData.sender_id)
      .single();

    if (senderError) {
      console.error('Error fetching sender:', senderError);
      throw senderError;
    }

    console.log('Sender data:', senderData);

    // Get receiver information if this is a direct message
    let receiverData = null;
    if (messageData.recipient_id) {
      const { data: receiver, error: receiverError } = await supabase
        .from('chat_users')
        .select('name, phone, email')
        .eq('id', messageData.recipient_id)
        .single();

      if (!receiverError && receiver) {
        receiverData = receiver;
        console.log('Receiver data:', receiverData);
      }
    }

    // Determine message context
    let chatType = 'unknown';
    let chatName = '';
    let topicName = '';
    let receiverEmail = '';
    let receiverPhone = '';
    let receiverName = '';

    if (messageData.room_id) {
      // Group message
      chatType = 'group';
      
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('id', messageData.room_id)
        .single();
      
      chatName = roomData?.name || 'نامشخص';

      // Get topic name if exists
      if (messageData.topic_id) {
        const { data: topicData } = await supabase
          .from('chat_topics')
          .select('title')
          .eq('id', messageData.topic_id)
          .single();
        
        topicName = topicData?.title || '';
      }
    } else if (messageData.recipient_id) {
      // Direct message
      chatType = 'private';
      
      if (receiverData) {
        chatName = receiverData.name;
        receiverEmail = receiverData.email || '';
        receiverPhone = receiverData.phone || '';
        receiverName = receiverData.name || '';
      }
    } else if (messageData.conversation_id) {
      // Support or private conversation
      chatType = 'support';
      chatName = 'Support';
    }

    // Prepare webhook payload
    const webhookUrl = 'https://hook.us1.make.com/0hc8v2f528r9ieyefwhu8g9ta8l4r1bk';
    
    const formData = [
      `message_content=${urlEncode(messageData.message || '')}`,
      `sender_name=${urlEncode(senderData.name || 'نامشخص')}`,
      `sender_phone=${urlEncode(senderData.phone || '')}`,
      `sender_email=${urlEncode(senderData.email || '')}`,
      `receiver_name=${urlEncode(receiverName)}`,
      `receiver_phone=${urlEncode(receiverPhone)}`,
      `receiver_email=${urlEncode(receiverEmail)}`,
      `chat_type=${urlEncode(chatType)}`,
      `chat_name=${urlEncode(chatName)}`,
      `topic_name=${urlEncode(topicName)}`,
      `timestamp=${urlEncode(messageData.created_at || new Date().toISOString())}`,
      `triggered_from=database_trigger`,
      `media_url=${urlEncode(messageData.media_url || '')}`,
      `media_type=${urlEncode(messageData.message_type || '')}`,
      `message_type=${urlEncode(messageData.media_url ? 'media' : 'text')}`
    ].join('&');

    console.log('Sending webhook with payload:', formData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log('Webhook response status:', response.status);
    console.log('Webhook response:', responseText.substring(0, 200));

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook sent successfully',
      webhookStatus: response.status,
      chatType,
      hasReceiver: !!receiverData,
      receiverEmail: receiverEmail || 'none'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-message-webhook:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
