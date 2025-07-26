
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { supportMessageService } from '@/lib/supportMessageService';
import { useToast } from '@/hooks/use-toast';
import VoiceRecorderButton from './VoiceRecorderButton';
import { uploadFile, FileUploadResult } from '@/lib/fileUploadService';

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

  const sendResponse = async (messageText?: string, mediaUrl?: string, mediaType?: string, mediaContent?: string) => {
    const textToSend = messageText || message.trim();
    
    if (!textToSend && !mediaUrl) return;
    if (sending) return;

    // Validation and logging
    console.log('Sending support response with parameters:', {
      conversationId,
      recipientUserId,
      messageLength: textToSend.length,
      hasMedia: !!mediaUrl
    });

    if (!recipientUserId || recipientUserId === 0) {
      console.error('Invalid recipientUserId:', recipientUserId);
      toast({
        title: 'خطا',
        description: 'شناسه کاربر نامعتبر است',
        variant: 'destructive',
      });
      return;
    }

    if (!conversationId || conversationId === 0) {
      console.error('Invalid conversationId:', conversationId);
      toast({
        title: 'خطا',
        description: 'شناسه گفتگو نامعتبر است',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSending(true);
      console.log('Calling sendSupportMessage with:', {
        recipientUserId,
        message: textToSend,
        conversationId,
        mediaUrl,
        mediaType
      });
      
      await supportMessageService.sendSupportMessage(
        recipientUserId,
        textToSend,
        conversationId,
        mediaUrl,
        mediaType,
        mediaContent
      );

      if (!mediaUrl) {
        setMessage('');
      }
      
      // Refresh messages immediately
      setTimeout(() => {
        onMessageSent();
      }, 500);
      
      toast({
        title: mediaUrl ? 'فایل ارسال شد' : 'پاسخ ارسال شد',
        description: `${mediaUrl ? 'فایل' : 'پاسخ'} شما به کاربر ${recipientUserId} ارسال شد`,
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

  const handleVoiceRecorded = async (blob: Blob) => {
    setSending(true);
    try {
      // Create a File object from the blob
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      
      const uploadResult: FileUploadResult = await uploadFile(file, 'voice-messages', 1); // Support user ID is 1
      
      console.log('Voice message upload result:', uploadResult);
      
      // Send the voice message
      await sendResponse('', uploadResult.url, 'audio/webm', uploadResult.name);

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
        <VoiceRecorderButton 
          onVoiceRecorded={handleVoiceRecorded}
          disabled={sending}
        />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="پاسخ خود را بنویسید..."
          className="flex-1"
          disabled={sending}
        />
        <Button 
          onClick={() => sendResponse()} 
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
        پاسخ شما به کاربر {recipientUserId} در گفتگو {conversationId} ارسال خواهد شد
      </p>
    </div>
  );
};

export default SupportResponseInput;
