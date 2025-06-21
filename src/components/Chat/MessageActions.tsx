
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreHorizontal, Reply, Forward, Heart } from 'lucide-react';

interface MessageActionsProps {
  messageId: number;
  onReply: (messageId: number) => void;
  onForward: (messageId: number) => void;
  onReact: (messageId: number) => void;
  currentUserId: number;
  senderId: number;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  onReply,
  onForward,
  onReact,
  currentUserId,
  senderId
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => onReact(messageId)}
          >
            <Heart className="w-3 h-3 mr-2" />
            واکنش
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => onReply(messageId)}
          >
            <Reply className="w-3 h-3 mr-2" />
            پاسخ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => onForward(messageId)}
          >
            <Forward className="w-3 h-3 mr-2" />
            ارسال مجدد
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MessageActions;
