
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserX, LogOut, Clock, Shield } from 'lucide-react';
import { chatUserAdminService } from '@/lib/chatUserAdmin';
import { useToast } from '@/hooks/use-toast';
import type { ChatUser } from '@/lib/supabase';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<ChatUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ChatUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pending, approved, sessions] = await Promise.all([
        chatUserAdminService.getPendingUsers(),
        chatUserAdminService.getAllUsers().then(users => users.filter(u => u.is_approved)),
        chatUserAdminService.getActiveSessions()
      ]);
      
      setPendingUsers(pending);
      setApprovedUsers(approved);
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات کاربران',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveUser = async (userId: number) => {
    try {
      await chatUserAdminService.approveUser(userId);
      toast({
        title: 'موفق',
        description: 'کاربر تایید شد و می‌تواند در چت شرکت کند',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تایید کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      await chatUserAdminService.rejectUser(userId);
      toast({
        title: 'موفق',
        description: 'کاربر رد شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در رد کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    try {
      await chatUserAdminService.deactivateUser(userId);
      toast({
        title: 'موفق',
        description: 'کاربر غیرفعال شد و از چت حذف گردید',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در غیرفعال کردن کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleForceLogout = async (sessionToken: string) => {
    try {
      await chatUserAdminService.forceLogoutUser(sessionToken);
      toast({
        title: 'موفق',
        description: 'کاربر به زور از سیستم خارج شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در خروج اجباری کاربر',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری اطلاعات کاربران...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
          <Shield className="w-6 h-6 text-blue-400" />
          👥 مدیریت کاربران چت
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              در انتظار ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              تایید شده ({approvedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              آنلاین ({activeSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">هیچ کاربری در انتظار تایید نیست</p>
                <p className="text-gray-400 text-sm">همه درخواست‌ها بررسی شده‌اند</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام کاربر</TableHead>
                    <TableHead className="text-right">شماره تلفن</TableHead>
                    <TableHead className="text-right">تاریخ درخواست</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="font-mono text-sm">{user.phone}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <UserCheck className="w-4 h-4 ml-1" />
                            تایید
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectUser(user.id)}
                          >
                            <UserX className="w-4 h-4 ml-1" />
                            رد
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">هیچ کاربر تایید شده‌ای وجود ندارد</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام کاربر</TableHead>
                    <TableHead className="text-right">شماره تلفن</TableHead>
                    <TableHead className="text-right">تاریخ عضویت</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="font-mono text-sm">{user.phone}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          فعال
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivateUser(user.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <UserX className="w-4 h-4 ml-1" />
                          غیرفعال
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="sessions">
            {activeSessions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">هیچ کاربر آنلاینی وجود ندارد</p>
                <p className="text-gray-400 text-sm">همه کاربران آفلاین هستند</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام کاربر</TableHead>
                    <TableHead className="text-right">آخرین فعالیت</TableHead>
                    <TableHead className="text-right">مدت جلسه</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.chat_users?.name || 'نامشخص'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(session.last_activity).toLocaleString('fa-IR')}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {Math.round((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60))} دقیقه
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleForceLogout(session.session_token)}
                        >
                          <LogOut className="w-4 h-4 ml-1" />
                          خروج اجباری
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
