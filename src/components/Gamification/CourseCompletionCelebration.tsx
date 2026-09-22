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
}

const CourseCompletionCelebration: React.FC<Props> = ({ open, onOpenChange, status }) => {
  if (!status?.completed) return null;
  const giftsLink = status.course?.gifts_link;
  const messages = status.settings?.messages ?? {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="overflow-hidden text-center sm:max-w-md">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={index}
              className="absolute animate-fade-in text-primary"
              style={{ left: `${6 + (index * 23) % 88}%`, top: `${5 + (index * 31) % 70}%`, animationDelay: `${(index % 5) * 90}ms` }}
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
        {giftsLink && (
          <Button className="relative w-full gap-2" onClick={() => openInNewTab(giftsLink)}>
            <Gift className="h-4 w-4" />
            {gamText(messages, 'completion_gifts_button')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseCompletionCelebration;