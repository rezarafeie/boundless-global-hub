
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
      link: '/courses',
      internal: true,
    },
    {
      title: 'مرکز سنجش',
      icon: <Brain size={24} />,
      link: '/assessment-center',
      internal: true,
    },
    {
      title: 'مجله',
      icon: <BookOpen size={24} />,
      link: '/blog',
      internal: true,
    },
    {
      title: 'پشتیبانی',
      icon: <HeadphonesIcon size={24} />,
      link: '/support',
      internal: true,
    },
    {
      title: 'دستیار هوشمند',
      icon: <Bot size={24} />,
      link: 'https://ai.rafiei.co',
      internal: false,
    },
    {
      title: 'برنامه بدون مرز',
      icon: <Globe size={24} />,
      link: '/course/boundless',
      internal: true,
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">دسترسی سریع</h2>
          <p className="text-gray-600">به راحتی به بخش‌های مختلف دسترسی پیدا کنید</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
          {quickAccessItems.map((item, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm"
            >
              <CardContent className="p-6 text-center">
                {item.internal ? (
                  <Link to={item.link} className="block">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                      <span className="text-primary group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
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
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                      <span className="text-primary group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors flex items-center justify-center gap-1">
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
