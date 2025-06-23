
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Settings, Users, Shield, Edit, Trash2, Crown, Headphones, Phone, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportRoomService, type SupportRoom, type SupportRoomAgent } from '@/lib/supportRoomService';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { getIconComponent } from './SupportRoomManagementHelpers';

const AVAILABLE_ICONS = [
  { icon: 'headphones', label: 'هدفون' },
  { icon: 'phone', label: 'تلفن' },
  { icon: 'message-circle', label: 'پیام' },
  { icon: 'crown', label: 'تاج' },
  { icon: 'shield', label: 'سپر' },
  { icon: 'users', label: 'کاربران' }
];

const USER_ROLES = [
  { value: 'all', label: 'همه کاربران' },
  { value: 'approved', label: 'کاربران تایید شده' },
  { value: 'boundless', label: 'اعضای بدون مرز' },
  { value: 'admin', label: 'مدیران' }
];

const SupportRoomManagement = () => {
  const { toast } = useToast();
  const [supportRooms, setSupportRooms] = useState<SupportRoom[]>([]);
  const [supportAgents, setSupportAgents] = useState<MessengerUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<MessengerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<SupportRoom | null>(null);
  const [managingAgents, setManagingAgents] = useState<SupportRoom | null>(null);
  const [roomAgents, setRoomAgents] = useState<SupportRoomAgent[]>([]);
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [updatingRoom, setUpdatingRoom] = useState(false);

  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    icon: 'headphones',
    color: '#3B82F6',
    permissions: ['approved'] as string[]
  });

  const [editRoom, setEditRoom] = useState({
    name: '',
    description: '',
    icon: 'headphones',
    color: '#3B82F6',
    permissions: ['approved'] as string[]
  });

  const getCurrentAdmin = async () => {
    try {
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('لطفاً ابتدا وارد شوید');
      }

      const result = await messengerService.validateSession(sessionToken);
      if (!result || !result.user.is_messenger_admin) {
        throw new Error('شما دسترسی مدیریتی ندارید');
      }

      setCurrentAdmin(result.user);
      return result.user;
    } catch (error: any) {
      console.error('Admin access error:', error);
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsData, agentsData, adminUser] = await Promise.all([
        supportRoomService.getAllSupportRooms(),
        messengerService.getAllUsers().then(users => users.filter(u => u.is_support_agent)),
        getCurrentAdmin()
      ]);
      
      setSupportRooms(roomsData);
      setSupportAgents(agentsData);
      
      if (!adminUser) {
        return;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validateRoomForm = (roomData: typeof newRoom) => {
    if (!roomData.name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام اتاق الزامی است',
        variant: 'destructive',
      });
      return false;
    }

    if (roomData.permissions.length === 0) {
      toast({
        title: 'خطا',
        description: 'حداقل یک نقش باید انتخاب شود',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleCreateRoom = async () => {
    if (!validateRoomForm(newRoom) || !currentAdmin) return;

    try {
      setCreatingRoom(true);
      const roomData = {
        name: newRoom.name.trim(),
        description: newRoom.description.trim(),
        icon: newRoom.icon,
        color: newRoom.color,
        created_by: currentAdmin.id
      };

      const createdRoom = await supportRoomService.createSupportRoom(roomData);
      
      // Set permissions
      const permissions = newRoom.permissions.map(role => ({
        user_role: role,
        can_access: true
      }));
      
      await supportRoomService.setRoomPermissions(createdRoom.id, permissions);

      toast({
        title: 'موفق',
        description: 'اتاق پشتیبانی با موفقیت ایجاد شد',
      });

      setCreateDialogOpen(false);
      setNewRoom({
        name: '',
        description: '',
        icon: 'headphones',
        color: '#3B82F6',
        permissions: ['approved']
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ایجاد اتاق پشتیبانی',
        variant: 'destructive',
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleEditRoom = (room: SupportRoom) => {
    setEditingRoom(room);
    setEditRoom({
      name: room.name,
      description: room.description || '',
      icon: room.icon,
      color: room.color,
      permissions: ['approved'] // We'll load actual permissions later
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRoom = async () => {
    if (!validateRoomForm(editRoom) || !editingRoom) return;

    try {
      setUpdatingRoom(true);
      const updates = {
        name: editRoom.name.trim(),
        description: editRoom.description.trim(),
        icon: editRoom.icon,
        color: editRoom.color
      };

      await supportRoomService.updateSupportRoom(editingRoom.id, updates);
      
      // Update permissions
      const permissions = editRoom.permissions.map(role => ({
        user_role: role,
        can_access: true
      }));
      
      await supportRoomService.setRoomPermissions(editingRoom.id, permissions);

      toast({
        title: 'موفق',
        description: 'اتاق پشتیبانی با موفقیت به‌روزرسانی شد',
      });

      setEditDialogOpen(false);
      setEditingRoom(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در به‌روزرسانی اتاق پشتیبانی',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!currentAdmin) return;

    try {
      await supportRoomService.deleteSupportRoom(roomId);
      toast({
        title: 'موفق',
        description: 'اتاق پشتیبانی حذف شد',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف اتاق پشتیبانی',
        variant: 'destructive',
      });
    }
  };

  const handleManageAgents = async (room: SupportRoom) => {
    setManagingAgents(room);
    try {
      const agents = await supportRoomService.getRoomAgents(room.id);
      setRoomAgents(agents);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات پشتیبان‌ها',
        variant: 'destructive',
      });
    }
  };

  const handleAssignAgent = async (agentId: number) => {
    if (!managingAgents || !currentAdmin) return;

    // Check if agent is already assigned
    if (roomAgents.some(agent => agent.agent_id === agentId)) {
      toast({
        title: 'اخطار',
        description: 'این پشتیبان قبلاً اختصاص داده شده است',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAssigningAgent(true);
      await supportRoomService.assignAgentToRoom(managingAgents.id, agentId, currentAdmin.id);
      toast({
        title: 'موفق',
        description: 'پشتیبان با موفقیت اختصاص داده شد',
      });
      
      const agents = await supportRoomService.getRoomAgents(managingAgents.id);
      setRoomAgents(agents);
    } catch (error: any) {
      console.error('Error assigning agent:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در اختصاص پشتیبان',
        variant: 'destructive',
      });
    } finally {
      setAssigningAgent(false);
    }
  };

  const handleRemoveAgent = async (agentId: number) => {
    if (!managingAgents) return;

    try {
      await supportRoomService.removeAgentFromRoom(managingAgents.id, agentId);
      toast({
        title: 'موفق',
        description: 'پشتیبان حذف شد',
      });
      
      const agents = await supportRoomService.getRoomAgents(managingAgents.id);
      setRoomAgents(agents);
    } catch (error: any) {
      console.error('Error removing agent:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف پشتیبان',
        variant: 'destructive',
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'crown': return <Crown className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'message-circle': return <MessageCircle className="w-4 h-4" />;
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      default: return <Headphones className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>در حال بارگذاری اتاق‌های پشتیبانی...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">شما دسترسی مدیریتی ندارید</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">مدیریت اتاق‌های پشتیبانی</h2>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              ایجاد اتاق جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ایجاد اتاق پشتیبانی جدید</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">نام اتاق *</label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="نام اتاق پشتیبانی"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">توضیحات</label>
                <Textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="توضیحات اتاق"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">آیکون</label>
                <Select value={newRoom.icon} onValueChange={(value) => setNewRoom({ ...newRoom, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon.icon} value={icon.icon}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">دسترسی‌ها *</label>
                <div className="space-y-2 mt-2">
                  {USER_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newRoom.permissions.includes(role.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRoom({
                              ...newRoom,
                              permissions: [...newRoom.permissions, role.value]
                            });
                          } else {
                            setNewRoom({
                              ...newRoom,
                              permissions: newRoom.permissions.filter(p => p !== role.value)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{role.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleCreateRoom} disabled={creatingRoom}>
                  {creatingRoom ? 'در حال ایجاد...' : 'ایجاد اتاق'}
                </Button>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  لغو
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش اتاق پشتیبانی</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">نام اتاق *</label>
              <Input
                value={editRoom.name}
                onChange={(e) => setEditRoom({ ...editRoom, name: e.target.value })}
                placeholder="نام اتاق پشتیبانی"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={editRoom.description}
                onChange={(e) => setEditRoom({ ...editRoom, description: e.target.value })}
                placeholder="توضیحات اتاق"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">آیکون</label>
              <Select value={editRoom.icon} onValueChange={(value) => setEditRoom({ ...editRoom, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon.icon} value={icon.icon}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">دسترسی‌ها *</label>
              <div className="space-y-2 mt-2">
                {USER_ROLES.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={editRoom.permissions.includes(role.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditRoom({
                            ...editRoom,
                            permissions: [...editRoom.permissions, role.value]
                          });
                        } else {
                          setEditRoom({
                            ...editRoom,
                            permissions: editRoom.permissions.filter(p => p !== role.value)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{role.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleUpdateRoom} disabled={updatingRoom}>
                {updatingRoom ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                لغو
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>اتاق‌های پشتیبانی ({supportRooms.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام اتاق</TableHead>
                <TableHead>توضیحات</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>پشتیبان‌ها</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supportRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${room.color}20` }}
                      >
                        {getIconComponent(room.icon)}
                      </div>
                      <div>
                        <p className="font-medium">{room.name}</p>
                        {room.is_default && (
                          <Badge variant="outline" className="text-xs">پیش‌فرض</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{room.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={room.is_active ? 'default' : 'secondary'}>
                      {room.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageAgents(room)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      مدیریت
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRoom(room)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!room.is_default && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agent Management Dialog */}
      <Dialog open={!!managingAgents} onOpenChange={(open) => !open && setManagingAgents(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>مدیریت پشتیبان‌های {managingAgents?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Assigned Agents */}
            <div>
              <h3 className="font-medium mb-2">پشتیبان‌های اختصاص یافته</h3>
              {roomAgents.length > 0 ? (
                <div className="space-y-2">
                  {roomAgents.map((agent) => (
                    <div key={agent.agent_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{agent.agent_name}</p>
                        <p className="text-sm text-slate-500">{agent.agent_phone}</p>
                        <p className="text-xs text-slate-400">
                          {agent.conversation_count} گفتگوی فعال
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAgent(agent.agent_id)}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">هیچ پشتیبانی اختصاص نیافته</p>
              )}
            </div>
            
            {/* Available Agents */}
            <div>
              <h3 className="font-medium mb-2">پشتیبان‌های موجود</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {supportAgents
                  .filter(agent => !roomAgents.some(ra => ra.agent_id === agent.id))
                  .map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-slate-500">{agent.phone}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={assigningAgent}
                        onClick={() => handleAssignAgent(agent.id)}
                      >
                        {assigningAgent ? 'در حال اختصاص...' : 'اختصاص'}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportRoomManagement;
