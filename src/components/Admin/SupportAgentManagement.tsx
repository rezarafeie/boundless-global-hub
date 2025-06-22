
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { UserCheck, UserX, MessageCircle, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

const SupportAgentManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await messengerService.getApprovedUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری کاربران',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSupportAgent = async (userId: number, isCurrentlyAgent: boolean) => {
    setUpdating(userId);
    try {
      await messengerService.updateUserRole(userId, { is_support_agent: !isCurrentlyAgent });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_support_agent: !isCurrentlyAgent }
          : user
      ));

      toast({
        title: 'موفق',
        description: isCurrentlyAgent 
          ? 'کاربر از تیم پشتیبانی حذف شد' 
          : 'کاربر به تیم پشتیبانی اضافه شد',
      });
    } catch (error) {
      console.error('Error updating support agent status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت پشتیبان',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleMessengerAdmin = async (userId: number, isCurrentlyAdmin: boolean) => {
    setUpdating(userId);
    try {
      await messengerService.updateUserRole(userId, { is_messenger_admin: !isCurrentlyAdmin });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_messenger_admin: !isCurrentlyAdmin }
          : user
      ));

      toast({
        title: 'موفق',
        description: isCurrentlyAdmin 
          ? 'کاربر از مدیریت مسنجر حذف شد' 
          : 'کاربر به عنوان مدیر مسنجر انتخاب شد',
      });
    } catch (error) {
      console.error('Error updating messenger admin status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت مدیر مسنجر',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const supportAgents = users.filter(user => user.is_support_agent);
  const messengerAdmins = users.filter(user => user.is_messenger_admin);
  const regularUsers = users.filter(user => !user.is_support_agent && !user.is_messenger_admin);

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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پشتیبانان فعال</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{supportAgents.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مدیران مسنجر</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{messengerAdmins.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران عادی</CardTitle>
            <MessageCircle className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* All Users Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            مدیریت نقش‌های کاربران
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>شماره تلفن</TableHead>
                <TableHead>تاریخ عضویت</TableHead>
                <TableHead>وضعیت بدون مرز</TableHead>
                <TableHead>پشتیبان</TableHead>
                <TableHead>مدیر مسنجر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('fa-IR')}
                  </TableCell>
                  <TableCell>
                    {user.bedoun_marz_approved ? (
                      <Badge variant="secondary">بدون مرز</Badge>
                    ) : (
                      <Badge variant="outline">عادی</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_support_agent}
                        onCheckedChange={() => handleToggleSupportAgent(user.id, user.is_support_agent)}
                        disabled={updating === user.id}
                      />
                      {user.is_support_agent && (
                        <Badge className="bg-green-100 text-green-800">
                          پشتیبان
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_messenger_admin}
                        onCheckedChange={() => handleToggleMessengerAdmin(user.id, user.is_messenger_admin)}
                        disabled={updating === user.id}
                      />
                      {user.is_messenger_admin && (
                        <Badge className="bg-purple-100 text-purple-800">
                          مدیر مسنجر
                        </Badge>
                      )}
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

export default SupportAgentManagement;
