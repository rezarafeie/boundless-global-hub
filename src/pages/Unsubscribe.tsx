import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type State = 'loading' | 'valid' | 'invalid' | 'already' | 'success' | 'error';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setState('invalid');
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState('invalid');
          return;
        }
        if (data?.valid === false && data?.reason === 'already_unsubscribed') {
          setState('already');
          return;
        }
        setState('valid');
      } catch {
        setState('error');
      }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'handle-email-unsubscribe',
        { body: { token } }
      );
      if (error) {
        setState('error');
        return;
      }
      if ((data as any)?.reason === 'already_unsubscribed') {
        setState('already');
      } else {
        setState('success');
      }
    } catch {
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {state === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Validating your request…</p>
          </>
        )}

        {state === 'valid' && (
          <>
            <h1 className="text-2xl font-semibold">Confirm unsubscribe</h1>
            <p className="text-muted-foreground">
              Click below to stop receiving these emails. You can re-subscribe later
              if you change your mind.
            </p>
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full h-12 rounded-xl"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirm unsubscribe'
              )}
            </Button>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold">You're unsubscribed</h1>
            <p className="text-muted-foreground">
              You will no longer receive these emails.
            </p>
          </>
        )}

        {state === 'already' && (
          <>
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold">Already unsubscribed</h1>
            <p className="text-muted-foreground">
              This email address has already been removed from our list.
            </p>
          </>
        )}

        {(state === 'invalid' || state === 'error') && (
          <>
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold">Link not valid</h1>
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
