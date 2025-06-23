import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tag, Plus, Edit, Trash2, Users, Hash, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService } from '@/lib/messengerService';

interface Topic {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Room {
  id: number;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  is_boundless_only: boolean;
  created_at: string;
  updated_at: string;
}

const TopicRoomManagementPanel = () => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Topic form state
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    is_active: true
  });

  // Room form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    type: 'public',
    is_active: true,
    is_boundless_only: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('messenger_session_token') || '';
      const [topicsData, roomsData] = await Promise.all([
        messengerService.getTopics(),
        messengerService.getRooms(sessionToken)
      ]);
      
      setTopics(topicsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await messengerService.createTopic(topicForm);
      toast({
        title: 'موفق',
        description: 'موضوع جدید ایجاد شد',
      });
      setIsCreateTopicOpen(false);
      setTopicForm({ title: '', description: '', is_active: true });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد موضوع',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await messengerService.createRoom(roomForm);
      toast({
        title: 'موفق',
        description: 'اتاق جدید ایجاد شد',
      });
      setIsCreateRoomOpen(false);
      setRoomForm({ 
        name: '', 
        description: '', 
        type: 'public', 
        is_active: true, 
        is_boundless_only: false 
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد اتاق',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTopic = async (id: number, updates: Partial<Topic>) => {
    try {
      await messengerService.updateTopic(id, updates);
      toast({
        title: 'موفق',
        description: 'موضوع به‌روزرسانی شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی موضوع',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRoom = async (id: number, updates: Partial<Room>) => {
    try {
      await messengerService.updateRoom(id, updates);
      toast({
        title: 'موفق',
        description: 'اتاق به‌روزرسانی شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی اتاق',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTopic = async (id: number) => {
    try {
      await messengerService.deleteTopic(id);
      toast({
        title: 'موفق',
        description: 'موضوع حذف شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف موضوع',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      await messengerService.deleteRoom(id);
      toast({
        title: 'موفق',
        description: 'اتاق حذف شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف اتاق',
        variant: 'destructive',
      });
    }
  };

  const getStatsCards = () => {
    const stats = {
      totalTopics: topics.length,
      activeTopics: topics.filter(t => t.is_active).length,
      totalRooms: rooms.length,
      activeRooms: rooms.filter(r => r.is_active).length
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Tag className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.totalTopics}</p>
            <p className="text-sm text-slate-600">کل موضوعات</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Tag className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.activeTopics}</p>
            <p className="text-sm text-slate-600">موضوعات فعال</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Hash className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{stats.totalRooms}</p>
            <p className="text-sm text-slate-600">کل اتاق‌ها</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Hash className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.activeRooms}</p>
            <p className="text-sm text-slate-600">اتاق‌های فعال</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>در حال بارگذاری موضوعات و اتاق‌ها...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {getStatsCards()}

      {/* Topics Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              مدیریت موضوعات ({topics.length})
            </CardTitle>
            <Dialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  موضوع جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ایجاد موضوع جدید</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTopic} className="space-y-4">
                  <div>
                    <Label htmlFor="topic-title">عنوان موضوع</Label>
                    <Input
                      id="topic-title"
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="topic-description">توضیحات</Label>
                    <Textarea
                      id="topic-description"
                      value={topicForm.description}
                      onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="topic-active"
                      checked={topicForm.is_active}
                      onCheckedChange={(checked) => setTopicForm({ ...topicForm, is_active: checked })}
                    />
                    <Label htmlFor="topic-active">فعال باشد</Label>
                  </div>
                  <Button type="submit">ایجاد موضوع</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>موضوع</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{topic.title}</p>
                      <p className="text-sm text-slate-500">{topic.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={topic.is_active ? "default" : "secondary"}>
                      {topic.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(topic.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTopic(topic.id, { is_active: !topic.is_active })}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTopic(topic.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rooms Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              مدیریت اتاق‌ها ({rooms.length})
            </CardTitle>
            <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  اتاق جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ایجاد اتاق جدید</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <Label htmlFor="room-name">نام اتاق</Label>
                    <Input
                      id="room-name"
                      value={roomForm.name}
                      onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-description">توضیحات</Label>
                    <Textarea
                      id="room-description"
                      value={roomForm.description}
                      onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="room-active"
                      checked={roomForm.is_active}
                      onCheckedChange={(checked) => setRoomForm({ ...roomForm, is_active: checked })}
                    />
                    <Label htmlFor="room-active">فعال باشد</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="room-boundless"
                      checked={roomForm.is_boundless_only}
                      onCheckedChange={(checked) => setRoomForm({ ...roomForm, is_boundless_only: checked })}
                    />
                    <Label htmlFor="room-boundless">فقط برای بدون مرز</Label>
                  </div>
                  <Button type="submit">ایجاد اتاق</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اتاق</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>دسترسی</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-slate-500">{room.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{room.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {room.is_boundless_only ? (
                      <Badge className="bg-blue-100 text-blue-800">بدون مرز</Badge>
                    ) : (
                      <Badge variant="secondary">عمومی</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.is_active ? "default" : "secondary"}>
                      {room.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(room.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateRoom(room.id, { is_active: !room.is_active })}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicRoomManagementPanel;
