const countryCodes = [
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+967', name: 'Yemen', flag: '🇾🇪' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', name: 'Syria', flag: '🇸🇾' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+421', name: 'Slovakia', flag: '🇸🇰' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: '+40', name: 'Romania', flag: '🇷🇴' },
  { code: '+359', name: 'Bulgaria', flag: '🇧🇬' },
  { code: '+385', name: 'Croatia', flag: '🇭🇷' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: '+381', name: 'Serbia', flag: '🇷🇸' },
  { code: '+382', name: 'Montenegro', flag: '🇲🇪' },
  { code: '+387', name: 'Bosnia', flag: '🇧🇦' },
  { code: '+389', name: 'North Macedonia', flag: '🇲🇰' },
  { code: '+355', name: 'Albania', flag: '🇦🇱' },
  { code: '+383', name: 'Kosovo', flag: '🇽🇰' },
  { code: '+372', name: 'Estonia', flag: '🇪🇪' },
  { code: '+371', name: 'Latvia', flag: '🇱🇻' },
  { code: '+370', name: 'Lithuania', flag: '🇱🇹' },
  { code: '+375', name: 'Belarus', flag: '🇧🇾' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+373', name: 'Moldova', flag: '🇲🇩' },
  { code: '+374', name: 'Armenia', flag: '🇦🇲' },
  { code: '+995', name: 'Georgia', flag: '🇬🇪' },
  { code: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+996', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+992', name: 'Tajikistan', flag: '🇹🇯' },
  { code: '+993', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+7', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+976', name: 'Mongolia', flag: '🇲🇳' }
];

export function detectCountryCode(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check for common Iranian patterns first
  if (cleanNumber.match(/^(98|0098)/)) return '+98';
  if (cleanNumber.match(/^09\d{9}$/)) return '+98';
  if (cleanNumber.match(/^9\d{9}$/)) return '+98';
  
  // Sort codes by length (longest first) to match longer codes first
  const sortedCodes = countryCodes
    .map(c => c.code.replace('+', ''))
    .sort((a, b) => b.length - a.length);
  
  for (const code of sortedCodes) {
    if (cleanNumber.startsWith(code)) {
      return '+' + code;
    }
  }
  
  // Default to Iran for unrecognized numbers
  return '+98';
}

export function formatPhoneWithCountryCode(phoneNumber: string, countryCode?: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const detectedCode = countryCode || detectCountryCode(phoneNumber);
  
  // Remove country code from number if it already starts with it
  const codeWithoutPlus = detectedCode.replace('+', '');
  let numberWithoutCode = cleanNumber;
  
  if (cleanNumber.startsWith(codeWithoutPlus)) {
    numberWithoutCode = cleanNumber.substring(codeWithoutPlus.length);
  }
  
  // Handle Iranian numbers special case
  if (detectedCode === '+98') {
    if (numberWithoutCode.startsWith('0')) {
      numberWithoutCode = numberWithoutCode.substring(1);
    }
  }
  
  return detectedCode + numberWithoutCode;
}

export function getCountryCodeOptions() {
  return countryCodes;
}

export function getCountryByCode(code: string) {
  return countryCodes.find(c => c.code === code);
}