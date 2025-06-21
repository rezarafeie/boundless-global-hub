
import React from 'react';

interface UserAvatarProps {
  name: string;
  userId?: string;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, userId, size = 40 }) => {
  // Extract first letter of name
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  
  // Generate consistent color based on name or userId
  const generateColor = (str: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#FF6348', '#2ED573', '#3742FA', '#F368E0', '#FFA502'
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  const backgroundColor = generateColor(userId || name);
  
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-medium"
      style={{
        width: size,
        height: size,
        backgroundColor,
        fontSize: size * 0.4
      }}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
