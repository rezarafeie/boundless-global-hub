
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FileAttachmentButton from './FileAttachmentButton';
import VoiceRecorderButton from './VoiceRecorderButton';
import { uploadFile, FileUploadResult } from '@/lib/fileUploadService';
import { useToast } from '@/hooks/use-toast';
import { useReply } from '@/contexts/ReplyContext';

interface ModernChatInputProps {
  onSendMessage: (message: string, media?: { url: string; type: string; size?: number; name?: string }, replyToId?: number) => void;
  disabled?: boolean;
  currentUserId?: number;
}

const ModernChatInput: React.FC<ModernChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  currentUserId 
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { replyingTo, setReplyingTo } = useReply();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message.trim(), undefined, replyingTo?.id);
      setMessage('');
      setReplyingTo(null);
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

  const handleFileSelect = async (files: FileList) => {
    if (!currentUserId) return;
    setIsSending(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: 'خطا',
            description: `فایل ${file.name} بیش از حد بزرگ است (حداکثر ۵۰ مگابایت)`,
            variant: 'destructive',
          });
          continue;
        }

        const uploadResult: FileUploadResult = await uploadFile(file, 'messenger-files', currentUserId);
        
        // Send the file as a message
        await onSendMessage('', {
          url: uploadResult.url,
          type: uploadResult.type,
          size: uploadResult.size,
          name: uploadResult.name
        });

        toast({
          title: 'موفق',
          description: `فایل ${file.name} ارسال شد`,
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'خطا',
        description: 'خطا در آپلود فایل',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceRecorded = async (blob: Blob) => {
    if (!currentUserId) return;
    setIsSending(true);
    try {
      // Create a File object from the blob
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      
      const uploadResult: FileUploadResult = await uploadFile(file, 'voice-messages', currentUserId);
      
      console.log('Voice message upload result:', uploadResult);
      
      // Send the voice message with proper media data
      await onSendMessage('🎤 Voice Message', {
        url: uploadResult.url,
        type: 'audio/webm',
        size: uploadResult.size,
        name: uploadResult.name
      });

      toast({
        title: 'موفق',
        description: 'پیام صوتی ارسال شد',
      });
    } catch (error) {
      console.error('Voice upload error:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام صوتی',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
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
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-3 safe-area-padding-bottom">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="max-w-6xl mx-auto mb-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                Reply to {replyingTo.sender_name}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                {replyingTo.message}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto flex items-end gap-2">
        {/* File Attachment and Voice Recorder */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <FileAttachmentButton 
            onFileSelect={handleFileSelect}
            disabled={disabled || isSending || !currentUserId}
          />
          <VoiceRecorderButton 
            onVoiceRecorded={handleVoiceRecorded}
            disabled={disabled || isSending || !currentUserId}
          />
        </div>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام..."
            className="resize-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 pr-10 min-h-[40px] max-h-32 text-right focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm"
            disabled={disabled || isSending}
            rows={1}
            dir="rtl"
            style={{ direction: 'rtl', textAlign: 'right' }}
          />
          <div className="absolute left-2 bottom-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={!isMessageValid || disabled || isSending}
          size="sm"
          className={`rounded-xl h-10 w-10 p-0 transition-all duration-200 flex-shrink-0 ${
            isMessageValid && !disabled && !isSending
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      
      {isSending && (
        <div className="text-center mt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            در حال ارسال...
          </span>
        </div>
      )}
    </div>
  );
};

export default ModernChatInput;
