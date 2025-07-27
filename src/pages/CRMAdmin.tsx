
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Phone, FileText, Video, Search, Calendar, User, BookOpen, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Layout/Header';

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
  courses?: {
    title: string;
  };
  chat_users?: {
    name: string;
  };
}

interface Course {
  id: string;
  title: string;
}

const CRMAdmin: React.FC = () => {
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [agents, setAgents] = useState<string[]>([]);
  
  const [newNote, setNewNote] = useState({
    type: 'note',
    content: '',
    user_id: '',
    course_id: '',
    status: 'در انتظار پرداخت'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
    fetchCourses();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_notes')
        .select(`
          *,
          courses(title),
          chat_users(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      
      // Extract unique agents
      const uniqueAgents = [...new Set(data?.map(note => note.created_by).filter(Boolean))];
      setAgents(uniqueAgents);
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

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim() || !newNote.user_id) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: parseInt(newNote.user_id),
          type: newNote.type,
          content: newNote.content,
          created_by: 'مدیر',
          course_id: newNote.course_id || null,
          status: newNote.status
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "یادداشت CRM با موفقیت اضافه شد."
      });

      setNewNote({
        type: 'note',
        content: '',
        user_id: '',
        course_id: '',
        status: 'در انتظار پرداخت'
      });
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'جلسه مشاوره':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      note: 'default',
      call: 'secondary',
      message: 'outline',
      'جلسه مشاوره': 'destructive'
    };
    
    const typeLabels: Record<string, string> = {
      note: 'یادداشت',
      call: 'تماس',
      message: 'پیام',
      'جلسه مشاوره': 'جلسه مشاوره'
    };
    
    return <Badge variant={variants[type] || 'default'} className="text-xs">{typeLabels[type] || type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'در انتظار پرداخت': 'bg-yellow-100 text-yellow-800',
      'کنسل': 'bg-red-100 text-red-800',
      'موفق': 'bg-green-100 text-green-800',
      'پاسخ نداده': 'bg-gray-100 text-gray-800',
      'امکان مکالمه نداشت': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {status}
      </Badge>
    );
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

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.chat_users?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'all' || note.course_id === filterCourse;
    const matchesAgent = filterAgent === 'all' || note.created_by === filterAgent;
    const matchesType = filterType === 'all' || note.type === filterType;
    
    return matchesSearch && matchesCourse && matchesAgent && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                مدیریت CRM ({filteredNotes.length})
              </CardTitle>
              
              <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    افزودن یادداشت CRM
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>افزودن یادداشت CRM</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <Label htmlFor="user_id">شناسه کاربر *</Label>
                      <Input
                        id="user_id"
                        type="number"
                        placeholder="شناسه کاربر را وارد کنید"
                        value={newNote.user_id}
                        onChange={(e) => setNewNote({...newNote, user_id: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="course">دوره</Label>
                      <Select value={newNote.course_id} onValueChange={(value) => setNewNote({...newNote, course_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب دوره" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">هیچ دوره‌ای</SelectItem>
                          {courses.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
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
                          <SelectItem value="جلسه مشاوره">جلسه مشاوره</SelectItem>
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
                          <SelectItem value="کنسل">کنسل</SelectItem>
                          <SelectItem value="موفق">موفق</SelectItem>
                          <SelectItem value="پاسخ نداده">پاسخ نداده</SelectItem>
                          <SelectItem value="امکان مکالمه نداشت">امکان مکالمه نداشت</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="content">محتوا *</Label>
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
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در یادداشت‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
              
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="فیلتر بر اساس دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دوره‌ها</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="فیلتر بر اساس کارشناس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه کارشناسان</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="فیلتر بر اساس نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  <SelectItem value="note">یادداشت</SelectItem>
                  <SelectItem value="call">تماس</SelectItem>
                  <SelectItem value="message">پیام</SelectItem>
                  <SelectItem value="جلسه مشاوره">جلسه مشاوره</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterCourse('all');
                  setFilterAgent('all');
                  setFilterType('all');
                }}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                پاک کردن فیلترها
              </Button>
            </div>

            {/* Notes Table */}
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
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">محتوا</TableHead>
                      <TableHead className="text-right">کارشناس</TableHead>
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
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{note.chat_users?.name || `کاربر ${note.user_id}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <span>{note.courses?.title || 'بدون دوره'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(note.status)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm leading-relaxed line-clamp-3">{note.content}</p>
                          </div>
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
    </div>
  );
};

export default CRMAdmin;
