
import React from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const AIAssistantCTA = () => {
  const { translations } = useLanguage();
  
  return (
    <Card className="overflow-hidden border border-black/10 hover:border-black/20 transition-all shadow-lg hover:shadow-xl animate-scale-in">
      <CardHeader className="bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle size={24} className="text-white" />
          <CardTitle>{translations.aiAssistantTitle}</CardTitle>
        </div>
        <CardDescription className="text-gray-200">
          {translations.aiAssistantDescription}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <MessageCircle size={16} className="text-white" />
            </div>
            <p className="text-sm">{translations.aiAssistantFeature1}</p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <MessageCircle size={16} className="text-white" />
            </div>
            <p className="text-sm">{translations.aiAssistantFeature2}</p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <MessageCircle size={16} className="text-white" />
            </div>
            <p className="text-sm">{translations.aiAssistantFeature3}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          className="w-full bg-black hover:bg-gray-800 text-white transition-all"
          onClick={() => window.open("/ai-assistant", "_blank")}
        >
          {translations.aiAssistantAction}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIAssistantCTA;
