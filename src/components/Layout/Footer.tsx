
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Mail, MessageCircle, Phone, Home, User, MapPin } from "lucide-react";

const Footer = () => {
  const { translations } = useLanguage();

  // Always use dark theme logo in footer since footer has dark background
  const footerLogoSrc = "/lovable-uploads/e743fe4f-8642-41ec-a4bf-7d749942d8b6.png";

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white">
      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center">
              <img 
                src={footerLogoSrc}
                alt={translations.websiteName} 
                className="h-10 w-auto ml-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png";
                }}
              />
              <h3 className="text-2xl font-bold text-white">{translations.websiteName}</h3>
            </div>
            <p className="text-gray-300 text-base leading-relaxed max-w-sm">
              {translations.footerDesc}
            </p>
            
            {/* Social Media - Enhanced RTL spacing */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <a 
                href="https://instagram.com/rafieiacademy" 
                className="bg-gray-700 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8.75C10.2051 8.75 8.75 10.2051 8.75 12C8.75 13.7949 10.2051 15.25 12 15.25C13.7949 15.25 15.25 13.7949 15.25 12C15.25 10.2051 13.7949 8.75 12 8.75Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.77 3.082C10.235 2.786 13.765 2.786 17.23 3.082C19.307 3.261 20.974 4.9 21.159 7.009C21.434 10.284 21.434 13.716 21.159 16.991C20.974 19.1 19.307 20.739 17.23 20.918C13.765 21.214 10.235 21.214 6.77 20.918C4.693 20.739 3.026 19.1 2.841 16.991C2.566 13.716 2.566 10.284 2.841 7.009C3.026 4.9 4.693 3.261 6.77 3.082ZM17 7C17.5523 7 18 6.55228 18 6C18 5.44772 17.5523 5 17 5C16.4477 5 16 5.44772 16 6C16 6.55228 16.4477 7 17 7ZM7.25 12C7.25 9.37665 9.37665 7.25 12 7.25C14.6234 7.25 16.75 9.37665 16.75 12C16.75 14.6234 14.6234 16.75 12 16.75C9.37665 16.75 7.25 14.6234 7.25 12Z" fill="currentColor"/>
                </svg>
              </a>
              <a 
                href="https://t.me/rafieiacademy" 
                className="bg-gray-700 hover:bg-blue-500 p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.2138 3.00409C21.8388 2.67463 21.3358 2.50201 20.8068 2.50201C20.4168 2.50201 20.0038 2.59452 19.5968 2.78026L2.76279 10.4264C1.31379 11.0874 1.27979 12.1118 1.28679 12.3398C1.32079 13.3062 2.00779 13.9306 2.81879 14.2428L6.51779 15.5121L8.15479 21.0861C8.51779 22.3221 9.50079 23.1748 10.6598 23.1748H10.6668C11.2518 23.1748 12.3508 22.7724 12.9508 21.0861L17.1968 9.66009C16.7408 9.72009 16.2948 9.54935 16.0058 9.19808C15.7098 8.84328 15.6158 8.36591 15.7478 7.92122L22.8128 4.23119C23.3128 3.99402 23.0498 3.33356 22.2138 3.00409Z" fill="currentColor"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/989123456789" 
                className="bg-gray-700 hover:bg-green-500 p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M19.0706 4.92746C16.7865 2.64925 13.7205 1.32747 10.4706 1.32745C5.39763 1.32745 1.24953 5.47555 1.24953 10.5486C1.24953 12.3458 1.70094 14.0983 2.54953 15.6565L1.25 21.0275L6.74763 19.7495C8.24953 20.5245 9.9264 20.9347 11.6264 20.9347C16.6994 20.9347 20.8475 16.7866 20.8475 11.7136C20.8475 8.43464 19.5267 5.39365 17.2485 3.11549L19.0706 4.92746Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links - Enhanced RTL spacing */}
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-white flex items-center">
              <Home className="ml-3 h-5 w-5 text-blue-400" />
              دسترسی سریع
            </h4>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 text-base flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full ml-3 group-hover:bg-white transition-colors"></span>
                  {translations.home}
                </Link>
              </li>
              <li>
                <Link 
                  to="/courses" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 text-base flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full ml-3 group-hover:bg-white transition-colors"></span>
                  {translations.trainingCenter}
                </Link>
              </li>
              <li>
                <Link 
                  to="/assessment-center" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 text-base flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full ml-3 group-hover:bg-white transition-colors"></span>
                  {translations.assessmentCenter}
                </Link>
              </li>
              <li>
                <a 
                  href="https://mag.rafiei.co" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 text-base flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-400 rounded-full ml-3 group-hover:bg-white transition-colors"></span>
                  {translations.magazine}
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info - Enhanced RTL spacing */}
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-white flex items-center">
              <MessageCircle className="ml-3 h-5 w-5 text-green-400" />
              {translations.contact}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center text-base group">
                <Mail className="ml-3 h-5 w-5 text-green-400 group-hover:text-white transition-colors" />
                <a 
                  href="mailto:hi@rafeie.com" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  hi@rafeie.com
                </a>
              </li>
              <li className="flex items-center text-base group">
                <Phone className="ml-3 h-5 w-5 text-green-400 group-hover:text-white transition-colors" />
                <a 
                  href="tel:02128427131" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  021-28427131
                </a>
              </li>
              <li className="flex items-center text-base group">
                <MapPin className="ml-3 h-5 w-5 text-green-400 group-hover:text-white transition-colors" />
                <span className="text-gray-300">تهران، ایران</span>
              </li>
            </ul>
          </div>
          
          {/* Support - Enhanced RTL spacing */}
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-white flex items-center">
              <User className="ml-3 h-5 w-5 text-purple-400" />
              پشتیبانی
            </h4>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/support" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 text-base flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full ml-3 group-hover:bg-white transition-colors"></span>
                  {translations.support}
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 text-base flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full ml-3 group-hover:bg-white transition-colors"></span>
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-300 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1 transition-all duration-200 text-base flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-400 rounded-full ml-3 group-hover:bg-white transition-colors"></span>
                  {translations.aboutUs}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Footer Bottom - Enhanced */}
      <div className="border-t border-gray-700 bg-gray-900/50">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-base">
              {translations.footerCopyright}
            </p>
            <div className="flex items-center space-x-8 rtl:space-x-reverse">
              <Link 
                to="/terms" 
                className="text-gray-400 hover:text-white text-base transition-colors hover:underline"
              >
                {translations.termsOfService}
              </Link>
              <Link 
                to="/privacy" 
                className="text-gray-400 hover:text-white text-base transition-colors hover:underline"
              >
                {translations.privacyPolicy}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
