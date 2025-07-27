
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  UserPlus,
  X
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
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">پنل مدیریت</h2>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-2 text-right",
                activeView === item.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
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
        <SheetContent side="right" className="p-0 w-64">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">پنل مدیریت</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </div>
          <SidebarContent activeView={activeView} onViewChange={onViewChange} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-full">
        <SidebarContent activeView={activeView} onViewChange={onViewChange} />
      </div>
    </>
  );
};
