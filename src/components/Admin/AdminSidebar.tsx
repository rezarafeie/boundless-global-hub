import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  Mail, 
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
} from "@/components/ui/sidebar";

type ViewType = 'dashboard' | 'courses' | 'enrollments' | 'users' | 'emails' | 'analytics' | 'settings';

interface AdminSidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'داشبورد',
    icon: LayoutDashboard,
  },
  {
    id: 'courses',
    label: 'دوره‌ها',
    icon: BookOpen,
  },
  {
    id: 'enrollments',
    label: 'ثبت‌نام‌ها',
    icon: Users,
  },
  {
    id: 'users',
    label: 'کاربران',
    icon: UserCheck,
  },
  {
    id: 'emails',
    label: 'ایمیل‌ها',
    icon: Mail,
  },
  {
    id: 'analytics',
    label: 'آمار و گزارش',
    icon: BarChart3,
  },
  {
    id: 'settings',
    label: 'تنظیمات',
    icon: Settings,
  },
];

export function AdminSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={cn(
      "border-l border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      collapsed ? "w-14" : "w-64"
    )}>
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-sm">پنل مدیریت</h2>
                <p className="text-xs text-muted-foreground">آکادمی رفیعی</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            منوی اصلی
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === item.id}
                    tooltip={collapsed ? item.label : undefined}
                  >
                    <button
                      onClick={() => onViewChange(item.id as ViewType)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        activeView === item.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.label}</span>}
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