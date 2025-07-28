
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  UserPlus,
  X,
  ChevronLeft,
  Crown,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, color: 'text-blue-500' },
  { id: 'courses', label: 'دوره‌ها', icon: BookOpen, color: 'text-emerald-500' },
  { id: 'enrollments', label: 'ثبت‌نام‌ها', icon: UserCheck, color: 'text-purple-500' },
  { id: 'leads', label: 'مدیریت لیدها', icon: UserPlus, color: 'text-orange-500' },
  { id: 'users', label: 'کاربران', icon: Users, color: 'text-cyan-500' },
  { id: 'analytics', label: 'آنالیتیکس', icon: TrendingUp, color: 'text-pink-500' },
  { id: 'crm', label: 'CRM', icon: MessageSquare, color: 'text-indigo-500' },
  { id: 'settings', label: 'تنظیمات', icon: Settings, color: 'text-gray-500' },
];

const SidebarContent: React.FC<Omit<AdminSidebarProps, 'isOpen' | 'onToggle'>> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white" dir="rtl" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-white">پنل مدیریت رفیعی</h2>
            <p className="text-xs text-slate-300">سیستم مدیریت آکادمی</p>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <div key={item.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 px-4 font-medium transition-all duration-300 text-right",
                  "hover:bg-slate-700/60 hover:text-white hover:shadow-md hover:scale-[1.02]",
                  "focus:bg-slate-700/60 focus:text-white",
                  "group relative overflow-hidden",
                  activeView === item.id ? [
                    "bg-gradient-to-r from-violet-600/80 to-purple-600/80 text-white shadow-lg",
                    "border-r-4 border-violet-400",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-500/20 before:to-purple-500/20",
                    "shadow-violet-500/25"
                  ] : "text-slate-300"
                )}
                onClick={() => onViewChange(item.id)}
              >
                <div className="flex items-center gap-3 w-full justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeView === item.id && (
                      <ChevronLeft className="h-4 w-4 text-violet-300 animate-pulse" />
                    )}
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-300",
                      activeView === item.id ? "text-white scale-110" : item.color
                    )} />
                  </div>
                </div>
              </Button>
              
              {/* Separators after specific sections */}
              {(index === 2 || index === 4) && (
                <Separator className="my-4 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
        <div className="text-xs text-slate-400 text-center">
          آکادمی رفیعی • نسخه ۱.۰.۰
        </div>
      </div>
    </div>
  );
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  onViewChange,
  isOpen,
  onToggle,
}) => {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent 
          side="right" 
          className="p-0 w-80 animate-slide-in-right border-l border-slate-700" 
          dir="rtl"
          style={{ direction: 'rtl' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">پنل مدیریت رفیعی</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X size={16} />
            </Button>
          </div>
          <div className="h-[calc(100vh-4rem)]">
            <SidebarContent activeView={activeView} onViewChange={onViewChange} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 h-full shadow-2xl shadow-slate-900/50 border-l border-slate-700">
        <SidebarContent activeView={activeView} onViewChange={onViewChange} />
      </div>
    </>
  );
};
