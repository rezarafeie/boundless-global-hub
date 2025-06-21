
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

interface ModernChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ModernChatInput: React.FC<ModernChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  placeholder = "پیامت رو بنویس..."
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
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
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="resize-none border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4 py-3 pr-12 min-h-[44px] max-h-[120px] text-right focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
            disabled={disabled}
            rows={1}
            dir="rtl"
          />
          <div className="absolute left-3 bottom-3">
            <EmojiPicker onEmojiSelect={handleEmojiSelect}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </EmojiPicker>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-11 h-11 p-0 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default ModernChatInput;
