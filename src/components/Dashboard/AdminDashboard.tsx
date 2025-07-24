
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Activity,
  Clock,
  UserPlus,
  MessageCircle,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalMessages: number;
  totalEnrollments: number;
  todayMessages: number;
  activeUsers: number;
  recentUsers: MessengerUser[];
  recentMessages: MessengerMessage[];
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMessages: 0,
    totalEnrollments: 0,
    todayMessages: 0,
    activeUsers: 0,
    recentUsers: [],
    recentMessages: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch exact counts from database
      const [totalUsersCount, totalMessagesCount, totalEnrollmentsCount] = await Promise.all([
        messengerService.getUsersCount(),
        messengerService.getMessagesCount(),
        messengerService.getEnrollmentsCount()
      ]);

      console.log('Exact counts from database:', {
        users: totalUsersCount,
        messages: totalMessagesCount,
        enrollments: totalEnrollmentsCount
      });

      // Fetch recent data for display (limited to what we need)
      const { data: recentUsersData } = await supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentMessagesData } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      // Calculate today's messages count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayMessagesCount } = await supabase
        .from('messenger_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Calculate active users count (sent messages in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: activeUsersData } = await supabase
        .from('messenger_messages')
        .select('sender_id')
        .gte('created_at', sevenDaysAgo.toISOString())
        .not('sender_id', 'is', null);

      const uniqueActiveUsers = new Set(activeUsersData?.map(msg => msg.sender_id) || []);

      setStats({
        totalUsers: totalUsersCount,
        totalMessages: totalMessagesCount,
        totalEnrollments: totalEnrollmentsCount,
        todayMessages: todayMessagesCount || 0,
        activeUsers: uniqueActiveUsers.size,
        recentUsers: recentUsersData || [],
        recentMessages: recentMessagesData || []
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'خطا در بارگذاری داده‌ها');
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات داشبورد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time updates for new messages and users
    const messagesChannel = supabase
      .channel('dashboard_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messenger_messages' },
        () => fetchDashboardData()
      )
      .subscribe();

    const usersChannel = supabase
      .channel('dashboard_users')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_users' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    return `${diffDays} روز پیش`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            تلاش مجدد
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">خطا در بارگذاری داده‌ها</p>
            <p className="text-sm text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          به‌روزرسانی
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">کل کاربران</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">کل پیام‌ها</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">پیام‌های امروز</p>
                <p className="text-2xl font-bold">{stats.todayMessages}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">کاربران فعال</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">کل ثبت‌نام‌ها</p>
                <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              کاربران جدید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.phone}</p>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      {user.is_approved && <Badge variant="default" className="text-xs">تایید شده</Badge>}
                      {user.bedoun_marz && <Badge variant="secondary" className="text-xs">بدون مرز</Badge>}
                      {user.is_messenger_admin && <Badge variant="destructive" className="text-xs">مدیر</Badge>}
                    </div>
                    <p className="text-xs text-slate-400">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {getTimeAgo(user.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              پیام‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentMessages.map((message) => (
                <div key={message.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm">{message.sender?.name || 'نامشخص'}</p>
                    <p className="text-xs text-slate-400">
                      {getTimeAgo(message.created_at)}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {message.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {message.room_id && (
                      <Badge variant="outline" className="text-xs">
                        اتاق: {message.room_id}
                      </Badge>
                    )}
                    {message.conversation_id && (
                      <Badge variant="secondary" className="text-xs">
                        پشتیبانی
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
