
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Users, User, Phone, Calendar, CheckCircle, Clock, Star, Shield } from 'lucide-react';
import type { ChatUser } from '@/lib/supabase';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userList = await chatUserService.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری لیست کاربران',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (userId: number, currentStatus: boolean) => {
    try {
      await chatUserService.updateUser(userId, { 
        is_approved: !currentStatus,
        updated_at: new Date().toISOString()
      });
      await loadUsers();
      
      toast({
        title: 'موفق',
        description: currentStatus ? 'دسترسی کاربر لغو شد' : 'کاربر تایید شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBedounMarz = async (userId: number, currentStatus: boolean) => {
    try {
      await chatUserService.updateUser(userId, { 
        bedoun_marz_approved: !currentStatus,
        updated_at: new Date().toISOString()
      });
      await loadUsers();
      
      toast({
        title: 'موفق',
        description: currentStatus ? 'دسترسی بدون مرز لغو شد' : 'دسترسی بدون مرز تایید شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر دسترسی بدون مرز',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-300">در حال بارگذاری کاربران...</p>
        </CardContent>
      </Card>
    );
  }

  const pendingUsers = users.filter(user => !user.is_approved);
  const approvedUsers = users.filter(user => user.is_approved);
  const bedounMarzRequests = users.filter(user => user.bedoun_marz_request && !user.bedoun_marz_approved);
  const bedounMarzApproved = users.filter(user => user.bedoun_marz_approved);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              در انتظار تایید
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-amber-600">{pendingUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              کاربران تایید شده
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">{approvedUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Star className="w-4 h-4" />
              درخواست بدون مرز
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-600">{bedounMarzRequests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              دسترسی بدون مرز
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">{bedounMarzApproved.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Clock className="w-5 h-5" />
              کاربران در انتظار تایید ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map((user) => (
                <Card key={user.id} className="border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-8 h-8 text-amber-500" />
                        <div>
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </p>
                        </div>
                      </div>
                      {user.bedoun_marz_request && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Star className="w-3 h-3 mr-1" />
                          بدون مرز
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString('fa-IR')}
                      </p>
                      <Button
                        onClick={() => handleToggleApproval(user.id, user.is_approved)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        تایید
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bedoun Marz Requests */}
      {bedounMarzRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Star className="w-5 h-5" />
              درخواست‌های دسترسی بدون مرز ({bedounMarzRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bedounMarzRequests.map((user) => (
                <Card key={user.id} className="border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <Badge variant={user.is_approved ? "default" : "secondary"}>
                        {user.is_approved ? 'تایید شده' : 'در انتظار تایید'}
                      </Badge>
                      <Button
                        onClick={() => handleToggleBedounMarz(user.id, user.bedoun_marz_approved)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                        disabled={!user.is_approved}
                      >
                        تایید بدون مرز
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            تمام کاربران ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">
                هنوز کاربری ثبت‌نام نکرده است
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          user.bedoun_marz_approved 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                            : user.is_approved 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'bg-gradient-to-r from-gray-400 to-gray-600'
                        }`}>
                          {user.bedoun_marz_approved ? (
                            <Star className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {user.name}
                            {user.bedoun_marz_approved && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                <Star className="w-3 h-3 mr-1" />
                                بدون مرز
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            عضویت: {new Date(user.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`approval-${user.id}`} className="text-sm">
                            تایید دسترسی
                          </Label>
                          <Switch
                            id={`approval-${user.id}`}
                            checked={user.is_approved}
                            onCheckedChange={() => handleToggleApproval(user.id, user.is_approved)}
                          />
                        </div>
                        
                        {user.bedoun_marz_request && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`bedoun-marz-${user.id}`} className="text-sm">
                              بدون مرز
                            </Label>
                            <Switch
                              id={`bedoun-marz-${user.id}`}
                              checked={user.bedoun_marz_approved}
                              onCheckedChange={() => handleToggleBedounMarz(user.id, user.bedoun_marz_approved)}
                              disabled={!user.is_approved}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
