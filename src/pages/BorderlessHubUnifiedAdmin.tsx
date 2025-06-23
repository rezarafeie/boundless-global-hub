
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, MessageSquare, Settings, UserCheck, UserX, Edit3, Trash2, Plus, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser, type ChatTopic } from '@/lib/messengerService';
import UserEditModal from '@/components/Admin/UserEditModal';

interface MessengerMessage {
  id: number;
  message: string;
  sender_id: number;
  room_id?: number;
  created_at: string;
  sender?: {
    name: string;
    phone: string;
  };
}

const BorderlessHubUnifiedAdmin: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [manualApprovalEnabled, setManualApprovalEnabled] = useState(false);

  // User edit modal state
  const [editingUser, setEditingUser] = useState<MessengerUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Topic form state
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    is_active: true
  });
  const [editingTopic, setEditingTopic] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, messagesData, topicsData, settingsData] = await Promise.all([
        messengerService.getAllUsers(),
        messengerService.getAllMessages(),
        messengerService.getTopics(),
        messengerService.getAdminSettings()
      ]);
      
      setUsers(usersData);
      setMessages(messagesData);
      setTopics(topicsData);
      setManualApprovalEnabled(settingsData.manual_approval_enabled);
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

  const handleToggleManualApproval = async (enabled: boolean) => {
    try {
      await messengerService.updateAdminSettings({ manual_approval_enabled: enabled });
      setManualApprovalEnabled(enabled);
      toast({
        title: 'موفق',
        description: enabled ? 'تایید دستی فعال شد' : 'تایید دستی غیرفعال شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر تنظیمات',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: MessengerUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleUserUpdated = () => {
    fetchData();
  };

  const handleToggleUserApproval = async (userId: number, isApproved: boolean) => {
    setUpdating(userId);
    try {
      await messengerService.updateUserRole(userId, { is_approved: !isApproved });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_approved: !isApproved } : user
      ));
      toast({
        title: 'موفق',
        description: isApproved ? 'کاربر رد شد' : 'کاربر تایید شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت کاربر',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleBoundless = async (userId: number, isBoundless: boolean) => {
    setUpdating(userId);
    try {
      await messengerService.updateUserRole(userId, { bedoun_marz_approved: !isBoundless });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, bedoun_marz_approved: !isBoundless } : user
      ));
      toast({
        title: 'موفق',
        description: isBoundless ? 'از بدون مرز حذف شد' : 'به بدون مرز اضافه شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت بدون مرز',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleSupportAgent = async (userId: number, isSupportAgent: boolean) => {
    setUpdating(userId);
    try {
      await messengerService.updateUserRole(userId, { is_support_agent: !isSupportAgent });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_support_agent: !isSupportAgent } : user
      ));
      toast({
        title: 'موفق',
        description: isSupportAgent ? 'از تیم پشتیبانی حذف شد' : 'به تیم پشتیبانی اضافه شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی نقش پشتیبان',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messengerService.deleteMessage(messageId);
      setMessages(messages.filter(msg => msg.id !== messageId));
      toast({
        title: 'موفق',
        description: 'پیام حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف پیام',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTopic = await messengerService.createTopic(topicForm);
      setTopics([...topics, newTopic]);
      setTopicForm({ title: '', description: '', is_active: true });
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
    }
  };

  const handleUpdateTopic = async (topicId: number, updates: Partial<ChatTopic>) => {
    try {
      await messengerService.updateTopic(topicId, updates);
      setTopics(topics.map(topic => 
        topic.id === topicId ? { ...topic, ...updates } : topic
      ));
      setEditingTopic(null);
      toast({
        title: 'موفق',
        description: 'تاپیک به‌روزرسانی شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تاپیک',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    try {
      await messengerService.deleteTopic(topicId);
      setTopics(topics.filter(topic => topic.id !== topicId));
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

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Settings className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پنل مدیریت...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const approvedUsers = users.filter(user => user.is_approved);
  const pendingUsers = users.filter(user => !user.is_approved);
  const boundlessUsers = users.filter(user => user.bedoun_marz_approved);
  const supportAgents = users.filter(user => user.is_support_agent);

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  پنل مدیریت یکپارچه
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  مدیریت کاربران، پشتیبانان، پیام‌ها و تاپیک‌ها
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Settings Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>تنظیمات سیستم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Switch
                  checked={manualApprovalEnabled}
                  onCheckedChange={handleToggleManualApproval}
                />
                <div>
                  <p className="font-medium">تایید دستی کاربران</p>
                  <p className="text-sm text-gray-500">
                    {manualApprovalEnabled 
                      ? 'کاربران جدید نیاز به تایید مدیر دارند' 
                      : 'کاربران جدید به صورت خودکار تایید می‌شوند'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  {approvedUsers.length} تایید شده، {pendingUsers.length} در انتظار
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">اعضای بدون مرز</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{boundlessUsers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">پشتیبانان</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{supportAgents.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل پیام‌ها</CardTitle>
                <MessageSquare className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messages.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                کاربران و نقش‌ها
              </TabsTrigger>
              <TabsTrigger value="chats" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                چت‌ها و تاپیک‌ها
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>مدیریت کاربران و نقش‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نام</TableHead>
                        <TableHead>شماره تلفن</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>بدون مرز</TableHead>
                        <TableHead>پشتیبان</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.is_approved}
                                onCheckedChange={() => handleToggleUserApproval(user.id, user.is_approved)}
                                disabled={updating === user.id}
                              />
                              {user.is_approved ? (
                                <Badge className="bg-green-100 text-green-800">تایید شده</Badge>
                              ) : (
                                <Badge variant="outline">در انتظار</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.bedoun_marz_approved}
                                onCheckedChange={() => handleToggleBoundless(user.id, user.bedoun_marz_approved)}
                                disabled={updating === user.id}
                              />
                              {user.bedoun_marz_approved && (
                                <Badge className="bg-blue-100 text-blue-800">بدون مرز</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.is_support_agent}
                                onCheckedChange={() => handleToggleSupportAgent(user.id, user.is_support_agent)}
                                disabled={updating === user.id}
                              />
                              {user.is_support_agent && (
                                <Badge className="bg-purple-100 text-purple-800">پشتیبان</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                              disabled={updating === user.id}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chats" className="space-y-6">
              {/* Topic Management */}
              <Card>
                <CardHeader>
                  <CardTitle>مدیریت تاپیک‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Create Topic Form */}
                  <form onSubmit={handleCreateTopic} className="mb-6 p-4 border rounded-lg">
                    <h3 className="text-lg font-medium mb-4">ایجاد تاپیک جدید</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        placeholder="عنوان تاپیک"
                        value={topicForm.title}
                        onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="توضیحات"
                        value={topicForm.description}
                        onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                      />
                      <Button type="submit">
                        <Plus className="w-4 h-4 mr-2" />
                        ایجاد تاپیک
                      </Button>
                    </div>
                  </form>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>عنوان</TableHead>
                        <TableHead>توضیحات</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>تاریخ ایجاد</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topics.map((topic) => (
                        <TableRow key={topic.id}>
                          <TableCell className="font-medium">{topic.title}</TableCell>
                          <TableCell>{topic.description}</TableCell>
                          <TableCell>
                            <Badge variant={topic.is_active ? "default" : "secondary"}>
                              {topic.is_active ? 'فعال' : 'غیرفعال'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(topic.created_at).toLocaleDateString('fa-IR')}
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

              {/* Messages Management */}
              <Card>
                <CardHeader>
                  <CardTitle>مدیریت پیام‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>پیام</TableHead>
                        <TableHead>فرستنده</TableHead>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.slice(0, 50).map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="max-w-md truncate">{message.message}</TableCell>
                          <TableCell>
                            {message.sender ? (
                              <div>
                                <p className="font-medium">{message.sender.name}</p>
                                <p className="text-sm text-gray-500">{message.sender.phone}</p>
                              </div>
                            ) : (
                              'نامشخص'
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(message.created_at).toLocaleDateString('fa-IR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* User Edit Modal */}
        <UserEditModal
          user={editingUser}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </MainLayout>
  );
};

export default BorderlessHubUnifiedAdmin;
