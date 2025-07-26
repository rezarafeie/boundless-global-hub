
import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type MessengerMessage, type MessengerUser } from '@/lib/messengerService';

interface MessengerMessageItemProps {
  message: MessengerMessage;
  currentUser: MessengerUser;
  isOptimistic?: boolean;
}

const MessengerMessageItem: React.FC<MessengerMessageItemProps> = ({
  message,
  currentUser,
  isOptimistic = false
}) => {
  const isOwnMessage = message.sender_id === currentUser.id;
  const senderName = message.sender?.name || 'Unknown User';

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} ${isOptimistic ? 'opacity-50' : ''}`}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {senderName}
          </span>
        )}
        
        <div
          className={`rounded-lg px-3 py-2 break-words ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {message.media_url && (
            <div className="mb-2">
              {message.message_type === 'media' && message.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img 
                  src={message.media_url} 
                  alt="Attachment" 
                  className="max-w-full max-h-64 rounded"
                />
              ) : (
                <a 
                  href={message.media_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  📎 View Attachment
                </a>
              )}
            </div>
          )}
          
          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        </div>
        
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {format(new Date(message.created_at), 'HH:mm')}
          {isOptimistic && <span className="ml-1">⏳</span>}
        </span>
      </div>
    </div>
  );
};

export default MessengerMessageItem;
