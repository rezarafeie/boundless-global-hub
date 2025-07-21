
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { supportMessageService } from '@/lib/supportMessageService';
import { useToast } from '@/hooks/use-toast';

interface SupportResponseInputProps {
  conversationId: number;
  recipientUserId: number;
  onMessageSent: () => void;
}

const SupportResponseInput: React.FC<SupportResponseInputProps> = ({
  conversationId,
  recipientUserId,
  onMessageSent
}) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendResponse = async () => {
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      console.log('Sending support response:', { conversationId, recipientUserId, message });
      
      await supportMessageService.sendSupportMessage(
        recipientUserId,
        message.trim(),
        conversationId
      );

      setMessage('');
      onMessageSent();
      
      toast({
        title: 'پاسخ ارسال شد',
        description: 'پاسخ شما به کاربر ارسال شد',
      });
    } catch (error) {
      console.error('Error sending support response:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پاسخ',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendResponse();
    }
  };

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="پاسخ خود را بنویسید..."
          className="flex-1"
          disabled={sending}
        />
        <Button 
          onClick={sendResponse} 
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        پاسخ شما به کاربر ارسال خواهد شد
      </p>
    </div>
  );
};

export default SupportResponseInput;
