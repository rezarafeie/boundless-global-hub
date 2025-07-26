
import { supabase } from '@/integrations/supabase/client';

interface WebhookData {
  messageId?: number;
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
  tableName?: string;
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
      
      // Ensure messageType is properly typed
      const messageType: 'text' | 'media' = data.mediaUrl ? 'media' : 'text';
      
      // Generate delete link if messageId is provided
      let deleteLink = '';
      if (data.messageId) {
        const baseUrl = window.location.origin;
        const tableName = data.tableName || 'messenger_messages';
        deleteLink = `${baseUrl.replace('ihhetvwuhqohbfgkqoxw.lovableproject.com', 'ihhetvwuhqohbfgkqoxw.supabase.co')}/functions/v1/delete-message-public?messageId=${data.messageId}&table=${tableName}`;
      }
      
      // Send data with media information and delete link
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
        message_type: messageType,
        delete_link: deleteLink
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
