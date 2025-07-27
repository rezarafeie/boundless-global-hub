
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  X,
  UserCheck,
  Target
} from 'lucide-react';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  userRole?: string | null;
  isMessengerAdmin?: boolean;
  isSalesAgent?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isOpen, 
  onToggle,
  userRole,
  isMessengerAdmin,
  isSalesAgent
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: LayoutDashboard,
      show: true
    },
    {
      id: 'courses',
      label: 'دوره‌ها',
      icon: GraduationCap,
      show: isMessengerAdmin || userRole === 'admin'
    },
    {
      id: 'enrollments',
      label: 'ثبت‌نام‌ها',
      icon: CreditCard,
      show: true
    },
    {
      id: 'users',
      label: 'کاربران',
      icon: Users,
      show: isMessengerAdmin || userRole === 'admin'
    },
    {
      id: 'analytics',
      label: 'گزارشات',
      icon: BarChart3,
      show: isMessengerAdmin || userRole === 'admin'
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: UserCheck,
      show: isMessengerAdmin || userRole === 'admin' || isSalesAgent
    },
    {
      id: 'leads',
      label: 'مدیریت لیدها',
      icon: Target,
      show: isSalesAgent,
      badge: isSalesAgent ? 'جدید' : undefined
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: Settings,
      show: isMessengerAdmin || userRole === 'admin'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => item.show);

  const sidebarContent = (
    <div className="h-full bg-white border-l border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">پنل مدیریت</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {isSalesAgent ? 'نماینده فروش' : 
           userRole === 'enrollments_manager' ? 'مدیر ثبت‌نام‌ها' : 
           isMessengerAdmin ? 'مدیر سیستم' : 'مدیر'}
        </p>
      </div>
      
      <nav className="p-4 space-y-2">
        {filteredMenuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "default" : "ghost"}
            className={`w-full justify-start text-right ${
              activeView === item.id 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => {
              onViewChange(item.id);
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
          >
            <item.icon className="ml-2 h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[10000] lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 right-0 z-[10001] w-64 
        transform ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out
        lg:transform-none
      `}>
        {sidebarContent}
      </div>
    </>
  );
};

export { AdminSidebar };
