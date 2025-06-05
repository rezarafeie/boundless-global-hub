
import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Award, TrendingUp, CheckCircle, Brain, Heart, DollarSign, Lightbulb, Target, BarChart3, Zap, Shield, BookOpen, Star, Puzzle, Trophy } from "lucide-react";
import EnhancedIframe from "@/components/EnhancedIframe";
import MobileStickyButton from "@/components/MobileStickyButton";

const TestLanding = () => {
  const { slug } = useParams();
  const [showIframe, setShowIframe] = useState(false);

  // Test iframe URL mapping
  const testIframeMap: Record<string, string> = {
    "ept": "https://auth.rafiei.co/sanjesh/ept",
    "mbti": "https://auth.rafiei.co/sanjesh/mbti",
    "disc": "https://auth.rafiei.co/sanjesh/disc",
    "16pf": "https://auth.rafiei.co/sanjesh/16pf",
    "csei-ad": "https://auth.rafiei.co/sanjesh/csei-ad",
    "mhs": "https://auth.rafiei.co/sanjesh/mhs",
    "slfs": "https://auth.rafiei.co/sanjesh/slfs",
    "tps": "https://auth.rafiei.co/sanjesh/tps",
    "hems": "https://auth.rafiei.co/sanjesh/hems",
    "iat": "https://auth.rafiei.co/sanjesh/iat",
    "iq": "https://auth.rafiei.co/sanjesh/iq",
    "iqr": "https://auth.rafiei.co/sanjesh/iqr",
    "growth": "https://auth.rafiei.co/sanjesh/growth",
    "riasec": "https://auth.rafiei.co/sanjesh/riasec",
    "lst": "https://auth.rafiei.co/sanjesh/lst",
    "mot": "https://auth.rafiei.co/sanjesh/mot",
    "ps": "https://auth.rafiei.co/sanjesh/ps",
    "hii": "https://auth.rafiei.co/sanjesh/hii",
    "boundless": "https://auth.rafiei.co/sanjesh/boundless",
    "strength": "https://auth.rafiei.co/sanjesh/strength",
    "dec": "https://auth.rafiei.co/sanjesh/dec",
    "personality": "https://auth.rafiei.co/sanjesh/ept",
    "financial": "https://auth.rafiei.co/sanjesh/financial",
    "emotional": "https://auth.rafiei.co/sanjesh/eq",
    "future": "https://auth.rafiei.co/sanjesh/future",
    "leadership": "https://auth.rafiei.co/sanjesh/leadership",
    "mii": "https://auth.rafiei.co/sanjesh/mii",
    "ocq": "https://auth.rafiei.co/sanjesh/ocq",
    "msq": "https://auth.rafiei.co/sanjesh/msq",
    "raven": "https://auth.rafiei.co/sanjesh/raven",
    "cattell-iq": "https://auth.rafiei.co/sanjesh/cattell-iq",
    "eq": "https://auth.rafiei.co/sanjesh/eq",
    "csei": "https://auth.rafiei.co/sanjesh/csei",
    "hpi": "https://auth.rafiei.co/sanjesh/hpi",
    "mmtic": "https://auth.rafiei.co/sanjesh/mmtic",
    "moci": "https://auth.rafiei.co/sanjesh/moci",
    "ohi": "https://auth.rafiei.co/sanjesh/ohi",
    "cattell-a": "https://auth.rafiei.co/sanjesh/cattell-a"
  };

  // Complete test data configuration synced with AssessmentCenter
  const tests = {
    // Original tests
    personality: {
      title: "تست شخصیت کارآفرین",
      englishTitle: "Entrepreneur Personality Test",
      description: "شخصیت کارآفرینی خود را بشناسید و نقاط قوت و ضعف خود را کشف کنید",
      icon: <Target className="text-blue-500" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۲۵ سوال",
      participants: "۵,۲۳۰",
      features: [
        "تحلیل کامل شخصیت کارآفرینی",
        "شناسایی نقاط قوت و ضعف",
        "پیشنهادات بهبود عملکرد",
        "گزارش تفصیلی نتایج"
      ],
      color: "blue"
    },
    
    // Tests from AssessmentCenter
    mbti: {
      title: "تست شخصیت MBTI",
      englishTitle: "Myers-Briggs Type Indicator",
      description: "شناخت نوع شخصیت و الگوهای رفتاری شما بر اساس تئوری مایرز-بریگز",
      icon: <Brain className="text-purple-500" size={24} />,
      duration: "۲۰ دقیقه",
      questions: "۶۰ سوال",
      participants: "۸,۱۲۰",
      features: [
        "تعیین دقیق نوع شخصیت MBTI",
        "توضیح کامل ویژگی‌های شخصیتی",
        "پیشنهادات شغلی مناسب",
        "راهنمای بهبود روابط"
      ],
      color: "purple"
    },

    disc: {
      title: "تست DISC",
      englishTitle: "DISC Behavioral Assessment",
      description: "ارزیابی سبک رفتاری و نحوه تعامل شما با دیگران",
      icon: <Users className="text-green-500" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۴۰ سوال",
      participants: "۶,۸۵۰",
      features: [
        "شناسایی سبک رفتاری غالب",
        "تحلیل نحوه تعامل با دیگران",
        "بهبود مهارت‌های ارتباطی",
        "راهنمای کار تیمی"
      ],
      color: "green"
    },

    mii: {
      title: "تست هوش چندگانه MII",
      englishTitle: "Multiple Intelligence Inventory",
      description: "شناسایی انواع مختلف هوش و توانایی‌های ذهنی شما",
      icon: <Puzzle className="text-indigo-500" size={24} />,
      duration: "۲۵ دقیقه",
      questions: "۸۰ سوال",
      participants: "۴,۲۳۰",
      features: [
        "شناسایی انواع هوش چندگانه",
        "تحلیل نقاط قوت ذهنی",
        "پیشنهادات تقویت هوش",
        "راهنمای انتخاب رشته"
      ],
      color: "indigo"
    },

    ocq: {
      title: "تست تعهد سازمانی OCQ",
      englishTitle: "Organizational Commitment Questionnaire",
      description: "سنجش میزان تعهد و وفاداری شما نسبت به سازمان",
      icon: <Shield className="text-blue-600" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۲۴ سوال",
      participants: "۳,۹۲۰",
      features: [
        "ارزیابی تعهد سازمانی",
        "تحلیل وفاداری شغلی",
        "شناسایی انگیزه‌های کاری",
        "بهبود عملکرد سازمانی"
      ],
      color: "blue"
    },

    msq: {
      title: "تست رضایت شغلی MSQ",
      englishTitle: "Minnesota Satisfaction Questionnaire",
      description: "ارزیابی میزان رضایت شما از جنبه‌های مختلف کار",
      icon: <Star className="text-yellow-500" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۱۰۰ سوال",
      participants: "۵,۱۴۰",
      features: [
        "سنجش رضایت شغلی",
        "تحلیل عوامل انگیزشی",
        "شناسایی نیازهای کاری",
        "بهبود محیط کار"
      ],
      color: "yellow"
    },

    raven: {
      title: "تست هوش ریون",
      englishTitle: "Raven's Progressive Matrices",
      description: "سنجش هوش غیرکلامی و توانایی حل مسئله",
      icon: <BarChart3 className="text-red-500" size={24} />,
      duration: "۳۰ دقیقه",
      questions: "۶۰ سوال",
      participants: "۷,۳۸۰",
      features: [
        "اندازه‌گیری هوش غیرکلامی",
        "تحلیل توانایی حل مسئله",
        "ارزیابی تفکر منطقی",
        "مقایسه با نرم‌های استاندارد"
      ],
      color: "red"
    },

    "cattell-iq": {
      title: "تست هوش کتل فرم B",
      englishTitle: "Cattell Culture Fair Intelligence Test",
      description: "ارزیابی جامع هوش عمومی و توانایی‌های شناختی",
      icon: <Brain className="text-purple-600" size={24} />,
      duration: "۴۵ دقیقه",
      questions: "۵۰ سوال",
      participants: "۶,۲۷۰",
      features: [
        "ارزیابی هوش عمومی",
        "تحلیل توانایی‌های شناختی",
        "آزمون مستقل از فرهنگ",
        "نتایج معتبر بین‌المللی"
      ],
      color: "purple"
    },

    eq: {
      title: "تست هوش عاطفی EQ-Shatt",
      englishTitle: "Emotional Intelligence Quotient",
      description: "سنجش توانایی درک و مدیریت احساسات خود و دیگران",
      icon: <Heart className="text-red-500" size={24} />,
      duration: "۲۰ دقیقه",
      questions: "۷۰ سوال",
      participants: "۸,۹۳۰",
      features: [
        "ارزیابی هوش عاطفی",
        "تحلیل مهارت‌های اجتماعی",
        "بهبود روابط بین‌فردی",
        "مدیریت استرس و احساسات"
      ],
      color: "red"
    },

    csei: {
      title: "تست عزت نفس کوپراسمیت",
      englishTitle: "Coopersmith Self-Esteem Inventory",
      description: "ارزیابی میزان اعتماد به نفس و ارزش‌گذاری خود",
      icon: <Trophy className="text-orange-500" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۵۸ سوال",
      participants: "۴,۶۸۰",
      features: [
        "سنجش عزت نفس",
        "تحلیل اعتماد به نفس",
        "شناسایی نقاط قوت شخصی",
        "راهنمای تقویت اعتماد"
      ],
      color: "orange"
    },

    hii: {
      title: "تست علایق شغلی هالند",
      englishTitle: "Holland Interest Inventory",
      description: "شناسایی علایق شغلی و مسیر شغلی مناسب",
      icon: <Target className="text-blue-500" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۸۴ سوال",
      participants: "۹,۲۳۰",
      features: [
        "شناسایی علایق شغلی",
        "تحلیل انطباق شغلی",
        "پیشنهاد مسیر شغلی",
        "راهنمای انتخاب رشته"
      ],
      color: "blue"
    },

    "16pf": {
      title: "تست شخصیت 16PF کتل",
      englishTitle: "Cattell's 16 Personality Factors",
      description: "بررسی جامع ۱۶ عامل اصلی شخصیت",
      icon: <Zap className="text-yellow-600" size={24} />,
      duration: "۳۰ دقیقه",
      questions: "۱۸۵ سوال",
      participants: "۳,۸۴۰",
      features: [
        "تحلیل ۱۶ عامل شخصیت",
        "ارزیابی جامع شخصیت",
        "پیش‌بینی رفتار",
        "گزارش تفصیلی نتایج"
      ],
      color: "yellow"
    },

    tps: {
      title: "تست اهمال‌کاری تاکمن",
      englishTitle: "Tuckman Procrastination Scale",
      description: "سنجش میزان تمایل به تعویق انداختن کارها",
      icon: <Clock className="text-gray-500" size={24} />,
      duration: "۵ دقیقه",
      questions: "۱۶ سوال",
      participants: "۵,۹۷۰",
      features: [
        "ارزیابی میزان اهمال‌کاری",
        "شناسایی علل تعویق",
        "راهکارهای بهبود",
        "تکنیک‌های مدیریت زمان"
      ],
      color: "gray"
    },

    hpi: {
      title: "تست کمال‌گرایی هیل",
      englishTitle: "Hill Perfectionism Inventory",
      description: "ارزیابی انواع مختلف کمال‌گرایی و تأثیر آن بر زندگی",
      icon: <Award className="text-pink-500" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۵۹ سوال",
      participants: "۲,۸۶۰",
      features: [
        "تحلیل انواع کمال‌گرایی",
        "ارزیابی تأثیرات مثبت و منفی",
        "راهنمای تعادل",
        "بهبود عملکرد"
      ],
      color: "pink"
    },

    hems: {
      title: "تست انگیزش تحصیلی هارتر",
      englishTitle: "Harter Educational Motivation Scale",
      description: "سنجش انگیزه و علاقه به یادگیری و تحصیل",
      icon: <BookOpen className="text-emerald-500" size={24} />,
      duration: "۸ دقیقه",
      questions: "۳۰ سوال",
      participants: "۴,۵۲۰",
      features: [
        "ارزیابی انگیزه تحصیلی",
        "تحلیل علاقه به یادگیری",
        "شناسایی موانع تحصیل",
        "راهکارهای افزایش انگیزه"
      ],
      color: "emerald"
    },

    mmtic: {
      title: "تست MBTI کودکان",
      englishTitle: "Murphy-Meisgeier Type Indicator for Children",
      description: "نسخه ویژه کودکان برای شناخت شخصیت",
      icon: <Heart className="text-pink-400" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۴۰ سوال",
      participants: "۱,۹۳۰",
      features: [
        "تست مخصوص کودکان",
        "شناخت شخصیت کودک",
        "راهنمای والدین",
        "بهبود ارتباط با کودک"
      ],
      color: "pink"
    },

    mhs: {
      title: "تست امید میلر",
      englishTitle: "Miller Hope Scale",
      description: "سنجش میزان امیدواری و نگرش مثبت به آینده",
      icon: <Lightbulb className="text-yellow-500" size={24} />,
      duration: "۵ دقیقه",
      questions: "۴۸ سوال",
      participants: "۳,۷۴۰",
      features: [
        "ارزیابی میزان امیدواری",
        "تحلیل نگرش به آینده",
        "راهکارهای تقویت امید",
        "بهبود انگیزش"
      ],
      color: "yellow"
    },

    iat: {
      title: "تست اعتیاد اینترنتی یانگ",
      englishTitle: "Young Internet Addiction Test",
      description: "ارزیابی میزان وابستگی به اینترنت و فضای مجازی",
      icon: <Zap className="text-red-600" size={24} />,
      duration: "۵ دقیقه",
      questions: "۲۰ سوال",
      participants: "۶,۸۲۰",
      features: [
        "سنجش اعتیاد اینترنتی",
        "ارزیابی استفاده از فضای مجازی",
        "راهکارهای کنترل",
        "بهبود تعادل زندگی"
      ],
      color: "red"
    },

    moci: {
      title: "تست وسواس فکری-عملی",
      englishTitle: "Maudsley Obsessional Compulsive Inventory",
      description: "سنجش نشانه‌های اختلال وسواس فکری و عملی",
      icon: <Brain className="text-purple-700" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۳۰ سوال",
      participants: "۲,۴۶۰",
      features: [
        "شناسایی نشانه‌های وسواس",
        "تحلیل الگوهای فکری",
        "راهنمای مدیریت",
        "پیشنهادات درمانی"
      ],
      color: "purple"
    },

    ohi: {
      title: "تست شادی آکسفورد",
      englishTitle: "Oxford Happiness Inventory",
      description: "ارزیابی میزان شادی و رضایت از زندگی",
      icon: <Star className="text-yellow-400" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۲۹ سوال",
      participants: "۷,۵۸۰",
      features: [
        "سنجش میزان شادی",
        "ارزیابی رضایت از زندگی",
        "شناسایی منابع شادی",
        "راهکارهای افزایش شادی"
      ],
      color: "yellow"
    },

    slfs: {
      title: "تست تنهایی اجتماعی",
      englishTitle: "Social and Emotional Loneliness Scale",
      description: "سنجش احساس تنهایی و انزوای اجتماعی",
      icon: <Users className="text-gray-600" size={24} />,
      duration: "۸ دقیقه",
      questions: "۲۰ سوال",
      participants: "۳,۲۹۰",
      features: [
        "ارزیابی احساس تنهایی",
        "تحلیل روابط اجتماعی",
        "راهکارهای بهبود ارتباط",
        "تقویت شبکه اجتماعی"
      ],
      color: "gray"
    },

    ept: {
      title: "تست شخصیت کارآفرینی",
      englishTitle: "Entrepreneurial Personality Test",
      description: "ارزیابی ویژگی‌های کارآفرینی و پتانسیل کسب‌وکار",
      icon: <TrendingUp className="text-green-600" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۵۰ سوال",
      participants: "۸,۷۴۰",
      features: [
        "شناسایی ویژگی‌های کارآفرینی",
        "ارزیابی پتانسیل کسب‌وکار",
        "راهنمای توسعه مهارت",
        "بینش کسب‌وکار"
      ],
      color: "green"
    },

    boundless: {
      title: "تست مسیر هوشمند",
      englishTitle: "Boundless Career Path Test",
      description: "راهنمای انتخاب مسیر تحصیلی و شغلی مناسب",
      icon: <Target className="text-indigo-600" size={24} />,
      duration: "۲۰ دقیقه",
      questions: "۶۰ سوال",
      participants: "۵,۸۳۰",
      features: [
        "راهنمای انتخاب مسیر",
        "تحلیل استعدادها",
        "پیشنهاد رشته تحصیلی",
        "برنامه‌ریزی آینده شغلی"
      ],
      color: "indigo"
    },

    "cattell-a": {
      title: "تست هوش تصویری کتل فرم A",
      englishTitle: "Cattell Culture Fair Test Form A",
      description: "سنجش هوش بصری و توانایی درک الگوهای تصویری",
      icon: <Puzzle className="text-teal-500" size={24} />,
      duration: "۴۰ دقیقه",
      questions: "۵۰ سوال",
      participants: "۴,۱۲۰",
      features: [
        "ارزیابی هوش بصری",
        "تحلیل الگوهای تصویری",
        "آزمون غیرکلامی",
        "مستقل از زبان و فرهنگ"
      ],
      color: "teal"
    },

    // Additional original tests
    financial: {
      title: "تست هوش مالی",
      englishTitle: "Financial Intelligence Test",
      description: "سطح دانش و هوش مالی خود را ارزیابی کنید",
      icon: <DollarSign className="text-green-500" size={24} />,
      duration: "۱۲ دقیقه",
      questions: "۳۰ سوال",
      participants: "۳,۸۹۰",
      features: [
        "ارزیابی دانش مالی شخصی",
        "تحلیل نگرش مالی",
        "پیشنهادات بهبود وضعیت مالی",
        "راهنمای سرمایه‌گذاری"
      ],
      color: "green"
    },

    emotional: {
      title: "تست هوش هیجانی",
      englishTitle: "Emotional Intelligence Test",
      description: "سطح هوش هیجانی و توانایی مدیریت احساسات خود را بسنجید",
      icon: <Heart className="text-red-500" size={24} />,
      duration: "۱۰ دقیقه",
      questions: "۲۰ سوال",
      participants: "۶,۷۵۰",
      features: [
        "ارزیابی هوش هیجانی",
        "تحلیل مهارت‌های اجتماعی",
        "راهنمای بهبود روابط",
        "تکنیک‌های مدیریت استرس"
      ],
      color: "red"
    },

    future: {
      title: "تست آینده‌نگری",
      englishTitle: "Future Vision Test",
      description: "توانایی برنامه‌ریزی و چشم‌انداز آینده خود را ارزیابی کنید",
      icon: <Lightbulb className="text-yellow-500" size={24} />,
      duration: "۸ دقیقه",
      questions: "۱۵ سوال",
      participants: "۲,۱۴۰",
      features: [
        "ارزیابی توانایی برنامه‌ریزی",
        "تحلیل نگرش به آینده",
        "پیشنهادات توسعه مهارت",
        "راهنمای تعیین هدف"
      ],
      color: "yellow"
    },

    iq: {
      title: "تست IQ",
      englishTitle: "Intelligence Quotient Test",
      description: "ضریب هوشی خود را با تست استاندارد IQ اندازه‌گیری کنید",
      icon: <BarChart3 className="text-indigo-500" size={24} />,
      duration: "۲۰ دقیقه",
      questions: "۴۰ سوال",
      participants: "۹,۳۲۰",
      features: [
        "اندازه‌گیری دقیق ضریب هوشی",
        "تحلیل انواع هوش",
        "مقایسه با میانگین جامعه",
        "پیشنهادات تقویت ذهن"
      ],
      color: "indigo"
    },

    leadership: {
      title: "تست مهارت‌های رهبری",
      englishTitle: "Leadership Skills Test",
      description: "توانایی‌های رهبری و مدیریت خود را ارزیابی کنید",
      icon: <TrendingUp className="text-orange-500" size={24} />,
      duration: "۱۵ دقیقه",
      questions: "۳۵ سوال",
      participants: "۴,۶۸۰",
      features: [
        "ارزیابی مهارت‌های رهبری",
        "تحلیل سبک مدیریت",
        "پیشنهادات توسعه رهبری",
        "راهنمای تیم‌سازی"
      ],
      color: "orange"
    }
  };

  // Get current test or redirect if not found
  const currentTest = slug ? tests[slug as keyof typeof tests] : null;

  if (!currentTest) {
    return <Navigate to="/assessment-center" replace />;
  }

  const handleStartTest = () => {
    const testUrl = testIframeMap[slug!];
    if (testUrl) {
      setShowIframe(true);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      green: "from-green-500 to-green-600",
      red: "from-red-500 to-red-600",
      yellow: "from-yellow-500 to-yellow-600",
      indigo: "from-indigo-500 to-indigo-600",
      orange: "from-orange-500 to-orange-600",
      gray: "from-gray-500 to-gray-600",
      pink: "from-pink-500 to-pink-600",
      emerald: "from-emerald-500 to-emerald-600",
      teal: "from-teal-500 to-teal-600"
    };
    return colorMap[color as keyof typeof colorMap] || "from-blue-500 to-blue-600";
  };

  if (showIframe && testIframeMap[slug!]) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container max-w-full mx-auto px-4 py-8">
            <div className="mb-6">
              <Button
                onClick={() => setShowIframe(false)}
                variant="outline"
                className="mb-4"
              >
                ← بازگشت به معرفی تست
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentTest.title}
              </h1>
            </div>
            
            <div className="w-full h-[calc(100vh-200px)] rounded-lg overflow-hidden shadow-lg">
              <EnhancedIframe
                src={testIframeMap[slug!]}
                title={currentTest.title}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container max-w-4xl mx-auto px-4 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                {currentTest.icon}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {currentTest.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              {currentTest.englishTitle}
            </p>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {currentTest.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Test Info */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    اطلاعات تست
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentTest.duration}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">مدت زمان</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentTest.questions}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">تعداد سوال</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Users className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentTest.participants}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">شرکت‌کننده</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      آنچه در این تست دریافت می‌کنید:
                    </h3>
                    <div className="space-y-3">
                      {currentTest.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Start Test Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      شروع تست
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      آماده دریافت نتایج دقیق هستید؟
                    </p>
                  </div>
                  
                  <Badge variant="outline" className="w-full justify-center py-2 mb-4 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                    رایگان
                  </Badge>
                  
                  <Button 
                    onClick={handleStartTest}
                    size="lg" 
                    className={`w-full bg-gradient-to-r ${getColorClasses(currentTest.color)} hover:opacity-90 text-white rounded-lg py-3 text-base font-medium`}
                  >
                    شروع تست
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                    نتایج فوری و رایگان
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Button */}
        <MobileStickyButton onClick={handleStartTest}>
          شروع تست
        </MobileStickyButton>
      </div>
    </MainLayout>
  );
};

export default TestLanding;
