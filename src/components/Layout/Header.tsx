
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import AuthenticationModal from "../Auth/AuthenticationModal";

const Header = () => {
  const { translations, language, toggleLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="text-xl font-bold tracking-tight"
          >
            {translations.websiteName}
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
          
          {/* User Authentication - Desktop Only */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="rounded-full"
              >
                <User size={16} className="mr-2" />
                {user.email}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="rounded-full"
              >
                خروج
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setAuthModalOpen(true)}
              className="rounded-full bg-black text-white hover:bg-black/90 hidden md:flex"
            >
              {translations.loginRegister}
            </Button>
          )}
          
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
            
            {/* User Authentication - Mobile Menu */}
            {user ? (
              <div className="space-y-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/dashboard';
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <User size={16} className="mr-2" />
                  داشبورد
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full"
                >
                  خروج
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setAuthModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full rounded-full bg-black text-white hover:bg-black/90 mt-2"
              >
                {translations.loginRegister}
              </Button>
            )}
          </nav>
        </div>
      )}

      {/* Auth Modal */}
      <AuthenticationModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
};

export default Header;
