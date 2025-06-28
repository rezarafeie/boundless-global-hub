
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

const AppHeader: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-600">
            آکادمی رفیعی
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-reverse space-x-8">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              خانه
            </Link>
            <Link to="/courses" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              دوره‌ها
            </Link>
            <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              درباره
            </Link>
            <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
              تماس
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/me" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.first_name}</span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="text-gray-700 dark:text-gray-300"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  ورود / ثبت‌نام
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
