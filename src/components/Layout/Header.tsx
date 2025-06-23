
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, MessageCircle, Wifi, LayoutDashboard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { toggleLanguage, language } = useLanguage();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navItems = [
    { name: 'خانه', path: '/' },
    { name: 'دوره‌ها', path: '/courses' },
    { name: 'آزمون‌ها', path: '/assessment' },
    { name: 'هاب', path: '/hub', icon: Wifi },
    { name: 'پیام‌رسان', path: '/hub/messenger', icon: MessageCircle },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img 
                src={theme === 'dark' ? '/lovable-uploads/d75e09d0-ed93-423b-a3ea-99dc74efc0e0.png' : '/lovable-uploads/590100d7-41ca-49fb-a3b6-dfecad4325bb.png'} 
                alt="آکادمی رفیعی" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-bold text-xl text-slate-800 dark:text-white">آکادمی رفیعی</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="hidden md:flex items-center gap-1"
              title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
            >
              🌍
              <span className="text-xs">{language === 'fa' ? 'EN' : 'فا'}</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden md:flex"
              title={theme === 'dark' ? 'حالت روز' : 'حالت شب'}
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </Button>

            {/* Dashboard Link */}
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-2"
                title="داشبورد"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden lg:inline">داشبورد</span>
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="w-full justify-start px-4"
                >
                  🌍 {language === 'fa' ? 'English' : 'فارسی'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full justify-start px-4"
                >
                  {theme === 'dark' ? '🌞 حالت روز' : '🌙 حالت شب'}
                </Button>

                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    داشبورد
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
