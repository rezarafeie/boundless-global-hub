import React, { createContext, useContext, useEffect } from 'react';
import { useBlackFriday } from '@/hooks/useBlackFriday';

interface BlackFridayContextType {
  isActive: boolean;
  settings: any;
  discounts: any[];
  getCourseDiscount: (courseId: string) => number;
}

const BlackFridayContext = createContext<BlackFridayContextType | undefined>(undefined);

export const BlackFridayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isActive, settings, discounts, getCourseDiscount } = useBlackFriday();

  useEffect(() => {
    if (isActive) {
      document.documentElement.classList.add('black-friday-mode');
    } else {
      document.documentElement.classList.remove('black-friday-mode');
    }

    return () => {
      document.documentElement.classList.remove('black-friday-mode');
    };
  }, [isActive]);

  return (
    <BlackFridayContext.Provider value={{ isActive, settings, discounts: discounts || [], getCourseDiscount }}>
      {children}
    </BlackFridayContext.Provider>
  );
};

export const useBlackFridayContext = () => {
  const context = useContext(BlackFridayContext);
  if (context === undefined) {
    throw new Error('useBlackFridayContext must be used within BlackFridayProvider');
  }
  return context;
};