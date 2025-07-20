import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnrollHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

const EnrollHeader: React.FC<EnrollHeaderProps> = ({ 
  showBackButton = true, 
  title = "آکادمی رفیعی" 
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-border/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-accent"
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  بازگشت
                </Link>
              </Button>
            )}
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden md:flex"
          >
            <Link to="/">
              <Home className="h-4 w-4 ml-2" />
              صفحه اصلی
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default EnrollHeader;