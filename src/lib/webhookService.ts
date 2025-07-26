
import { supabase } from '@/integrations/supabase/client';

interface WebhookData {
  messageContent: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  chatType: 'group' | 'private' | 'support';
  chatName?: string;
  topicName?: string;
  topicId?: number;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: string;
  messageType?: 'text' | 'media';
}

const WEBHOOK_URL = 'https://hook.us1.make.com/0hc8v2f528r9ieyefwhu8g9ta8l4r1bk';

export const webhookService = {
  async sendMessageWebhook(data: WebhookData): Promise<void> {
    try {
      console.log('🔗 [Webhook] Sending webhook for message:', {
        chatType: data.chatType,
        chatName: data.chatName,
        topicId: data.topicId,
        topicName: data.topicName,
        messageContent: data.messageContent?.substring(0, 50) + '...'
      });
      
      // Get topic name if topicId is provided but topicName is not
      let topicName = data.topicName;
      if (data.topicId && !topicName) {
        try {
          const { data: topic } = await supabase
            .from('chat_topics')
            .select('title')
            .eq('id', data.topicId)
            .single();
          
          topicName = topic?.title;
          console.log('🔗 [Webhook] Fetched topic name:', topicName);
        } catch (error) {
          console.error('🔗 [Webhook] Error fetching topic name:', error);
        }
      }
      
      // Ensure messageType is properly typed
      const messageType: 'text' | 'media' = data.mediaUrl ? 'media' : 'text';
      
      // Send data with media information
      const payload = {
        message_content: data.messageContent,
        sender_name: data.senderName,
        sender_phone: data.senderPhone,
        sender_email: data.senderEmail,
        chat_type: data.chatType,
        chat_name: data.chatName || '',
        topic_name: topicName || '',
        timestamp: data.timestamp,
        triggered_from: window.location.origin,
        media_url: data.mediaUrl || '',
        media_type: data.mediaType || '',
        message_type: messageType
      };

      console.log('🔗 [Webhook] Payload being sent:', payload);

      // Use form data to ensure fields are sent separately
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('✅ [Webhook] Webhook sent successfully');
      } else {
        console.error('❌ [Webhook] Webhook failed with status:', response.status);
      }
    } catch (error) {
      console.error('❌ [Webhook] Error sending webhook:', error);
      // Don't throw error to prevent blocking message sending
    }
  }
};
