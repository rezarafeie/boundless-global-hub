
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Settings, 
  UserCheck, 
  UserX, 
  Search, 
  Edit,
  Calendar,
  Phone,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import UserEditModal from '@/components/Admin/UserEditModal';
import MessengerAdminSection from '@/components/Admin/MessengerAdminSection';

const BorderlessHubUnifiedAdmin: React.FC = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // User Management States
  const [allUsers, setAllUsers] = useState<MessengerUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MessengerUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<MessengerUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('لطفاً ابتدا وارد شوید');
      }

      const result = await messengerService.validateSession(sessionToken);
      if (!result || !result.user.is_messenger_admin) {
        throw new Error('شما دسترسی به پنل مدیریت ندارید');
      }

      setCurrentUser(result.user);
      await fetchUsers();
    } catch (error: any) {
      console.error('Admin access error:', error);
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
      window.location.href = '/hub';
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await messengerService.getAllUsers();
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری کاربران',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [allUsers, searchTerm]);

  const handleApproveUser = async (userId: number) => {
    try {
      await messengerService.updateUserRole(userId, { is_approved: true });
      toast({
        title: 'موفق',
        description: 'کاربر تایید شد',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تایید کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleToggleRole = async (userId: number, role: 'is_messenger_admin' | 'bedoun_marz_approved', currentValue: boolean) => {
    try {
      await messengerService.updateUserRole(userId, { [role]: !currentValue });
      
      const roleNames = {
        is_messenger_admin: 'مدیر',
        bedoun_marz_approved: 'بدون مرز'
      };
      
      toast({
        title: 'موفق',
        description: `نقش ${roleNames[role]} ${!currentValue ? 'اضافه' : 'حذف'} شد`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر نقش کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      await messengerService.updateUserRole(userId, { is_approved: false });
      toast({
        title: 'موفق',
        description: 'کاربر رد شد',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در رد کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: MessengerUser) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleUserUpdate = () => {
    fetchUsers();
  };

  const getStatusBadges = (user: MessengerUser) => {
    const badges = [];
    
    if (!user.is_approved) {
      badges.push(<Badge key="pending" variant="destructive">در انتظار تایید</Badge>);
    } else {
      badges.push(<Badge key="approved" variant="secondary">تایید شده</Badge>);
    }
    
    if (user.is_messenger_admin) {
      badges.push(<Badge key="admin" variant="default">مدیر</Badge>);
    }
    
    if (user.bedoun_marz_approved) {
      badges.push(<Badge key="boundless" className="bg-blue-100 text-blue-800">بدون مرز</Badge>);
    }
    
    return badges;
  };

  const getStatsCards = () => {
    const stats = {
      total: allUsers.length,
      pending: allUsers.filter(u => !u.is_approved).length,
      approved: allUsers.filter(u => u.is_approved).length,
      boundless: allUsers.filter(u => u.bedoun_marz_approved).length,
      admins: allUsers.filter(u => u.is_messenger_admin).length
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-slate-600">کل کاربران</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-slate-600">در انتظار</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className="text-sm text-slate-600">تایید شده</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.boundless}</p>
            <p className="text-sm text-slate-600">بدون مرز</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{stats.admins}</p>
            <p className="text-sm text-slate-600">مدیر</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پنل مدیریت...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser || !currentUser.is_messenger_admin) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <Card className="w-full max-w-md p-6 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              دسترسی غیرمجاز
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              شما دسترسی به پنل مدیریت ندارید.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                پنل مدیریت یکپارچه
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              مدیریت کامل سیستم پیام‌رسان و کاربران
            </p>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger 
                value="users" 
                className="flex flex-col items-center gap-2 py-4"
              >
                <Users className="w-5 h-5" />
                <span>مدیریت کاربران</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messenger" 
                className="flex flex-col items-center gap-2 py-4"
              >
                <MessageSquare className="w-5 h-5" />
                <span>مدیریت پیام‌رسان</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              {getStatsCards()}
              
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="جستجو بر اساس نام، شماره تلفن یا نام کاربری..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    مدیریت کاربران ({filteredUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>کاربر</TableHead>
                          <TableHead>وضعیت</TableHead>
                          <TableHead>نقش‌ها</TableHead>
                          <TableHead>تاریخ عضویت</TableHead>
                          <TableHead>عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </p>
                                {user.username && (
                                  <p className="text-xs text-blue-600">@{user.username}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {getStatusBadges(user)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={user.bedoun_marz_approved}
                                    onCheckedChange={() => handleToggleRole(user.id, 'bedoun_marz_approved', user.bedoun_marz_approved)}
                                  />
                                  <span className="text-sm">بدون مرز</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={user.is_messenger_admin}
                                    onCheckedChange={() => handleToggleRole(user.id, 'is_messenger_admin', user.is_messenger_admin)}
                                  />
                                  <span className="text-sm">مدیر</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-slate-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(user.created_at).toLocaleDateString('fa-IR')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditUser(user)}
                                  className="p-2"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {!user.is_approved ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveUser(user.id)}
                                      className="bg-green-600 hover:bg-green-700 p-2"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectUser(user.id)}
                                      className="p-2"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectUser(user.id)}
                                    className="p-2"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messenger" className="space-y-6">
              <MessengerAdminSection />
            </TabsContent>
          </Tabs>

          {/* Edit User Modal */}
          <UserEditModal
            user={editingUser}
            isOpen={showEditModal}
            onClose={handleEditModalClose}
            onUserUpdate={handleUserUpdate}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubUnifiedAdmin;
