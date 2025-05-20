
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, MessageCircle, Send } from "lucide-react";

const Footer = () => {
  const { translations, language, direction } = useLanguage();
  
  return (
    <footer className="bg-background py-16 border-t border-border">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png"
                alt="Rafiei Academy"
                className="h-8 w-auto"
              />
              <h3 className="text-lg font-bold">{translations.websiteName}</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              {translations.tagline}
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-4">Quick Access</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {translations.coursesTitle}
                </Link>
              </li>
              <li>
                <Link to="/assessment-center" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {translations.assessmentCenterTitle}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  User Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={16} className="flex-shrink-0" />
                <span>support@rafiei.academy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Send size={16} className="flex-shrink-0" />
                <span>@RafieiAcademy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle size={16} className="flex-shrink-0" />
                <span>+98 912 345 6789</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-base font-semibold mb-4">Subscribe</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join our newsletter to get the latest updates.
            </p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button type="submit" className="h-9 rounded-md bg-primary px-3 text-primary-foreground shadow hover:bg-primary/90 text-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {translations.websiteName}. {translations.footerCopyright}
          </p>
          <div className="flex space-x-4 rtl:space-x-reverse mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              {translations.privacy}
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              {translations.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
