import React, { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  ClipboardList, 
  User,
  ArrowLeft,
  MoreVertical
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  rightAction?: ReactNode;
}

const AppLayout = ({ children, title, showBackButton = true, rightAction }: AppLayoutProps) => {
  const { direction } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const bottomNavItems = [
    { icon: Home, label: "خانه", path: "/app/dashboard" },
    { icon: BookOpen, label: "دوره‌ها", path: "/app/my-courses" },
    { icon: TrendingUp, label: "یادگیری", path: "/app/learning" },
    { icon: ClipboardList, label: "آزمون‌ها", path: "/app/tests" },
    { icon: User, label: "پروفایل", path: "/app/profile" }
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      dir={direction}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft size={18} />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground truncate">
              {title || "آکادمی رفیعی"}
            </h1>
          </div>
          {rightAction || (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical size={18} />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 backdrop-blur-sm">
        <div className="flex justify-around py-2">
          {bottomNavItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 flex-1 ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon size={20} />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;