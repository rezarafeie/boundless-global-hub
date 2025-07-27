
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit2, Trash2, User, Phone, Mail, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CRMNote {
  id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  user_id: number;
  course_id?: string;
}

interface EnrollmentCRMProps {
  userId: number;
  userInfo?: {
    name: string;
    phone: string;
    email: string;
  };
}

export function EnrollmentCRM({ userId, userInfo }: EnrollmentCRMProps) {
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<CRMNote | null>(null);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'general',
    status: 'در انتظار پرداخت'
  });
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [canAccessCRM, setCanAccessCRM] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    checkCRMAccess();
    fetchUserEnrollments();
    fetchNotes();
  }, [userId]);

  const checkCRMAccess = async () => {
    try {
      // Check if user has admin role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      const isAdmin = userRoles?.some(role => role.role_name === 'admin');
      const isSalesAgent = userRoles?.some(role => role.role_name === 'sales_agent');

      if (isAdmin) {
        setCanAccessCRM(true);
        return;
      }

      if (isSalesAgent) {
        // Check if sales agent has any assigned leads for this user
        const { data: assignedLeads } = await supabase
          .rpc('check_sales_agent_lead_access', {
            agent_id: user?.id,
            target_user_id: userId
          })
          .then(result => {
            if (result.error) {
              console.log('Lead access check function not found, allowing access for now');
              return { data: true };
            }
            return result;
          });

        setCanAccessCRM(assignedLeads || false);
      }
    } catch (error) {
      console.error('Error checking CRM access:', error);
      setCanAccessCRM(false);
    }
  };

  const fetchUserEnrollments = async () => {
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          payment_status,
          payment_amount,
          created_at,
          courses(title)
        `)
        .eq('chat_user_id', userId);

      setUserEnrollments(enrollments || []);
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
    }
  };

  const fetchNotes = async () => {
    if (!canAccessCRM) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching CRM notes:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری یادداشت‌ها.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: userId,
          content: newNote.content,
          type: newNote.type,
          status: newNote.status,
          created_by: user?.name || 'Unknown User'
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت با موفقیت اضافه شد."
      });

      setNewNote({ content: '', type: 'general', status: 'در انتظار پرداخت' });
      setIsAddingNote(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن یادداشت.",
        variant: "destructive"
      });
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !editingNote.content.trim()) return;

    try {
      const { error } = await supabase
        .from('crm_notes')
        .update({
          content: editingNote.content,
          type: editingNote.type,
          status: editingNote.status
        })
        .eq('id', editingNote.id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت با موفقیت به‌روزرسانی شد."
      });

      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی یادداشت.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت با موفقیت حذف شد."
      });

      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف یادداشت.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'در انتظار پرداخت': 'bg-yellow-100 text-yellow-800',
      'پرداخت شده': 'bg-green-100 text-green-800',
      'لغو شده': 'bg-red-100 text-red-800',
      'در حال پیگیری': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-gray-100 text-gray-800',
      'payment': 'bg-green-100 text-green-800',
      'support': 'bg-blue-100 text-blue-800',
      'sales': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (!canAccessCRM) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            شما به این بخش دسترسی ندارید.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* User Info */}
      {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              اطلاعات کاربر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">نام:</span>
                <span>{userInfo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">تلفن:</span>
                <span>{userInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">ایمیل:</span>
                <span>{userInfo.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            ثبت‌نام‌های کاربر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userEnrollments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              هیچ ثبت‌نامی یافت نشد.
            </div>
          ) : (
            <div className="space-y-3">
              {userEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{enrollment.courses?.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(enrollment.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={enrollment.payment_status === 'completed' ? 'default' : 'secondary'}>
                      {enrollment.payment_status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('fa-IR').format(enrollment.payment_amount)} تومان
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRM Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>یادداشت‌های CRM</CardTitle>
            <Button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              افزودن یادداشت
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Note Form */}
          {isAddingNote && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">نوع یادداشت</Label>
                    <Select value={newNote.type} onValueChange={(value) => setNewNote({...newNote, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">عمومی</SelectItem>
                        <SelectItem value="payment">پرداخت</SelectItem>
                        <SelectItem value="support">پشتیبانی</SelectItem>
                        <SelectItem value="sales">فروش</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">وضعیت</Label>
                    <Select value={newNote.status} onValueChange={(value) => setNewNote({...newNote, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="در انتظار پرداخت">در انتظار پرداخت</SelectItem>
                        <SelectItem value="پرداخت شده">پرداخت شده</SelectItem>
                        <SelectItem value="لغو شده">لغو شده</SelectItem>
                        <SelectItem value="در حال پیگیری">در حال پیگیری</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="content">محتوای یادداشت</Label>
                  <Textarea
                    id="content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    placeholder="متن یادداشت را وارد کنید..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} disabled={!newNote.content.trim()}>
                    ذخیره
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                    لغو
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ یادداشتی یافت نشد.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4">
                  {editingNote?.id === note.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select value={editingNote.type} onValueChange={(value) => setEditingNote({...editingNote, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">عمومی</SelectItem>
                            <SelectItem value="payment">پرداخت</SelectItem>
                            <SelectItem value="support">پشتیبانی</SelectItem>
                            <SelectItem value="sales">فروش</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={editingNote.status} onValueChange={(value) => setEditingNote({...editingNote, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="در انتظار پرداخت">در انتظار پرداخت</SelectItem>
                            <SelectItem value="پرداخت شده">پرداخت شده</SelectItem>
                            <SelectItem value="لغو شده">لغو شده</SelectItem>
                            <SelectItem value="در حال پیگیری">در حال پیگیری</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        value={editingNote.content}
                        onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleEditNote}>ذخیره</Button>
                        <Button variant="outline" onClick={() => setEditingNote(null)}>لغو</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(note.type)}>
                            {note.type}
                          </Badge>
                          <Badge className={getStatusColor(note.status)}>
                            {note.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNote(note)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{note.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(note.created_at).toLocaleDateString('fa-IR')}
                        </div>
                        <div>توسط: {note.created_by}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
