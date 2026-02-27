import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Trash2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  webinar_id: string;
  participant_id: string;
  display_name: string;
  message: string;
  is_private: boolean;
  created_at: string;
}

interface WebinarChatProps {
  webinarId: string;
  participantId: string;
  displayName: string;
  chatEnabled: boolean;
  chatMode: 'public' | 'private' | 'off';
  isHost?: boolean;
}

const WebinarChat: React.FC<WebinarChatProps> = ({
  webinarId,
  participantId,
  displayName,
  chatEnabled,
  chatMode,
  isHost = false,
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!webinarId) return;
    const query = supabase
      .from('webinar_messages')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('created_at', { ascending: true })
      .limit(200);

    // In private mode, only host sees private messages (non-host sees nothing when mode is private)
    if (chatMode === 'private' && !isHost) {
      query.eq('is_private', false);
    }

    const { data } = await query;
    if (data) setMessages(data as ChatMessage[]);
  }, [webinarId, chatMode, isHost]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!webinarId) return;

    const channel = supabase
      .channel(`webinar-chat-${webinarId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'webinar_messages',
        filter: `webinar_id=eq.${webinarId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        // In private mode, non-host shouldn't see private messages
        if (chatMode === 'private' && !isHost && newMsg.is_private) return;
        setMessages(prev => [...prev].slice(-199).concat(newMsg));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'webinar_messages',
        filter: `webinar_id=eq.${webinarId}`,
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [webinarId, chatMode, isHost]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('webinar_messages').insert({
        webinar_id: webinarId,
        participant_id: participantId,
        display_name: displayName,
        message: newMessage.trim(),
        is_private: chatMode === 'private',
      });
      if (error) throw error;
      setNewMessage('');
    } catch {
      toast({ title: 'خطا در ارسال پیام', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    await supabase.from('webinar_messages').delete().eq('id', messageId);
  };

  if (!chatEnabled || chatMode === 'off') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-12 gap-2">
        <Lock className="h-5 w-5" />
        <p>چت غیرفعال است</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {chatMode === 'private' && (
        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1.5 border-b">
          <Lock className="h-3 w-3" />
          چت خصوصی — فقط میزبان پیام‌ها را می‌بیند
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1.5">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">هنوز پیامی نیست...</p>
        ) : (
          messages.map(msg => {
            const isOwn = msg.participant_id === participantId;
            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-sm ${
                  isOwn
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {!isOwn && (
                    <span className="text-[10px] font-medium opacity-70 block mb-0.5">
                      {msg.display_name}
                    </span>
                  )}
                  <p className="leading-relaxed text-[13px]">{msg.message}</p>
                </div>
                {isHost && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t p-2 flex gap-2">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="پیام بنویسید..."
          dir="rtl"
          maxLength={300}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          className="text-sm h-9"
        />
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WebinarChat;
