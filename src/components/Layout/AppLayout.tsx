import React, { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  BookOpen,
  TrendingUp,
  ClipboardList,
  User,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  GraduationCap,
  LogOut,
  Monitor,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  rightAction?: ReactNode;
}

const navItems = [
  { icon: Home, label: "خانه", path: "/app/dashboard" },
  { icon: BookOpen, label: "دوره‌ها", path: "/app/my-courses" },
  { icon: TrendingUp, label: "یادگیری", path: "/app/learning" },
  { icon: ClipboardList, label: "آزمون‌ها", path: "/app/tests" },
  { icon: User, label: "پروفایل", path: "/app/profile" },
];

const AppLayout = ({ children, title, showBackButton = true, rightAction }: AppLayoutProps) => {
  const { direction } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isRtl = direction === "rtl";

  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/app/dashboard");
  };

  const switchToFullMode = () => {
    const currentPath = location.pathname;
    if (currentPath === "/app/dashboard") {
      navigate("/dashboard");
    } else if (currentPath.startsWith("/app/course/")) {
      const slug = currentPath.split("/app/course/")[1].split("/")[0];
      navigate(`/courses/${slug}`);
    } else if (currentPath === "/app/tests") {
      navigate("/tests");
    } else if (currentPath === "/app/profile") {
      navigate("/profile");
    } else {
      navigate("/");
    }
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const displayName =
    (user as any)?.firstName || (user as any)?.name || user?.email || "کاربر";

  return (
    <div className="min-h-screen bg-muted/30" dir={direction}>
      {/* ============ DESKTOP LAYOUT (md+) ============ */}
      <div className="hidden md:flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-card border-border/60 flex flex-col shrink-0 sticky top-0 h-screen ${
            isRtl ? "border-l" : "border-r"
          }`}
        >
          {/* Brand */}
          <div className="px-5 py-5 border-b border-border/60">
            <button
              onClick={() => navigate("/app/dashboard")}
              className="flex items-center gap-3 group"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-sm">
                <GraduationCap size={20} />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm leading-tight">آکادمی رفیعی</p>
                <p className="text-[11px] text-muted-foreground">پنل یادگیری</p>
              </div>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="p-3 border-t border-border/60">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                {String(displayName).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {user?.email && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={switchToFullMode}
                aria-label="نمای کامل"
              >
                <Monitor size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => logout()}
                aria-label="خروج"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border/60">
            <div className="flex items-center justify-between px-6 lg:px-8 py-4">
              <div className="flex items-center gap-3 min-w-0">
                {showBackButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="h-9 w-9"
                    aria-label="بازگشت"
                  >
                    <BackIcon size={18} />
                  </Button>
                )}
                <h1 className="text-xl font-semibold truncate">
                  {title || "آکادمی رفیعی"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {rightAction}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT (below md) ============ */}
      <div className="md:hidden flex justify-center">
        <div className="relative w-full max-w-md min-h-screen bg-background flex flex-col">
          <header className="sticky top-0 z-40 bg-card border-b border-border/50 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="h-8 w-8"
                  >
                    <BackIcon size={18} />
                  </Button>
                )}
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {title || "آکادمی رفیعی"}
                </h1>
              </div>
              <div className="flex items-center gap-1">
                {rightAction}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} sideOffset={8}>
                    <DropdownMenuItem onClick={switchToFullMode}>
                      <Monitor size={16} className="ml-2" />
                      <span>نمای کامل</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-20 overflow-y-auto">{children}</main>

          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 backdrop-blur-sm mx-auto max-w-md">
            <div className="flex justify-around py-2">
              {navItems.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 flex-1 ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
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
      </div>
    </div>
  );
};

export default AppLayout;
