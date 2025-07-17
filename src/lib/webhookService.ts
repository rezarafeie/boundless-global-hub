
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
      console.log('Sending webhook for message:', data);
      
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
        } catch (error) {
          console.error('Error fetching topic name:', error);
        }
      }
      
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
        message_type: data.messageType || 'text'
      };

      // Use form data to ensure fields are sent separately
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      console.log('Webhook sent successfully');
    } catch (error) {
      console.error('Error sending webhook:', error);
      // Don't throw error to prevent blocking message sending
    }
  }
};
