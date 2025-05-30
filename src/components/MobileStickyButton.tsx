
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sparkles } from 'lucide-react';

interface MobileStickyButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const MobileStickyButton: React.FC<MobileStickyButtonProps> = ({
  onClick,
  children,
  className = ""
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-40">
      <Button
        onClick={onClick}
        size="lg"
        className={`w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-xl transition-all duration-300 shadow-lg ${className}`}
      >
        <Sparkles size={16} className="ml-2" />
        {children}
      </Button>
    </div>
  );
};

export default MobileStickyButton;
