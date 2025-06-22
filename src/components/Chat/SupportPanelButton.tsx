
import React from 'react';
import { Button } from '@/components/ui/button';
import { Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type MessengerUser } from '@/lib/messengerService';

interface SupportPanelButtonProps {
  currentUser: MessengerUser;
}

const SupportPanelButton: React.FC<SupportPanelButtonProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  if (!currentUser.is_support_agent) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate('/hub/support')}
      className="bg-purple-600 hover:bg-purple-700 text-white"
      size="sm"
    >
      <Headphones className="w-4 h-4 mr-2" />
      🎧 ورود به پنل پشتیبانی
    </Button>
  );
};

export default SupportPanelButton;
