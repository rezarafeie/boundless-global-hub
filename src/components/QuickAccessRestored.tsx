
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Brain, 
  BookOpen, 
  HeadphonesIcon, 
  Bot, 
  Globe,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const QuickAccessRestored = () => {
  const quickAccessItems = [
    {
      title: 'مرکز آموزش',
      icon: <GraduationCap size={24} />,
      link: '/courses',
      internal: true,
      gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      hoverBg: 'hover:bg-emerald-100',
      shadowColor: 'shadow-emerald-100',
      hoverShadow: 'hover:shadow-emerald-200',
      iconBg: 'bg-emerald-500',
    },
    {
      title: 'مرکز سنجش',
      icon: <Brain size={24} />,
      link: '/assessment',
      internal: true,
      gradient: 'from-purple-500 via-purple-600 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      hoverBg: 'hover:bg-purple-100',
      shadowColor: 'shadow-purple-100',
      hoverShadow: 'hover:shadow-purple-200',
      iconBg: 'bg-purple-500',
    },
    {
      title: 'مجله',
      icon: <BookOpen size={24} />,
      link: '/blog',
      internal: true,
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      hoverBg: 'hover:bg-blue-100',
      shadowColor: 'shadow-blue-100',
      hoverShadow: 'hover:shadow-blue-200',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'پشتیبانی',
      icon: <HeadphonesIcon size={24} />,
      link: '/support',
      internal: true,
      gradient: 'from-orange-500 via-orange-600 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      hoverBg: 'hover:bg-orange-100',
      shadowColor: 'shadow-orange-100',
      hoverShadow: 'hover:shadow-orange-200',
      iconBg: 'bg-orange-500',
    },
    {
      title: 'دستیار هوشمند',
      icon: <Bot size={24} />,
      link: 'https://ai.rafiei.co',
      internal: false,
      gradient: 'from-pink-500 via-pink-600 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      hoverBg: 'hover:bg-pink-100',
      shadowColor: 'shadow-pink-100',
      hoverShadow: 'hover:shadow-pink-200',
      iconBg: 'bg-pink-500',
    },
    {
      title: 'برنامه بدون مرز',
      icon: <Globe size={24} />,
      link: '/course/boundless',
      internal: true,
      gradient: 'from-amber-500 via-amber-600 to-yellow-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      hoverBg: 'hover:bg-amber-100',
      shadowColor: 'shadow-amber-100',
      hoverShadow: 'hover:shadow-amber-200',
      iconBg: 'bg-amber-500',
      featured: true,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="container">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              دسترسی سریع
            </h2>
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            به راحتی به بخش‌های مختلف دسترسی پیدا کنید
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
          {quickAccessItems.map((item, index) => (
            <Card 
              key={index} 
              className={`group relative overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-500 hover:scale-105 cursor-pointer ${item.shadowColor} ${item.hoverShadow} hover:shadow-2xl ${item.featured ? 'ring-2 ring-amber-400/30' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {item.featured && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
              
              <CardContent className="p-6 text-center relative z-10">
                {item.internal ? (
                  <Link to={item.link} className="block">
                    <div className={`w-16 h-16 ${item.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-xl relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="text-white group-hover:scale-110 transition-transform duration-500 relative z-10">
                        {item.icon}
                      </span>
                    </div>
                    <h3 className={`font-bold text-sm ${item.textColor} group-hover:text-gray-900 transition-colors duration-500 leading-tight`}>
                      {item.title}
                    </h3>
                  </Link>
                ) : (
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className={`w-16 h-16 ${item.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-xl relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="text-white group-hover:scale-110 transition-transform duration-500 relative z-10">
                        {item.icon}
                      </span>
                    </div>
                    <h3 className={`font-bold text-sm ${item.textColor} group-hover:text-gray-900 transition-colors duration-500 flex items-center justify-center gap-1 leading-tight`}>
                      {item.title}
                      <ExternalLink size={10} className="opacity-70" />
                    </h3>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            همه این امکانات در دسترس شماست
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickAccessRestored;
