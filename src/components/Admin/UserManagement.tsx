
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserX, LogOut, Clock } from 'lucide-react';
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
        description: 'کاربر تایید شد',
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
        description: 'کاربر غیرفعال شد',
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
        description: 'کاربر از سیستم خارج شد',
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
      <Card>
        <CardContent className="p-8">
          <p className="text-center">در حال بارگذاری...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            در انتظار تایید ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            کاربران تایید شده ({approvedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            جلسات فعال ({activeSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>کاربران در انتظار تایید</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">هیچ کاربری در انتظار تایید نیست</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>شماره تلفن</TableHead>
                      <TableHead>تاریخ درخواست</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectUser(user.id)}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              رد
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>کاربران تایید شده</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedUsers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">هیچ کاربر تایید شده‌ای وجود ندارد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>شماره تلفن</TableHead>
                      <TableHead>تاریخ عضویت</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            فعال
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateUser(user.id)}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            غیرفعال
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>جلسات فعال</CardTitle>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">هیچ جلسه فعالی وجود ندارد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام کاربر</TableHead>
                      <TableHead>آخرین فعالیت</TableHead>
                      <TableHead>مدت جلسه</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.chat_users?.name || 'نامشخص'}</TableCell>
                        <TableCell>
                          {new Date(session.last_activity).toLocaleString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          {Math.round((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60))} دقیقه
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleForceLogout(session.session_token)}
                          >
                            <LogOut className="w-4 h-4 mr-1" />
                            خروج اجباری
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
