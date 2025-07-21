
// Phone number normalization utilities for consistent handling across the app

export interface NormalizedPhone {
  phone: string; // Normalized phone without country code (e.g., "9120784457")
  countryCode: string; // Country code (e.g., "+98")
}

/**
 * Normalize phone number by removing country codes and leading zeros
 */
export function normalizePhone(phone: string, defaultCountryCode: string = '+98'): NormalizedPhone {
  if (!phone) {
    return { phone: '', countryCode: defaultCountryCode };
  }

  // Remove all non-digit characters
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  let countryCode = defaultCountryCode;

  // Handle different Iranian phone formats
  if (cleanPhone.startsWith('98') && cleanPhone.length === 12) {
    // +98xxxxxxxxxx or 98xxxxxxxxxx
    countryCode = '+98';
    cleanPhone = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('0098') && cleanPhone.length === 14) {
    // 0098xxxxxxxxxx
    countryCode = '+98';
    cleanPhone = cleanPhone.substring(4);
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
    // 09xxxxxxxxx
    countryCode = '+98';
    cleanPhone = cleanPhone.substring(1);
  }

  // Remove any remaining leading zeros
  cleanPhone = cleanPhone.replace(/^0+/, '');

  return {
    phone: cleanPhone,
    countryCode
  };
}

/**
 * Generate all possible phone formats to search for in database
 */
export function generatePhoneSearchFormats(phone: string, countryCode: string = '+98'): string[] {
  const normalized = normalizePhone(phone, countryCode);
  const basePhone = normalized.phone;
  
  if (!basePhone) return [];

  const formats = [
    basePhone, // 9120784457
    `0${basePhone}`, // 09120784457
    `${countryCode}${basePhone}`, // +989120784457
    `${countryCode.substring(1)}${basePhone}`, // 989120784457
    `00${countryCode.substring(1)}${basePhone}`, // 00989120784457
  ];

  // Remove duplicates
  return [...new Set(formats)];
}

/**
 * Format phone for display with country code
 */
export function formatPhoneForDisplay(phone: string, countryCode: string = '+98'): string {
  const normalized = normalizePhone(phone, countryCode);
  return `${normalized.countryCode}${normalized.phone}`;
}

/**
 * Validate if phone number is Iranian format
 */
export function isIranianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.phone.length === 10 && normalized.phone.startsWith('9');
}
