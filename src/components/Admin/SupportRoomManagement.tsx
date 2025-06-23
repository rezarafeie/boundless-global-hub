
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
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<SupportRoom | null>(null);
  const [managingAgents, setManagingAgents] = useState<SupportRoom | null>(null);
  const [roomAgents, setRoomAgents] = useState<SupportRoomAgent[]>([]);

  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    icon: 'headphones',
    color: '#3B82F6',
    permissions: ['approved'] as string[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsData, agentsData] = await Promise.all([
        supportRoomService.getAllSupportRooms(),
        messengerService.getAllUsers().then(users => users.filter(u => u.is_support_agent))
      ]);
      
      setSupportRooms(roomsData);
      setSupportAgents(agentsData);
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

  const handleCreateRoom = async () => {
    try {
      const roomData = {
        name: newRoom.name,
        description: newRoom.description,
        icon: newRoom.icon,
        color: newRoom.color,
        created_by: 1 // Replace with actual admin user ID
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
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد اتاق پشتیبانی',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await supportRoomService.deleteSupportRoom(roomId);
      toast({
        title: 'موفق',
        description: 'اتاق پشتیبانی حذف شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف اتاق پشتیبانی',
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
    if (!managingAgents) return;

    try {
      await supportRoomService.assignAgentToRoom(managingAgents.id, agentId, 1);
      toast({
        title: 'موفق',
        description: 'پشتیبان اختصاص داده شد',
      });
      
      const agents = await supportRoomService.getRoomAgents(managingAgents.id);
      setRoomAgents(agents);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در اختصاص پشتیبان',
        variant: 'destructive',
      });
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
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف پشتیبان',
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
                <label className="text-sm font-medium">نام اتاق</label>
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
                <label className="text-sm font-medium">دسترسی‌ها</label>
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
                <Button onClick={handleCreateRoom} disabled={!newRoom.name}>
                  ایجاد اتاق
                </Button>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  لغو
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                      <Button variant="outline" size="sm">
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
                        onClick={() => handleAssignAgent(agent.id)}
                      >
                        اختصاص
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
