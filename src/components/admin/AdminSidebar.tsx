import React from 'react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BarChart3, CreditCard, Upload, DollarSign, BookOpen, Users, TrendingUp, Webhook, Menu, X, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: 'dashboard' | 'enrollments' | 'discounts' | 'courses' | 'webhooks' | 'reports' | 'data-import' | 'users' | 'shortlinks') => void;
}

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'داشبورد',
    icon: BarChart3,
  },
  {
    id: 'enrollments',
    label: 'ثبت‌نام‌ها',
    icon: CreditCard,
  },
  {
    id: 'data-import',
    label: 'وارد کردن داده',
    icon: Upload,
  },
  {
    id: 'discounts',
    label: 'کدهای تخفیف',
    icon: DollarSign,
  },
  {
    id: 'courses',
    label: 'دوره‌ها',
    icon: BookOpen,
  },
  {
    id: 'users',
    label: 'کاربران',
    icon: Users,
  },
  {
    id: 'reports',
    label: 'گزارشات',
    icon: TrendingUp,
  },
  {
    id: 'webhooks',
    label: 'وب‌هوک‌ها',
    icon: Webhook,
  },
  {
    id: 'shortlinks',
    label: 'لینک‌های کوتاه',
    icon: Link,
  },
];

// Desktop Sidebar Component
function DesktopSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  return (
    <div className="w-64 h-full bg-background border-l border-border">
      <div className="p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeView === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// Mobile Menu Component
function MobileMenu({ activeView, onViewChange }: AdminSidebarProps) {
  const [open, setOpen] = React.useState(false);

  const handleItemClick = (viewId: any) => {
    onViewChange(viewId);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden rounded-xl hover:bg-muted/80"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-64 p-0 bg-background border-l"
      >
        <div className="flex items-center justify-end p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeView === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopSidebar activeView={activeView} onViewChange={onViewChange} />
      </div>
      
      {/* Mobile Menu - Hidden on desktop */}
      <div className="lg:hidden">
        <MobileMenu activeView={activeView} onViewChange={onViewChange} />
      </div>
    </>
  );
}