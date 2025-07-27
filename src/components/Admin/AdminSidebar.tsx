
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  X,
  MessageSquare,
  FileText,
  LayoutGrid
} from 'lucide-react';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { 
    id: 'dashboard', 
    label: 'خانه', 
    icon: LayoutGrid,
    className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
  },
  { id: 'courses', label: 'دوره‌ها', icon: BookOpen },
  { id: 'enrollments', label: 'ثبت‌نام‌ها', icon: UserCheck },
  { id: 'users', label: 'کاربران', icon: Users },
  { id: 'analytics', label: 'آمار', icon: BarChart3 },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

const externalLinks = [
  { 
    href: '/enroll/admin/crm', 
    label: 'CRM', 
    icon: MessageSquare,
    description: 'مدیریت فعالیت‌های CRM'
  },
  { 
    href: '/enroll/admin/email', 
    label: 'مدیریت ایمیل', 
    icon: FileText,
    description: 'تنظیمات و مدیریت ایمیل'
  }
];

export function AdminSidebar({ activeView, onViewChange, isOpen, onToggle }: AdminSidebarProps) {
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">ر</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">آکادمی رفیعی</h2>
              <p className="text-sm text-gray-500">پنل مدیریت</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-right h-14 rounded-2xl font-medium transition-all duration-200",
                  isActive && item.className ? item.className : "hover:bg-gray-100",
                  !isActive && "text-gray-700 hover:text-gray-900"
                )}
                onClick={() => {
                  onViewChange(item.id);
                  onToggle();
                }}
              >
                <Icon className="ml-3 h-6 w-6" />
                <span className="text-base">{item.label}</span>
              </Button>
            );
          })}
          
          <div className="pt-6">
            {externalLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-right h-14 rounded-2xl font-medium transition-all duration-200 mb-2",
                      isActive ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    )}
                    onClick={onToggle}
                  >
                    <Icon className="ml-3 h-6 w-6" />
                    <span className="text-base">{link.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:z-50 lg:pt-16 lg:border-r lg:border-gray-200">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent side="right" className="w-80 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
