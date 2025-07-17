import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, Edit2, Trash2, Plus, Crown, Building2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatRoom } from '@/lib/messengerService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RoomManagementProps {
  currentUser?: any;
  sessionToken?: string;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ currentUser, sessionToken }) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  
  // Create/Edit form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'group' as 'group' | 'super_group',
    is_super_group: false,
    is_boundless_only: false,
    avatar_url: ''
  });

  useEffect(() => {
    if (currentUser?.is_messenger_admin) {
      loadRooms();
    }
  }, [currentUser]);

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری گروه‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'group',
      is_super_group: false,
      is_boundless_only: false,
      avatar_url: ''
    });
  };

  const handleCreateRoom = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام گروه الزامی است',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          is_super_group: formData.is_super_group,
          is_boundless_only: formData.is_boundless_only,
          avatar_url: formData.avatar_url || null,
          is_active: true
        });

      if (error) throw error;
      
      toast({
        title: 'موفق',
        description: 'گروه جدید ایجاد شد',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد گروه',
        variant: 'destructive',
      });
    }
  };

  const handleEditRoom = async () => {
    if (!formData.name.trim() || !editingRoom) {
      toast({
        title: 'خطا',
        description: 'نام گروه الزامی است',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          is_super_group: formData.is_super_group,
          is_boundless_only: formData.is_boundless_only,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRoom.id);

      if (error) throw error;
      
      toast({
        title: 'موفق',
        description: 'گروه ویرایش شد',
      });

      setEditingRoom(null);
      resetForm();
      loadRooms();
    } catch (error) {
      console.error('Error editing room:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ویرایش گروه',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (!confirm(`آیا از حذف گروه "${roomName}" مطمئن هستید؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) throw error;
      
      toast({
        title: 'موفق',
        description: 'گروه حذف شد',
      });

      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف گروه',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (room: ChatRoom) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || '',
      type: room.type as 'group' | 'super_group',
      is_super_group: room.is_super_group || false,
      is_boundless_only: room.is_boundless_only || false,
      avatar_url: room.avatar_url || ''
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: 'موفق',
        description: 'آواتار آپلود شد',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'خطا',
        description: 'خطا در آپلود آواتار',
        variant: 'destructive',
      });
    }
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  if (!currentUser?.is_messenger_admin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">شما دسترسی ادمین ندارید</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">در حال بارگذاری گروه‌ها...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          🏢 مدیریت گروه‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Room Button */}
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-slate-900 dark:text-white">
            گروه‌های موجود ({rooms.length})
          </h4>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 ml-1" />
                افزودن گروه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ایجاد گروه جدید</DialogTitle>
                <DialogDescription>
                  اطلاعات گروه جدید را وارد کنید
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نام گروه</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="نام گروه..."
                  />
                </div>
                <div>
                  <Label>توضیحات</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="توضیحات گروه..."
                  />
                </div>
                <div>
                  <Label>آواتار گروه</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="flex-1"
                    />
                    {formData.avatar_url && (
                      <img src={formData.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_super_group}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_super_group: checked, type: checked ? 'super_group' : 'group' }))}
                  />
                  <Label>سوپر گروه (با قابلیت موضوعات)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_boundless_only}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_boundless_only: checked }))}
                  />
                  <Label>فقط برای اعضای بدون مرز</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateRoom} className="flex-1">
                    ایجاد گروه
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    لغو
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms List */}
        <div className="space-y-3">
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              هیچ گروهی یافت نشد
            </div>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  {editingRoom?.id === room.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label>نام گروه</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="نام گروه..."
                        />
                      </div>
                      <div>
                        <Label>توضیحات</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="توضیحات گروه..."
                        />
                      </div>
                       <div>
                         <Label>آواتار گروه</Label>
                         <div className="flex items-center gap-2">
                           <Input
                             type="file"
                             accept="image/*"
                             onChange={handleAvatarUpload}
                             className="flex-1"
                           />
                           {formData.avatar_url && (
                             <img src={formData.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                           )}
                         </div>
                       </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.is_super_group}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_super_group: checked, type: checked ? 'super_group' : 'group' }))}
                        />
                        <Label>سوپر گروه (با قابلیت موضوعات)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.is_boundless_only}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_boundless_only: checked }))}
                        />
                        <Label>فقط برای اعضای بدون مرز</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleEditRoom} className="bg-green-600 hover:bg-green-700">
                          ذخیره
                        </Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          لغو
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          {room.avatar_url ? (
                            <img src={room.avatar_url} alt={room.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {room.name}
                            </span>
                            {room.is_super_group && (
                              <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">
                                <Crown className="w-3 h-3 mr-1" />
                                سوپر گروه
                              </Badge>
                            )}
                            {room.is_boundless_only && (
                              <Badge variant="secondary">
                                بدون مرز
                              </Badge>
                            )}
                          </div>
                          {room.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {room.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>نوع: {room.type}</span>
                            <span>•</span>
                            <span>ID: {room.id}</span>
                            <span>•</span>
                            <span>ایجاد شده: {new Date(room.created_at).toLocaleDateString('fa-IR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(room)}
                        >
                          <Edit2 className="w-3 h-3 ml-1" />
                          ویرایش
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRoom(room.id, room.name)}
                        >
                          <Trash2 className="w-3 h-3 ml-1" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomManagement;