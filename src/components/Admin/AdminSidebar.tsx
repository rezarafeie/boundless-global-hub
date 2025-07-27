
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  X,
  MessageSquare,
  FileText
} from 'lucide-react';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'courses', label: 'مدیریت دوره‌ها', icon: BookOpen },
  { id: 'enrollments', label: 'ثبت‌نام‌ها', icon: UserCheck },
  { id: 'users', label: 'کاربران', icon: Users },
  { id: 'analytics', label: 'گزارشات', icon: BarChart3 },
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">پنل مدیریت</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggle}
          className="lg:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-right h-10",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => {
                  onViewChange(item.id);
                  onToggle();
                }}
              >
                <Icon className="ml-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
          
          <div className="pt-4 border-t">
            <h3 className="px-3 text-sm font-medium text-muted-foreground mb-2">لینک‌های خارجی</h3>
            {externalLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-right h-10",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    onClick={onToggle}
                  >
                    <Icon className="ml-2 h-4 w-4" />
                    {link.label}
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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-background lg:border-r lg:pt-16">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent side="right" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
