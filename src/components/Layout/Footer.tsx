import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, MapPin } from "lucide-react";
import enamadAsset from "@/assets/enamad.png.asset.json";

const linkCls = "text-muted-foreground hover:text-foreground transition-colors";

const Footer = () => {
  const { translations } = useLanguage();
  const footerLogoSrc = "/lovable-uploads/e743fe4f-8642-41ec-a4bf-7d749942d8b6.png";

  const socials = [
    { href: "https://instagram.com/rafieiacademy", label: "Instagram" },
    { href: "https://t.me/rafieiacademy", label: "Telegram" },
  ];

  return (
    <footer className="bg-muted/40 text-foreground border-t border-border">
      <div className="container py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img src={footerLogoSrc} alt={translations.websiteName} className="h-9 w-auto invert dark:invert-0" loading="lazy" />
              <span className="text-xl font-bold">{translations.websiteName}</span>
            </div>
            <p className="text-sm leading-7 text-muted-foreground max-w-xs">{translations.footerDesc}</p>
            <div className="flex gap-2">
              {socials.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-foreground hover:bg-foreground hover:text-background transition-colors">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">دسترسی سریع</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className={linkCls}>{translations.home}</Link></li>
              <li><Link to="/courses" className={linkCls}>{translations.trainingCenter}</Link></li>
              <li><Link to="/assessment-center" className={linkCls}>{translations.assessmentCenter}</Link></li>
              <li><a href="https://mag.rafiei.co" target="_blank" rel="noopener noreferrer" className={linkCls}>{translations.magazine}</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">پشتیبانی</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/support" className={linkCls}>{translations.support}</Link></li>
              <li><Link to="/contact" className={linkCls}>تماس با ما</Link></li>
              <li><Link to="/about" className={linkCls}>{translations.aboutUs}</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1 space-y-4">
            <h4 className="text-sm font-semibold">{translations.contact}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground/70" /><a href="mailto:hi@rafeie.com" className={linkCls}>hi@rafeie.com</a></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground/70" /><a href="tel:02128427131" className={linkCls} dir="ltr">021-28427131</a></li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground/70" /><span className="text-muted-foreground">تهران، ایران</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container py-6 flex flex-col-reverse md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">{translations.footerCopyright}</p>
          <a href="https://trustseal.enamad.ir/?id=657703&code=null" target="_blank" rel="noopener noreferrer" referrerPolicy="origin"
            className="inline-block rounded-xl border border-border bg-card p-1.5 hover:opacity-90 transition-opacity">
            <img src={enamadAsset.url} alt="eNamad" className="h-12 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
