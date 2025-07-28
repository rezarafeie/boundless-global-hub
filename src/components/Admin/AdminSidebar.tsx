
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
  ChevronLeft
} from 'lucide-react';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'courses', label: 'دوره‌ها', icon: BookOpen },
  { id: 'enrollments', label: 'ثبت‌نام‌ها', icon: UserCheck },
  { id: 'leads', label: 'مدیریت لیدها', icon: UserPlus },
  { id: 'users', label: 'کاربران', icon: Users },
  { id: 'analytics', label: 'آنالیتیکس', icon: BarChart3 },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

const SidebarContent: React.FC<Omit<AdminSidebarProps, 'isOpen' | 'onToggle'>> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border rtl" dir="rtl">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sidebar-accent rounded-lg">
            <LayoutDashboard className="h-5 w-5 text-sidebar-accent-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">پنل مدیریت</h2>
            <p className="text-xs text-sidebar-foreground/60">سیستم مدیریت آکادمی</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={item.id}>
              <Button
                variant={activeView === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-between gap-3 h-11 px-4 font-medium transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
                  activeView === item.id && [
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                    "border-r-2 border-sidebar-primary"
                  ]
                )}
                onClick={() => onViewChange(item.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{item.label}</span>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                </div>
                {activeView === item.id && (
                  <ChevronLeft className="h-4 w-4 text-sidebar-accent-foreground/60" />
                )}
              </Button>
              {index === 2 && <Separator className="my-3 bg-sidebar-border" />}
              {index === 4 && <Separator className="my-3 bg-sidebar-border" />}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          نسخه ۱.۰.۰
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
        <SheetContent side="right" className="p-0 w-72 animate-slide-in-right" dir="rtl">
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sidebar-accent rounded-md">
                <LayoutDashboard className="h-4 w-4 text-sidebar-accent-foreground" />
              </div>
              <h2 className="text-base font-bold text-sidebar-foreground">پنل مدیریت</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-sidebar-accent"
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
      <div className="hidden lg:block w-72 h-full shadow-lg">
        <SidebarContent activeView={activeView} onViewChange={onViewChange} />
      </div>
    </>
  );
};
