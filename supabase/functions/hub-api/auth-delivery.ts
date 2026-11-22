import * as React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts';
import { HubError } from '../_shared/hub-policy.ts';
import { sendEmail } from '../_shared/support-followup.ts';

// Reuse the academy's email provider and OTP template; no OTP body or provider URL is logged.
export async function deliverCode(channel: 'email' | 'sms', destination: string, code: string, requestId: string) {
  try {
    if (channel === 'sms') {
      const key = Deno.env.get('KAVENEGAR_API_KEY');
      const template = Deno.env.get('KAVENEGAR_VERIFY_TEMPLATE');
      if (!key || !template) throw new HubError(503, 'ارسال پیامک تنظیم نشده است');
      const response = await fetch(`https://api.kavenegar.com/v1/${key}/verify/lookup.json`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ receptor: destination, token: code, template }), signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || result.return?.status !== 200) throw new HubError(502, 'ارسال کد انجام نشد');
    } else {
      const template = TEMPLATES['otp-verification'];
      const data = { code };
      const html = await renderAsync(React.createElement(template.component, data));
      const result = await sendEmail(destination, typeof template.subject === 'function' ? template.subject(data) : template.subject, html);
      if (!result.ok) throw new HubError(502, 'ارسال کد ایمیل از سرویس فعلی انجام نشد');
    }
  } catch (error) {
    // Never pass a fetch exception (it can contain Kavenegar's key-bearing URL) to logs.
    if (error instanceof HubError) throw error;
    throw new HubError(502, 'ارسال کد انجام نشد؛ دوباره تلاش کنید');
  }
}