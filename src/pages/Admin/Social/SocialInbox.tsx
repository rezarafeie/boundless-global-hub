import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Languages, FileText, Bell, Search, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SocialInbox: React.FC = () => {
  const [convs, setConvs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadConvs = async () => {
    const { data } = await supabase
      .from('social_conversations')
      .select('*, social_accounts(username)')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100);
    setConvs(data || []);
  };

  const loadMsgs = async (id: string) => {
    const { data } = await supabase
      .from('social_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('sent_at', { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => { loadConvs(); }, []);
  useEffect(() => {
    if (!selected) return;
    loadMsgs(selected.id);
    const ch = supabase
      .channel(`social-msgs-${selected.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'social_messages',
        filter: `conversation_id=eq.${selected.id}`,
      }, () => loadMsgs(selected.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected?.id]);

  useEffect(() => {
    const ch = supabase
      .channel('social-convs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_conversations' }, () => loadConvs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    if (!q) return convs;
    const s = q.toLowerCase();
    return convs.filter(c =>
      (c.participant_username || '').toLowerCase().includes(s) ||
      (c.last_message_preview || '').toLowerCase().includes(s)
    );
  }, [q, convs]);

  const send = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('social-send-message', {
        body: { conversation_id: selected.id, text: draft.trim() },
      });
      if (error) throw error;
      setDraft('');
      await loadMsgs(selected.id);
    } catch (e: any) {
      toast({ title: 'ارسال ناموفق', description: e.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const runAi = async (action: string) => {
    if (!selected) return;
    setAiBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke('social-ai-reply', {
        body: { conversation_id: selected.id, action },
      });
      if (error) throw error;
      if (action === 'suggest' || action === 'followup') {
        setDraft(data.reply || '');
      } else {
        toast({ title: action === 'summarize' ? 'خلاصه مکالمه' : 'ترجمه', description: data.reply });
      }
    } catch (e: any) {
      toast({ title: 'خطای AI', description: e.message, variant: 'destructive' });
    } finally { setAiBusy(null); }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      await supabase.functions.invoke('social-inbox-sync', { body: {} });
      await loadConvs();
      if (selected) await loadMsgs(selected.id);
    } finally { setSyncing(false); }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row" dir="rtl">
      {/* Conversation list */}
      <div className="w-full md:w-80 border-l border-border bg-card flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">مکالمات ({filtered.length})</h2>
            <Button size="icon" variant="ghost" onClick={syncNow} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو..." className="pr-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              مکالمه‌ای موجود نیست. از بخش اکانت‌ها «به‌روزرسانی صندوق» را بزنید.
            </div>
          )}
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-right p-3 border-b hover:bg-muted transition-colors ${
                selected?.id === c.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.participant_username || 'ناشناس'}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {c.last_message_preview || '—'}
                  </div>
                </div>
                {c.unread_count > 0 && (
                  <Badge className="bg-primary">{c.unread_count}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground">
                  {c.social_accounts?.username && `@${c.social_accounts.username}`}
                </span>
                {c.last_responder === 'ai' && <Badge variant="outline" className="text-[10px]">AI</Badge>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>یک مکالمه را انتخاب کنید</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b bg-card flex items-center justify-between">
              <div>
                <div className="font-semibold">{selected.participant_username || 'ناشناس'}</div>
                <div className="text-xs text-muted-foreground">
                  @{selected.social_accounts?.username}
                  {selected.lead_score > 0 && <> · امتیاز lead: {selected.lead_score}</>}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    m.direction === 'out'
                      ? m.sender_type === 'ai'
                        ? 'bg-purple-500/10 border border-purple-500/30'
                        : 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {m.sender_type === 'ai' && (
                      <div className="text-[10px] opacity-70 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    <div className="text-[10px] opacity-60 mt-1">
                      {new Date(m.sent_at).toLocaleString('fa-IR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-3 bg-card space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => runAi('suggest')} disabled={!!aiBusy}>
                  {aiBusy === 'suggest' ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Sparkles className="w-3 h-3 ml-1" />}
                  پیشنهاد AI
                </Button>
                <Button size="sm" variant="outline" onClick={() => runAi('translate')} disabled={!!aiBusy}>
                  <Languages className="w-3 h-3 ml-1" /> ترجمه
                </Button>
                <Button size="sm" variant="outline" onClick={() => runAi('summarize')} disabled={!!aiBusy}>
                  <FileText className="w-3 h-3 ml-1" /> خلاصه
                </Button>
                <Button size="sm" variant="outline" onClick={() => runAi('followup')} disabled={!!aiBusy}>
                  <Bell className="w-3 h-3 ml-1" /> پیگیری
                </Button>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  rows={2}
                  className="resize-none"
                />
                <Button onClick={send} disabled={sending || !draft.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SocialInbox;
