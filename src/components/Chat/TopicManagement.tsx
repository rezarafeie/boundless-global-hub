
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { useChatTopics } from '@/hooks/useChatTopics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TopicManagement: React.FC = () => {
  const { topics, loading, refetch } = useChatTopics();
  const { toast } = useToast();
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopic, setEditingTopic] = useState<{ id: string; name: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) {
      toast({
        title: "خطا",
        description: "نام تاپیک نمی‌تواند خالی باشد",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('chat_topics')
        .insert([{ name: newTopicName.trim() }]);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "تاپیک جدید اضافه شد"
      });
      
      setNewTopicName('');
      refetch();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در اضافه کردن تاپیک",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditTopic = async () => {
    if (!editingTopic || !editingTopic.name.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_topics')
        .update({ name: editingTopic.name.trim() })
        .eq('id', editingTopic.id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "تاپیک ویرایش شد"
      });
      
      setEditingTopic(null);
      refetch();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ویرایش تاپیک",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "تاپیک حذف شد"
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف تاپیک",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <MessageCircle className="w-6 h-6 text-blue-400" />
          💬 مدیریت تاپیک‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Topic */}
        <div className="flex gap-3">
          <Input
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="نام تاپیک جدید..."
            className="flex-1 bg-gray-800 border-gray-600 text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
          />
          <Button 
            onClick={handleAddTopic}
            disabled={isAdding || !newTopicName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    #{topic.name}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Edit Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTopic({ id: topic.id, name: topic.name })}
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl" className="bg-gray-900 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">حذف تاپیک</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          آیا مطمئن هستید که می‌خواهید تاپیک "{topic.name}" را حذف کنید؟ این عمل قابل بازگشت نیست.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">
                          لغو
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            
            {topics.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>هنوز تاپیکی اضافه نشده است</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Topic Modal */}
        {editingTopic && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md" dir="rtl">
              <h3 className="text-lg font-semibold text-white mb-4">ویرایش تاپیک</h3>
              <Input
                value={editingTopic.name}
                onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                placeholder="نام تاپیک..."
                className="mb-4 bg-gray-800 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleEditTopic()}
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setEditingTopic(null)}
                  className="text-gray-400"
                >
                  لغو
                </Button>
                <Button
                  onClick={handleEditTopic}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ذخیره
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicManagement;
