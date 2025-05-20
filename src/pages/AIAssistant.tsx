
import React, { useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import { MessageCircle, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIAssistantViewProps {
  language?: "en" | "fa";
}

const AIAssistantView = ({ language: propLanguage }: AIAssistantViewProps) => {
  const { translations, setLanguage } = useLanguage();

  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage);
    }
  }, [propLanguage, setLanguage]);

  return (
    <MainLayout>
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <SectionTitle
            title={translations.aiAssistantTitle}
            subtitle={translations.aiAssistantDescription}
          />
          
          <div className="bg-gradient-to-r from-gray-900 to-black text-white p-8 rounded-2xl shadow-xl mb-12 relative overflow-hidden">
            {/* Abstract background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-white/20"></div>
              <div className="absolute right-20 bottom-10 h-60 w-60 rounded-full bg-white/10"></div>
              <div className="absolute left-40 bottom-0 h-20 w-20 rounded-full bg-white/15"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold">{translations.aiAssistantName}</h2>
              </div>
              
              <p className="text-lg mb-6 text-gray-200">
                {translations.aiAssistantLongDescription}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-xl">{translations.aiAssistantFeature1Title}</h3>
                  <p className="text-gray-200">{translations.aiAssistantFeature1}</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-xl">{translations.aiAssistantFeature2Title}</h3>
                  <p className="text-gray-200">{translations.aiAssistantFeature2}</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-xl">{translations.aiAssistantFeature3Title}</h3>
                  <p className="text-gray-200">{translations.aiAssistantFeature3}</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-xl">{translations.aiAssistantFeature4Title}</h3>
                  <p className="text-gray-200">{translations.aiAssistantFeature4}</p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Button 
                  className="bg-white text-black hover:bg-gray-200 transition-colors px-8 py-6 text-lg font-medium"
                >
                  {translations.startAssistant}
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-50 p-6 rounded-lg border border-black/10 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Star size={20} className="text-black" />
                <h3 className="font-semibold">{translations.aiFeature1}</h3>
              </div>
              <p className="text-sm text-gray-600 flex-grow">{translations.aiFeature1Desc}</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-black/10 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Star size={20} className="text-black" />
                <h3 className="font-semibold">{translations.aiFeature2}</h3>
              </div>
              <p className="text-sm text-gray-600 flex-grow">{translations.aiFeature2Desc}</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-black/10 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Star size={20} className="text-black" />
                <h3 className="font-semibold">{translations.aiFeature3}</h3>
              </div>
              <p className="text-sm text-gray-600 flex-grow">{translations.aiFeature3Desc}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIAssistantView;
