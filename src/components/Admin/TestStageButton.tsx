import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PlayCircle, Loader2 } from 'lucide-react';

interface Props { stage: 1 | 2 | 3; courseId: string }

const TestStageButton: React.FC<Props> = ({ stage, courseId }) => {
  const [activations, setActivations] = useState<any[]>([]);
  const [activationId, setActivationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!courseId) return;
    supabase
      .from('support_activations' as any)
      .select('id, user_id, activation_token, status, chat_users:user_id(name, phone, email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setActivations((data as any) || []));
  }, [courseId]);

  const run = async () => {
    if (!activationId) {
      toast({ title: 'یک کاربر برای تست انتخاب کنید', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('support-activation-followup-test', {
        body: { activation_id: activationId, stage },
      });
      if (error) throw error;
      setResult(data);
      toast({ title: (data as any)?.ok ? 'ارسال شد ✅' : 'ناموفق', description: JSON.stringify((data as any)?.result ?? data).slice(0, 200) });
    } catch (e: any) {
      setResult({ ok: false, error: e.message || String(e) });
      toast({ title: 'خطا', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-3 mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">تست ارسال:</span>
        <Select value={activationId} onValueChange={setActivationId}>
          <SelectTrigger className="h-8 w-[280px] text-xs"><SelectValue placeholder="یک خریدار انتخاب کنید" /></SelectTrigger>
          <SelectContent>
            {activations.map((a) => (
              <SelectItem key={a.id} value={a.id} className="text-xs">
                {a.chat_users?.name || `#${a.user_id}`} · {a.chat_users?.phone || a.chat_users?.email || a.activation_token.slice(0, 6)} · {a.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" onClick={run} disabled={loading || !activationId}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <PlayCircle className="h-3 w-3 ml-1" />}
          ارسال تستی مرحله {stage}
        </Button>
      </div>
      {result && (
        <pre className="text-[10px] bg-background border rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap" dir="ltr">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default TestStageButton;
