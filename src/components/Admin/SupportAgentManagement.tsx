
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { UserCheck, UserX, MessageCircle, Users } from 'lucide-react';
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

  const supportAgents = users.filter(user => user.is_support_agent);
  const regularUsers = users.filter(user => !user.is_support_agent);

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
      {/* Support Agents Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">کاربران عادی</CardTitle>
            <MessageCircle className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Support Agents */}
      {supportAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              پشتیبانان فعال ({supportAgents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                {supportAgents.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('fa-IR')}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        پشتیبان فعال
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={true}
                        onCheckedChange={() => handleToggleSupportAgent(user.id, true)}
                        disabled={updating === user.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Regular Users - Assign as Support Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            کاربران عادی - انتخاب پشتیبان ({regularUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regularUsers.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              همه کاربران تایید شده به عنوان پشتیبان انتخاب شده‌اند
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>شماره تلفن</TableHead>
                  <TableHead>تاریخ عضویت</TableHead>
                  <TableHead>وضعیت بدون مرز</TableHead>
                  <TableHead>انتخاب به عنوان پشتیبان</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularUsers.map((user) => (
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
                          checked={false}
                          onCheckedChange={() => handleToggleSupportAgent(user.id, false)}
                          disabled={updating === user.id}
                        />
                        <span className="text-sm text-slate-600">
                          {updating === user.id ? 'در حال به‌روزرسانی...' : 'انتخاب'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportAgentManagement;
