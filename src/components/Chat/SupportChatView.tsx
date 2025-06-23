
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SupportRoom {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ReactNode;
  isPermanent: boolean;
}

interface SupportChatViewProps {
  supportRoom: SupportRoom;
  currentUser: any;
  sessionToken: string;
  onBack: () => void;
}

const SupportChatView: React.FC<SupportChatViewProps> = ({
  supportRoom,
  currentUser,
  sessionToken,
  onBack
}) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Card className="p-8 text-center">
        <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {supportRoom.name}
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          {supportRoom.description}
        </p>
        <p className="text-sm text-slate-400 mt-4">
          این بخش در حال توسعه است
        </p>
      </Card>
    </div>
  );
};

export default SupportChatView;
