
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
  MessageSquare,
  Brain,
  Calendar,
  Briefcase,
  ClipboardList,
  Calculator,
  Kanban,
  Receipt,
  Video
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

const menuItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'courses', label: 'دوره‌ها', icon: BookOpen },
  { id: 'tests', label: 'آزمون‌ها', icon: Brain },
  { id: 'webinars', label: 'وبینارها', icon: Calendar },
  { id: 'consultations', label: 'مشاوره‌ها', icon: Video },
  { id: 'enrollments', label: 'ثبت‌نام‌ها', icon: UserCheck },
  { id: 'recruitment', label: 'استخدام', icon: Briefcase },
  { id: 'internships', label: 'کارآموزی‌ها', icon: Users },
  { id: 'sales', label: 'داشبورد فروش', icon: BarChart3 },
  { id: 'leads', label: 'مدیریت لیدها', icon: UserPlus },
  { id: 'pipeline', label: 'پایپ‌لاین فروش', icon: Kanban },
  { id: 'daily-reports', label: 'گزارشات روزانه', icon: ClipboardList },
  { id: 'accounting', label: 'حسابداری', icon: Calculator },
  { id: 'users', label: 'کاربران', icon: Users },
  { id: 'analytics', label: 'آنالیتیکس', icon: TrendingUp },
  { id: 'crm', label: 'CRM', icon: MessageSquare },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

const SidebarContent: React.FC<Omit<AdminSidebarProps, 'isOpen' | 'onToggle'>> = ({
  activeView,
  onViewChange,
  userRole,
  isMessengerAdmin,
  isSalesAgent,
}) => {
  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    // Sales manager gets sales, leads, and crm tabs
    if (userRole === 'sales_manager' && !isMessengerAdmin) {
      return menuItems.filter(item => ['sales', 'leads', 'crm'].includes(item.id));
    }
    
    // Sales agent gets sales, leads, crm, accounting, and pipeline tabs (for their financials)
    if (isSalesAgent && !isMessengerAdmin && userRole !== 'sales_manager') {
      return menuItems.filter(item => ['sales', 'leads', 'accounting', 'crm', 'pipeline'].includes(item.id));
    }
    
    // Enrollment managers get specific tabs including webinars
    if (userRole === 'enrollments_manager' && !isMessengerAdmin) {
      return menuItems.filter(item => ['enrollments', 'users', 'crm', 'webinars'].includes(item.id));
    }
    
    // Admin and messenger admin get all tabs
    return menuItems;
  };

  const filteredMenuItems = getFilteredMenuItems();
  return (
    <div className="flex flex-col h-full bg-background border-l border-border" dir="rtl" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 text-right">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-foreground">آکادمی رفیعی</h2>
            <p className="text-sm text-muted-foreground">پنل مدیریت</p>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          {filteredMenuItems.map((item, index) => (
            <div key={item.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 px-3 font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  "text-right flex-row-reverse",
                  activeView === item.id ? [
                    "bg-primary/10 text-primary border-r-2 border-primary",
                    "shadow-sm"
                  ] : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  if (item.id === 'webinars') {
                    // Navigate to webinar admin page
                    window.location.href = '/enroll/admin/webinar';
                  } else {
                    onViewChange(item.id);
                  }
                }}
              >
                <item.icon className={cn(
                  "h-4 w-4 flex-shrink-0 ml-2",
                  activeView === item.id ? "text-primary" : ""
                )} />
                <span className="text-sm text-right flex-1">{item.label}</span>
                {activeView === item.id && (
                  <ChevronLeft className="h-4 w-4 text-primary/60" />
                )}
              </Button>
              
              {/* Clean separators after specific sections */}
              {(index === 3 || index === 5) && (
                <div className="my-3">
                  <Separator className="bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Clean Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
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
  userRole,
  isMessengerAdmin,
  isSalesAgent,
}) => {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent 
          side="right" 
          className="p-0 w-72 animate-slide-in-right" 
          dir="rtl"
          style={{ direction: 'rtl' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3 text-right">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">آکادمی رفیعی</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <X size={16} />
            </Button>
          </div>
          <div className="h-[calc(100vh-4rem)]">
            <SidebarContent 
              activeView={activeView} 
              onViewChange={onViewChange}
              userRole={userRole}
              isMessengerAdmin={isMessengerAdmin}
              isSalesAgent={isSalesAgent}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-full shadow-sm border-l border-border">
        <SidebarContent 
          activeView={activeView} 
          onViewChange={onViewChange}
          userRole={userRole}
          isMessengerAdmin={isMessengerAdmin}
          isSalesAgent={isSalesAgent}
        />
      </div>
    </>
  );
};
