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
  | 'rafiei_player_license_generated';

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

  async sendWebhook(eventType: WebhookEventType, payload: any) {
    try {
      const webhooks = await this.getActiveWebhooks(eventType);
      
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
          return value !== undefined ? value : match;
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

  // Event-specific methods
  async sendEnrollmentCreated(enrollment: any, user: any, course: any) {
    await this.sendWebhook('enrollment_created', {
      event_type: 'enrollment_created',
      timestamp: new Date().toISOString(),
      data: { enrollment, user, course }
    });
  }

  async sendEnrollmentPaidSuccessful(enrollment: any, user: any, course: any, payment: any) {
    await this.sendWebhook('enrollment_paid_successful', {
      event_type: 'enrollment_paid_successful',
      timestamp: new Date().toISOString(),
      data: { enrollment, user, course, payment }
    });
  }

  async sendEnrollmentManualPaymentSubmitted(enrollment: any, user: any, course: any) {
    await this.sendWebhook('enrollment_manual_payment_submitted', {
      event_type: 'enrollment_manual_payment_submitted',
      timestamp: new Date().toISOString(),
      data: { enrollment, user, course }
    });
  }

  async sendEnrollmentManualPaymentApproved(enrollment: any, user: any, course: any) {
    await this.sendWebhook('enrollment_manual_payment_approved', {
      event_type: 'enrollment_manual_payment_approved',
      timestamp: new Date().toISOString(),
      data: { enrollment, user, course }
    });
  }

  async sendEnrollmentManualPaymentRejected(enrollment: any, user: any, course: any) {
    await this.sendWebhook('enrollment_manual_payment_rejected', {
      event_type: 'enrollment_manual_payment_rejected',
      timestamp: new Date().toISOString(),
      data: { enrollment, user, course }
    });
  }

  async sendUserCreated(user: any) {
    await this.sendWebhook('user_created', {
      event_type: 'user_created',
      timestamp: new Date().toISOString(),
      data: { user }
    });
  }

  async sendEmailLinkedExistingAccount(user: any, enrollment: any) {
    await this.sendWebhook('email_linked_existing_account', {
      event_type: 'email_linked_existing_account',
      timestamp: new Date().toISOString(),
      data: { user, enrollment }
    });
  }

  async sendSSOAccessLinkGenerated(enrollment: any, user: any, course: any, ssoTokens: any) {
    await this.sendWebhook('sso_access_link_generated', {
      event_type: 'sso_access_link_generated',
      timestamp: new Date().toISOString(),
      data: { enrollment, user, course, sso_tokens: ssoTokens }
    });
  }

  async sendRafieiPlayerLicenseGenerated(enrollment: any, user: any, course: any, license: any) {
    await this.sendWebhook('rafiei_player_license_generated', {
      event_type: 'rafiei_player_license_generated',
      timestamp: new Date().toISOString(),
      data: { enrollment, user, course, license }
    });
  }
}

export const enhancedWebhookManager = new EnhancedWebhookManager();