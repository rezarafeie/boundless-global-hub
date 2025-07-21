import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, Calendar, Phone, Mail, User, Users, UserCheck, Clock, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  bedoun_marz_approved: boolean;
  signup_source: string;
  last_seen: string;
}

interface UserStats {
  total: number;
  approved: number;
  admins: number;
  boundless: number;
  todayRegistrations: number;
  activeToday: number;
  totalCrmNotes: number;
}

export default function UsersOverview() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    approved: 0,
    admins: 0,
    boundless: 0,
    todayRegistrations: 0,
    activeToday: 0,
    totalCrmNotes: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterBy]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id, name, email, phone, created_at, is_approved, is_messenger_admin, bedoun_marz_approved, signup_source, last_seen')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get user counts
      const { data: allUsers } = await supabase.from('chat_users').select('*');
      const approved = allUsers?.filter(u => u.is_approved).length || 0;
      const admins = allUsers?.filter(u => u.is_messenger_admin).length || 0;
      const boundless = allUsers?.filter(u => u.bedoun_marz_approved).length || 0;
      const todayRegistrations = allUsers?.filter(u => u.created_at?.startsWith(today)).length || 0;
      const activeToday = allUsers?.filter(u => u.last_seen?.startsWith(today)).length || 0;

      // Get CRM notes count
      const { count: crmCount } = await supabase
        .from('crm_notes')
        .select('*', { count: 'exact', head: true });

      setStats({
        total: allUsers?.length || 0,
        approved,
        admins,
        boundless,
        todayRegistrations,
        activeToday,
        totalCrmNotes: crmCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);

      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'approved' && user.is_approved) ||
        (filterBy === 'admin' && user.is_messenger_admin) ||
        (filterBy === 'boundless' && user.bedoun_marz_approved);

      return matchesSearch && matchesFilter;
    });

    setFilteredUsers(filtered);
  };

  const getStatusBadges = (user: User) => {
    const badges = [];
    if (user.is_approved) badges.push(<Badge key="approved" variant="default">تایید شده</Badge>);
    if (user.is_messenger_admin) badges.push(<Badge key="admin" variant="destructive">ادمین</Badge>);
    if (user.bedoun_marz_approved) badges.push(<Badge key="boundless" variant="secondary">بدون مرز</Badge>);
    return badges;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'نامشخص';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const handleViewProfile = (userId: number) => {
    navigate(`/enroll/admin/users/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری کاربران...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">مدیریت کاربران</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline">{filteredUsers.length} کاربر</Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">تعداد کل ثبت‌نام‌ها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران تایید شده</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">{Math.round((stats.approved/stats.total)*100)}% از کل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ثبت‌نام امروز</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayRegistrations.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">کاربران جدید امروز</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فعالیت CRM</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCrmNotes.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">کل یادداشت‌های CRM</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            جستجو و فیلتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="جستجو بر اساس نام، ایمیل یا تلفن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فیلتر بر اساس وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه کاربران</SelectItem>
                <SelectItem value="approved">فقط تایید شده‌ها</SelectItem>
                <SelectItem value="admin">فقط ادمین‌ها</SelectItem>
                <SelectItem value="boundless">فقط بدون مرز</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            کاربران ({filteredUsers.length.toLocaleString('fa-IR')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">شناسه</TableHead>
                <TableHead className="text-right">نام کامل</TableHead>
                <TableHead className="text-right">ایمیل</TableHead>
                <TableHead className="text-right">تلفن</TableHead>
                <TableHead className="text-right">تاریخ ثبت‌نام</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">#{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email || 'ندارد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {user.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getStatusBadges(user)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewProfile(user.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      مشاهده پروفایل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              کاربری با معیارهای انتخابی شما یافت نشد.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}