interface WebhookData {
  messageContent: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  chatType: 'group' | 'private' | 'support';
  chatName?: string;
  timestamp: string;
}

const WEBHOOK_URL = 'https://rafeie.app.n8n.cloud/webhook-test/90fb3574-9e9e-41cc-8845-b93f5686b66a';

export const webhookService = {
  async sendMessageWebhook(data: WebhookData): Promise<void> {
    try {
      console.log('Sending webhook for message:', data);
      
      const payload = {
        message_content: data.messageContent,
        sender_name: data.senderName,
        sender_phone: data.senderPhone,
        sender_email: data.senderEmail,
        chat_type: data.chatType,
        chat_name: data.chatName,
        timestamp: data.timestamp,
        triggered_from: window.location.origin
      };

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      console.log('Webhook sent successfully');
    } catch (error) {
      console.error('Error sending webhook:', error);
      // Don't throw error to prevent blocking message sending
    }
  }
};