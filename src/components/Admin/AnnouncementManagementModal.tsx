
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Announcement } from '@/types/supabase';

interface AnnouncementManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnnouncementManagementModal: React.FC<AnnouncementManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    summary: '',
    full_text: '',
    type: 'general' as 'general' | 'urgent' | 'technical' | 'educational',
    is_pinned: false,
    media_type: 'none' as 'none' | 'image' | 'video' | 'audio' | 'iframe',
    media_url: '',
    media_content: ''
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اعلانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.summary.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفا عنوان و خلاصه را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const { error } = await supabase
        .from('announcements')
        .insert([newAnnouncement]);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'اعلان جدید ایجاد شد',
      });

      setNewAnnouncement({
        title: '',
        summary: '',
        full_text: '',
        type: 'general',
        is_pinned: false,
        media_type: 'none',
        media_url: '',
        media_content: ''
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد اعلان',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'اعلان حذف شد',
      });

      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف اعلان',
        variant: 'destructive',
      });
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return <Badge variant="destructive">🚨 فوری</Badge>;
      case 'technical':
        return <Badge variant="secondary">🔧 فنی</Badge>;
      case 'educational':
        return <Badge variant="outline">📚 آموزشی</Badge>;
      default:
        return <Badge variant="secondary">📝 عمومی</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مدیریت اعلانات</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Announcement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                ایجاد اعلان جدید
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">عنوان *</label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="عنوان اعلان"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">نوع</label>
                  <Select value={newAnnouncement.type} onValueChange={(value: 'general' | 'urgent' | 'technical' | 'educational') => setNewAnnouncement({ ...newAnnouncement, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عمومی</SelectItem>
                      <SelectItem value="urgent">فوری</SelectItem>
                      <SelectItem value="technical">فنی</SelectItem>
                      <SelectItem value="educational">آموزشی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">خلاصه *</label>
                <Textarea
                  value={newAnnouncement.summary}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, summary: e.target.value })}
                  placeholder="خلاصه اعلان"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">متن کامل</label>
                <Textarea
                  value={newAnnouncement.full_text}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, full_text: e.target.value })}
                  placeholder="متن کامل اعلان"
                  rows={4}
                />
              </div>

              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'در حال ایجاد...' : 'ایجاد اعلان'}
              </Button>
            </CardContent>
          </Card>

          {/* Announcements List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>لیست اعلانات ({announcements.length})</span>
                <Button onClick={fetchAnnouncements} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  به‌روزرسانی
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>در حال بارگذاری...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  هیچ اعلانی یافت نشد
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>عنوان</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>بازدید</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((announcement) => (
                      <TableRow key={announcement.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{announcement.title}</p>
                            <p className="text-sm text-slate-500 truncate max-w-xs">
                              {announcement.summary}
                            </p>
                            {announcement.is_pinned && (
                              <Badge variant="outline" className="text-xs mt-1">
                                📌 سنجاق شده
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(announcement.type)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {announcement.views}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(announcement.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementManagementModal;
