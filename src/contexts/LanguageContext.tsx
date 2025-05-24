
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "@/translations/en";
import { fa } from "@/translations/fa";

type Language = "en" | "fa";
type Direction = "ltr" | "rtl";
type TranslationType = typeof en | typeof fa;

interface LanguageContextType {
  language: Language;
  direction: Direction;
  translations: TranslationType;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>("fa");
  const [direction, setDirection] = useState<Direction>("rtl");
  const [translations, setTranslations] = useState<TranslationType>(fa);

  useEffect(() => {
    // Check if language is stored in local storage
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage === "en" || savedLanguage === "fa") {
      setLanguage(savedLanguage);
    } else {
      // Default to Persian (Farsi)
      setLanguage("fa");
      localStorage.setItem("language", "fa");
    }
  }, []);

  useEffect(() => {
    // Update direction and translations when language changes
    setDirection(language === "fa" ? "rtl" : "ltr");
    setTranslations(language === "fa" ? fa : en);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    localStorage.setItem("language", language);
    
    // Update font family based on language
    document.body.style.fontFamily = language === "fa" ? "Vazir, sans-serif" : "Inter, sans-serif";
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "fa" : "en"));
  };

  const value = {
    language,
    direction,
    translations,
    setLanguage,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
