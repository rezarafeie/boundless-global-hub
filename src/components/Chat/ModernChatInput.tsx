
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

interface ModernChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ModernChatInput: React.FC<ModernChatInputProps> = ({ 
  onSendMessage, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessage(prev => prev + emoji);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const isMessageValid = message.trim().length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 safe-area-padding-bottom">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="برای نوشتن پیام اینجا بنویسید... ✍️"
            className="resize-none border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 pr-12 min-h-[48px] max-h-32 text-right focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 text-base"
            disabled={disabled || isSending}
            rows={1}
            dir="rtl"
            style={{ direction: 'rtl', textAlign: 'right' }}
          />
          <div className="absolute left-3 bottom-3">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={!isMessageValid || disabled || isSending}
          className={`rounded-2xl h-12 w-12 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex-shrink-0 ${
            isMessageValid && !disabled && !isSending
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
      
      {isSending && (
        <div className="text-center mt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            در حال ارسال پیام...
          </span>
        </div>
      )}
    </div>
  );
};

export default ModernChatInput;
