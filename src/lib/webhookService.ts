interface WebhookData {
  messageContent: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  chatType: 'group' | 'private' | 'support';
  chatName?: string;
  timestamp: string;
}

const WEBHOOK_URL = 'https://hook.us1.make.com/0hc8v2f528r9ieyefwhu8g9ta8l4r1bk';

export const webhookService = {
  async sendMessageWebhook(data: WebhookData): Promise<void> {
    try {
      console.log('Sending webhook for message:', data);
      
      // Send data directly without wrapping in nested structure
      const payload = {
        message_content: data.messageContent,
        sender_name: data.senderName,
        sender_phone: data.senderPhone,
        sender_email: data.senderEmail,
        chat_type: data.chatType,
        chat_name: data.chatName || '',
        timestamp: data.timestamp,
        triggered_from: window.location.origin
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