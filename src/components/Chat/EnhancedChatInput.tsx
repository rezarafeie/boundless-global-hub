
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';

interface ReplyingTo {
  messageId: number;
  message: string;
  senderName: string;
}

interface EnhancedChatInputProps {
  onSendMessage: (message: string, replyToId?: number) => Promise<void>;
  disabled?: boolean;
  replyingTo?: ReplyingTo | null;
  onCancelReply?: () => void;
}

const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  onSendMessage,
  disabled = false,
  replyingTo,
  onCancelReply
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(message.trim(), replyingTo?.messageId);
      setMessage('');
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                پاسخ به {replyingTo.senderName}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {replyingTo.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="بنویسید..."
              className="w-full resize-none border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={disabled || sending}
            />
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || disabled || sending}
            size="sm"
            className="px-3 py-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedChatInput;
