
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  BarChart3, 
  Settings, 
  MessageSquare,
  X,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeView: 'dashboard' | 'courses' | 'enrollments' | 'users' | 'analytics' | 'settings' | 'crm';
  onViewChange: (view: 'dashboard' | 'courses' | 'enrollments' | 'users' | 'analytics' | 'settings' | 'crm') => void;
  isOpen: boolean;
  onToggle: () => void;
}

const sidebarItems = [
  {
    key: 'dashboard' as const,
    label: 'داشبورد',
    icon: LayoutDashboard,
  },
  {
    key: 'courses' as const,
    label: 'مدیریت دوره‌ها',
    icon: BookOpen,
  },
  {
    key: 'enrollments' as const,
    label: 'ثبت‌نام‌ها',
    icon: UserCheck,
  },
  {
    key: 'users' as const,
    label: 'کاربران',
    icon: Users,
  },
  {
    key: 'crm' as const,
    label: 'CRM',
    icon: MessageSquare,
  },
  {
    key: 'analytics' as const,
    label: 'آمار و گزارشات',
    icon: BarChart3,
  },
  {
    key: 'settings' as const,
    label: 'تنظیمات',
    icon: Settings,
  },
];

const SidebarContent = ({ activeView, onViewChange, onClose }: {
  activeView: AdminSidebarProps['activeView'];
  onViewChange: AdminSidebarProps['onViewChange'];
  onClose?: () => void;
}) => (
  <div className="flex flex-col h-full bg-white border-r border-gray-200">
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">پنل مدیریت</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X size={20} />
          </Button>
        )}
      </div>
    </div>
    
    <nav className="flex-1 p-4 space-y-2">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.key}
            variant={activeView === item.key ? 'default' : 'ghost'}
            className={cn(
              'w-full justify-start text-right h-11',
              activeView === item.key && 'bg-primary text-primary-foreground'
            )}
            onClick={() => {
              onViewChange(item.key);
              onClose?.();
            }}
          >
            <Icon size={20} className="ml-3" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  </div>
);

export function AdminSidebar({ activeView, onViewChange, isOpen, onToggle }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-full">
        <SidebarContent 
          activeView={activeView} 
          onViewChange={onViewChange}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent side="right" className="p-0 w-64">
          <SidebarContent 
            activeView={activeView} 
            onViewChange={onViewChange}
            onClose={onToggle}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
