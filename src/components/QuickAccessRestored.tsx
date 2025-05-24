
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
  ExternalLink
} from 'lucide-react';

const QuickAccessRestored = () => {
  const quickAccessItems = [
    {
      title: 'مرکز آموزش',
      icon: <GraduationCap size={24} />,
      link: '/courses/free',
      internal: true,
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      hoverBg: 'hover:bg-emerald-100',
    },
    {
      title: 'مرکز سنجش',
      icon: <Brain size={24} />,
      link: '/assessment',
      internal: true,
      gradient: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      hoverBg: 'hover:bg-purple-100',
    },
    {
      title: 'مجله',
      icon: <BookOpen size={24} />,
      link: '/blog',
      internal: true,
      gradient: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      hoverBg: 'hover:bg-blue-100',
    },
    {
      title: 'پشتیبانی',
      icon: <HeadphonesIcon size={24} />,
      link: '/support',
      internal: true,
      gradient: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      hoverBg: 'hover:bg-orange-100',
    },
    {
      title: 'دستیار هوشمند',
      icon: <Bot size={24} />,
      link: 'https://ai.rafiei.co',
      internal: false,
      gradient: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      hoverBg: 'hover:bg-pink-100',
    },
    {
      title: 'برنامه بدون مرز',
      icon: <Globe size={24} />,
      link: '/course/boundless',
      internal: true,
      gradient: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      hoverBg: 'hover:bg-amber-100',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            دسترسی سریع
          </h2>
          <p className="text-gray-600">به راحتی به بخش‌های مختلف دسترسی پیدا کنید</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {quickAccessItems.map((item, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 bg-white/90 backdrop-blur-sm overflow-hidden relative transform hover:scale-105"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />
              <CardContent className="p-6 text-center relative z-10">
                {item.internal ? (
                  <Link to={item.link} className="block">
                    <div className={`w-14 h-14 ${item.bgColor} ${item.hoverBg} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-125 transition-all duration-500 shadow-lg group-hover:shadow-2xl`}>
                      <span className={`${item.textColor} group-hover:scale-110 transition-transform duration-500`}>
                        {item.icon}
                      </span>
                    </div>
                    <h3 className={`font-semibold text-sm ${item.textColor} group-hover:text-gray-900 transition-colors duration-500`}>
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
                    <div className={`w-14 h-14 ${item.bgColor} ${item.hoverBg} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-125 transition-all duration-500 shadow-lg group-hover:shadow-2xl`}>
                      <span className={`${item.textColor} group-hover:scale-110 transition-transform duration-500`}>
                        {item.icon}
                      </span>
                    </div>
                    <h3 className={`font-semibold text-sm ${item.textColor} group-hover:text-gray-900 transition-colors duration-500 flex items-center justify-center gap-1`}>
                      {item.title}
                      <ExternalLink size={10} />
                    </h3>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccessRestored;
