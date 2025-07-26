import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Edit, Users, UserCheck, Shield } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import UserEditModal from './UserEditModal';

const UserManagementPanel = () => {
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MessengerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<MessengerUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await messengerService.getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: MessengerUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUserDetails = (userId: number) => {
    window.open(`/enroll/admin/users/${userId}`, '_blank');
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getUserBadges = (user: MessengerUser) => {
    const badges = [];
    
    if (!user.is_approved) {
      badges.push(<Badge key="pending" variant="secondary">در انتظار تایید</Badge>);
    }
    
    if (user.is_messenger_admin) {
      badges.push(<Badge key="admin" variant="default" className="bg-red-500"><Shield className="w-3 h-3 mr-1" />مدیر</Badge>);
    }
    
    if (user.bedoun_marz_approved) {
      badges.push(<Badge key="boundless" variant="default" className="bg-purple-500">بدون مرز</Badge>);
    } else if (user.bedoun_marz_request) {
      badges.push(<Badge key="boundless-pending" variant="outline" className="border-purple-500 text-purple-500">درخواست بدون مرز</Badge>);
    }
    
    return badges;
  };

  const stats = {
    total: users.length,
    approved: users.filter(u => u.is_approved).length,
    pending: users.filter(u => !u.is_approved).length,
    boundless: users.filter(u => u.bedoun_marz_approved).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-slate-500">در حال بارگذاری کاربران...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">کل کاربران</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">تایید شده</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">در انتظار</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Users className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">بدون مرز</p>
                <p className="text-2xl font-bold text-purple-600">{stats.boundless}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>مدیریت کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="جستجو بر اساس نام، شماره تلفن یا نام کاربری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback 
                      style={{ backgroundColor: getAvatarColor(user.name) }}
                      className="text-white font-medium"
                    >
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <button
                      onClick={() => handleViewUserDetails(user.id)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-right"
                    >
                      {user.name}
                    </button>
                    <div className="text-sm text-slate-500">
                      {user.phone}
                      {user.username && ` • @${user.username}`}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {getUserBadges(user)}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  ویرایش
                </Button>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">کاربری یافت نشد</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <UserEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
        onUserUpdate={loadUsers}
      />
    </div>
  );
};

export default UserManagementPanel;
