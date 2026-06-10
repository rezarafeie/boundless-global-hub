// Telegram bot OTP login/register panel for non-Iranian users.
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Send, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'open' | 'otp' | 'email';

interface Props {
  onAuthenticated: (sessionToken: string, userName: string, user: any) => void;
}

const TelegramAuthPanel: React.FC<Props> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<Step>('open');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [tgFirstName, setTgFirstName] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const pollRef = useRef<number | null>(null);

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
      toast.error(e.message || 'خطا در شروع ورود با تلگرام');
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
          toast.error('لینک ورود منقضی شد، دوباره تلاش کنید');
          return;
        }
        if (data?.bound) {
          setTgUsername(data.telegram_username ?? null);
          setTgFirstName(data.first_name ?? null);
          setFirstName(data.first_name ?? '');
          setStep('otp');
          if (pollRef.current) window.clearInterval(pollRef.current);
        }
      } catch { /* ignore */ }
    };
    tick();
    pollRef.current = window.setInterval(tick, 2500) as unknown as number;
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [token, step]);

  const submitCode = async (extra?: { email?: string; firstName?: string }) => {
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-otp-verify', {
        body: { token, code, email: extra?.email ?? email, firstName: extra?.firstName ?? firstName },
      });
      if (error) throw new Error(error.message);
      if (data?.error === 'invalid_code') { toast.error('کد اشتباه است'); return; }
      if (data?.error === 'expired') { toast.error('کد منقضی شده'); return; }
      if (data?.error === 'email_in_use') { toast.error('این ایمیل قبلاً ثبت شده'); return; }
      if (data?.needs_email) { setStep('email'); return; }
      if (data?.error) { toast.error(data.error); return; }
      if (data?.sessionToken && data?.user) {
        toast.success('ورود موفق');
        onAuthenticated(data.sessionToken, data.user.name, data.user);
        return;
      }
      toast.error('خطای نامشخص');
    } catch (e: any) {
      toast.error(e.message || 'خطا');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'open') {
    return (
      <div className="space-y-6 text-center">
        <p className="text-sm text-muted-foreground">
          روی دکمه زیر بزنید تا ربات تلگرام آکادمی باز شود، سپس داخل تلگرام دکمه Start را بزنید.
        </p>
        <Button
          type="button"
          onClick={() => botUrl && window.open(botUrl, '_blank')}
          className="w-full h-12 rounded-full bg-[#229ED9] hover:bg-[#1b86bd] text-white font-normal"
          disabled={!botUrl || loading}
        >
          <Send className="w-4 h-4 mr-2" />
          باز کردن ربات تلگرام
        </Button>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> در انتظار تایید شما در تلگرام...
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={start} disabled={loading}>
          <RefreshCw className="w-3 h-3 mr-1" /> لینک جدید
        </Button>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="space-y-6">
        <p className="text-sm text-center text-muted-foreground">
          کد ۶ رقمی ارسال‌شده در تلگرام {tgUsername ? `(@${tgUsername})` : ''} را وارد کنید
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
          onClick={() => submitCode()}
          disabled={loading || code.length !== 6}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تایید'}
        </Button>
      </div>
    );
  }

  // step === 'email'
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => { e.preventDefault(); submitCode({ email, firstName }); }}
    >
      <p className="text-sm text-center text-muted-foreground">
        برای تکمیل ثبت‌نام، ایمیل و نام خود را وارد کنید
      </p>
      <div>
        <label className="text-xs text-muted-foreground">نام</label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Mail className="w-3 h-3" /> ایمیل
        </label>
        <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full h-12 rounded-full" disabled={loading || !email || !firstName}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تکمیل ثبت‌نام'}
      </Button>
    </form>
  );
};

export default TelegramAuthPanel;
