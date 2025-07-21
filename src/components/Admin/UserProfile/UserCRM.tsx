import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Phone, FileText, Trash2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CRMNote {
  id: string;
  type: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UserCRMProps {
  userId: number;
}

export function UserCRM({ userId }: UserCRMProps) {
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ type: 'note', content: '' });
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const fetchNotes = async () => {
    try {
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
        description: "خطا در بارگذاری یادداشت‌های CRM.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: userId,
          type: newNote.type,
          content: newNote.content,
          created_by: 'مدیر' // You might want to get this from current user context
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت CRM با موفقیت اضافه شد."
      });

      setNewNote({ type: 'note', content: '' });
      setIsAddingNote(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding CRM note:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن یادداشت CRM.",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت CRM با موفقیت حذف شد."
      });

      fetchNotes();
    } catch (error) {
      console.error('Error deleting CRM note:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف یادداشت CRM.",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'message':
        return <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <FileText className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      note: 'default',
      call: 'secondary',
      message: 'outline'
    };
    
    const typeLabels: Record<string, string> = {
      note: 'یادداشت',
      call: 'تماس',
      message: 'پیام'
    };
    
    return <Badge variant={variants[type] || 'default'} className="text-xs">{typeLabels[type] || type}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotes = filterType === 'all' 
    ? notes 
    : notes.filter(note => note.type === filterType);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              فعالیت‌های CRM ({filteredNotes.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="فیلتر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  <SelectItem value="note">یادداشت‌ها</SelectItem>
                  <SelectItem value="call">تماس‌ها</SelectItem>
                  <SelectItem value="message">پیام‌ها</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" size="sm">
                    <Plus className="w-4 h-4" />
                    افزودن یادداشت
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>افزودن یادداشت CRM</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <Label htmlFor="type">نوع</Label>
                      <Select value={newNote.type} onValueChange={(value) => setNewNote({...newNote, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">یادداشت</SelectItem>
                          <SelectItem value="call">گزارش تماس</SelectItem>
                          <SelectItem value="message">پیام</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="content">محتوا</Label>
                      <Textarea
                        id="content"
                        placeholder="محتوای یادداشت خود را وارد کنید..."
                        value={newNote.content}
                        onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                        لغو
                      </Button>
                      <Button onClick={addNote}>
                        افزودن یادداشت
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ فعالیت CRM یافت نشد.
              {filterType !== 'all' && (
                <p className="mt-2">
                  فیلتر را تغییر دهید یا{' '}
                  <Button variant="link" onClick={() => setFilterType('all')} className="p-0 h-auto">
                    همه فعالیت‌ها را مشاهده کنید
                  </Button>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-0">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(note.type)}
                          {getTypeBadge(note.type)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed">{note.content}</p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(note.created_at)}
                          </div>
                          <Badge variant="outline" className="text-xs">{note.created_by}</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نوع</TableHead>
                      <TableHead className="text-right">محتوا</TableHead>
                      <TableHead className="text-right">ایجاد شده توسط</TableHead>
                      <TableHead className="text-right">تاریخ</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(note.type)}
                            {getTypeBadge(note.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm leading-relaxed">{note.content}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{note.created_by}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(note.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNote(note.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}