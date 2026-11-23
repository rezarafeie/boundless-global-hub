
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
    if (!message.trim() || disabled) return;
    
    const messageToSend = message.trim();
    const replyId = replyingTo?.id;
    
    // Clear input and reply immediately for instant feel
    setMessage('');
    setReplyingTo(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // Send message without waiting - fire and forget for speed
    try {
      // Call onSendMessage immediately without await for instant UI update
      onSendMessage(messageToSend, undefined, replyId);
    } catch (error) {
      console.error('Error sending message:', error);
      // Don't show error toast immediately to maintain fast feel
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
        
        // Send the file as a message immediately
        onSendMessage('', {
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
      
      // Send the voice message immediately
      onSendMessage('', {
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
    <div className="bg-background/85 backdrop-blur-xl border-t border-border/60 px-2 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      {/* Reply Preview */}
      {replyingTo && (
        <div className="max-w-6xl mx-auto mb-2 px-3 py-2 bg-muted rounded-xl border-r-4 border-primary animate-fade-in"
             style={{
               animation: 'slideDown 0.3s ease-out'
             }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-foreground font-semibold mb-0.5">
                پاسخ به {replyingTo.sender_name}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {replyingTo.message}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 text-muted-foreground"
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
            className="resize-none border-0 bg-muted rounded-3xl px-4 py-2.5 pl-10 min-h-[42px] max-h-32 text-right focus-visible:ring-1 text-[15px]"
            disabled={disabled}
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
          disabled={!isMessageValid || disabled}
          size="sm"
          className={`rounded-full h-[42px] w-[42px] p-0 transition-all duration-150 flex-shrink-0 active:scale-95 ${
            isMessageValid && !disabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Send className="w-[18px] h-[18px] -scale-x-100" />
        </Button>
      </form>
    </div>
  );
};

export default ModernChatInput;
