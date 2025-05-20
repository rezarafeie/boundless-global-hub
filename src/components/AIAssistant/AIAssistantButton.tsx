
import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface AIAssistantButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

const AIAssistantButton = ({ 
  variant = "default", 
  size = "default", 
  className = "" 
}: AIAssistantButtonProps) => {
  const { translations } = useLanguage();
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      className={`group relative overflow-hidden rounded-full ${className}`}
      onClick={() => window.open("https://ai.rafiei.co/", "_blank")}
    >
      <span className="flex items-center gap-2">
        <MessageCircle size={size === "sm" ? 16 : 20} className="animate-pulse" />
        <span>{translations.aiAssistant}</span>
      </span>
      <span className="absolute inset-0 bg-gradient-to-r from-black/0 via-white/10 to-black/0 -translate-x-full group-hover:animate-[shimmer_1s_forwards] pointer-events-none"></span>
    </Button>
  );
};

export default AIAssistantButton;
