import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type ChatRoom } from '@/lib/messengerService';

interface RoomEditModalProps {
  room: ChatRoom | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const RoomEditModal: React.FC<RoomEditModalProps> = ({
  room,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_super_group: false,
    is_boundless_only: false
  });

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        is_active: room.is_active ?? true,
        is_super_group: room.is_super_group ?? false,
        is_boundless_only: room.is_boundless_only ?? false
      });
    }
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    setLoading(true);
    try {
      await messengerService.updateRoom(room.id, formData);
      
      toast({
        title: 'موفق',
        description: 'اتاق با موفقیت ویرایش شد',
      });
      
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ویرایش اتاق',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ویرایش اتاق</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">نام اتاق</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="نام اتاق را وارد کنید"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="توضیحات اتاق را وارد کنید"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">اتاق فعال</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_super_group">سوپر گروه</Label>
            <Switch
              id="is_super_group"
              checked={formData.is_super_group}
              onCheckedChange={(checked) => handleInputChange('is_super_group', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_boundless_only">فقط بدون مرز</Label>
            <Switch
              id="is_boundless_only"
              checked={formData.is_boundless_only}
              onCheckedChange={(checked) => handleInputChange('is_boundless_only', checked)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              لغو
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomEditModal;