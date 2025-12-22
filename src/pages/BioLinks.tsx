import { Instagram, BookOpen, Utensils, FileText, Phone, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const BioLinks = () => {
  const links = [
    {
      title: 'دوره بدون مرز',
      subtitle: 'کسب درآمد دلاری از ایران',
      icon: BookOpen,
      href: '/courses/boundless',
      gradient: 'from-primary to-primary/70',
    },
    {
      title: 'دوره مزه بدون مرز',
      subtitle: 'راه‌اندازی کسب‌وکار غذایی',
      icon: Utensils,
      href: '/courses/boundless-taste',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      title: 'مشاوره رایگان',
      subtitle: 'ثبت درخواست مشاوره',
      icon: FileText,
      href: '/request',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: '۰۲۱-۲۸۴۲۷۱۳۱',
      subtitle: 'تماس مستقیم با ما',
      icon: Phone,
      href: 'tel:02128427131',
      gradient: 'from-blue-500 to-cyan-500',
      external: true,
    },
    {
      title: 'کانال تلگرام',
      subtitle: 'عضویت در کانال آکادمی',
      icon: Send,
      href: 'https://t.me/rafieiacademy',
      gradient: 'from-sky-400 to-blue-500',
      external: true,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col items-center px-4 py-8" dir="rtl">
      {/* Profile Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
          <Instagram className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Rafiei Academy</h1>
        <p className="text-muted-foreground text-sm">آکادمی رفیعی</p>
      </motion.div>

      {/* Links Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-3"
      >
        {links.map((link, index) => {
          const Icon = link.icon;
          const LinkComponent = link.external ? 'a' : 'a';
          
          return (
            <motion.div key={index} variants={itemVariants}>
              <a
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="group block w-full"
              >
                <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{link.subtitle}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <svg 
                        className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors rotate-180" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto pt-8 text-center"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Rafiei Academy
        </p>
      </motion.footer>
    </div>
  );
};

export default BioLinks;
