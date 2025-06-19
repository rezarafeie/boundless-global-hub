
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, LogOut, MessageCircle } from 'lucide-react';

interface ModernChatHeaderProps {
  userName: string;
  onlineCount: number;
  onLogout: () => void;
}

const ModernChatHeader: React.FC<ModernChatHeaderProps> = ({ 
  userName, 
  onlineCount, 
  onLogout 
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-900 dark:bg-slate-950 border-b border-slate-700 rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <MessageCircle className="w-8 h-8 text-amber-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">💬 گفت‌وگوهای بدون مرز</h3>
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              آنلاین
            </span>
            <Badge variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
              <Users className="w-3 h-3 mr-1" />
              {onlineCount} نفر
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-slate-300 text-sm hidden sm:block">
          خوش آمدید، {userName}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ModernChatHeader;
