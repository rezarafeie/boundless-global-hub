import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  Settings,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    description: 'نمای کلی',
  },
  {
    id: 'courses',
    label: 'دوره‌ها',
    icon: BookOpen,
    description: 'مدیریت دوره‌ها',
  },
  {
    id: 'enrollments',
    label: 'ثبت‌نام‌ها',
    icon: Users,
    description: 'مدیریت ثبت‌نام‌ها',
  },
  {
    id: 'users',
    label: 'کاربران',
    icon: UserCheck,
    description: 'مدیریت کاربران',
  },
  {
    id: 'analytics',
    label: 'آمار',
    icon: BarChart3,
    description: 'گزارش‌ها و آمار',
  },
  {
    id: 'settings',
    label: 'تنظیمات',
    icon: Settings,
    description: 'تنظیمات سیستم',
  },
];

export function AdminSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 shadow-xl flex flex-col">
      <div className="bg-gradient-to-b from-gray-50 to-white h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">ر</span>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-xl text-gray-900">آکادمی رفیعی</h2>
              <p className="text-sm text-gray-500">پنل مدیریت</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-4 py-6 flex-1">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => handleViewChange(item.id as ViewType)}
                  className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:scale-[1.02]",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                        activeView === item.id
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                          : "text-gray-700 hover:text-gray-900"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                        activeView === item.id
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>

                  {/* Content */}
                  <div className="flex-1 text-right">
                    <div className="font-semibold text-base">{item.label}</div>
                    <div className={cn(
                      "text-xs transition-colors duration-300",
                      activeView === item.id
                        ? "text-white/80"
                        : "text-gray-500 group-hover:text-gray-600"
                    )}>
                      {item.description}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-all duration-300",
                    activeView === item.id
                      ? "text-white transform rotate-180"
                      : "text-gray-400 group-hover:text-gray-600 group-hover:transform group-hover:translate-x-1"
                  )} />

                      {/* Active indicator */}
                      {activeView === item.id && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-white rounded-r-full"></div>
                      )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">نسخه ۱.۰.۰</p>
            <p className="text-xs text-gray-400 mt-1">آکادمی رفیعی</p>
          </div>
        </div>
      </div>
    </div>
  );
}