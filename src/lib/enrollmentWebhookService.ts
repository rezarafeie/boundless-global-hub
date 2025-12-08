import { supabase } from '@/integrations/supabase/client';
import { enhancedWebhookManager } from './enhancedWebhookManager';

interface EnrollmentWebhookData {
  enrollment: any;
  user: any;
  course: any;
}

export const sendEnrollmentWebhook = async (data: EnrollmentWebhookData) => {
  try {
    console.log('📤 Sending enrollment webhook...', data);
    
    // Use the new enhanced webhook manager
    await enhancedWebhookManager.sendEnrollmentCreated(data.enrollment, data.user, data.course);
    
    // Keep the old webhook for backward compatibility
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

// New webhook functions for different enrollment events
export const sendEnrollmentPaidSuccessful = async (enrollment: any, user: any, course: any, payment: any) => {
  await enhancedWebhookManager.sendEnrollmentPaidSuccessful(enrollment, user, course, payment);
};

export const sendEnrollmentManualPaymentSubmitted = async (enrollment: any, user: any, course: any) => {
  await enhancedWebhookManager.sendEnrollmentManualPaymentSubmitted(enrollment, user, course);
};

export const sendEnrollmentManualPaymentApproved = async (enrollment: any, user: any, course: any) => {
  await enhancedWebhookManager.sendEnrollmentManualPaymentApproved(enrollment, user, course);
};

export const sendEnrollmentManualPaymentRejected = async (enrollment: any, user: any, course: any) => {
  await enhancedWebhookManager.sendEnrollmentManualPaymentRejected(enrollment, user, course);
};

export const sendUserCreated = async (user: any) => {
  await enhancedWebhookManager.sendUserCreated(user);
};

export const sendEmailLinkedExistingAccount = async (user: any, enrollment: any) => {
  await enhancedWebhookManager.sendEmailLinkedExistingAccount(user, enrollment);
};

export const sendSSOAccessLinkGenerated = async (enrollment: any, user: any, course: any, ssoTokens: any) => {
  await enhancedWebhookManager.sendSSOAccessLinkGenerated(enrollment, user, course, ssoTokens);
};

export const sendRafieiPlayerLicenseGenerated = async (enrollment: any, user: any, course: any, license: any) => {
  await enhancedWebhookManager.sendRafieiPlayerLicenseGenerated(enrollment, user, course, license);
};

export const sendCRMNoteCreated = async (user: any, crmNote: any, course: any) => {
  await enhancedWebhookManager.sendCRMNoteCreated(user, crmNote, course);
};

export const sendConsultationBooking = async (status: 'pending' | 'confirmed' | 'cancelled', booking: any, user: any, slot: any) => {
  await enhancedWebhookManager.sendConsultationBooking(status, booking, user, slot);
};