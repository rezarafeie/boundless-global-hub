
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
      icon: <GraduationCap size={28} />,
      link: '/courses',
      internal: true,
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      hoverBg: 'hover:bg-emerald-100',
      shadowColor: 'hover:shadow-emerald-200',
    },
    {
      title: 'مرکز سنجش',
      icon: <Brain size={28} />,
      link: '/assessment',
      internal: true,
      gradient: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      hoverBg: 'hover:bg-purple-100',
      shadowColor: 'hover:shadow-purple-200',
    },
    {
      title: 'مجله',
      icon: <BookOpen size={28} />,
      link: '/blog',
      internal: true,
      gradient: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      hoverBg: 'hover:bg-blue-100',
      shadowColor: 'hover:shadow-blue-200',
    },
    {
      title: 'پشتیبانی',
      icon: <HeadphonesIcon size={28} />,
      link: '/support',
      internal: true,
      gradient: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      hoverBg: 'hover:bg-orange-100',
      shadowColor: 'hover:shadow-orange-200',
    },
    {
      title: 'دستیار هوشمند',
      icon: <Bot size={28} />,
      link: 'https://ai.rafiei.co',
      internal: false,
      gradient: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      hoverBg: 'hover:bg-pink-100',
      shadowColor: 'hover:shadow-pink-200',
    },
    {
      title: 'برنامه بدون مرز',
      icon: <Globe size={28} />,
      link: '/course/boundless',
      internal: true,
      gradient: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      hoverBg: 'hover:bg-amber-100',
      shadowColor: 'hover:shadow-amber-200',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            دسترسی سریع
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            به راحتی به بخش‌های مختلف دسترسی پیدا کنید
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
          {quickAccessItems.map((item, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              <CardContent className="p-8 text-center relative z-10">
                {item.internal ? (
                  <Link to={item.link} className="block">
                    <div className={`w-20 h-20 ${item.bgColor} ${item.hoverBg} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg ${item.shadowColor} group-hover:shadow-2xl`}>
                      <span className={`${item.textColor} group-hover:scale-110 transition-transform duration-500`}>
                        {item.icon}
                      </span>
                    </div>
                    <h3 className={`font-bold text-base ${item.textColor} group-hover:text-gray-900 transition-colors duration-500 leading-tight`}>
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
                    <div className={`w-20 h-20 ${item.bgColor} ${item.hoverBg} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg ${item.shadowColor} group-hover:shadow-2xl`}>
                      <span className={`${item.textColor} group-hover:scale-110 transition-transform duration-500`}>
                        {item.icon}
                      </span>
                    </div>
                    <h3 className={`font-bold text-base ${item.textColor} group-hover:text-gray-900 transition-colors duration-500 flex items-center justify-center gap-2 leading-tight`}>
                      {item.title}
                      <ExternalLink size={12} />
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
