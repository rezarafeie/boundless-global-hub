import { BookOpen, Wallet, ShieldCheck, MessageCircle, Clock, Gift, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const courseEditorSections = [
  { id: 'general', title: 'اطلاعات دوره', detail: 'عنوان، توضیحات و نمایش', icon: BookOpen },
  { id: 'pricing', title: 'قیمت و پرداخت', detail: 'قیمت، حراج و پیش‌فروش', icon: Wallet },
  { id: 'access', title: 'محتوا و دسترسی', detail: 'درس‌ها و شرایط ورود', icon: ShieldCheck },
  { id: 'activation', title: 'پشتیبانی و پیام‌ها', detail: 'تلگرام، بله و فعال‌سازی', icon: MessageCircle },
  { id: 'followups', title: 'زمان‌بندی و پیگیری', detail: 'مراحل و پیام‌های سفارشی', icon: Clock },
  { id: 'rewards', title: 'مهلت آموزش و جوایز', detail: 'دسترسی، تمدید و هدایا', icon: Gift },
  { id: 'advanced', title: 'اتصال‌ها و لید', detail: 'ووکامرس و ثبت‌نام‌ها', icon: Settings2 },
] as const;

export type CourseEditorSectionId = typeof courseEditorSections[number]['id'];

export default function CourseEditorNavigation({ active, onChange }: { active: CourseEditorSectionId; onChange: (id: CourseEditorSectionId) => void }) {
  return (
    <nav aria-label="بخش‌های ویرایش دوره" className="lg:sticky lg:top-24 lg:self-start">
      <div className="lg:hidden">
        <Select value={active} onValueChange={value => {
          const section = courseEditorSections.find(item => item.id === value);
          if (section) onChange(section.id);
        }} dir="rtl">
          <SelectTrigger aria-label="انتخاب بخش ویرایش" className="h-12 w-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>{courseEditorSections.map(section => <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="hidden space-y-1 lg:block">
        {courseEditorSections.map(({ id, title, detail, icon: Icon }) => (
          <Button key={id} type="button" variant={active === id ? 'secondary' : 'ghost'} aria-current={active === id ? 'page' : undefined}
            onClick={() => onChange(id)} className="h-auto w-full justify-start gap-3 px-3 py-3 text-right whitespace-normal">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0"><span className="block font-medium">{title}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{detail}</span></span>
          </Button>
        ))}
      </div>
    </nav>
  );
}