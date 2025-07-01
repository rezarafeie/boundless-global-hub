
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRafieiAuth } from "@/hooks/useRafieiAuth";
import { useAcademyAuth } from '@/contexts/AcademyAuthContext';

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { openAuth } = useRafieiAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useAcademyAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="Your Company"
              />
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                خانه
              </Link>
              <Link
                to="/courses"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                دوره‌ها
              </Link>
              <Link
                to="/blog"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                بلاگ
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                درباره ما
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                تماس با ما
              </Link>
              {isAdmin && (
                <Link
                  to="/academy/admin"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  پنل مدیریت
                </Link>
              )}
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Navigate through our site.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <Link
                    to="/"
                    className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    خانه
                  </Link>
                  <Link
                    to="/courses"
                    className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    دوره‌ها
                  </Link>
                  <Link
                    to="/blog"
                    className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    بلاگ
                  </Link>
                  <Link
                    to="/about"
                    className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    درباره ما
                  </Link>
                  <Link
                    to="/contact"
                    className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    تماس با ما
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Auth */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-8 h-8 rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {isAuthenticated ? user?.first_name?.[0] || user?.full_name?.[0] || "U" : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  {isAuthenticated ? user?.full_name || `${user?.first_name} ${user?.last_name}` || "کاربر" : "مهمان"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isAuthenticated ? (
                  <DropdownMenuItem onClick={() => openAuth()}>
                    ورود
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => logout()}>
                      خروج
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/user-hub'}>
                      پنل کاربری
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
