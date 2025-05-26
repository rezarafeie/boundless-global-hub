
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import IframeModal from "@/components/IframeModal";
import { MessageCircle, Book, GraduationCap, FileText } from "lucide-react";

interface FreeCourseLandingProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: "message" | "book" | "graduation" | "file";
  iframeUrl: string;
}

const FreeCourseLanding = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType,
  iframeUrl,
}: FreeCourseLandingProps) => {
  const { translations } = useLanguage();
  const [showIframeModal, setShowIframeModal] = useState(false);

  const IconComponent = {
    message: MessageCircle,
    book: Book,
    graduation: GraduationCap,
    file: FileText
  }[iconType];

  // Update domain from rafeie.com to auth.rafiei.co
  const updatedIframeUrl = iframeUrl.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <MainLayout>
      <Hero
        title={title}
        subtitle={description}
        ctaText={translations.startFreeCourse}
        ctaLink="#register"
        backgroundType="glow"
      />
      
      <section id="register" className="py-16 bg-gradient-to-b from-accent/5 to-background">
        <div className="container max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <IconComponent size={32} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="text-muted-foreground">{englishTitle}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-primary text-lg">✓</span>
                  <p>{benefitOne}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary text-lg">✓</span>
                  <p>{benefitTwo}</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowIframeModal(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                size="lg"
              >
                {translations.startFreeCourse}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title={title}
        url={updatedIframeUrl}
      />
    </MainLayout>
  );
};

export default FreeCourseLanding;
