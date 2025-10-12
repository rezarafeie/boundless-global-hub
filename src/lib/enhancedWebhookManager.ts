
import { supabase } from '@/integrations/supabase/client';

export type WebhookEventType = 
  | 'enrollment_created'
  | 'enrollment_paid_successful' 
  | 'enrollment_manual_payment_submitted'
  | 'enrollment_manual_payment_approved'
  | 'enrollment_manual_payment_rejected'
  | 'user_created'
  | 'email_linked_existing_account'
  | 'sso_access_link_generated'
  | 'rafiei_player_license_generated'
  | 'webinar_registration'
  | 'webinar_login';

interface WebhookPayload {
  event_type: WebhookEventType;
  timestamp: string;
  data: {
    user?: any;
    course?: any;
    enrollment?: any;
    payment?: any;
  };
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  event_type: string;
  is_active: boolean;
  headers: any;
  body_template: any;
}

class EnhancedWebhookManager {
  async getActiveWebhooks(eventType: WebhookEventType): Promise<WebhookConfig[]> {
    const { data, error } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching webhook configurations:', error);
      return [];
    }

    return data || [];
  }

  // Helper method to ensure course data has proper price
  private ensureCourseData(course: any): any {
    if (!course) return course;
    
    return {
      ...course,
      price: course.price != null && course.price !== '' ? course.price : 0
    };
  }

  async sendWebhook(eventType: WebhookEventType, payload: any) {
    try {
      const webhooks = await this.getActiveWebhooks(eventType);
      
      if (webhooks.length === 0) {
        console.log(`No active webhooks found for event type: ${eventType}`);
        return;
      }
      
      // Ensure course price is properly set in payload
      if (payload.data?.course) {
        payload.data.course = this.ensureCourseData(payload.data.course);
      }
      
      for (const webhook of webhooks) {
        await this.executeWebhook(webhook, payload);
      }
    } catch (error) {
      console.error('Error sending webhooks:', error);
    }
  }

  private async executeWebhook(webhook: WebhookConfig, payload: any) {
    try {
      // Merge payload with body template
      const body = this.mergeTemplate(webhook.body_template, payload);
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(body)
      });

      // Log the webhook execution
      await this.logWebhookExecution(
        webhook.id,
        webhook.event_type,
        body,
        response.status,
        await response.text(),
        response.ok
      );

    } catch (error) {
      console.error(`Webhook execution failed for ${webhook.name}:`, error);
      
      // Log the error
      await this.logWebhookExecution(
        webhook.id,
        webhook.event_type,
        payload,
        0,
        '',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private mergeTemplate(template: Record<string, any>, payload: any): any {
    const result = { ...template };
    
    // Replace template variables with actual data
    const replaceVariables = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
          const value = this.getNestedValue(payload, path);
          
          // Special handling for course.price - ensure it's 0 if empty
          if (path === 'data.course.price' && (value == null || value === '')) {
            return '0';
          }
          
          return value !== undefined && value !== null ? value : match;
        });
      } else if (Array.isArray(obj)) {
        return obj.map(replaceVariables);
      } else if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = replaceVariables(value);
        }
        return newObj;
      }
      return obj;
    };

    return replaceVariables(result);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async logWebhookExecution(
    webhookConfigId: string,
    eventType: string,
    payload: any,
    responseStatus: number,
    responseBody: string,
    success: boolean,
    errorMessage?: string
  ) {
    try {
      await supabase.from('webhook_logs').insert({
        webhook_config_id: webhookConfigId,
        event_type: eventType,
        payload,
        response_status: responseStatus,
        response_body: responseBody,
        success,
        error_message: errorMessage
      });
    } catch (error) {
      console.error('Error logging webhook execution:', error);
    }
  }

  // Helper method to enhance user data with firstname and lastname
  private enhanceUserData(userData: any): any {
    if (!userData) return userData;

    const enhanced = { ...userData };
    
    // If we have full_name but not firstname/lastname, split them
    if (userData.full_name && (!userData.firstname || !userData.lastname)) {
      const nameParts = userData.full_name.trim().split(' ');
      enhanced.firstname = nameParts[0] || '';
      enhanced.lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }
    
    // If we have first_name/last_name but not firstname/lastname, map them
    if (userData.first_name && !enhanced.firstname) {
      enhanced.firstname = userData.first_name;
    }
    if (userData.last_name && !enhanced.lastname) {
      enhanced.lastname = userData.last_name;
    }
    
    // If we have name but not full_name or firstname/lastname, use it
    if (userData.name && !enhanced.full_name && !enhanced.firstname) {
      enhanced.full_name = userData.name;
      const nameParts = userData.name.trim().split(' ');
      enhanced.firstname = nameParts[0] || '';
      enhanced.lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }

    return enhanced;
  }

  // Event-specific methods
  async sendEnrollmentCreated(enrollment: any, user: any, course: any) {
    const enhancedUser = this.enhanceUserData(user);
    const enhancedCourse = this.ensureCourseData(course);
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://academy.rafiei.net';
    const adminAccessLink = `${baseUrl}/admin-enrollment-details?id=${enrollment.id}`;
    
    await this.sendWebhook('enrollment_created', {
      event_type: 'enrollment_created',
      timestamp: new Date().toISOString(),
      data: { 
        enrollment, 
        user: enhancedUser, 
        course: enhancedCourse,
        admin_access_link: adminAccessLink
      }
    });
  }

  async sendEnrollmentPaidSuccessful(enrollment: any, user: any, course: any, payment: any) {
    const enhancedUser = this.enhanceUserData(user);
    const enhancedCourse = this.ensureCourseData(course);
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://academy.rafiei.net';
    const adminAccessLink = `${baseUrl}/admin-enrollment-details?id=${enrollment.id}`;
    
    await this.sendWebhook('enrollment_paid_successful', {
      event_type: 'enrollment_paid_successful',
      timestamp: new Date().toISOString(),
      data: { enrollment, user: enhancedUser, course: enhancedCourse, payment, admin_access_link: adminAccessLink }
    });
  }

  async sendEnrollmentManualPaymentSubmitted(enrollment: any, user: any, course: any) {
    const enhancedUser = this.enhanceUserData(user);
    const enhancedCourse = this.ensureCourseData(course);
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://academy.rafiei.net';
    const adminAccessLink = `${baseUrl}/admin-enrollment-details?id=${enrollment.id}`;
    
    await this.sendWebhook('enrollment_manual_payment_submitted', {
      event_type: 'enrollment_manual_payment_submitted',
      timestamp: new Date().toISOString(),
      data: { enrollment, user: enhancedUser, course: enhancedCourse, admin_access_link: adminAccessLink }
    });
  }

  async sendEnrollmentManualPaymentApproved(enrollment: any, user: any, course: any) {
    const enhancedUser = this.enhanceUserData(user);
    const enhancedCourse = this.ensureCourseData(course);
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://academy.rafiei.net';
    const adminAccessLink = `${baseUrl}/admin-enrollment-details?id=${enrollment.id}`;
    
    await this.sendWebhook('enrollment_manual_payment_approved', {
      event_type: 'enrollment_manual_payment_approved',
      timestamp: new Date().toISOString(),
      data: { enrollment, user: enhancedUser, course: enhancedCourse, admin_access_link: adminAccessLink }
    });
  }

  async sendEnrollmentManualPaymentRejected(enrollment: any, user: any, course: any) {
    const enhancedUser = this.enhanceUserData(user);
    const enhancedCourse = this.ensureCourseData(course);
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://academy.rafiei.net';
    const adminAccessLink = `${baseUrl}/admin-enrollment-details?id=${enrollment.id}`;
    
    await this.sendWebhook('enrollment_manual_payment_rejected', {
      event_type: 'enrollment_manual_payment_rejected',
      timestamp: new Date().toISOString(),
      data: { enrollment, user: enhancedUser, course: enhancedCourse, admin_access_link: adminAccessLink }
    });
  }

  async sendUserCreated(user: any) {
    try {
      console.log('📤 EnhancedWebhookManager: Sending user_created webhook for:', user.name);
      
      const enhancedUser = this.enhanceUserData(user);
      
      // Try direct webhook sending first
      await this.sendWebhook('user_created', {
        event_type: 'user_created',
        timestamp: new Date().toISOString(),
        data: { user: enhancedUser }
      });
      
      // Also call the edge function as backup/alternative method
      try {
        const { error: functionError } = await supabase.functions.invoke('send-user-webhook', {
          body: {
            user: enhancedUser,
            eventType: 'user_created'
          }
        });
        
        if (functionError) {
          console.error('Edge function error for user_created webhook:', functionError);
        }
      } catch (edgeFunctionError) {
        console.error('Failed to call edge function for user_created webhook:', edgeFunctionError);
      }
      
    } catch (error) {
      console.error('Failed to send user_created webhook:', error);
      throw error;
    }
  }

  async sendEmailLinkedExistingAccount(user: any, enrollment: any) {
    const enhancedUser = this.enhanceUserData(user);
    await this.sendWebhook('email_linked_existing_account', {
      event_type: 'email_linked_existing_account',
      timestamp: new Date().toISOString(),
      data: { user: enhancedUser, enrollment }
    });
  }

  async sendSSOAccessLinkGenerated(enrollment: any, user: any, course: any, ssoTokens: any) {
    const enhancedUser = this.enhanceUserData(user);
    const enhancedCourse = this.ensureCourseData(course);
    await this.sendWebhook('sso_access_link_generated', {
      event_type: 'sso_access_link_generated',
      timestamp: new Date().toISOString(),
      data: { enrollment, user: enhancedUser, course: enhancedCourse, sso_tokens: ssoTokens }
    });
  }

  async sendRafieiPlayerLicenseGenerated(enrollment: any, user: any, course: any, license: any) {
    const enhancedUser = this.enhanceUserData(user);
    const enhancedCourse = this.ensureCourseData(course);
    await this.sendWebhook('rafiei_player_license_generated', {
      event_type: 'rafiei_player_license_generated',
      timestamp: new Date().toISOString(),
      data: { enrollment, user: enhancedUser, course: enhancedCourse, license }
    });
  }

  async sendWebinarRegistration(webinar: any, registration: any) {
    await this.sendWebhook('webinar_registration', {
      event_type: 'webinar_registration',
      timestamp: new Date().toISOString(),
      data: { webinar, registration }
    });
  }

  async sendWebinarLogin(webinar: any, entry: any) {
    await this.sendWebhook('webinar_login', {
      event_type: 'webinar_login',
      timestamp: new Date().toISOString(),
      data: { webinar, entry }
    });
  }
}

export const enhancedWebhookManager = new EnhancedWebhookManager();
