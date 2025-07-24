
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserX, LogOut, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { chatUserAdminService } from '@/lib/chatUserAdmin';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import type { ChatUser } from '@/lib/supabase';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<ChatUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ChatUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingTotal, setPendingTotal] = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('pending');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const itemsPerPage = 50;

  const fetchData = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      
      const [pendingResult, approvedResult, sessionsResult] = await Promise.all([
        chatUserAdminService.getPendingUsers(debouncedSearchTerm, itemsPerPage, offset),
        chatUserAdminService.getApprovedUsers(debouncedSearchTerm, itemsPerPage, offset),
        chatUserAdminService.getActiveSessions(debouncedSearchTerm, itemsPerPage, offset)
      ]);
      
      setPendingUsers(pendingResult.users);
      setPendingTotal(pendingResult.total);
      setApprovedUsers(approvedResult.users);
      setApprovedTotal(approvedResult.total);
      setActiveSessions(sessionsResult.sessions);
      setSessionsTotal(sessionsResult.total);
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
  }, [debouncedSearchTerm, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeTab]);

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

  const totalPages = Math.ceil((activeTab === 'pending' ? pendingTotal : activeTab === 'approved' ? approvedTotal : sessionsTotal) / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">مدیریت کاربران</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="جستجوی نام، تلفن یا ایمیل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            در انتظار تایید ({pendingTotal})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            کاربران تایید شده ({approvedTotal})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            جلسات فعال ({sessionsTotal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>کاربران در انتظار تایید</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
                </div>
              ) : pendingUsers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ کاربری در انتظار تایید نیست'}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    نمایش {pendingUsers.length} از {pendingTotal} کاربر
                  </p>
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
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        قبلی
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحه {currentPage} از {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        بعدی
                        <ChevronLeft className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
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
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
                </div>
              ) : approvedUsers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ کاربر تایید شده‌ای وجود ندارد'}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    نمایش {approvedUsers.length} از {approvedTotal} کاربر
                  </p>
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
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        قبلی
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحه {currentPage} از {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        بعدی
                        <ChevronLeft className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
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
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
                </div>
              ) : activeSessions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ جلسه فعالی وجود ندارد'}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    نمایش {activeSessions.length} از {sessionsTotal} جلسه
                  </p>
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
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        قبلی
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        صفحه {currentPage} از {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        بعدی
                        <ChevronLeft className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
