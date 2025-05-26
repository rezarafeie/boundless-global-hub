
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

const Header = () => {
  const { translations, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[10000] w-full border-b border-black/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-2"
          >
            <img 
              src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png" 
              alt="Rafiei Academy" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold tracking-tight">
              {translations.websiteName}
            </span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-black">
            {translations.home}
          </Link>
          <Link to="/courses" className="text-sm font-medium transition-colors hover:text-black">
            مرکز آموزش
          </Link>
          <Link to="/assessment-center" className="text-sm font-medium transition-colors hover:text-black">
            {translations.assessmentCenter}
          </Link>
          <Link to="/blog" className="text-sm font-medium transition-colors hover:text-black">
            مجله
          </Link>
          <Link to="/support" className="text-sm font-medium transition-colors hover:text-black">
            پشتیبانی
          </Link>
        </nav>
        
        <div className="flex items-center gap-3">
          {/* Language Switcher - Icon Only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-full hover:bg-gray-100"
            aria-label={language === "en" ? "Switch to Persian" : "Switch to English"}
          >
            <Globe size={20} />
          </Button>
          
          {/* User Account Button - Desktop Only */}
          <Button
            variant="default"
            size="sm"
            asChild
            className="rounded-full bg-black text-white hover:bg-black/90 hidden md:flex"
          >
            <Link to="/dashboard">حساب کاربری</Link>
          </Button>
          
          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === "fa" ? "right" : "left"} className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-2 pb-6 border-b">
                  <img 
                    src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png" 
                    alt="Rafiei Academy" 
                    className="h-8 w-auto"
                  />
                  <span className="text-lg font-bold">
                    {translations.websiteName}
                  </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col space-y-4 py-6 flex-1">
                  <Link 
                    to="/" 
                    className="text-lg font-medium transition-colors hover:text-black py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {translations.home}
                  </Link>
                  <Link 
                    to="/courses" 
                    className="text-lg font-medium transition-colors hover:text-black py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    مرکز آموزش
                  </Link>
                  <Link 
                    to="/assessment-center" 
                    className="text-lg font-medium transition-colors hover:text-black py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {translations.assessmentCenter}
                  </Link>
                  <Link 
                    to="/blog" 
                    className="text-lg font-medium transition-colors hover:text-black py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    مجله
                  </Link>
                  <Link 
                    to="/support" 
                    className="text-lg font-medium transition-colors hover:text-black py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    پشتیبانی
                  </Link>
                </nav>

                {/* Footer Actions */}
                <div className="pt-6 border-t space-y-4">
                  {/* User Account Button */}
                  <Button
                    variant="default"
                    size="lg"
                    asChild
                    className="w-full rounded-full bg-black text-white hover:bg-black/90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link to="/dashboard">حساب کاربری</Link>
                  </Button>
                  
                  {/* Language Toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      toggleLanguage();
                      setIsMenuOpen(false);
                    }}
                    className="w-full rounded-full"
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
