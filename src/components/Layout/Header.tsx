
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, AlignLeft, X, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "../Auth/AuthModal";

const Header = () => {
  const { language, setLanguage, translations, direction } = useLanguage();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check if the current route is English
  const isEnglishRoute = location.pathname.startsWith("/en");

  // Toggle language
  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "fa" : "en";
    setLanguage(newLanguage);
    
    // Redirect to equivalent page in other language
    if (location.pathname.startsWith("/en/")) {
      window.location.href = location.pathname.replace("/en/", "/");
    } else if (location.pathname === "/en") {
      window.location.href = "/";
    } else if (location.pathname === "/") {
      window.location.href = "/en";
    } else {
      window.location.href = isEnglishRoute ? location.pathname.replace("/en", "") : `/en${location.pathname}`;
    }
  };

  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
      }`}
    >
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* logo on the left for LTR, right for RTL */}
            <Link
              to={isEnglishRoute ? "/en" : "/"}
              className="mr-6 flex items-center space-x-2"
            >
              <img
                src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png"
                alt="Rafiei Academy"
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl hidden md:inline-block">
                {translations.rafiei}
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to={isEnglishRoute ? "/en" : "/"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.home}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/courses" : "/courses"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.courses}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/assessment-center" : "/assessment-center"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.assessmentCenter}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/blog" : "/blog"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.blog}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/support" : "/support"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.support}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Login/Dashboard Button */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-1"
                asChild
              >
                <Link to={isEnglishRoute ? "/en/dashboard" : "/dashboard"}>
                  <User size={16} />
                  <span className="ml-1">{translations.dashboard}</span>
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-1"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <User size={16} />
                <span className="ml-1">{translations.loginRegister}</span>
              </Button>
            )}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="hidden md:flex"
            >
              {language === "en" ? "فارسی" : "English"}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to={isEnglishRoute ? "/en" : "/"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.home}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/courses" : "/courses"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.courses}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/assessment-center" : "/assessment-center"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.assessmentCenter}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/blog" : "/blog"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.blog}
              </Link>
              <Link
                to={isEnglishRoute ? "/en/support" : "/support"}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {translations.support}
              </Link>
              {user ? (
                <Link
                  to={isEnglishRoute ? "/en/dashboard" : "/dashboard"}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {translations.dashboard}
                </Link>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  className="justify-start p-0 h-auto font-medium"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                >
                  {translations.loginRegister}
                </Button>
              )}
              <Button
                variant="link"
                size="sm"
                onClick={toggleLanguage}
                className="justify-start p-0 h-auto font-medium"
              >
                {language === "en" ? "فارسی" : "English"}
              </Button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
