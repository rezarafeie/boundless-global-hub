import { supabase } from '@/integrations/supabase/client';

interface NotificationWebhookData {
  event_type: 'notification_enabled' | 'notification_disabled' | 'message_sent';
  user_id: number;
  user_name: string;
  user_phone: string;
  onesignal_token?: string;
  message_content?: string;
  chat_type?: 'group' | 'private' | 'support';
  chat_name?: string;
  timestamp: string;
  triggered_from: string;
}

const WEBHOOK_URL = 'https://hook.us1.make.com/0hc8v2f528r9ieyefwhu8g9ta8l4r1bk';

export const enhancedWebhookService = {
  async sendNotificationWebhook(data: NotificationWebhookData): Promise<void> {
    try {
      console.log('🔗 [Enhanced Webhook] Sending notification webhook:', data.event_type);
      
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('✅ [Enhanced Webhook] Notification webhook sent successfully');
      } else {
        console.warn('⚠️ [Enhanced Webhook] Webhook response not OK:', response.status);
      }
    } catch (error) {
      console.error('❌ [Enhanced Webhook] Error sending notification webhook:', error);
      // Don't throw error to prevent blocking other operations
    }
  },

  async sendUserSubscriptionEvent(
    userId: number, 
    userName: string, 
    userPhone: string, 
    oneSignalToken: string, 
    enabled: boolean
  ): Promise<void> {
    const webhookData: NotificationWebhookData = {
      event_type: enabled ? 'notification_enabled' : 'notification_disabled',
      user_id: userId,
      user_name: userName,
      user_phone: userPhone,
      onesignal_token: oneSignalToken,
      timestamp: new Date().toISOString(),
      triggered_from: 'notification_service'
    };

    await this.sendNotificationWebhook(webhookData);
  },

  async sendMessageNotificationEvent(
    userId: number,
    userName: string,
    userPhone: string,
    messageContent: string,
    chatType: 'group' | 'private' | 'support',
    chatName?: string
  ): Promise<void> {
    const webhookData: NotificationWebhookData = {
      event_type: 'message_sent',
      user_id: userId,
      user_name: userName,
      user_phone: userPhone,
      message_content: messageContent,
      chat_type: chatType,
      chat_name: chatName,
      timestamp: new Date().toISOString(),
      triggered_from: 'message_service'
    };

    await this.sendNotificationWebhook(webhookData);
  }
};