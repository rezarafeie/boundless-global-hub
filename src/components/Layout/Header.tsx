import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { messengerService } from "@/lib/messengerService";
import OnlineStatusIndicator from "@/components/OnlineStatusIndicator";

const Header = () => {
  const { translations, language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMessengerAdmin, setIsMessengerAdmin] = useState(false);

  // Check user role on mount and when user changes
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.phone) {
        setUserRole(null);
        setIsMessengerAdmin(false);
        return;
      }

      try {
        const detailedUser = await messengerService.getUserByPhone(user.phone);
        if (detailedUser) {
          setUserRole(detailedUser.role || 'user');
          setIsMessengerAdmin(detailedUser.is_messenger_admin || false);
        } else {
          setUserRole(null);
          setIsMessengerAdmin(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
        setIsMessengerAdmin(false);
      }
    };

    checkUserRole();
  }, [user]);

  const handleMessengerClick = () => {
    navigate('/hub/messenger');
  };

  // Check if user has admin access - Including sales agents
  const hasAdminAccess = () => {
    const result = isMessengerAdmin || 
           ['admin', 'enrollments_manager', 'sales_manager', 'sales_agent'].includes(userRole || '') ||
           (userRole === 'sales_agent') ||
           (userRole === 'user' && isMessengerAdmin); // fallback for legacy users
    
    return result;
  };

  // Use different logos for light/dark modes with proper fallbacks
  const logoSrc = isDarkMode 
    ? "/lovable-uploads/e743fe4f-8642-41ec-a4bf-7d749942d8b6.png" // new dark theme logo
    : "/lovable-uploads/d03b7d97-8f42-4806-a04a-add408342460.png"; // black logo for light mode

  return (
    <header className="fixed top-0 z-[10000] w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border/20">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="flex items-center gap-2"
          >
            <img 
              src={logoSrc}
              alt="Rafiei Academy" 
              className={`w-auto transition-all duration-300 ${isDarkMode ? 'h-7' : 'h-8'}`}
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = isDarkMode 
                  ? "/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png"
                  : "/lovable-uploads/6ee3e71a-c27b-49b7-b51c-14ce664d8043.png";
              }}
            />
            <span className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap flex-shrink-0">
              {translations.websiteName}
            </span>
          </Link>
          
          {/* Online Status Indicator positioned beside logo */}
          <OnlineStatusIndicator />
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
            {translations.home}
          </Link>
          <Link to="/courses" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
            {language === "en" ? "Training Center" : "مرکز آموزش"}
          </Link>
          <Link to="/assessment" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
            {translations.assessmentCenter}
          </Link>
          <a href="https://mag.rafiei.co" target="_blank" rel="noopener noreferrer" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
            {language === "en" ? "Magazine" : "مجله"}
          </a>
          <Link to="/support" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
            {language === "en" ? "Support" : "پشتیبانی"}
          </Link>
          <div
            className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary cursor-pointer"
            onClick={handleMessengerClick}
          >
            {language === "en" ? "Messenger" : "پیام‌رسان"}
          </div>
          <Link to="/hub" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
            {language === "en" ? "Hub" : "هاب"}
          </Link>
          
          {/* Admin Links for authorized users */}
          {isAuthenticated && hasAdminAccess() && (
            <>
              <Link to="/enroll/admin" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
                {language === "en" ? "Enrollment Admin" : "مدیریت ثبت‌نام"}
              </Link>
              {isMessengerAdmin && (
                <Link to="/hub/admin" className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary">
                  {language === "en" ? "Hub Admin" : "مدیریت هاب"}
                </Link>
              )}
            </>
          )}
        </nav>
        
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-accent dark:hover:bg-accent/50"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={20} className="text-foreground" /> : <Moon size={20} className="text-foreground" />}
          </Button>

          {/* Language Switcher - Hidden for now */}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-full hover:bg-accent dark:hover:bg-accent/50"
            aria-label={language === "en" ? "Switch to Persian" : "Switch to English"}
          >
            <Globe size={20} className="text-foreground" />
          </Button> */}
          
          {/* User Account Button - Desktop Only */}
          <Button
            variant="default"
            size="sm"
            asChild
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hidden md:flex dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          >
            <Link to={isAuthenticated && user ? "/dashboard" : `/auth?redirect=${encodeURIComponent(window.location.pathname)}`}>
              {isAuthenticated && user ? 
                user.name || user.firstName || user.username || 'کاربر' : 
                (language === "en" ? "Login / Register" : "ورود / ثبت‌نام")
              }
            </Link>
          </Button>
          
          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-accent dark:hover:bg-accent/50"
              >
                <Menu size={20} className="text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side={language === "fa" ? "right" : "left"} 
              className="w-[300px] sm:w-[400px] z-[10002] [&>div]:z-[10001] bg-background border-border dark:bg-background dark:border-border"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-border dark:border-border min-w-0">
                  <img 
                    src={logoSrc}
                    alt="Rafiei Academy" 
                    className="h-8 w-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = isDarkMode 
                        ? "/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png"
                        : "/lovable-uploads/6ee3e71a-c27b-49b7-b51c-14ce664d8043.png";
                    }}
                  />
                  <span className="text-lg font-bold text-foreground whitespace-nowrap flex-shrink-0 min-w-0">
                    {translations.websiteName}
                  </span>
                  <OnlineStatusIndicator />
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col space-y-4 py-6 flex-1 overflow-y-auto">{/* Add overflow-y-auto for scrolling */}
                  <Link 
                    to="/" 
                    className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {translations.home}
                  </Link>
                  <Link 
                    to="/courses" 
                    className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {language === "en" ? "Training Center" : "مرکز آموزش"}
                  </Link>
                  <Link 
                    to="/assessment" 
                    className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {translations.assessmentCenter}
                  </Link>
                  <a 
                    href="https://mag.rafiei.co" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {language === "en" ? "Magazine" : "مجله"}
                  </a>
                  <Link 
                    to="/support" 
                    className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {language === "en" ? "Support" : "پشتیبانی"}
                  </Link>
                  <div
                    className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary cursor-pointer"
                    onClick={() => {
                      handleMessengerClick();
                      setIsMenuOpen(false);
                    }}
                  >
                    {language === "en" ? "Messenger" : "پیام‌رسان"}
                  </div>
                  <Link 
                    to="/hub" 
                    className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {language === "en" ? "Hub" : "هاب"}
                  </Link>
                  
                  {/* Admin Links for authorized users in mobile menu */}
                  {isAuthenticated && hasAdminAccess() && (
                    <>
                      <Link 
                        to="/enroll/admin" 
                        className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {language === "en" ? "Enrollment Admin" : "مدیریت ثبت‌نام"}
                      </Link>
                      {isMessengerAdmin && (
                        <Link 
                          to="/hub/admin" 
                          className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {language === "en" ? "Hub Admin" : "مدیریت هاب"}
                        </Link>
                      )}
                    </>
                  )}
                </nav>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-border dark:border-border space-y-4">
                  {/* User Account Button */}
                  <Button
                    variant="default"
                    size="lg"
                    asChild
                    className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                     <Link to={isAuthenticated && user ? "/dashboard" : `/auth?redirect=${encodeURIComponent(window.location.pathname)}`}>
                       {isAuthenticated && user ? 
                         user.name || user.firstName || user.username || 'کاربر' : 
                         (language === "en" ? "Login / Register" : "ورود / ثبت‌نام")
                       }
                     </Link>
                  </Button>
                  
                  {/* Theme Toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full rounded-full border-border dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                  >
                    {isDarkMode ? <Sun size={20} className="mr-2" /> : <Moon size={20} className="mr-2" />}
                    {isDarkMode ? 
                      (language === "en" ? "Light Mode" : "حالت روشن") : 
                      (language === "en" ? "Dark Mode" : "حالت تاریک")
                    }
                  </Button>
                  
                  {/* Language Toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      toggleLanguage();
                      setIsMenuOpen(false);
                    }}
                    className="w-full rounded-full border-border dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-accent"
                  >
                    <Globe size={20} className="mr-2" />
                    {language === "en" ? "فارسی" : "English"}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;