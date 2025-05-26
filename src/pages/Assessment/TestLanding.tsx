import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Clock, 
  HelpCircle, 
  Users, 
  Target, 
  Award,
  CheckCircle,
  Play,
  ArrowRight
} from "lucide-react";
import IframeModal from "@/components/IframeModal";
import { motion } from "framer-motion";

// Test data with detailed information for ALL tests
const testData: Record<string, any> = {
  "mbti": {
    title: "تست شخصیت MBTI",
    description: "شناخت نوع شخصیت و الگوهای رفتاری شما بر اساس تئوری مایرز-بریگز",
    longDescription: "این تست بر اساس تئوری کارل یونگ و توسط کاترین بریگز و ایزابل مایرز توسعه یافته است. MBTI یکی از معتبرترین ابزارهای شناخت شخصیت در جهان محسوب می‌شود.",
    category: "شخصیت",
    duration: "۲۰ دقیقه",
    questions: 60,
    benefits: [
      "شناخت عمیق نقاط قوت و ضعف شخصیتی",
      "درک بهتر نحوه تعامل با دیگران",
      "انتخاب مسیر شغلی مناسب",
      "بهبود روابط بین فردی",
      "افزایش اعتماد به نفس"
    ],
    features: [
      "تحلیل ۱۶ نوع شخصیت",
      "گزارش جامع و تفصیلی",
      "توصیه‌های شغلی",
      "راهنمای تعامل اجتماعی"
    ],
    whoFor: [
      "افرادی که می‌خواهند خود را بهتر بشناسند",
      "دانشجویان در حال انتخاب رشته",
      "حرفه‌ای‌ها برای توسعه مهارت‌های کاری",
      "مدیران برای بهبود مدیریت تیم"
    ]
  },
  "disc": {
    title: "تست DISC",
    description: "ارزیابی سبک رفتاری و نحوه تعامل شما با دیگران",
    longDescription: "مدل DISC یکی از ابزارهای محبوب برای درک انواع شخصیت و سبک‌های ارتباطی است که در محیط‌های کاری و شخصی بسیار مفید است.",
    category: "شخصیت",
    duration: "۱۵ دقیقه", 
    questions: 40,
    benefits: [
      "شناخت سبک رهبری طبیعی شما",
      "بهبود مهارت‌های ارتباطی",
      "درک تفاوت‌های فردی در تیم",
      "افزایش اثربخشی در کار گروهی"
    ],
    features: [
      "تحلیل ۴ سبک اصلی رفتاری",
      "راهنمای کاربردی برای محیط کار",
      "نکات بهبود ارتباط",
      "استراتژی‌های مدیریت استرس"
    ],
    whoFor: [
      "مدیران و رهبران تیم",
      "فروشندگان و متخصصان ارتباط",
      "افراد شاغل در مشاغل تیمی",
      "کسانی که می‌خواهند مهارت‌های اجتماعی خود را بهبود دهند"
    ]
  },
  "mii": {
    title: "تست هوش چندگانه MII",
    description: "شناسایی انواع مختلف هوش و توانایی‌های ذهنی شما",
    longDescription: "تست هوش چندگانه بر اساس تئوری هاوارد گاردنر طراحی شده و ۸ نوع مختلف هوش را در شما شناسایی می‌کند.",
    category: "هوش",
    duration: "۲۵ دقیقه",
    questions: 80,
    benefits: [
      "شناخت نقاط قوت ذهنی شما",
      "انتخاب روش‌های یادگیری مناسب",
      "توسعه مهارت‌های خلاقیت",
      "بهبود عملکرد تحصیلی و شغلی"
    ],
    features: [
      "ارزیابی ۸ نوع هوش",
      "نمودار توانایی‌های شما",
      "پیشنهاد مسیرهای شغلی",
      "راهنمای توسعه هوش"
    ],
    whoFor: [
      "دانش‌آموزان و دانشجویان",
      "والدین برای شناخت فرزندان",
      "معلمان و مربیان",
      "افراد در حال تغییر شغل"
    ]
  },
  "ocq": {
    title: "تست تعهد سازمانی OCQ",
    description: "سنجش میزان تعهد و وفاداری شما نسبت به سازمان",
    longDescription: "این تست میزان دلبستگی، تعهد و وفاداری کارکنان نسبت به سازمان خود را اندازه‌گیری می‌کند.",
    category: "سازمانی",
    duration: "۱۰ دقیقه",
    questions: 24,
    benefits: [
      "ارزیابی میزان تعهد شغلی",
      "شناخت عوامل انگیزشی",
      "بهبود رضایت شغلی",
      "توسعه وفاداری سازمانی"
    ],
    features: [
      "سنجش سه بعد تعهد",
      "تحلیل عوامل مؤثر",
      "راهکارهای بهبود",
      "مقایسه با استانداردها"
    ],
    whoFor: [
      "کارکنان شاغل",
      "مدیران منابع انسانی",
      "مشاوران سازمانی",
      "رهبران تیم"
    ]
  },
  "msq": {
    title: "تست رضایت شغلی MSQ",
    description: "ارزیابی میزان رضایت شما از جنبه‌های مختلف کار",
    longDescription: "پرسشنامه رضایت شغلی مینه‌سوتا ابزاری جامع برای سنجش رضایت از ابعاد مختلف محیط کار است.",
    category: "شغلی",
    duration: "۱۵ دقیقه",
    questions: 100,
    benefits: [
      "شناسایی منابع رضایت شغلی",
      "بهبود عملکرد کاری",
      "کاهش استرس شغلی",
      "انتخاب شغل مناسب"
    ],
    features: [
      "بررسی ۲۰ عامل رضایت",
      "نمره کلی و جزئی",
      "مقایسه با گروه‌های شغلی",
      "پیشنهادات بهبود"
    ],
    whoFor: [
      "کارکنان و کارگران",
      "مشاوران شغلی",
      "مدیران HR",
      "افراد نارضی از کار"
    ]
  },
  "eq": {
    title: "تست هوش عاطفی EQ",
    description: "سنجش توانایی درک و مدیریت احساسات خود و دیگران",
    longDescription: "تست هوش عاطفی ابزاری مدرن برای سنجش توانایی‌های عاطفی و اجتماعی افراد است.",
    category: "عاطفی",
    duration: "۲۰ دقیقه",
    questions: 70,
    benefits: [
      "بهبود روابط بین‌فردی",
      "مدیریت بهتر استرس",
      "افزایش مهارت‌های رهبری",
      "توسعه همدلی و درک"
    ],
    features: [
      "پنج حوزه هوش عاطفی",
      "نمودار مهارت‌های EQ",
      "راهکارهای عملی",
      "برنامه توسعه فردی"
    ],
    whoFor: [
      "مدیران و رهبران",
      "مشاوران و درمانگران",
      "معلمان و والدین",
      "افراد در مشاغل خدماتی"
    ]
  },
  "raven": {
    title: "تست هوش ریون",
    description: "سنجش هوش غیرکلامی و توانایی حل مسئله",
    longDescription: "تست ماتریس‌های پیشرونده ریون ابزاری معتبر برای سنجش هوش عمومی و توانایی تفکر منطقی است.",
    category: "هوش",
    duration: "۳۰ دقیقه",
    questions: 60,
    benefits: [
      "سنجش دقیق هوش عمومی",
      "ارزیابی بدون تأثیر فرهنگ",
      "شناخت توانایی حل مسئله",
      "پیش‌بینی موفقیت تحصیلی"
    ],
    features: [
      "بدون وابستگی به زبان",
      "استاندارد بین‌المللی",
      "نمره هوشی دقیق",
      "مقایسه با جمعیت"
    ],
    whoFor: [
      "دانش‌آموزان و دانشجویان",
      "متقاضیان شغل",
      "روانشناسان",
      "مشاوران تحصیلی"
    ]
  },
  "cattell-iq": {
    title: "تست هوش کتل فرم B",
    description: "ارزیابی جامع هوش عمومی و توانایی‌های شناختی",
    longDescription: "آزمون هوش کتل یکی از معتبرترین ابزارهای سنجش هوش عمومی و توانایی‌های شناختی است.",
    category: "هوش",
    duration: "۴۵ دقیقه",
    questions: 50,
    benefits: [
      "سنجش جامع هوش عمومی",
      "ارزیابی سرعت پردازش",
      "شناخت استعدادهای ذهنی",
      "راهنمایی تحصیلی و شغلی"
    ],
    features: [
      "چهار خرده‌آزمون متنوع",
      "نمره استاندارد IQ",
      "تحلیل نقاط قوت",
      "مقایسه سنی"
    ],
    whoFor: [
      "دانشجویان رشته‌های علمی",
      "متقاضیان مشاغل فنی",
      "محققان و دانشمندان",
      "مشاوران روانشناس"
    ]
  },
  "cattell-a": {
    title: "تست هوش کتل فرم A",
    description: "نسخه جایگزین آزمون هوش کتل برای سنجش هوش عمومی",
    longDescription: "آزمون هوش کتل فرم A نسخه موازی فرم B است و برای ارزیابی مجدد یا تحقیقات استفاده می‌شود.",
    category: "هوش",
    duration: "۴۵ دقیقه",
    questions: 50,
    benefits: [
      "سنجش جامع هوش عمومی",
      "ارزیابی سرعت پردازش",
      "شناخت استعدادهای ذهنی",
      "راهنمایی تحصیلی و شغلی"
    ],
    features: [
      "چهار خرده‌آزمون متنوع",
      "نمره استاندارد IQ",
      "تحلیل نقاط قوت",
      "مقایسه سنی"
    ],
    whoFor: [
      "دانشجویان رشته‌های علمی",
      "متقاضیان مشاغل فنی",
      "محققان و دانشمندان",
      "مشاوران روانشناس"
    ]
  },
  "csei": {
    title: "تست عزت نفس کوپراسمیت",
    description: "ارزیابی میزان اعتماد به نفس و ارزش‌گذاری خود",
    longDescription: "پرسشنامه عزت نفس کوپراسمیت ابزاری معتبر برای سنجش میزان اعتماد به نفس و خودپنداره مثبت است.",
    category: "شخصیت",
    duration: "۱۰ دقیقه",
    questions: 58,
    benefits: [
      "شناخت سطح عزت نفس",
      "تقویت اعتماد به نفس",
      "بهبود خودپنداره",
      "افزایش انگیزه پیشرفت"
    ],
    features: [
      "چهار حوزه عزت نفس",
      "نمره کلی و جزئی",
      "شناسایی نقاط ضعف",
      "برنامه بهبود"
    ],
    whoFor: [
      "نوجوانان و جوانان",
      "افراد با اضطراب اجتماعی",
      "مشاوران روانشناختی",
      "معلمان و والدین"
    ]
  },
  "hii": {
    title: "تست علایق شغلی هالند",
    description: "شناسایی علایق شغلی و مسیر شغلی مناسب",
    longDescription: "تست علایق شغلی هالند بر اساس تئوری شش نوع شخصیت و محیط‌های شغلی طراحی شده است.",
    category: "شغلی",
    duration: "۱۵ دقیقه",
    questions: 84,
    benefits: [
      "انتخاب رشته مناسب",
      "شناخت مشاغل متناسب",
      "افزایش رضایت شغلی",
      "برنامه‌ریزی مسیر شغلی"
    ],
    features: [
      "شش نوع شخصیت RIASEC",
      "فهرست مشاغل پیشنهادی",
      "تحلیل محیط کاری",
      "راهنمای انتخاب رشته"
    ],
    whoFor: [
      "دانش‌آموزان آخر دبیرستان",
      "دانشجویان تردیدی",
      "افراد در حال تغییر شغل",
      "مشاوران تحصیلی"
    ]
  },
  "16pf": {
    title: "تست شخصیت 16PF کتل",
    description: "بررسی جامع ۱۶ عامل اصلی شخصیت",
    longDescription: "پرسشنامه 16PF کتل یکی از جامع‌ترین ابزارهای سنجش شخصیت است که ۱۶ بعد اصلی شخصیت را بررسی می‌کند.",
    category: "شخصیت",
    duration: "۳۰ دقیقه",
    questions: 185,
    benefits: [
      "شناخت عمیق ویژگی‌های شخصیتی",
      "پیش‌بینی رفتار در موقعیت‌ها",
      "بهبود خودآگاهی",
      "راهنمایی در انتخاب‌های زندگی"
    ],
    features: [
      "۱۶ عامل اولیه شخصیت",
      "پنج عامل کلی",
      "پروفایل شخصیتی کامل",
      "تفسیر تخصصی"
    ],
    whoFor: [
      "روانشناسان بالینی",
      "مشاوران ازدواج",
      "متخصصان HR",
      "محققان روانشناسی"
    ]
  },
  "tps": {
    title: "تست اهمال‌کاری تاکمن",
    description: "سنجش میزان تمایل به تعویق انداختن کارها",
    longDescription: "مقیاس اهمال‌کاری تاکمن ابزاری کوتاه و دقیق برای سنجش میزان تعلل و اهمال‌کاری افراد است.",
    category: "رفتاری",
    duration: "۵ دقیقه",
    questions: 16,
    benefits: [
      "شناخت الگوهای تعلل",
      "بهبود مدیریت زمان",
      "افزایش بهره‌وری",
      "کاهش استرس تکالیف"
    ],
    features: [
      "سنجش سریع و دقیق",
      "نمره استاندارد",
      "راهکارهای عملی",
      "برنامه خودکنترلی"
    ],
    whoFor: [
      "دانشجویان",
      "کارمندان اداری",
      "مدیران پروژه",
      "افراد با مشکل تعلل"
    ]
  },
  "hpi": {
    title: "تست کمال‌گرایی هیل",
    description: "ارزیابی انواع مختلف کمال‌گرایی و تأثیر آن بر زندگی",
    longDescription: "مقیاس کمال‌گرایی هیل انواع مختلف کمال‌گرایی سازنده و مخرب را در افراد شناسایی می‌کند.",
    category: "شخصیت",
    duration: "۱۰ دقیقه",
    questions: 59,
    benefits: [
      "تشخیص نوع کمال‌گرایی",
      "کاهش اضطراب عملکرد",
      "بهبود رضایت از زندگی",
      "تعادل در انتظارات"
    ],
    features: [
      "سه نوع کمال‌گرایی",
      "تحلیل مزایا و معایب",
      "راهبردهای تعدیل",
      "برنامه خودمراقبتی"
    ],
    whoFor: [
      "دانشجویان پزشکی و مهندسی",
      "ورزشکاران حرفه‌ای",
      "هنرمندان و نویسندگان",
      "افراد با اضطراب عملکرد"
    ]
  },
  "hems": {
    title: "تست انگیزش تحصیلی هارتر",
    description: "سنجش انگیزه و علاقه به یادگیری و تحصیل",
    longDescription: "مقیاس انگیزش تحصیلی هارتر انگیزه درونی و بیرونی دانش‌آموزان را در فرآیند یادگیری بررسی می‌کند.",
    category: "تحصیلی",
    duration: "۸ دقیقه",
    questions: 30,
    benefits: [
      "شناخت منابع انگیزشی",
      "بهبود عملکرد تحصیلی",
      "افزایش علاقه به یادگیری",
      "کاهش فرسودگی تحصیلی"
    ],
    features: [
      "انگیزه درونی و بیرونی",
      "پنج حوزه انگیزشی",
      "راهکارهای تقویت",
      "برنامه مطالعه"
    ],
    whoFor: [
      "دانش‌آموزان دبیرستان",
      "دانشجویان دانشگاه",
      "معلمان و اساتید",
      "والدین نگران"
    ]
  },
  "mmtic": {
    title: "تست MBTI کودکان",
    description: "نسخه ویژه کودکان برای شناخت شخصیت",
    longDescription: "MMTIC نسخه تعدیل‌شده MBTI برای کودکان و نوجوانان است که با زبان و مثال‌های مناسب سن طراحی شده.",
    category: "کودکان",
    duration: "۱۵ دقیقه",
    questions: 40,
    benefits: [
      "شناخت استعدادهای کودک",
      "راهنمایی روش‌های یادگیری",
      "بهبود ارتباط والد-فرزند",
      "توسعه اعتماد به نفس"
    ],
    features: [
      "مناسب سنین ۷-۱۷ سال",
      "زبان ساده و قابل فهم",
      "مثال‌های کودکانه",
      "راهنمای والدین"
    ],
    whoFor: [
      "کودکان ۷ تا ۱۷ سال",
      "والدین و خانواده‌ها",
      "مشاوران مدرسه",
      "روانشناسان کودک"
    ]
  },
  "mhs": {
    title: "تست امید میلر",
    description: "سنجش میزان امیدواری و نگرش مثبت به آینده",
    longDescription: "مقیاس امید میلر میزان امیدواری و انتظارات مثبت افراد نسبت به آینده را اندازه‌گیری می‌کند.",
    category: "روانی",
    duration: "۵ دقیقه",
    questions: 48,
    benefits: [
      "افزایش امیدواری",
      "تقویت انگیزه زندگی",
      "بهبود سلامت روان",
      "مقاومت در برابر مشکلات"
    ],
    features: [
      "چهار بعد امید",
      "نمره کلی امیدواری",
      "راهبردهای تقویت",
      "برنامه مثبت‌اندیشی"
    ],
    whoFor: [
      "افراد در بحران",
      "بیماران مزمن",
      "مشاوران و درمانگران",
      "هر کس با ناامیدی"
    ]
  },
  "iat": {
    title: "تست اعتیاد اینترنتی یانگ",
    description: "ارزیابی میزان وابستگی به اینترنت و فضای مجازی",
    longDescription: "آزمون اعتیاد اینترنتی یانگ معتبرترین ابزار سنجش میزان وابستگی و اعتیاد به اینترنت است.",
    category: "رفتاری",
    duration: "۵ دقیقه",
    questions: 20,
    benefits: [
      "تشخیص زودهنگام اعتیاد",
      "کنترل زمان اینترنت",
      "بهبود کیفیت زندگی",
      "افزایش تعاملات واقعی"
    ],
    features: [
      "پنج سطح استفاده",
      "هشدارهای زودهنگام",
      "راهکارهای کنترل",
      "برنامه کاهش تدریجی"
    ],
    whoFor: [
      "نوجوانان و جوانان",
      "والدین نگران",
      "دانشجویان",
      "کاربران پرمصرف اینترنت"
    ]
  },
  "moci": {
    title: "تست وسواس فکری-عملی",
    description: "سنجش نشانه‌های اختلال وسواس فکری و عملی",
    longDescription: "فهرست وسواس مادزلی (MOCI) ابزاری استاندارد برای سنجش نشانه‌های اختلال وسواس فکری-عملی است.",
    category: "روانی",
    duration: "۱۰ دقیقه",
    questions: 30,
    benefits: [
      "تشخیص زودهنگام OCD",
      "سنجش شدت نشانه‌ها",
      "راهنمایی درمانی",
      "پیگیری پیشرفت"
    ],
    features: [
      "چهار نوع وسواس",
      "نمره شدت کلی",
      "تحلیل تخصصی",
      "راهنمای ارجاع"
    ],
    whoFor: [
      "افراد مشکوک به OCD",
      "روانپزشکان",
      "روانشناسان بالینی",
      "خانواده‌های درگیر"
    ]
  },
  "ohi": {
    title: "تست شادی آکسفورد",
    description: "ارزیابی میزان شادی و رضایت از زندگی",
    longDescription: "مقیاس شادی آکسفورد یکی از معتبرترین ابزارهای سنجش شادی و بهزیستی روانشناختی است.",
    category: "روانی",
    duration: "۱۰ دقیقه",
    questions: 29,
    benefits: [
      "سنجش سطح شادی",
      "شناخت منابع رضایت",
      "بهبود کیفیت زندگی",
      "افزایش بهزیستی"
    ],
    features: [
      "نمره شادی کلی",
      "مقایسه با جمعیت",
      "راهکارهای افزایش شادی",
      "برنامه زندگی شاد"
    ],
    whoFor: [
      "افراد افسرده",
      "کسانی با کم‌حوصلگی",
      "مشاوران مثبت‌گرا",
      "هر کس خواهان شادی"
    ]
  },
  "slfs": {
    title: "تست تنهایی اجتماعی",
    description: "سنجش احساس تنهایی و انزوای اجتماعی",
    longDescription: "مقیاس تنهایی اجتماعی میزان احساس انزوا و تنهایی افراد در روابط اجتماعی را بررسی می‌کند.",
    category: "اجتماعی",
    duration: "۸ دقیقه",
    questions: 20,
    benefits: [
      "شناخت علل تنهایی",
      "بهبود مهارت‌های اجتماعی",
      "گسترش شبکه دوستان",
      "افزایش احساس تعلق"
    ],
    features: [
      "سه نوع تنهایی",
      "تحلیل علل",
      "راهکارهای عملی",
      "برنامه اجتماعی‌شدن"
    ],
    whoFor: [
      "افراد منزوی",
      "دانشجویان تازه‌وارد",
      "مهاجران",
      "سالمندان تنها"
    ]
  },
  "ept": {
    title: "تست شخصیت کارآفرینی",
    description: "ارزیابی ویژگی‌های کارآفرینی و پتانسیل کسب‌وکار",
    longDescription: "این تست ویژگی‌های شخصیتی لازم برای موفقیت در کارآفرینی و راه‌اندازی کسب‌وکار را بررسی می‌کند.",
    category: "کسب‌وکار",
    duration: "۱۵ دقیقه",
    questions: 50,
    benefits: [
      "شناخت پتانسیل کارآفرینی",
      "ارزیابی ریسک‌پذیری",
      "توسعه مهارت‌های کسب‌وکار",
      "راهنمایی استارتاپ"
    ],
    features: [
      "هفت ویژگی کارآفرینی",
      "نمره پتانسیل کلی",
      "نقاط قوت و ضعف",
      "برنامه توسعه"
    ],
    whoFor: [
      "علاقه‌مندان به کسب‌وکار",
      "دانشجویان مدیریت",
      "استارتاپی‌ها",
      "سرمایه‌گذاران"
    ]
  },
  "boundless": {
    title: "تست مسیر هوشمند",
    description: "راهنمای انتخاب مسیر تحصیلی و شغلی مناسب",
    longDescription: "تست مسیر هوشمند با ترکیب علایق، استعدادها و شخصیت، بهترین مسیر تحصیلی و شغلی را پیشنهاد می‌دهد.",
    category: "شغلی",
    duration: "۲۰ دقیقه",
    questions: 60,
    benefits: [
      "انتخاب رشته مناسب",
      "برنامه‌ریزی مسیر شغلی",
      "شناخت استعدادهای پنهان",
      "راهنمایی جامع آینده"
    ],
    features: [
      "تحلیل چندبعدی",
      "پیشنهاد رشته‌ها",
      "مسیرهای شغلی",
      "برنامه عملی"
    ],
    whoFor: [
      "دانش‌آموزان کنکوری",
      "دانشجویان مردد",
      "افراد در تغییر مسیر",
      "مشاوران تحصیلی"
    ]
  }
};

const TestLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const testInfo = slug ? testData[slug] : null;

  if (!testInfo) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">تست پیدا نشد</h1>
          <Button onClick={() => navigate('/assessment-center')}>
            بازگشت به مرکز ارزیابی
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleStartTest = () => {
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="container max-w-4xl mx-auto">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                  <Brain size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {testInfo.title}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                {testInfo.description}
              </p>

              {/* Test Stats */}
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock size={20} />
                  <span>{testInfo.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <HelpCircle size={20} />
                  <span>{testInfo.questions} سؤال</span>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-700">
                  {testInfo.category}
                </Badge>
              </div>
              
              <Button 
                onClick={handleStartTest}
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="mr-2" size={20} />
                شروع تست
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Detailed Information */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* About This Test */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="h-full border-0 shadow-lg dark:bg-gray-800/50 dark:border-gray-700">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center dark:text-white">
                      <Target className="mr-3 text-blue-600 dark:text-blue-400" size={24} />
                      درباره این تست
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      {testInfo.longDescription}
                    </p>
                    
                    <h3 className="font-semibold mb-3 dark:text-white">مزایای شرکت در این تست:</h3>
                    <div className="space-y-2">
                      {testInfo.benefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-sm dark:text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Features & Who It's For */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                {/* Features */}
                <Card className="border-0 shadow-lg dark:bg-gray-800/50 dark:border-gray-700">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center dark:text-white">
                      <Award className="mr-3 text-green-600 dark:text-green-400" size={24} />
                      ویژگی‌های تست
                    </h2>
                    <div className="space-y-3">
                      {testInfo.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <ArrowRight className="text-blue-500 dark:text-blue-400 mr-2" size={16} />
                          <span className="dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Who It's For */}
                <Card className="border-0 shadow-lg dark:bg-gray-800/50 dark:border-gray-700">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center dark:text-white">
                      <Users className="mr-3 text-purple-600 dark:text-purple-400" size={24} />
                      این تست برای چه کسانی است؟
                    </h2>
                    <div className="space-y-3">
                      {testInfo.whoFor.map((person: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="text-purple-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-sm dark:text-gray-300">{person}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <motion.section 
          className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              آماده کشف خودتان هستید؟
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              همین الان شروع کنید و نتایج شگفت‌انگیز را ببینید
            </p>
            <Button 
              onClick={handleStartTest}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-semibold"
            >
              <Play className="mr-2" size={20} />
              شروع تست {testInfo.title}
            </Button>
          </div>
        </motion.section>
      </div>

      {/* Test Modal */}
      <IframeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={testInfo.title}
        url={`https://auth.rafiei.co/test/${slug}`}
        showCloseButton={true}
      />
    </MainLayout>
  );
};

export default TestLanding;
