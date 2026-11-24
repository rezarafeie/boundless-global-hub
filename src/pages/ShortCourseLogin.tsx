import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { setCookie } from '@/lib/cookieUtils';
import { isShortlinkSubdomain } from '@/utils/subdomainDetection';

export default function ShortCourseLogin() {
  const { code } = useParams(); const navigate = useNavigate(); const { login } = useAuth();
  const started = useRef(false); const [error, setError] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!code || !/^[A-Za-z0-9]{10}$/.test(code)) { setError('لینک ورود معتبر نیست.'); return; }
    if (isShortlinkSubdomain()) {
      window.location.replace(`https://academy.rafiei.co/s/${encodeURIComponent(code)}`);
      return;
    }
    const authenticate = async () => {
      const { data, error } = await supabase.functions.invoke('enrollment-sms', { body: { action: 'login', code } });
      if (error || !data?.data?.session_token) { setError(data?.error || 'لینک منقضی شده، قبلاً استفاده شده یا دسترسی دوره فعال نیست.'); return; }
      const result = data.data; const chatUser = result.user;
      const user = { id: String(chatUser.id), name: chatUser.name, firstName: chatUser.first_name || '', lastName: chatUser.last_name || '',
        email: chatUser.email || '', phone: chatUser.phone, countryCode: chatUser.country_code || '+98', username: chatUser.username,
        isAcademyUser: true, isMessengerUser: true, messengerData: chatUser };
      setCookie('session_token', result.session_token, 30);
      setCookie('current_user', encodeURIComponent(JSON.stringify(user)), 30);
      localStorage.setItem('messenger_session_token', result.session_token);
      login(user, result.session_token);
      navigate(`/app/course/${encodeURIComponent(result.course_slug)}`, { replace: true });
    };
    authenticate().catch(() => setError('ورود انجام نشد؛ از صفحه ورود وارد شوید.'));
  }, [code, navigate, login]);
  return <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
    <div className="w-full max-w-sm space-y-5 text-center">
      {error ? <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" /> : <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />}
      <h1 className="text-xl font-semibold">{error ? 'ورود به آکادمی رفیعی' : 'در حال ورود به آموزش'}</h1>
      {error && <><p role="alert" className="text-sm leading-7 text-muted-foreground">{error}</p><Button onClick={() => navigate('/auth', { replace: true })}>ورود به حساب</Button></>}
    </div>
  </main>;
}