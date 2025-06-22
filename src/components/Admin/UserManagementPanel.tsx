import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Users, UserCheck, UserX, Search, Shield, Star, Clock, Phone, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

const UserManagementPanel = () => {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<MessengerUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MessengerUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = allUsers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    // Filter by tab
    switch (filterTab) {
      case 'pending':
        filtered = filtered.filter(user => !user.is_approved);
        break;
      case 'approved':
        filtered = filtered.filter(user => user.is_approved);
        break;
      case 'support-agents':
        filtered = filtered.filter(user => user.is_support_agent);
        break;
      case 'boundless':
        filtered = filtered.filter(user => user.bedoun_marz || user.bedoun_marz_approved);
        break;
      case 'admins':
        filtered = filtered.filter(user => user.is_messenger_admin);
        break;
    }

    setFilteredUsers(filtered);
  }, [allUsers, searchTerm, filterTab]);

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

  const handleToggleRole = async (userId: number, role: 'is_support_agent' | 'is_messenger_admin' | 'bedoun_marz_approved', currentValue: boolean) => {
    try {
      await messengerService.updateUserRole(userId, { [role]: !currentValue });
      
      const roleNames = {
        is_support_agent: 'پشتیبان',
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
    
    if (user.is_support_agent) {
      badges.push(<Badge key="support" className="bg-purple-100 text-purple-800">پشتیبان</Badge>);
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
      supportAgents: allUsers.filter(u => u.is_support_agent).length,
      boundless: allUsers.filter(u => u.bedoun_marz_approved).length,
      admins: allUsers.filter(u => u.is_messenger_admin).length
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
            <Shield className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{stats.supportAgents}</p>
            <p className="text-sm text-slate-600">پشتیبان</p>
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
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{stats.admins}</p>
            <p className="text-sm text-slate-600">مدیر</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>در حال بارگذاری کاربران...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {getStatsCards()}
      
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="جستجو بر اساس نام یا شماره تلفن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management Tabs */}
      <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="all">همه ({allUsers.length})</TabsTrigger>
          <TabsTrigger value="pending">در انتظار ({allUsers.filter(u => !u.is_approved).length})</TabsTrigger>
          <TabsTrigger value="approved">تایید شده ({allUsers.filter(u => u.is_approved).length})</TabsTrigger>
          <TabsTrigger value="support-agents">پشتیبان ({allUsers.filter(u => u.is_support_agent).length})</TabsTrigger>
          <TabsTrigger value="boundless">بدون مرز ({allUsers.filter(u => u.bedoun_marz_approved).length})</TabsTrigger>
          <TabsTrigger value="admins">مدیر ({allUsers.filter(u => u.is_messenger_admin).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={filterTab} className="mt-6">
          <Card>
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
                                checked={user.is_support_agent}
                                onCheckedChange={() => handleToggleRole(user.id, 'is_support_agent', user.is_support_agent)}
                              />
                              <span className="text-sm">پشتیبان</span>
                            </div>
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
                            {!user.is_approved ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveUser(user.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectUser(user.id)}
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectUser(user.id)}
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
      </Tabs>
    </div>
  );
};

export default UserManagementPanel;
