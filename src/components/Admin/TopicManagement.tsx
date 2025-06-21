
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit2, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { useChatTopics } from '@/hooks/useChatTopics';
import { chatService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { ChatTopic } from '@/types/supabase';

const TopicManagement: React.FC = () => {
  const { toast } = useToast();
  const { topics, loading } = useChatTopics();
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [editingTopic, setEditingTopic] = useState<ChatTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) {
      toast({
        title: 'خطا',
        description: 'عنوان تاپیک را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await chatService.createTopic({
        title: newTopicTitle.trim(),
        description: '',
        is_active: true
      });
      
      setNewTopicTitle('');
      toast({
        title: 'موفق',
        description: 'تاپیک جدید ایجاد شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد تاپیک',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTopic = async (topicId: number) => {
    if (!editTitle.trim()) {
      toast({
        title: 'خطا',
        description: 'عنوان تاپیک را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      await chatService.updateTopic(topicId, {
        title: editTitle.trim()
      });
      
      setEditingTopic(null);
      setEditTitle('');
      toast({
        title: 'موفق',
        description: 'تاپیک ویرایش شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ویرایش تاپیک',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTopic = async (topicId: number, topicTitle: string) => {
    if (!confirm(`آیا از حذف تاپیک "${topicTitle}" مطمئن هستید؟`)) {
      return;
    }

    try {
      await chatService.deleteTopic(topicId);
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

  const handleToggleActive = async (topicId: number, isActive: boolean) => {
    try {
      await chatService.updateTopic(topicId, {
        is_active: !isActive
      });
      
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
    setEditingTopic(topic);
    setEditTitle(topic.title);
  };

  const cancelEdit = () => {
    setEditingTopic(null);
    setEditTitle('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">در حال بارگذاری تاپیک‌ها...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          💬 مدیریت تاپیک‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Topic */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <Label htmlFor="new-topic" className="text-sm font-medium mb-2 block">
            افزودن تاپیک جدید
          </Label>
          <div className="flex gap-2">
            <Input
              id="new-topic"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="عنوان تاپیک جدید..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTopic();
                }
              }}
            />
            <Button 
              onClick={handleCreateTopic}
              disabled={isCreating || !newTopicTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 ml-1" />
              افزودن
            </Button>
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-white">
            تاپیک‌های موجود ({topics.length})
          </h4>
          
          {topics.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              هیچ تاپیکی یافت نشد
            </div>
          ) : (
            <div className="grid gap-3">
              {topics.map((topic) => (
                <div key={topic.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {editingTopic?.id === topic.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleEditTopic(topic.id);
                              }
                              if (e.key === 'Escape') {
                                cancelEdit();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleEditTopic(topic.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ذخیره
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            لغو
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              🔹 {topic.title}
                            </span>
                            <Badge variant={topic.is_active ? "default" : "secondary"}>
                              {topic.is_active ? 'فعال' : 'غیرفعال'}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {topic.id}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {editingTopic?.id !== topic.id && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(topic.id, topic.is_active)}
                          className="text-xs"
                        >
                          {topic.is_active ? (
                            <>
                              <EyeOff className="w-3 h-3 ml-1" />
                              غیرفعال
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 ml-1" />
                              فعال
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(topic)}
                        >
                          <Edit2 className="w-3 h-3 ml-1" />
                          ویرایش
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTopic(topic.id, topic.title)}
                        >
                          <Trash2 className="w-3 h-3 ml-1" />
                          حذف
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {topic.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {topic.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    ایجاد شده: {new Date(topic.created_at).toLocaleDateString('fa-IR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicManagement;
