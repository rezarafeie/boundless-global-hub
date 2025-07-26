import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  UserCheck, 
  Settings,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
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
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-20 right-4 z-[10001] p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ease-in-out",
        "fixed lg:relative z-50 lg:z-auto h-full",
        // Mobile styles
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full",
        // Desktop styles
        isCollapsed ? "lg:w-20" : "lg:w-72",
        // Mobile width
        "w-72"
      )}>
        {/* Header */}
        <div className={cn(
          "border-b border-gray-100 bg-white transition-all duration-300",
          isCollapsed ? "p-4" : "p-6"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300",
                isCollapsed ? "w-10 h-10" : "w-12 h-12"
              )}>
                <span className="text-white font-bold text-lg">ر</span>
              </div>
              {!isCollapsed && (
                <div className="text-right">
                  <h2 className="font-bold text-lg text-gray-900">آکادمی رفیعی</h2>
                  <p className="text-sm text-gray-500">پنل مدیریت</p>
                </div>
              )}
            </div>
            
            {/* Desktop Collapse Button */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={cn(
          "py-6 bg-white h-full overflow-auto",
          isCollapsed ? "px-2" : "px-4"
        )}>
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleViewChange(item.id as ViewType)}
                  className={cn(
                    "w-full flex items-center transition-all duration-200 font-medium rounded-xl",
                    "hover:bg-gray-50",
                    isCollapsed ? "px-3 py-4 justify-center" : "px-4 py-4 gap-4",
                    activeView === item.id
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-[0.98]"
                      : "text-gray-700 hover:text-gray-900"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    activeView === item.id ? "text-white" : "text-gray-500"
                  )} />
                  {!isCollapsed && (
                    <span className="text-base text-right">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}