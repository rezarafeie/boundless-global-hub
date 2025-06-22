
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserCheck, UserX, Search, Edit, Trash2, Shield, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

const UnifiedUserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MessengerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<MessengerUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await messengerService.getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
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

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleToggleRole = async (userId: number, field: 'is_approved' | 'is_support_agent' | 'is_messenger_admin' | 'bedoun_marz_approved', currentValue: boolean) => {
    try {
      const updates = { [field]: !currentValue };
      await messengerService.updateUser(userId, updates);
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, [field]: !currentValue } : user
      ));

      toast({
        title: 'موفق',
        description: 'وضعیت کاربر به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      try {
        // Note: We would need to implement deleteUser in messengerService
        // For now, just show a message
        toast({
          title: 'توجه',
          description: 'قابلیت حذف کاربر در نسخه بعدی اضافه می‌شود',
        });
      } catch (error) {
        toast({
          title: 'خطا',
          description: 'خطا در حذف کاربر',
          variant: 'destructive',
        });
      }
    }
  };

  const stats = {
    total: users.length,
    approved: users.filter(u => u.is_approved).length,
    supportAgents: users.filter(u => u.is_support_agent).length,
    boundless: users.filter(u => u.bedoun_marz_approved).length,
    admins: users.filter(u => u.is_messenger_admin).length,
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-slate-600">کل کاربران</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-slate-600">تایید شده</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.supportAgents}</div>
            <div className="text-sm text-slate-600">پشتیبان</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.boundless}</div>
            <div className="text-sm text-slate-600">بدون مرز</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            <div className="text-sm text-slate-600">مدیر</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            جستجو و فیلتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="جستجو بر اساس نام یا شماره تلفن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>مدیریت کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>شماره تلفن</TableHead>
                <TableHead>تایید شده</TableHead>
                <TableHead>بدون مرز</TableHead>
                <TableHead>پشتیبان</TableHead>
                <TableHead>مدیر</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.name}
                      {user.bedoun_marz_approved && <Star className="w-4 h-4 text-amber-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_approved}
                      onCheckedChange={() => handleToggleRole(user.id, 'is_approved', user.is_approved)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.bedoun_marz_approved}
                      onCheckedChange={() => handleToggleRole(user.id, 'bedoun_marz_approved', user.bedoun_marz_approved)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_support_agent}
                      onCheckedChange={() => handleToggleRole(user.id, 'is_support_agent', user.is_support_agent)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_messenger_admin}
                      onCheckedChange={() => handleToggleRole(user.id, 'is_messenger_admin', user.is_messenger_admin)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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

export default UnifiedUserManagement;
