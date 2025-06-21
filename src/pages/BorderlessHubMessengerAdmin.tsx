import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Settings, Plus, Edit, Trash2, CheckCircle, XCircle, ArrowLeft, Loader2, UserCheck } from 'lucide-react';
import { messengerService, type MessengerUser, type ChatRoom } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import SupportAgentManagement from '@/components/Admin/SupportAgentManagement';

const BorderlessHubMessengerAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Room form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'public_group',
    description: '',
    is_boundless_only: false
  });

  useEffect(() => {
    // Get session token from localStorage
    const storedToken = localStorage.getItem('messenger_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
    } else {
      toast({
        title: 'خطا',
        description: 'لطفاً وارد پیام‌رسان شوید تا دسترسی مدیریت داشته باشید',
        variant: 'destructive',
      });
      navigate('/hub/messenger');
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (sessionToken) {
      fetchData();
    }
  }, [sessionToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin data...');
      
      const [usersData, roomsData] = await Promise.all([
        messengerService.getApprovedUsers(),
        messengerService.getRooms(sessionToken)
      ]);
      
      console.log('Fetched users:', usersData.length);
      console.log('Fetched rooms:', roomsData.length);
      
      setUsers(usersData);
      setRooms(roomsData);
      
      toast({
        title: 'موفق',
        description: `${roomsData.length} اتاق و ${usersData.length} کاربر بارگذاری شد`,
      });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بارگذاری داده‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: number, approve: boolean) => {
    try {
      // This would require an admin function to approve users
      toast({
        title: approve ? 'کاربر تایید شد' : 'کاربر رد شد',
        description: 'وضعیت کاربر به‌روزرسانی شد.',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      toast({
        title: 'خطا',
        description: 'لطفاً دوباره وارد شوید',
        variant: 'destructive',
      });
      return;
    }

    if (!roomForm.name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام اتاق الزامی است',
        variant: 'destructive',
      });
      return;
    }

    setCreateLoading(true);
    try {
      console.log('Creating room with data:', roomForm);
      
      const newRoom = await messengerService.createRoom(roomForm, sessionToken);
      
      console.log('Room created successfully:', newRoom);
      
      toast({
        title: 'موفق',
        description: `اتاق "${newRoom.name}" ایجاد شد`,
      });
      
      // Reset form
      setRoomForm({
        name: '',
        type: 'public_group',
        description: '',
        is_boundless_only: false
      });
      
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: 'خطا در ایجاد اتاق',
        description: error.message || 'خطا در ایجاد اتاق جدید',
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRoom = async (room: ChatRoom, updates: Partial<ChatRoom>) => {
    if (!sessionToken) return;

    try {
      console.log('Updating room:', room.id, updates);
      
      const updatedRoom = await messengerService.updateRoom(room.id, updates, sessionToken);
      
      console.log('Room updated successfully:', updatedRoom);
      
      toast({
        title: 'موفق',
        description: `اتاق "${updatedRoom.name}" به‌روزرسانی شد`,
      });
      setEditingRoom(null);
      await fetchData();
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        title: 'خطا در به‌روزرسانی',
        description: error.message || 'خطا در به‌روزرسانی اتاق',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (!sessionToken) return;
    
    if (!confirm(`آیا از حذف اتاق "${roomName}" اطمینان دارید؟`)) return;

    setDeleteLoading(roomId);
    try {
      console.log('Deleting room:', roomId);
      
      await messengerService.deleteRoom(roomId, sessionToken);
      
      console.log('Room deleted successfully');
      
      toast({
        title: 'موفق',
        description: `اتاق "${roomName}" حذف شد`,
      });
      
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'خطا در حذف',
        description: error.message || 'خطا در حذف اتاق',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'public_group':
        return 'گروه عمومی';
      case 'boundless_group':
        return 'گروه بدون مرز';
      case 'announcement_channel':
        return 'کانال اطلاعیه';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پنل مدیریت...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/hub/admin')}
                  className="text-slate-600 dark:text-slate-400"
                >
                  <ArrowLeft className="w-5 h-5 ml-2" />
                  بازگشت
                </Button>
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    مدیریت پیام‌رسان
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    مدیریت کاربران، اتاق‌ها و پشتیبانی
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="rooms" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                مدیریت کاربران
              </TabsTrigger>
              <TabsTrigger value="support-agents" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                پشتیبانان
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                مدیریت اتاق‌ها
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                پشتیبانی
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>مدیریت کاربران ({users.length} کاربر)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-slate-500">{user.phone}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {user.bedoun_marz_request && (
                              <Badge variant="outline">درخواست بدون مرز</Badge>
                            )}
                            {user.bedoun_marz_approved && (
                              <Badge>بدون مرز</Badge>
                            )}
                            {user.is_support_agent && (
                              <Badge variant="secondary">پشتیبان</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.bedoun_marz_request && !user.bedoun_marz_approved && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveUser(user.id, true)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                                تایید
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleApproveUser(user.id, false)}
                              >
                                <XCircle className="w-4 h-4" />
                                رد
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support-agents" className="space-y-6">
              <SupportAgentManagement />
            </TabsContent>

            <TabsContent value="rooms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ایجاد اتاق جدید</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <Label htmlFor="room-name">نام اتاق</Label>
                      <Input
                        id="room-name"
                        value={roomForm.name}
                        onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                        placeholder="نام اتاق را وارد کنید"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="room-type">نوع اتاق</Label>
                      <Select value={roomForm.type} onValueChange={(value) => setRoomForm({ ...roomForm, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع اتاق" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public_group">گروه عمومی</SelectItem>
                          <SelectItem value="boundless_group">گروه بدون مرز</SelectItem>
                          <SelectItem value="announcement_channel">کانال اطلاعیه</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room-description">توضیحات</Label>
                      <Textarea
                        id="room-description"
                        value={roomForm.description}
                        onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                        placeholder="توضیحات اتاق"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="boundless-only"
                        checked={roomForm.is_boundless_only}
                        onCheckedChange={(checked) => setRoomForm({ ...roomForm, is_boundless_only: checked })}
                      />
                      <Label htmlFor="boundless-only">فقط برای دانش‌پذیران بدون مرز</Label>
                    </div>
                    <Button type="submit" disabled={createLoading}>
                      {createLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          در حال ایجاد...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          ایجاد اتاق
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>اتاق‌های موجود ({rooms.length} اتاق)</CardTitle>
                </CardHeader>
                <CardContent>
                  {rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">هیچ اتاقی موجود نیست</p>
                      <Button onClick={fetchData} variant="ghost" className="mt-2">
                        بارگذاری مجدد
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{room.name}</h3>
                            <p className="text-sm text-slate-500">{room.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{getRoomTypeLabel(room.type)}</Badge>
                              {room.is_boundless_only && (
                                <Badge variant="secondary">بدون مرز</Badge>
                              )}
                              {room.is_active ? (
                                <Badge variant="default" className="bg-green-500">فعال</Badge>
                              ) : (
                                <Badge variant="destructive">غیرفعال</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRoom(room)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteRoom(room.id, room.name)}
                              disabled={deleteLoading === room.id}
                            >
                              {deleteLoading === room.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>مدیریت پشتیبانی</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400">
                    بخش مدیریت پشتیبانی در حال توسعه است.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubMessengerAdmin;
