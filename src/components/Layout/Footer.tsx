
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BookOpen, Mail, MessageCircle, Phone, Moon, Sun, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const { translations } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
      <div className="container">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png" 
                alt={translations.websiteName} 
                className="h-8 w-auto mr-2"
              />
              <h3 className="text-xl font-bold text-white">{translations.websiteName}</h3>
            </div>
            <p className="text-gray-300 dark:text-gray-400 text-sm leading-relaxed">
              مرجع تخصصی توسعه فردی و کسب‌وکار. تبدیل دانش به درآمد جهانی با آموزش‌های تخصصی رضا رفیعی
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center text-white">
              <Home className="mr-2 h-4 w-4" />
              دسترسی سریع
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm flex items-center">
                  صفحه اصلی
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm flex items-center">
                  <BookOpen className="mr-2 h-3 w-3" />
                  مرکز آموزش
                </Link>
              </li>
              <li>
                <Link to="/assessment-center" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm flex items-center">
                  <User className="mr-2 h-3 w-3" />
                  مرکز ارزیابی
                </Link>
              </li>
              <li>
                <Link to="/mag" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm flex items-center">
                  <Mail className="mr-2 h-3 w-3" />
                  مجله
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm flex items-center">
                  <MessageCircle className="mr-2 h-3 w-3" />
                  پشتیبانی
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center text-white">
              <MessageCircle className="mr-2 h-4 w-4" />
              ارتباط با ما
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <a href="mailto:info@rafiei.co" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                  info@rafiei.co
                </a>
              </li>
              <li className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <a href="tel:+989123456789" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                  +98 912 345 6789
                </a>
              </li>
              <li className="flex items-center text-sm">
                <MessageCircle className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <a href="https://t.me/rafieiacademy" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                  @rafieiacademy
                </a>
              </li>
            </ul>
          </div>
          
          {/* Social & Theme */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">شبکه‌های اجتماعی</h4>
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
              <a href="https://instagram.com/rafieiacademy" className="bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8.75C10.2051 8.75 8.75 10.2051 8.75 12C8.75 13.7949 10.2051 15.25 12 15.25C13.7949 15.25 15.25 13.7949 15.25 12C15.25 10.2051 13.7949 8.75 12 8.75Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.77 3.082C10.235 2.786 13.765 2.786 17.23 3.082C19.307 3.261 20.974 4.9 21.159 7.009C21.434 10.284 21.434 13.716 21.159 16.991C20.974 19.1 19.307 20.739 17.23 20.918C13.765 21.214 10.235 21.214 6.77 20.918C4.693 20.739 3.026 19.1 2.841 16.991C2.566 13.716 2.566 10.284 2.841 7.009C3.026 4.9 4.693 3.261 6.77 3.082ZM17 7C17.5523 7 18 6.55228 18 6C18 5.44772 17.5523 5 17 5C16.4477 5 16 5.44772 16 6C16 6.55228 16.4477 7 17 7ZM7.25 12C7.25 9.37665 9.37665 7.25 12 7.25C14.6234 7.25 16.75 9.37665 16.75 12C16.75 14.6234 14.6234 16.75 12 16.75C9.37665 16.75 7.25 14.6234 7.25 12Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://t.me/rafieiacademy" className="bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.2138 3.00409C21.8388 2.67463 21.3358 2.50201 20.8068 2.50201C20.4168 2.50201 20.0038 2.59452 19.5968 2.78026L2.76279 10.4264C1.31379 11.0874 1.27979 12.1118 1.28679 12.3398C1.32079 13.3062 2.00779 13.9306 2.81879 14.2428L6.51779 15.5121L8.15479 21.0861C8.51779 22.3221 9.50079 23.1748 10.6598 23.1748H10.6668C11.2518 23.1748 12.3508 22.7724 12.9508 21.0861L17.1968 9.66009C16.7408 9.72009 16.2948 9.54935 16.0058 9.19808C15.7098 8.84328 15.6158 8.36591 15.7478 7.92122L22.8128 4.23119C23.3128 3.99402 23.0498 3.33356 22.2138 3.00409Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://wa.me/989123456789" className="bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M19.0706 4.92746C16.7865 2.64925 13.7205 1.32747 10.4706 1.32745C5.39763 1.32745 1.24953 5.47555 1.24953 10.5486C1.24953 12.3458 1.70094 14.0983 2.54953 15.6565L1.25 21.0275L6.74763 19.7495C8.24953 20.5245 9.9264 20.9347 11.6264 20.9347C16.6994 20.9347 20.8475 16.7866 20.8475 11.7136C20.8475 8.43464 19.5267 5.39365 17.2485 3.11549L19.0706 4.92746ZM7.85504 17.4175C6.51661 17.4175 5.20528 17.0073 4.03983 16.2323L3.83927 16.1085L3.42818 16.2323L1.85945 16.6841L2.31136 15.1154L2.43515 14.7042L2.31136 14.5045C1.47798 13.3258 1.06841 11.9388 1.06841 10.5281C1.06841 5.66801 5.14694 1.59061 10.0042 1.59061C12.8753 1.59061 15.5485 2.79109 17.5174 4.75994C19.4863 6.72879 20.6868 9.40206 20.6868 12.2731C20.6868 17.1332 16.6082 21.2106 11.751 21.2106C10.3845 21.2106 9.01815 20.8425 7.8345 20.0675L7.85504 17.4175ZM15.2711 12.7454C15.0439 12.6216 13.8074 12.0147 13.6007 11.932C13.394 11.8493 13.2497 11.8078 13.0845 12.035C12.9194 12.2622 12.4368 12.8277 12.313 12.9929C12.1892 13.158 12.0654 13.1786 11.8382 13.0548C11.6111 12.931 10.788 12.6423 9.81943 11.7842C9.06579 11.1365 8.5626 10.3201 8.43881 10.093C8.31503 9.86582 8.4268 9.75169 8.51576 9.63756C8.81592 9.26564 9.11609 8.89373 9.20202 8.72859C9.28795 8.56345 9.24827 8.39831 9.18416 8.27452C9.11913 8.15074 8.62555 6.91432 8.43881 6.45865C8.25208 6.00298 8.06534 6.06709 7.94156 6.06709C7.81777 6.06709 7.67347 6.03709 7.54968 6.03709C7.4259 6.03709 7.21897 6.10213 7.01226 6.32924C6.80555 6.55636 6.15916 7.16329 6.15916 8.39971C6.15916 9.63614 7.08392 10.8314 7.21262 10.9966C7.34131 11.1617 8.52963 13.0033 10.3845 13.8308C12.2393 14.6582 12.2393 14.3678 12.6726 14.3263C13.1058 14.2848 14.1379 13.7191 14.3246 13.1785C14.5114 12.6379 14.5114 12.1822 14.4473 12.0584C14.3832 11.9346 14.2179 11.8523 13.9908 11.7285L15.2711 12.7454Z" fill="currentColor"/>
                </svg>
              </a>
              
              {/* Theme Toggle as Icon Only */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors text-white"
                aria-label={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="pt-8 border-t border-gray-700 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4 md:mb-0">
            © ۲۰۲۴ آکادمی رفیعی. تمامی حقوق محفوظ است.
          </p>
          <div className="flex space-x-6 rtl:space-x-reverse">
            <Link to="/about" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 text-sm transition-colors">
              درباره ما
            </Link>
            <Link to="/terms" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 text-sm transition-colors">
              شرایط استفاده
            </Link>
            <Link to="/privacy" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 text-sm transition-colors">
              حریم خصوصی
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
