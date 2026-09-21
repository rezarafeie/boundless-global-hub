import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  compact?: boolean;
  onExit?: () => void;
  className?: string;
}

const DiagnosticShell: React.FC<Props> = ({ children, compact, onExit, className }) => (
  <main dir="rtl" className={cn('stv2 min-h-[100dvh] bg-background text-foreground', className)}>
    <header className="h-16 sm:h-20 border-b border-border/70 bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center font-black text-lg">R</div>
          <div>
            <div className="font-black text-sm leading-none">آکادمی رفیعی</div>
            {!compact && <div className="text-[10px] text-muted-foreground mt-1">تشخیص مسیر بدون مرز</div>}
          </div>
        </div>
        {onExit ? (
          <Button variant="ghost" size="sm" onClick={onExit} className="gap-2">
            خروج <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" /> پاسخ‌ها محرمانه‌اند
          </div>
        )}
      </div>
    </header>
    {children}
  </main>
);

export default DiagnosticShell;