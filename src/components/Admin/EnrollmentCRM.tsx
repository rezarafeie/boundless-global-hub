
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Phone, FileText, Users, Calendar, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  user_id: number;
  course_id: string | null;
  status: string;
  chat_users?: {
    name: string;
    phone: string;
  };
  courses?: {
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

const CRM_TYPES = [
  { value: 'note', label: 'یادداشت' },
  { value: 'call', label: 'تماس' },
  { value: 'message', label: 'پیام' },
  { value: 'consultation', label: 'جلسه مشاوره' }
];

const CRM_STATUSES = [
  { value: 'در انتظار پرداخت', label: 'در انتظار پرداخت' },
  { value: 'کنسل', label: 'کنسل' },
  { value: 'موفق', label: 'موفق' },
  { value: 'پاسخ نداده', label: 'پاسخ نداده' },
  { value: 'امکان مکالمه نداشت', label: 'امکان مکالمه نداشت' }
];

export function EnrollmentCRM() {
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // Filters
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // New note form
  const [newNote, setNewNote] = useState({
    type: 'note',
    content: '',
    course_id: '',
    status: 'در انتظار پرداخت'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch CRM notes with user and course details
      const { data: notesData, error: notesError } = await supabase
        .from('crm_notes')
        .select(`
          *,
          chat_users (name, phone),
          courses (title)
        `)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (coursesError) throw coursesError;

      setNotes(notesData || []);
      setCourses(coursesData || []);
      
      // Extract unique agents
      const uniqueAgents = [...new Set((notesData || []).map(note => note.created_by))];
      setAgents(uniqueAgents);
      
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داده‌های CRM.",
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
          user_id: 1, // This should be dynamic based on selected user
          type: newNote.type,
          content: newNote.content,
          course_id: newNote.course_id || null,
          status: newNote.status,
          created_by: 'مدیر' // Should be current user
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت CRM با موفقیت اضافه شد."
      });

      setNewNote({
        type: 'note',
        content: '',
        course_id: '',
        status: 'در انتظار پرداخت'
      });
      setIsAddingNote(false);
      fetchData();
    } catch (error) {
      console.error('Error adding CRM note:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن یادداشت CRM.",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'consultation':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabel = CRM_TYPES.find(t => t.value === type)?.label || type;
    return <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'موفق': 'default',
      'کنسل': 'destructive',
      'در انتظار پرداخت': 'secondary',
      'پاسخ نداده': 'outline',
      'امکان مکالمه نداشت': 'destructive'
    };
    
    return <Badge variant={variants[status] || 'default'} className="text-xs">{status}</Badge>;
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

  // Apply filters
  const filteredNotes = notes.filter(note => {
    if (filterCourse !== 'all' && note.course_id !== filterCourse) return false;
    if (filterAgent !== 'all' && note.created_by !== filterAgent) return false;
    if (filterType !== 'all' && note.type !== filterType) return false;
    if (filterStatus !== 'all' && note.status !== filterStatus) return false;
    return true;
  });

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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                فعالیت‌های CRM ({filteredNotes.length})
              </CardTitle>
              <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
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
                          {CRM_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="course">دوره</Label>
                      <Select value={newNote.course_id} onValueChange={(value) => setNewNote({...newNote, course_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب دوره" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">بدون دوره</SelectItem>
                          {courses.map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                          ))}
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
                          {CRM_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
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
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">فیلتر:</span>
              </div>
              
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دوره‌ها</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نماینده" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه نمایندگان</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  {CRM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  {CRM_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ فعالیت CRM یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نوع</TableHead>
                    <TableHead className="text-right">کاربر</TableHead>
                    <TableHead className="text-right">دوره</TableHead>
                    <TableHead className="text-right">محتوا</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">نماینده</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
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
                        <div className="flex flex-col">
                          <span className="font-medium">{note.chat_users?.name || 'نامشخص'}</span>
                          <span className="text-sm text-muted-foreground">{note.chat_users?.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{note.courses?.title || 'بدون دوره'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm leading-relaxed">{note.content}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(note.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{note.created_by}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(note.created_at)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
