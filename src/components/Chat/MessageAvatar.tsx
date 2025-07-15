
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageAvatarProps {
  name: string;
  userId: number;
  avatarUrl?: string;
}

const MessageAvatar: React.FC<MessageAvatarProps> = ({ name, userId, avatarUrl }) => {
  // Generate consistent color based on user ID
  const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
  const colorIndex = userId % colors.length;
  const backgroundColor = colors[colorIndex];
  
  // Get first letter of the name
  const firstLetter = name ? name.charAt(0).toUpperCase() : '؟';

  return (
    <Avatar className="w-8 h-8">
      <AvatarImage src={avatarUrl} alt={name} />
      <AvatarFallback 
        className="text-white text-sm font-medium"
        style={{ backgroundColor }}
      >
        {firstLetter}
      </AvatarFallback>
    </Avatar>
  );
};

export default MessageAvatar;
