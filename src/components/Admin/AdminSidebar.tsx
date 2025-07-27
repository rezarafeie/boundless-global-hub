import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, LayoutDashboard, ListChecks, Users, TrendingUp, Settings, Menu, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminSidebarProps {
  activeView: 'dashboard' | 'courses' | 'enrollments' | 'users' | 'analytics' | 'settings';
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isOpen, 
  onToggle 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const sidebarClasses = cn(
    "fixed inset-y-0 z-[80] flex flex-col border-r bg-secondary/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:zoom-out data-[state=open]:zoom-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden",
    isOpen ? "data-[state=open]" : "data-[state=closed]",
    "w-72",
  );

  const isCurrentPath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleViewChange = (view: string) => {
    onViewChange(view as any);
    if (isMobile) {
      onToggle();
    }
  };

  const handleEnrollmentManagement = () => {
    window.open('/admin/enrollments', '_blank');
  };

  return (
    <>
      {/* Mobile Menu Button Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in lg:hidden",
          isOpen ? "data-[state=open]" : "data-[state=closed]"
        )}
        style={{ display: isOpen ? 'block' : 'none' }}
        onClick={onToggle}
      />
      
      <div className={`${sidebarClasses} bg-white shadow-lg border-r border-gray-200`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4">
            <h1 className="text-lg font-semibold">پنل مدیریت</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full pl-3.5 font-normal",
                  activeView === 'dashboard' && "bg-secondary text-foreground",
                )}
                onClick={() => handleViewChange('dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                داشبورد
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full pl-3.5 font-normal",
                  activeView === 'courses' && "bg-secondary text-foreground",
                )}
                onClick={() => handleViewChange('courses')}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                مدیریت دوره‌ها
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full pl-3.5 font-normal",
                  activeView === 'users' && "bg-secondary text-foreground",
                )}
                onClick={() => handleViewChange('users')}
              >
                <Users className="h-4 w-4 mr-2" />
                مدیریت کاربران
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full pl-3.5 font-normal",
                  activeView === 'analytics' && "bg-secondary text-foreground",
                )}
                onClick={() => handleViewChange('analytics')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                گزارش‌ها
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full pl-3.5 font-normal",
                  activeView === 'settings' && "bg-secondary text-foreground",
                )}
                onClick={() => handleViewChange('settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                تنظیمات
              </Button>
              
              {/* Add enrollment management link */}
              <button
                onClick={handleEnrollmentManagement}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
              >
                <FileText className="ml-3 h-5 w-5" />
                مدیریت ثبت‌نام‌ها
                <ExternalLink className="mr-2 h-4 w-4" />
              </button>
              
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
