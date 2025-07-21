import React from 'react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BarChart3, CreditCard, Upload, DollarSign, BookOpen, Users, TrendingUp, Webhook, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: 'dashboard' | 'enrollments' | 'discounts' | 'courses' | 'webhooks' | 'reports' | 'data-import' | 'users') => void;
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
];

// Desktop Sidebar Component
function DesktopSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar 
      className={cn(
        "border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )} 
      collapsible="icon"
    >
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    className={cn(
                      "group relative w-full justify-start rounded-xl border-0 px-3 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                      activeView === item.id
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    <button 
                      onClick={() => onViewChange(item.id as any)}
                      className="flex w-full items-center gap-3"
                    >
                      <item.icon 
                        className={cn(
                          "h-5 w-5 transition-transform group-hover:scale-110",
                          collapsed ? "mx-auto" : ""
                        )} 
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {activeView === item.id && !collapsed && (
                        <div className="mr-auto h-2 w-2 rounded-full bg-primary-foreground/80" />
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
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
        className="w-64 p-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">منوی مدیریت</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="rounded-full"
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
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                  activeView === item.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {activeView === item.id && (
                  <div className="mr-auto h-2 w-2 rounded-full bg-primary-foreground/80" />
                )}
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