
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface ActivationBlockProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  variant?: "default" | "primary" | "secondary" | "success";
  isActivated?: boolean;
  onActivate?: (activated: boolean) => void;
}

const ActivationBlock: React.FC<ActivationBlockProps> = ({
  icon,
  title,
  description,
  buttonText,
  onClick,
  href,
  external = false,
  variant = "default",
  isActivated = false,
  onActivate
}) => {
  const [activated, setActivated] = useState(isActivated);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (activated) return;

    setIsLoading(true);
    
    // Simulate activation process
    setTimeout(() => {
      setActivated(true);
      setIsLoading(false);
      onActivate?.(true);
    }, 1000);

    if (onClick) {
      onClick();
    } else if (href) {
      if (external) {
        window.open(href, '_blank');
      } else {
        window.location.href = href;
      }
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-r from-blue-500 to-purple-600 border-blue-200";
      case "secondary":
        return "bg-gradient-to-r from-green-500 to-teal-600 border-green-200";
      case "success":
        return "bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-200";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 border-gray-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: activated ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className={`border-2 overflow-hidden transition-all duration-300 ${
        activated ? 'opacity-60 scale-95' : 'hover:scale-105 hover:shadow-lg'
      }`}>
        <CardContent className="p-0">
          <div className={`${getVariantStyles()} text-white p-6 relative`}>
            {activated && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center"
              >
                <Check size={20} className="text-green-600" />
              </motion.div>
            )}
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-white/90 mb-4">{description}</p>
                
                <Button
                  onClick={handleClick}
                  disabled={activated || isLoading}
                  className={`w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 ${
                    activated ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  ) : activated ? (
                    <span className="flex items-center gap-2">
                      <Check size={20} />
                      فعال شد
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {buttonText}
                      {external && <ExternalLink size={16} />}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActivationBlock;
