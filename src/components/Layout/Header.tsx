
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AIAssistantButton from "../AIAssistant/AIAssistantButton";

const Header = () => {
  const { translations, language, toggleLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <AIAssistantButton variant="ghost" size="sm" />
        </nav>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="px-2 py-1 rounded-md hover:bg-gray-100"
          >
            {language === "en" ? "فارسی" : "English"}
          </Button>
          
          <div className="hidden md:block">
            <AIAssistantButton size="sm" />
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden container py-4 pb-6 border-t border-black/10 animate-fade-in">
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
            <AIAssistantButton className="w-full" />
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
