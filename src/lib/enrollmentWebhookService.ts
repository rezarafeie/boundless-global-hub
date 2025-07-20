import { supabase } from '@/integrations/supabase/client';

interface EnrollmentWebhookData {
  enrollment: any;
  user: any;
  course: any;
}

export const sendEnrollmentWebhook = async (data: EnrollmentWebhookData) => {
  try {
    console.log('📤 Sending enrollment webhook...', data);
    
    const { data: response, error } = await supabase.functions.invoke('send-enrollment-webhook', {
      body: data
    });

    if (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }

    console.log('✅ Webhook sent successfully:', response);
    return response;
  } catch (error) {
    console.error('💥 Failed to send enrollment webhook:', error);
    throw error;
  }
};