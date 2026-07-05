import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ArrowUp, ArrowDown, Plus, GripVertical } from 'lucide-react';
import type { AssignmentBlock, AssignmentBlockType } from '@/types/assignment';

const BLOCK_TYPES: { value: AssignmentBlockType; label: string }[] = [
  { value: 'title', label: 'عنوان (نمایشی)' },
  { value: 'description', label: 'توضیح (نمایشی)' },
  { value: 'hint', label: 'راهنما / نکته' },
  { value: 'short_text', label: 'پاسخ کوتاه' },
  { value: 'long_text', label: 'پاسخ بلند' },
  { value: 'number', label: 'عدد' },
  { value: 'single_choice', label: 'تک‌گزینه‌ای' },
  { value: 'multiple_choice', label: 'چندگزینه‌ای' },
  { value: 'rating', label: 'امتیازدهی (۱ تا ۵)' },
  { value: 'checklist', label: 'چک‌لیست' },
  { value: 'file_upload', label: 'آپلود فایل' },
  { value: 'image_upload', label: 'آپلود تصویر' },
  { value: 'link', label: 'لینک' },
];

const NEEDS_OPTIONS: AssignmentBlockType[] = ['single_choice', 'multiple_choice', 'checklist'];
const IS_DISPLAY: AssignmentBlockType[] = ['title', 'description', 'hint'];

const uid = () => `b_${Math.random().toString(36).slice(2, 9)}`;

const defaultBlock = (type: AssignmentBlockType): AssignmentBlock => ({
  id: uid(),
  type,
  label: '',
  help: '',
  required: false,
  ...(NEEDS_OPTIONS.includes(type) ? { options: ['گزینه ۱', 'گزینه ۲'] } : {}),
});

interface Props {
  blocks: AssignmentBlock[];
  onChange: (blocks: AssignmentBlock[]) => void;
}

export const BlockBuilder: React.FC<Props> = ({ blocks, onChange }) => {
  const update = (i: number, patch: Partial<AssignmentBlock>) => {
    const next = blocks.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (type: AssignmentBlockType) => onChange([...blocks, defaultBlock(type)]);

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
          هنوز بلوکی اضافه نشده. از پایین یک بلوک اضافه کنید.
        </div>
      )}

      {blocks.map((b, i) => {
        const typeLabel = BLOCK_TYPES.find((t) => t.value === b.type)?.label || b.type;
        const display = IS_DISPLAY.includes(b.type);
        return (
          <Card key={b.id} className="border-primary/20">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{typeLabel}</span>
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">{display ? 'متن' : 'برچسب / سؤال'}</Label>
                {b.type === 'description' || b.type === 'hint' ? (
                  <Textarea rows={2} value={b.label || ''} onChange={(e) => update(i, { label: e.target.value })} />
                ) : (
                  <Input value={b.label || ''} onChange={(e) => update(i, { label: e.target.value })} />
                )}
              </div>

              {!display && (
                <>
                  <div>
                    <Label className="text-xs">توضیح کمکی (اختیاری)</Label>
                    <Input value={b.help || ''} onChange={(e) => update(i, { help: e.target.value })} />
                  </div>

                  {(b.type === 'short_text' || b.type === 'long_text' || b.type === 'number' || b.type === 'link') && (
                    <div>
                      <Label className="text-xs">Placeholder</Label>
                      <Input value={b.placeholder || ''} onChange={(e) => update(i, { placeholder: e.target.value })} />
                    </div>
                  )}

                  {NEEDS_OPTIONS.includes(b.type) && (
                    <div>
                      <Label className="text-xs">گزینه‌ها (هر خط یک گزینه)</Label>
                      <Textarea
                        rows={4}
                        value={(b.options || []).join('\n')}
                        onChange={(e) => update(i, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                      />
                    </div>
                  )}

                  {b.type === 'number' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">حداقل</Label><Input type="number" value={b.min ?? ''} onChange={(e) => update(i, { min: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
                      <div><Label className="text-xs">حداکثر</Label><Input type="number" value={b.max ?? ''} onChange={(e) => update(i, { max: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch checked={!!b.required} onCheckedChange={(v) => update(i, { required: v })} />
                    <Label className="text-xs">پاسخ الزامی</Label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <Select onValueChange={(v) => add(v as AssignmentBlockType)}>
          <SelectTrigger className="w-64"><SelectValue placeholder="افزودن بلوک..." /></SelectTrigger>
          <SelectContent>
            {BLOCK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Plus className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default BlockBuilder;
