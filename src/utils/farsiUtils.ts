// Utility functions for handling Farsi/Persian numbers and text

export const farsiToEnglishNumbers = (input: string): string => {
  if (!input) return input;
  
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = input;
  
  // Convert Farsi digits to English
  farsiDigits.forEach((farsiDigit, index) => {
    result = result.replace(new RegExp(farsiDigit, 'g'), englishDigits[index]);
  });
  
  // Convert Arabic digits to English
  arabicDigits.forEach((arabicDigit, index) => {
    result = result.replace(new RegExp(arabicDigit, 'g'), englishDigits[index]);
  });
  
  return result;
};

export const englishToFarsiNumbers = (input: string): string => {
  if (!input) return input;
  
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = input;
  
  englishDigits.forEach((englishDigit, index) => {
    result = result.replace(new RegExp(englishDigit, 'g'), farsiDigits[index]);
  });
  
  return result;
};

export const normalizePhoneInput = (input: string): string => {
  // First convert Farsi/Arabic digits to English
  const englishNumbers = farsiToEnglishNumbers(input);
  
  // Remove all non-digit characters except +
  const cleaned = englishNumbers.replace(/[^\d+]/g, '');
  
  return cleaned;
};