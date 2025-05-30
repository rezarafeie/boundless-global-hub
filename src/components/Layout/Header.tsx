
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/ui/use-toast";

const Header = () => {
  const { translations, language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Use different logos for light/dark modes with proper fallbacks
  const logoSrc = isDarkMode 
    ? "/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png" // white logo for dark mode
    : "/lovable-uploads/d03b7d97-8f42-4806-a04a-add408342460.png"; // black logo for light mode

  // Add live icon to navigation items after line with Dashboard
  const navigationItems = [
    { name: translations.home, href: "/" },
    { name: translations.courses, href: "/courses" },
    { name: translations.assessmentCenter, href: "/assessment-center" },
    { name: translations.magazine, href: "/blog" },
    { name: "📺 Live", href: "/#live-section", className: "text-red-500 animate-pulse" },
    { name: translations.aboutUs, href: "/about" },
    { name: translations.contact, href: "/contact" }
  ];

  return (
    <header className="fixed top-0 z-[10000] w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border/20">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-2"
          >
            <img 
              src={logoSrc}
              alt="Rafiei Academy" 
              className="h-8 w-auto transition-all duration-300"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = isDarkMode 
                  ? "/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png"
                  : "/lovable-uploads/6ee3e71a-c27b-49b7-b51c-14ce664d8043.png";
              }}
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              {translations.websiteName}
            </span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigationItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.href} 
              className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full hover:bg-accent dark:hover:bg-accent/50"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={20} className="text-foreground" /> : <Moon size={20} className="text-foreground" />}
          </Button>

          {/* Language Switcher - Icon Only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-full hover:bg-accent dark:hover:bg-accent/50"
            aria-label={language === "en" ? "Switch to Persian" : "Switch to English"}
          >
            <Globe size={20} className="text-foreground" />
          </Button>
          
          {/* User Account Button - Desktop Only */}
          <Button
            variant="default"
            size="sm"
            asChild
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hidden md:flex dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          >
            <Link to="/dashboard">{language === "en" ? "My Account" : "حساب کاربری"}</Link>
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
                <div className="flex items-center gap-2 pb-6 border-b border-border dark:border-border">
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
                  <span className="text-lg font-bold text-foreground">
                    {translations.websiteName}
                  </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col space-y-4 py-6 flex-1">
                  {navigationItems.map((item, index) => (
                    <Link 
                      key={index} 
                      to={item.href} 
                      className="text-lg font-medium transition-colors hover:text-foreground text-muted-foreground py-2 hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
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
                    <Link to="/dashboard">{language === "en" ? "My Account" : "حساب کاربری"}</Link>
                  </Button>
                  
                  {/* Theme Toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      toggleDarkMode();
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
