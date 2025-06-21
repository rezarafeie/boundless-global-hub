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
import { MessageSquare, Users, Settings, Plus, Edit, Trash2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';

const BorderlessHubMessengerAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>('');

  // Room form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'public_group',
    description: '',
    is_boundless_only: false
  });

  useEffect(() => {
    // Get session token from localStorage or create admin session
    const storedToken = localStorage.getItem('messenger_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
    } else {
      // For admin access, we'll use a placeholder token
      // In a real implementation, you'd have proper admin authentication
      setSessionToken('admin-session-token');
    }
  }, []);

  useEffect(() => {
    if (sessionToken) {
      fetchData();
    }
  }, [sessionToken]);

  const fetchData = async () => {
    try {
      const [usersData, roomsData] = await Promise.all([
        messengerService.getApprovedUsers(),
        messengerService.getRooms(sessionToken)
      ]);
      setUsers(usersData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری داده‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: number, approve: boolean) => {
    try {
      // Update user approval status
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
    try {
      // Create new room logic would go here
      toast({
        title: 'موفق',
        description: 'اتاق جدید ایجاد شد',
      });
      setRoomForm({
        name: '',
        type: 'public_group',
        description: '',
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

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری...</p>
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
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                مدیریت کاربران
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
                  <CardTitle>مدیریت کاربران</CardTitle>
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
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="room-type">نوع اتاق</Label>
                      <Select onValueChange={(value) => setRoomForm({ ...roomForm, type: value })}>
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
                    <Button type="submit">
                      <Plus className="w-4 h-4 mr-2" />
                      ایجاد اتاق
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>اتاق‌های موجود</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{room.name}</h3>
                          <p className="text-sm text-slate-500">{room.description}</p>
                          <Badge variant="outline">{room.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
