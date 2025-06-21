
import React from 'react';

interface MessageAvatarProps {
  name: string;
  userId: number;
}

const MessageAvatar: React.FC<MessageAvatarProps> = ({ name, userId }) => {
  // Generate consistent color based on user ID
  const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
  const colorIndex = userId % colors.length;
  const backgroundColor = colors[colorIndex];
  
  // Get first letter of the name
  const firstLetter = name ? name.charAt(0).toUpperCase() : '؟';

  return (
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
      style={{ backgroundColor }}
    >
      {firstLetter}
    </div>
  );
};

export default MessageAvatar;
