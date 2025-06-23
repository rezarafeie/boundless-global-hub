
import React from 'react';
import { Crown, Headphones, Phone, MessageCircle, Shield, Users } from 'lucide-react';

export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'crown': return <Crown className="w-4 h-4" />;
    case 'phone': return <Phone className="w-4 h-4" />;
    case 'message-circle': return <MessageCircle className="w-4 h-4" />;
    case 'shield': return <Shield className="w-4 h-4" />;
    case 'users': return <Users className="w-4 h-4" />;
    default: return <Headphones className="w-4 h-4" />;
  }
};
