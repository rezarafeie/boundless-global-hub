import React from 'react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { BarChart3, CreditCard, Upload, DollarSign, BookOpen, Users, TrendingUp, Webhook } from 'lucide-react';
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
    label: 'مدیریت ثبت‌نام‌ها',
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
    label: 'مدیریت دوره‌ها',
    icon: BookOpen,
  },
  {
    id: 'users',
    label: 'مدیریت کاربران',
    icon: Users,
  },
  {
    id: 'reports',
    label: 'گزارش آمار',
    icon: TrendingUp,
  },
  {
    id: 'webhooks',
    label: 'وب‌هوک‌ها',
    icon: Webhook,
  },
];

export function AdminSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (viewId: string) => activeView === viewId;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            پنل مدیریت
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    className={cn(
                      "w-full justify-start transition-colors",
                      isActive(item.id)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted"
                    )}
                  >
                    <button onClick={() => onViewChange(item.id as any)}>
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.label}</span>}
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