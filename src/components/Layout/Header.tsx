
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import AuthModal from "../Auth/AuthModal";

const Header = () => {
  const { translations, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
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
          <Link to="/paid-courses" className="text-sm font-medium transition-colors hover:text-black">
            {translations.paidCourses}
          </Link>
          <Link to="/free-courses" className="text-sm font-medium transition-colors hover:text-black">
            {translations.freeCourses}
          </Link>
          <Link to="/assessment-center" className="text-sm font-medium transition-colors hover:text-black">
            {translations.assessmentCenter}
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
          
          {/* Login/Register Button */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setAuthModalOpen(true)}
            className="rounded-full bg-black text-white hover:bg-black/90"
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
              to="/paid-courses" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              {translations.paidCourses}
            </Link>
            <Link 
              to="/free-courses" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              {translations.freeCourses}
            </Link>
            <Link 
              to="/assessment-center" 
              className="text-sm font-medium transition-colors hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              {translations.assessmentCenter}
            </Link>
          </nav>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        courseTitle=""
        isPaid={false}
      />
    </header>
  );
};

export default Header;

