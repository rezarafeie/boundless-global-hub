
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { translations, language, direction } = useLanguage();
  
  return (
    <footer className="bg-secondary py-12 border-t">
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4">{translations.websiteName}</h3>
          <p className="text-muted-foreground mb-4">{translations.slogan}</p>
          <p className="text-muted-foreground">{translations.tagline}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-4">{translations.paidCoursesTitle}</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/paid-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.boundlessProgram}
              </Link>
            </li>
            <li>
              <Link to="/paid-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.instagramEssentials}
              </Link>
            </li>
            <li>
              <Link to="/paid-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.wealthCourse}
              </Link>
            </li>
            <li>
              <Link to="/paid-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.metaverseEmpire}
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-4">{translations.freeCoursesTitle}</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/free-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.boundlessTaste}
              </Link>
            </li>
            <li>
              <Link to="/free-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.passiveIncomeAI}
              </Link>
            </li>
            <li>
              <Link to="/free-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.changeProject}
              </Link>
            </li>
            <li>
              <Link to="/free-courses" className="text-muted-foreground hover:text-primary transition-colors">
                {translations.americanBusiness}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-muted-foreground mb-4 md:mb-0">
          {translations.footerCopyright}
        </p>
        <div className="flex space-x-4 rtl:space-x-reverse">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {translations.privacy}
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {translations.terms}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

