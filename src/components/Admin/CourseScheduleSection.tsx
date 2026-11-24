import { useState, type ReactNode } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

export function scheduleDuration(minutes: number): string {
  if (!minutes) return 'فوری';
  if (minutes % 1440 === 0) return `${(minutes / 1440).toLocaleString('fa-IR')} روز`;
  if (minutes % 60 === 0) return `${(minutes / 60).toLocaleString('fa-IR')} ساعت`;
  return `${minutes.toLocaleString('fa-IR')} دقیقه`;
}

export function CourseEditorDisclosure({ title, summary, children }: { title: string; summary?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border">
      <Button type="button" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)} className="h-auto w-full justify-between gap-3 px-0 py-4 text-right whitespace-normal hover:bg-transparent">
        <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span>{summary && <span className="mt-1 block text-xs font-normal text-muted-foreground">{summary}</span>}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </Button>
      <CollapsibleContent forceMount className="space-y-4 pb-5 data-[state=closed]:hidden">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function CourseScheduleSection({ title, channel, delay, repeat, enabled, onEnabledChange, children }: {
  title: string; channel: string; delay: number; repeat: number; enabled: boolean;
  onEnabledChange: (value: boolean) => void; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border">
      <div className="flex items-center gap-3 py-3">
        <Button type="button" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)} className="h-auto min-w-0 flex-1 justify-start gap-3 px-0 py-2 text-right whitespace-normal hover:bg-transparent">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs font-normal leading-6 text-muted-foreground">{channel} · اولین ارسال {scheduleDuration(delay)} بعد · تکرار هر {scheduleDuration(repeat)}</span></span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} aria-label={`فعال بودن ${title}`} />
      </div>
      <CollapsibleContent forceMount className="space-y-4 pb-5 data-[state=closed]:hidden">{children}</CollapsibleContent>
    </Collapsible>
  );
}