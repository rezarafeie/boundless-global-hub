import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Star, Upload, Link as LinkIcon, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AssignmentBlock } from '@/types/assignment';

interface Props {
  block: AssignmentBlock;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
  studentId?: number;
  submissionId?: string;
}

export const BlockRenderer: React.FC<Props> = ({ block, value, onChange, disabled, studentId, submissionId }) => {
  const label = (
    <div className="mb-2">
      {block.label && (
        <Label className="text-sm font-medium">
          {block.label}
          {block.required && <span className="text-destructive mr-1">*</span>}
        </Label>
      )}
      {block.help && <p className="text-xs text-muted-foreground mt-1">{block.help}</p>}
    </div>
  );

  switch (block.type) {
    case 'title':
      return <h3 className="text-lg font-bold text-foreground">{block.label}</h3>;

    case 'description':
      return <p className="text-sm text-muted-foreground leading-6">{block.label}</p>;

    case 'hint':
      return (
        <div className="flex gap-2 rounded-lg bg-muted/60 p-3 text-sm">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
          <span>{block.label}</span>
        </div>
      );

    case 'short_text':
      return (
        <div>
          {label}
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={block.placeholder}
            disabled={disabled}
          />
        </div>
      );

    case 'long_text':
      return (
        <div>
          {label}
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={block.placeholder}
            disabled={disabled}
            rows={5}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          {label}
          <Input
            type="number"
            value={(value as number | string) ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            min={block.min}
            max={block.max}
            disabled={disabled}
          />
        </div>
      );

    case 'single_choice':
      return (
        <div>
          {label}
          <RadioGroup value={(value as string) || ''} onValueChange={onChange} disabled={disabled}>
            <div className="space-y-2">
              {(block.options || []).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value={opt} id={`${block.id}-${i}`} />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>
      );

    case 'multiple_choice': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (opt: string) => {
        onChange(arr.includes(opt) ? arr.filter((o) => o !== opt) : [...arr, opt]);
      };
      return (
        <div>
          {label}
          <div className="space-y-2">
            {(block.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <Checkbox checked={arr.includes(opt)} onCheckedChange={() => !disabled && toggle(opt)} disabled={disabled} />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'checklist': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (opt: string) => {
        onChange(arr.includes(opt) ? arr.filter((o) => o !== opt) : [...arr, opt]);
      };
      return (
        <div>
          {label}
          <div className="space-y-2">
            {(block.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={arr.includes(opt)} onCheckedChange={() => !disabled && toggle(opt)} disabled={disabled} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'rating': {
      const max = block.max || 5;
      const current = (value as number) || 0;
      return (
        <div>
          {label}
          <div className="flex gap-1">
            {Array.from({ length: max }).map((_, i) => (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChange(i + 1)}
                className="p-1"
              >
                <Star
                  className={`h-6 w-6 ${i < current ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                />
              </button>
            ))}
          </div>
        </div>
      );
    }

    case 'link':
      return (
        <div>
          {label}
          <div className="relative">
            <LinkIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              disabled={disabled}
              className="pr-9"
              dir="ltr"
            />
          </div>
        </div>
      );

    case 'file_upload':
    case 'image_upload': {
      const currentFile = value as { url: string; name: string } | null;
      const handleUpload = async (file: File) => {
        if (!studentId) {
          toast.error('برای آپلود ابتدا وارد شوید');
          return;
        }
        const path = `${studentId}/${submissionId || 'draft'}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('assignment-uploads').upload(path, file);
        if (error) {
          toast.error('خطا در آپلود فایل');
          return;
        }
        const { data } = supabase.storage.from('assignment-uploads').getPublicUrl(path);
        onChange({ url: data.publicUrl, name: file.name, size: file.size, path });
        toast.success('فایل آپلود شد');
      };
      return (
        <div>
          {label}
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {currentFile ? currentFile.name : block.type === 'image_upload' ? 'انتخاب تصویر' : 'انتخاب فایل'}
            </span>
            <input
              type="file"
              className="hidden"
              accept={block.type === 'image_upload' ? 'image/*' : undefined}
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        </div>
      );
    }

    default:
      return null;
  }
};
