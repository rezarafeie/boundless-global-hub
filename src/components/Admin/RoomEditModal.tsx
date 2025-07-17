import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type ChatRoom } from '@/lib/messengerService';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Hash, Plus, Trash2, Settings } from 'lucide-react';
import type { ChatTopic } from '@/types/supabase';

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
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'group',
    is_active: true,
    is_boundless_only: false,
    is_super_group: false
  });

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        type: room.type || 'group',
        is_active: room.is_active !== false,
        is_boundless_only: room.is_boundless_only || false,
        is_super_group: room.is_super_group || false
      });
      
      if (room.is_super_group) {
        loadTopics();
      }
    }
  }, [room]);

  const loadTopics = async () => {
    if (!room) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    try {
      setLoading(true);
      await messengerService.updateRoom(room.id, formData);
      
      toast({
        title: 'موفق',
        description: 'گروه با موفقیت به‌روزرسانی شد',
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating room:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی گروه',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If changing to super group, load topics
    if (field === 'is_super_group' && value && room) {
      loadTopics();
    }
  };

  const handleAddTopic = async () => {
    if (!room || !newTopicTitle.trim()) return;

    try {
      setAddingTopic(true);
      
      const { error } = await supabase
        .from('chat_topics')
        .insert({
          title: newTopicTitle.trim(),
          description: newTopicDescription.trim() || null,
          room_id: room.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'موضوع جدید اضافه شد',
      });

      setNewTopicTitle('');
      setNewTopicDescription('');
      loadTopics();
    } catch (error) {
      console.error('Error adding topic:', error);
      toast({
        title: 'خطا',
        description: 'خطا در افزودن موضوع',
        variant: 'destructive',
      });
    } finally {
      setAddingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .update({ is_active: false })
        .eq('id', topicId);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'موضوع حذف شد',
      });

      loadTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف موضوع',
        variant: 'destructive',
      });
    }
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ویرایش گروه: {room.name}
          </DialogTitle>
          <DialogDescription>
            تنظیمات گروه و مدیریت موضوعات را در اینجا انجام دهید
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">تنظیمات عمومی</TabsTrigger>
            <TabsTrigger value="topics" disabled={!formData.is_super_group}>
              مدیریت موضوعات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام گروه</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">فعال</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_boundless_only">ویژه بدون مرز</Label>
                  <Switch
                    id="is_boundless_only"
                    checked={formData.is_boundless_only}
                    onCheckedChange={(checked) => handleInputChange('is_boundless_only', checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <div>
                    <Label htmlFor="is_super_group" className="font-medium">سوپر گروه</Label>
                    <p className="text-sm text-muted-foreground">
                      امکان ایجاد موضوعات مختلف در گروه
                    </p>
                  </div>
                </div>
                <Switch
                  id="is_super_group"
                  checked={formData.is_super_group}
                  onCheckedChange={(checked) => handleInputChange('is_super_group', checked)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  انصراف
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            {formData.is_super_group ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">موضوعات گروه</h3>
                </div>

                {/* Add New Topic */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">افزودن موضوع جدید</h4>
                  <div className="grid gap-3">
                    <Input
                      placeholder="عنوان موضوع"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="توضیحات موضوع (اختیاری)"
                      value={newTopicDescription}
                      onChange={(e) => setNewTopicDescription(e.target.value)}
                      rows={2}
                    />
                    <Button
                      onClick={handleAddTopic}
                      disabled={!newTopicTitle.trim() || addingTopic}
                      className="self-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {addingTopic ? 'در حال افزودن...' : 'افزودن موضوع'}
                    </Button>
                  </div>
                </div>

                {/* Topics List */}
                <div className="space-y-2">
                  <h4 className="font-medium">موضوعات موجود</h4>
                  <ScrollArea className="h-64 border rounded-lg p-2">
                    {topics.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>هنوز موضوعی ایجاد نشده</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{topic.title}</span>
                              </div>
                              {topic.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Crown className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>برای مدیریت موضوعات، ابتدا گروه را به سوپر گروه تبدیل کنید</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomEditModal;