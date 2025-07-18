
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
    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-b border-slate-700 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-1">
            💬 گفت‌وگوهای بدون مرز
          </h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              آنلاین
            </span>
            <Badge className="bg-amber-600/20 text-amber-300 border-amber-600/30 text-xs">
              <Users className="w-3 h-3 mr-1" />
              {onlineCount} نفر
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-slate-300 text-sm hidden sm:block">
          خوش آمدید، <span className="text-amber-300 font-medium">{userName}</span>
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ModernChatHeader;
