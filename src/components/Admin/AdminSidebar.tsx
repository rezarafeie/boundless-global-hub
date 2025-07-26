import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type ViewType = 'dashboard' | 'courses' | 'enrollments' | 'users' | 'analytics' | 'settings';

interface AdminSidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'خانه',
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
    id: 'analytics',
    label: 'آمار',
    icon: BarChart3,
  },
  {
    id: 'settings',
    label: 'تنظیمات',
    icon: Settings,
  },
];

export function AdminSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  const { state, setOpen, open } = useSidebar();
  const collapsed = state === "collapsed";

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    // Force close sidebar completely on mobile only
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile) {
      setTimeout(() => {
        setOpen(false);
      }, 150);
    }
  };

  return (
    <Sidebar className={cn(
      "bg-white border-l border-gray-200 shadow-lg lg:shadow-none",
      "lg:relative z-50 lg:z-auto",
      "h-full lg:h-auto",
      collapsed ? "w-16" : "w-72"
    )} side="right" collapsible="icon" variant="sidebar">
      <SidebarContent className="bg-white h-full overflow-auto">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">ر</span>
            </div>
            {!collapsed && (
              <div className="text-right">
                <h2 className="font-bold text-lg text-gray-900">آکادمی رفیعی</h2>
                <p className="text-sm text-gray-500">پنل مدیریت</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-4 py-6 bg-white">
          <SidebarGroupContent className="bg-white">
            <SidebarMenu className="space-y-1">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === item.id}
                    tooltip={collapsed ? item.label : undefined}
                  >
                    <button
                      onClick={() => handleViewChange(item.id as ViewType)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 font-medium",
                        "hover:bg-gray-50",
                        activeView === item.id
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-[0.98]"
                          : "text-gray-700 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 flex-shrink-0",
                        activeView === item.id ? "text-white" : "text-gray-500"
                      )} />
                      {!collapsed && <span className="text-base">{item.label}</span>}
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