
import React, { useState, useEffect } from 'react';

const DynamicQuote = () => {
  const quotes = [
    "آینده از آن کسانی است که آماده‌اند بدون مرز فکر کنند",
    "کسب‌وکار جهانی، یک کلیک با تو فاصله دارد", 
    "شروعی کوچک، تغییری جهانی",
    "موفقیت، نتیجه تلاش‌های مداوم و هدفمند است",
    "درآمد ارزی، دروازه‌ای به آزادی مالی",
    "هر روز، فرصتی جدید برای شروع دوباره است",
    "تو قدرت تغییر زندگی‌ات را داری"
  ];

  const [currentQuote, setCurrentQuote] = useState("");

  useEffect(() => {
    // Select a random quote on component mount
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  }, []);

  return (
    <div className="text-center mb-6">
      <p className="text-lg md:text-xl text-primary font-medium italic animate-fade-in">
        "{currentQuote}"
      </p>
    </div>
  );
};

export default DynamicQuote;
