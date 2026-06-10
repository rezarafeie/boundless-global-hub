// Telegram bot OTP login/register panel.
// Flow: open bot → enter Telegram OTP → (new users) collect phone/email → second OTP via SMS (+98)
// or email (others). If the bot received "Share contact" we skip the second OTP automatically.
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Send, Mail, RefreshCw, Phone, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'open' | 'tg_otp' | 'contact' | 'contact_otp';

interface Props {
  onAuthenticated: (sessionToken: string, userName: string, user: any) => void;
}

const COUNTRY_CODES = [
  { code: '+98', label: '🇮🇷 Iran +98' },
  { code: '+1', label: '🇺🇸 US/Canada +1' },
  { code: '+44', label: '🇬🇧 UK +44' },
  { code: '+49', label: '🇩🇪 Germany +49' },
  { code: '+33', label: '🇫🇷 France +33' },
  { code: '+90', label: '🇹🇷 Turkey +90' },
  { code: '+971', label: '🇦🇪 UAE +971' },
  { code: '+966', label: '🇸🇦 Saudi +966' },
  { code: '+61', label: '🇦🇺 Australia +61' },
  { code: '+91', label: '🇮🇳 India +91' },
];

const TelegramAuthPanel: React.FC<Props> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<Step>('open');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [contactCode, setContactCode] = useState('');
  const [countryCode, setCountryCode] = useState('+98');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phoneFromTelegram, setPhoneFromTelegram] = useState<string | null>(null);
  const [otpChannel, setOtpChannel] = useState<'sms' | 'email' | null>(null);
  const [otpDestination, setOtpDestination] = useState<string>('');
  const pollRef = useRef<number | null>(null);

  const isIran = countryCode === '+98';

  const start = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-login-start', { body: {} });
      if (error || !data?.token) throw new Error(error?.message || 'failed');
      setToken(data.token);
      setBotUrl(data.bot_url);
      setStep('open');
      try { window.open(data.bot_url, '_blank'); } catch { /* ignore */ }
    } catch (e: any) {
      toast.error(e.message || 'Failed to start Telegram login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { start(); /* eslint-disable-next-line */ }, []);

  // Poll status while waiting on the user to open the bot
  useEffect(() => {
    if (!token || step !== 'open') return;
    const tick = async () => {
      try {
        const url = `https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/telegram-login-status?token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.expired) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          toast.error('Login link expired, please try again');
          return;
        }
        if (data?.bound) {
          setTgUsername(data.telegram_username ?? null);
          setFirstName(data.first_name ?? '');
          if (data.phone_from_telegram) {
            setPhoneFromTelegram(data.phone_from_telegram);
            if (data.country_code_from_telegram) setCountryCode(data.country_code_from_telegram);
            const local = String(data.phone_from_telegram).replace(data.country_code_from_telegram || '', '');
            setPhone(local);
          }
          setStep('tg_otp');
          if (pollRef.current) window.clearInterval(pollRef.current);
        }
      } catch { /* ignore */ }
    };
    tick();
    pollRef.current = window.setInterval(tick, 2500) as unknown as number;
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [token, step]);

  const submitTgOtp = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-otp-verify', {
        body: { token, code },
      });
      if (error) throw new Error(error.message);
      if (data?.error === 'invalid_code') { toast.error('Wrong code'); return; }
      if (data?.error === 'expired') { toast.error('Code expired'); return; }
      if (data?.needs_contact) {
        setStep('contact');
        return;
      }
      if (data?.error) { toast.error(data.error); return; }
      if (data?.sessionToken && data?.user) {
        toast.success('Logged in');
        onAuthenticated(data.sessionToken, data.user.name, data.user);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const sendContactOtp = async () => {
    if (!token) return;
    if (!phone || !firstName) { toast.error('Please complete the form'); return; }
    if (!isIran && !email) { toast.error('Email is required for non-Iranian numbers'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-finalize-registration', {
        body: {
          mode: 'send_otp', token, phone, countryCode,
          email: isIran ? undefined : email, firstName,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error === 'phone_in_use') { toast.error('This phone is already registered'); return; }
      if (data?.error === 'email_in_use') { toast.error('This email is already registered'); return; }
      if (data?.error === 'invalid_email') { toast.error('Invalid email'); return; }
      if (data?.error === 'send_failed') { toast.error('Could not send verification code'); return; }
      if (data?.error) { toast.error(data.error); return; }
      // Auto-create path (phone already verified via Telegram contact share)
      if (data?.channel === 'auto' && data?.sessionToken && data?.user) {
        toast.success('Welcome!');
        onAuthenticated(data.sessionToken, data.user.name, data.user);
        return;
      }
      setOtpChannel(data?.channel ?? null);
      setOtpDestination(data?.destination ?? '');
      setStep('contact_otp');
      toast.success(data?.channel === 'sms' ? 'SMS code sent' : 'Email code sent');
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const verifyContactOtp = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-finalize-registration', {
        body: { mode: 'verify_otp', token, code: contactCode },
      });
      if (error) throw new Error(error.message);
      if (data?.error === 'invalid_code') { toast.error('Wrong code'); return; }
      if (data?.error === 'expired_code') { toast.error('Code expired'); return; }
      if (data?.error === 'phone_in_use') { toast.error('This phone is already registered'); return; }
      if (data?.error === 'email_in_use') { toast.error('This email is already registered'); return; }
      if (data?.error) { toast.error(data.error); return; }
      if (data?.sessionToken && data?.user) {
        toast.success('Welcome!');
        onAuthenticated(data.sessionToken, data.user.name, data.user);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'open') {
    return (
      <div className="space-y-6 text-center">
        <p className="text-sm text-muted-foreground">
          Tap the button to open the Rafiei Academy Telegram bot, then press Start inside Telegram.
        </p>
        <Button
          type="button"
          onClick={() => botUrl && window.open(botUrl, '_blank')}
          className="w-full h-12 rounded-full bg-[#229ED9] hover:bg-[#1b86bd] text-white font-normal"
          disabled={!botUrl || loading}
        >
          <Send className="w-4 h-4 mr-2" />
          Open Telegram bot
        </Button>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Waiting for confirmation in Telegram...
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={start} disabled={loading}>
          <RefreshCw className="w-3 h-3 mr-1" /> New link
        </Button>
      </div>
    );
  }

  if (step === 'tg_otp') {
    return (
      <div className="space-y-6">
        <p className="text-sm text-center text-muted-foreground">
          Enter the 6-digit code sent to your Telegram {tgUsername ? `(@${tgUsername})` : ''}
        </p>
        <div className="flex justify-center" dir="ltr">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          type="button"
          className="w-full h-12 rounded-full"
          onClick={submitTgOtp}
          disabled={loading || code.length !== 6}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
        </Button>
      </div>
    );
  }

  if (step === 'contact') {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); sendContactOtp(); }}
      >
        <p className="text-sm text-center text-muted-foreground">
          Finish creating your account
        </p>

        {phoneFromTelegram && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded">
            <CheckCircle2 className="w-4 h-4" />
            Phone shared via Telegram — we'll skip the SMS step
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground">Name</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" /> Phone
          </label>
          <div className="flex gap-2" dir="ltr">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={isIran ? '9120000000' : '5551234567'}
              required
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {isIran ? 'We will send an SMS code via Kavenegar' : 'Used as your contact number'}
          </p>
        </div>

        {!isIran && (
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email (we'll send a code here)
            </label>
            <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        )}

        <Button type="submit" className="w-full h-12 rounded-full" disabled={loading || !phone || !firstName || (!isIran && !email)}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (phoneFromTelegram ? 'Finish' : 'Send verification code')}
        </Button>
      </form>
    );
  }

  // step === 'contact_otp'
  return (
    <div className="space-y-6">
      <p className="text-sm text-center text-muted-foreground">
        {otpChannel === 'sms'
          ? `Enter the 6-digit code sent via SMS to ${otpDestination}`
          : `Enter the 6-digit code sent to ${otpDestination}`}
      </p>
      <div className="flex justify-center" dir="ltr">
        <InputOTP maxLength={6} value={contactCode} onChange={setContactCode}>
          <InputOTPGroup>
            {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        type="button"
        className="w-full h-12 rounded-full"
        onClick={verifyContactOtp}
        disabled={loading || contactCode.length !== 6}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & create account'}
      </Button>
      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setStep('contact')}>
        Back
      </Button>
    </div>
  );
};

export default TelegramAuthPanel;
