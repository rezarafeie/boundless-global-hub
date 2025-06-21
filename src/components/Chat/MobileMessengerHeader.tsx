
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, LogOut } from 'lucide-react';

interface MobileMessengerHeaderProps {
  onBack: () => void;
  onLogout: () => void;
}

const MobileMessengerHeader: React.FC<MobileMessengerHeaderProps> = ({
  onBack,
  onLogout
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 md:hidden">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-500" />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-red-500 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default MobileMessengerHeader;
