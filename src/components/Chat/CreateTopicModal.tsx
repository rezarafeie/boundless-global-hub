import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CreateTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
}

const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
  open,
  onOpenChange,
  roomId
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('chat_topics')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          room_id: roomId,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'موضوع جدید ایجاد شد',
      });

      setTitle('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد موضوع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد موضوع جدید</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان موضوع</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان موضوع را وارد کنید"
              maxLength={100}
            />
          </div>
          
          <div>
            <Label htmlFor="description">توضیحات (اختیاری)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات موضوع را وارد کنید"
              rows={3}
              maxLength={500}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              ایجاد موضوع
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTopicModal;