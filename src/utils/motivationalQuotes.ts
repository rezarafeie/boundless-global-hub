
export const motivationalQuotes = {
  fa: [
    "آینده از آن کسانی است که آماده‌اند بدون مرز فکر کنند",
    "کسب‌وکار جهانی، یک کلیک با تو فاصله دارد", 
    "شروعی کوچک، تغییری جهانی",
    "هر روز فرصتی نو برای یادگیری است",
    "موفقیت نتیجه تلاش مستمر و یادگیری مداوم است",
    "رویاهایت را به واقعیت تبدیل کن",
    "مرزهای ذهنت را گسترش ده",
    "آینده متعلق به یادگیرندگان است"
  ],
  en: [
    "The future belongs to those ready to think boundlessly",
    "Global business is just one click away from you",
    "Small start, global change", 
    "Every day is a new opportunity to learn",
    "Success is the result of continuous effort and learning",
    "Turn your dreams into reality",
    "Expand the boundaries of your mind",
    "The future belongs to learners"
  ]
};

export const getRandomQuote = (language: 'fa' | 'en'): string => {
  const quotes = motivationalQuotes[language];
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};
