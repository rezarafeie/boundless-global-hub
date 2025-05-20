
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

const Header = () => {
  const { translations, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          
          {/* Login/Register Button - Desktop Only */}
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = "/dashboard"}
            className="rounded-full bg-black text-white hover:bg-black/90 hidden md:flex"
          >
            {translations.loginRegister}
          </Button>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden container py-4 pb-6 border-t border-black/5 animate-slide-down">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              {translations.home}
            </Link>
            <Link 
              to="/courses" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              مرکز آموزش
            </Link>
            <Link 
              to="/assessment-center" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              {translations.assessmentCenter}
            </Link>
            <Link 
              to="/blog" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              مجله
            </Link>
            <Link 
              to="/support" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              پشتیبانی
            </Link>
            
            {/* Login/Register Button - Mobile Menu */}
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                window.location.href = "/dashboard";
                setIsMenuOpen(false);
              }}
              className="w-full rounded-full bg-black text-white hover:bg-black/90 mt-2"
            >
              {translations.loginRegister}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
