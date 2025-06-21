
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useChatTopics } from '@/hooks/useChatTopics';
import { chatTopicsService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { ChatTopic, ChatTopicInsert } from '@/types/supabase';

const TopicManagement = () => {
  const { toast } = useToast();
  const { topics, loading } = useChatTopics();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [newTopic, setNewTopic] = useState<ChatTopicInsert>({
    title: '',
    description: '',
    is_active: true
  });

  const [editTopic, setEditTopic] = useState<Partial<ChatTopicInsert>>({});

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.title.trim()) return;

    try {
      await chatTopicsService.create(newTopic);
      toast({
        title: 'موفق',
        description: 'تاپیک جدید ایجاد شد',
      });
      setNewTopic({ title: '', description: '', is_active: true });
      setIsCreating(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد تاپیک',
        variant: 'destructive',
      });
    }
  };

  const handleEditSubmit = async (id: number) => {
    if (!editTopic.title?.trim()) return;

    try {
      await chatTopicsService.update(id, editTopic);
      toast({
        title: 'موفق',
        description: 'تاپیک به‌روزرسانی شد',
      });
      setEditingId(null);
      setEditTopic({});
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تاپیک',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این تاپیک مطمئن هستید؟')) return;

    try {
      await chatTopicsService.delete(id);
      toast({
        title: 'موفق',
        description: 'تاپیک حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف تاپیک',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await chatTopicsService.toggleActive(id, isActive);
      toast({
        title: 'موفق',
        description: isActive ? 'تاپیک غیرفعال شد' : 'تاپیک فعال شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت تاپیک',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (topic: ChatTopic) => {
    setEditingId(topic.id);
    setEditTopic({
      title: topic.title,
      description: topic.description,
      is_active: topic.is_active
    });
  };

  if (loading) {
    return <p className="text-center">در حال بارگذاری تاپیک‌ها...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Create New Topic */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            💬 مدیریت تاپیک‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isCreating ? (
            <Button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ایجاد تاپیک جدید
            </Button>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-title">عنوان تاپیک</Label>
                <Input
                  id="new-title"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  placeholder="عنوان تاپیک را وارد کنید"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-description">توضیحات (اختیاری)</Label>
                <Textarea
                  id="new-description"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  placeholder="توضیحات تاپیک"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-active"
                  checked={newTopic.is_active}
                  onCheckedChange={(checked) => setNewTopic({ ...newTopic, is_active: checked })}
                />
                <Label htmlFor="new-active">فعال باشد؟</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  ذخیره
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTopic({ title: '', description: '', is_active: true });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  لغو
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Topics List */}
      <Card>
        <CardHeader>
          <CardTitle>تاپیک‌های موجود</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <Card key={topic.id} className="border-slate-200 dark:border-slate-600">
                <CardContent className="p-4">
                  {editingId === topic.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editTopic.title || ''}
                        onChange={(e) => setEditTopic({ ...editTopic, title: e.target.value })}
                        placeholder="عنوان تاپیک"
                      />
                      <Textarea
                        value={editTopic.description || ''}
                        onChange={(e) => setEditTopic({ ...editTopic, description: e.target.value })}
                        placeholder="توضیحات"
                      />
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editTopic.is_active || false}
                          onCheckedChange={(checked) => setEditTopic({ ...editTopic, is_active: checked })}
                        />
                        <Label>فعال</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSubmit(topic.id)}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditTopic({});
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 dark:text-white">{topic.title}</h3>
                        <Badge variant={topic.is_active ? "default" : "secondary"}>
                          {topic.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                      {topic.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">{topic.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(topic)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(topic.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(topic.id, topic.is_active)}
                        >
                          {topic.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicManagement;
