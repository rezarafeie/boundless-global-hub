import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Edit2, Trash2, Plus, Eye, EyeOff, Hash, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatTopic } from '@/types/supabase';
import type { ChatRoom } from '@/lib/messengerService';

interface TopicManagementProps {
  currentUser?: any;
  sessionToken?: string;
}

const TopicManagement: React.FC<TopicManagementProps> = ({ currentUser, sessionToken }) => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [newTopicIcon, setNewTopicIcon] = useState('🔹');
  const [editingTopic, setEditingTopic] = useState<ChatTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('🔹');
  const [isCreating, setIsCreating] = useState(false);

  const availableEmojis = ['🔹', '📚', '💼', '🎯', '🚀', '💡', '🔧', '📊', '🎨', '⚡', '🔥', '🎵', '🏆', '📝', '💻', '🌟', '🎲', '🍕', '🏠', '🌈'];

  useEffect(() => {
    if (currentUser?.is_messenger_admin) {
      loadRooms();
      loadTopics();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedRoomId) {
      loadTopicsForRoom(selectedRoomId);
    } else {
      loadTopics();
    }
  }, [selectedRoomId]);

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select(`
          *,
          chat_rooms (name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopicsForRoom = async (roomId: number) => {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select(`
          *,
          chat_rooms (name)
        `)
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error loading topics for room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !selectedRoomId) {
      toast({
        title: 'خطا',
        description: 'عنوان تاپیک و انتخاب گروه الزامی است',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('chat_topics')
        .insert({
          title: newTopicTitle.trim(),
          description: newTopicDescription.trim() || null,
          room_id: selectedRoomId,
          icon: newTopicIcon,
          is_active: true
        });

      if (error) throw error;
      
      setNewTopicTitle('');
      setNewTopicDescription('');
      setNewTopicIcon('🔹');
      
      toast({
        title: 'موفق',
        description: 'تاپیک جدید ایجاد شد',
      });

      // Reload topics
      if (selectedRoomId) {
        loadTopicsForRoom(selectedRoomId);
      } else {
        loadTopics();
      }
    } catch (error) {
      console.error('Error creating topic:', error);
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
      const { error } = await supabase
        .from('chat_topics')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          icon: editIcon
        })
        .eq('id', topicId);

      if (error) throw error;
      
      setEditingTopic(null);
      setEditTitle('');
      setEditDescription('');
      setEditIcon('🔹');
      
      toast({
        title: 'موفق',
        description: 'تاپیک ویرایش شد',
      });

      // Reload topics
      if (selectedRoomId) {
        loadTopicsForRoom(selectedRoomId);
      } else {
        loadTopics();
      }
    } catch (error) {
      console.error('Error editing topic:', error);
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
      const { error } = await supabase
        .from('chat_topics')
        .update({ is_active: false })
        .eq('id', topicId);

      if (error) throw error;
      
      toast({
        title: 'موفق',
        description: 'تاپیک حذف شد',
      });

      // Reload topics
      if (selectedRoomId) {
        loadTopicsForRoom(selectedRoomId);
      } else {
        loadTopics();
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف تاپیک',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (topicId: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .update({ is_active: !isActive })
        .eq('id', topicId);

      if (error) throw error;
      
      toast({
        title: 'موفق',
        description: isActive ? 'تاپیک غیرفعال شد' : 'تاپیک فعال شد',
      });

      // Reload topics
      if (selectedRoomId) {
        loadTopicsForRoom(selectedRoomId);
      } else {
        loadTopics();
      }
    } catch (error) {
      console.error('Error toggling topic status:', error);
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
    setEditDescription(topic.description || '');
    setEditIcon((topic as any).icon || '🔹');
  };

  const cancelEdit = () => {
    setEditingTopic(null);
    setEditTitle('');
    setEditDescription('');
    setEditIcon('🔹');
  };

  if (!currentUser?.is_messenger_admin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">شما دسترسی ادمین ندارید</p>
        </CardContent>
      </Card>
    );
  }

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
        {/* Room Filter */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-2 block">
            فیلتر بر اساس گروه
          </Label>
          <Select
            value={selectedRoomId?.toString() || "all"}
            onValueChange={(value) => setSelectedRoomId(value === "all" ? null : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب گروه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه گروه‌ها</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()}>
                  <div className="flex items-center gap-2">
                    {room.is_super_group && <Crown className="w-4 h-4 text-yellow-600" />}
                    {room.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create New Topic */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-2 block">
            افزودن تاپیک جدید
          </Label>
          <div className="space-y-3">
            <Select
              value={selectedRoomId?.toString() || ""}
              onValueChange={(value) => setSelectedRoomId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب گروه برای تاپیک" />
              </SelectTrigger>
              <SelectContent>
                {rooms.filter(room => room.is_super_group).map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      {room.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="عنوان تاپیک جدید..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTopic();
                }
              }}
            />
            
            <Input
              value={newTopicDescription}
              onChange={(e) => setNewTopicDescription(e.target.value)}
              placeholder="توضیحات تاپیک (اختیاری)..."
            />
            
            <div className="flex flex-wrap gap-2">
              <Label className="text-sm font-medium w-full mb-2">انتخاب آیکون:</Label>
              {availableEmojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant={newTopicIcon === emoji ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewTopicIcon(emoji)}
                  className="text-lg"
                >
                  {emoji}
                </Button>
              ))}
            </div>
            
            <Button 
              onClick={handleCreateTopic}
              disabled={isCreating || !newTopicTitle.trim() || !selectedRoomId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 ml-1" />
              {isCreating ? 'در حال افزودن...' : 'افزودن'}
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
              {selectedRoomId ? 'در این گروه تاپیکی یافت نشد' : 'هیچ تاپیکی یافت نشد'}
            </div>
          ) : (
            <div className="grid gap-3">
              {topics.map((topic) => (
                <div key={topic.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {editingTopic?.id === topic.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="space-y-2 flex-1">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="عنوان تاپیک"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditTopic(topic.id);
                                }
                                if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                            />
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="توضیحات تاپیک"
                            />
                            <div className="flex flex-wrap gap-1">
                              {availableEmojis.map((emoji) => (
                                <Button
                                  key={emoji}
                                  variant={editIcon === emoji ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setEditIcon(emoji)}
                                  className="text-sm"
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
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
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{(topic as any).icon || '🔹'}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {topic.title}
                                </span>
                                <Badge variant={topic.is_active ? "default" : "secondary"}>
                                  {topic.is_active ? 'فعال' : 'غیرفعال'}
                                </Badge>
                              </div>
                              {topic.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {topic.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>گروه: {(topic as any).chat_rooms?.name || 'نامشخص'}</span>
                                <span>•</span>
                                <span>ID: {topic.id}</span>
                              </div>
                            </div>
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