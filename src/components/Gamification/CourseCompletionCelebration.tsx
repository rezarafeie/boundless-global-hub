import React from 'react';
import { Gift, PartyPopper, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GamStatus } from '@/hooks/useCourseGamification';
import { gamText } from '@/lib/gamificationMessages';
import { openInNewTab } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: GamStatus | null;
  onOpenGifts?: () => void;
}

const PARTICLES = [
  'left-[8%] top-[12%]', 'left-[19%] top-[61%]', 'left-[31%] top-[28%]', 'left-[43%] top-[72%]',
  'left-[55%] top-[9%]', 'left-[67%] top-[48%]', 'left-[79%] top-[20%]', 'left-[90%] top-[65%]',
  'left-[12%] top-[78%]', 'left-[25%] top-[7%]', 'left-[38%] top-[52%]', 'left-[51%] top-[34%]',
  'left-[63%] top-[81%]', 'left-[74%] top-[6%]', 'left-[85%] top-[43%]', 'left-[94%] top-[27%]',
];

const CourseCompletionCelebration: React.FC<Props> = ({ open, onOpenChange, status, onOpenGifts }) => {
  if (!status?.completed) return null;
  const giftsLink = status.course?.gifts_link;
  const messages = status.settings?.messages ?? {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="overflow-hidden text-center sm:max-w-md">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {PARTICLES.map((position, index) => (
            <span
              key={position}
              className={`absolute animate-fade-in text-primary ${position}`}
            >
              {index % 2 ? '✦' : '●'}
            </span>
          ))}
        </div>
        <DialogHeader className="relative items-center text-center sm:text-center">
          <div className="mb-3 flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl leading-relaxed">{status.completionMessage?.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-line text-sm leading-7">
            {status.completionMessage?.text}
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex items-center justify-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> صددرصد دوره تکمیل شد
        </div>
        {!!status.earnedRewards?.length && (
          <div className="relative space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-right">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Gift className="h-4 w-4 text-primary" /> هدایای فعال‌شده شما
            </p>
            {status.earnedRewards.map((reward) => (
              <div key={reward.id} className="text-sm text-muted-foreground">
                • {reward.title}
              </div>
            ))}
          </div>
        )}
        {(giftsLink || onOpenGifts) && (
          <Button
            className="relative w-full gap-2"
            onClick={() => {
              if (giftsLink) openInNewTab(giftsLink);
              else onOpenGifts?.();
              onOpenChange(false);
            }}
          >
            <Gift className="h-4 w-4" />
            {gamText(messages, 'completion_gifts_button')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseCompletionCelebration;