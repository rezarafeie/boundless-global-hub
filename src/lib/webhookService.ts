

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
      console.log('🔥 WEBHOOK SERVICE - Sending webhook for message with data:', data);
      
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
      
      // FORCE generate delete link - ensure it's never empty
      let deleteLink = '';
      if (data.messageId) {
        const tableName = data.tableName || 'messenger_messages';
        deleteLink = `https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/delete-message-public?messageId=${data.messageId}&table=${tableName}`;
        console.log('🔥 FORCED delete link generated:', deleteLink, 'for messageId:', data.messageId);
      } else {
        console.error('❌ CRITICAL: No messageId provided for delete link generation - FORCING empty but structured link');
        // Even if no messageId, provide the structure so webhook doesn't fail
        const tableName = data.tableName || 'messenger_messages';
        deleteLink = `https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/delete-message-public?messageId=MISSING&table=${tableName}`;
      }
      
      // Send data with media information and delete link - FORCE delete_link to never be empty
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
        delete_link: deleteLink // FORCE this to always have a value
      };

      console.log('🔥 FINAL webhook payload with FORCED delete link:', payload);

      // Use form data to ensure fields are sent separately
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      console.log('🔥 Webhook sent successfully with FORCED delete link:', deleteLink);
    } catch (error) {
      console.error('❌ Error sending webhook:', error);
      // Don't throw error to prevent blocking message sending
    }
  }
};

