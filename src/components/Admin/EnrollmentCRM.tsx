import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MessageSquare, Plus, Phone, FileText, Users, Calendar, Filter, Search, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
  user_name?: string;
  user_phone?: string;
  course_title?: string;
}

interface Course {
  id: string;
  title: string;
}

interface ChatUser {
  id: number;
  name: string;
  phone: string;
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
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // New note form with follow-up
  const [newNote, setNewNote] = useState({
    type: 'note',
    content: '',
    course_id: 'none',
    status: 'در انتظار پرداخت',
    user_id: '',
    // Follow-up fields
    schedule_followup: false,
    followup_title: '',
    followup_date_option: 'tomorrow',
    followup_custom_date: '',
    followup_time: new Date().getHours() + ':00'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  // Search users with debounce
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 150); // Reduced debounce for faster search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .eq('is_approved', true)
        .order('name')
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = (user: ChatUser) => {
    setSelectedUser(user);
    setNewNote({ ...newNote, user_id: user.id.toString() });
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setNewNote({ ...newNote, user_id: '' });
  };

  const openAddNoteDialog = () => {
    if (!selectedUser) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا کاربر را انتخاب کنید.",
        variant: "destructive"
      });
      return;
    }
    setIsAddingNote(true);
  };

  const fetchData = async () => {
    try {
      // Fetch CRM notes with manual joins
      const { data: notesData, error: notesError } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (coursesError) throw coursesError;

      // Fetch chat users for user names and user selection
      const { data: chatUsersData, error: chatUsersError } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .eq('is_approved', true)
        .order('name');

      if (chatUsersError) throw chatUsersError;

      // Enrich notes with user and course data
      const enrichedNotes = (notesData || []).map(note => {
        const user = chatUsersData?.find(u => u.id === note.user_id);
        const course = coursesData?.find(c => c.id === note.course_id);
        
        return {
          ...note,
          user_name: user?.name || 'نامشخص',
          user_phone: user?.phone || '',
          course_title: course?.title || 'بدون دوره'
        };
      });

      setNotes(enrichedNotes);
      setCourses(coursesData || []);
      setChatUsers(chatUsersData || []);
      
      // Extract unique agents
      const uniqueAgents = [...new Set(enrichedNotes.map(note => note.created_by))];
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

  const calculateFollowUpDate = (option: string, customDate?: string, time?: string) => {
    const now = new Date();
    let targetDate = new Date();
    
    switch (option) {
      case 'tomorrow':
        targetDate.setDate(now.getDate() + 1);
        break;
      case 'day_after_tomorrow':
        targetDate.setDate(now.getDate() + 2);
        break;
      case 'next_week':
        targetDate.setDate(now.getDate() + 7);
        break;
      case 'custom':
        if (customDate) {
          targetDate = new Date(customDate);
        }
        break;
      default:
        targetDate.setDate(now.getDate() + 1);
    }
    
    // Set time
    if (time) {
      const [hours, minutes] = time.split(':');
      targetDate.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
    } else {
      targetDate.setHours(now.getHours(), 0, 0, 0);
    }
    
    return targetDate.toISOString();
  };

  const addNote = async () => {
    console.log('Adding note with data:', newNote);
    
    if (!newNote.content.trim()) {
      toast({
        title: "خطا",
        description: "محتوای یادداشت نمی‌تواند خالی باشد.",
        variant: "destructive"
      });
      return;
    }

    if (!newNote.user_id) {
      toast({
        title: "خطا",
        description: "لطفاً کاربر را انتخاب کنید.",
        variant: "destructive"
      });
      return;
    }

    if (newNote.schedule_followup && !newNote.followup_title.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً عنوان پیگیری را وارد کنید.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert CRM note
      const { data: crmData, error: crmError } = await supabase
        .from('crm_notes')
        .insert({
          user_id: parseInt(newNote.user_id),
          type: newNote.type,
          content: newNote.content,
          course_id: newNote.course_id === 'none' ? null : newNote.course_id,
          status: newNote.status,
          created_by: 'مدیر'
        })
        .select()
        .single();

      if (crmError) throw crmError;

      // If follow-up is scheduled, create follow-up entry
      if (newNote.schedule_followup && crmData) {
        const followUpDateTime = calculateFollowUpDate(
          newNote.followup_date_option,
          newNote.followup_custom_date,
          newNote.followup_time
        );

        const { error: followupError } = await supabase
          .from('crm_followups')
          .insert({
            user_id: parseInt(newNote.user_id),
            crm_activity_id: crmData.id,
            title: newNote.followup_title,
            assigned_to: 1, // Default to admin user
            due_at: followUpDateTime,
            status: 'open'
          });

        if (followupError) {
          console.error('Error creating follow-up:', followupError);
          toast({
            title: "هشدار",
            description: "یادداشت ثبت شد اما پیگیری ایجاد نشد.",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "موفق",
        description: newNote.schedule_followup 
          ? "یادداشت CRM و پیگیری با موفقیت اضافه شد."
          : "یادداشت CRM با موفقیت اضافه شد."
      });

      // Reset form
      setNewNote({
        type: 'note',
        content: '',
        course_id: 'none',
        status: 'در انتظار پرداخت',
        user_id: '',
        schedule_followup: false,
        followup_title: '',
        followup_date_option: 'tomorrow',
        followup_custom_date: '',
        followup_time: new Date().getHours() + ':00'
      });
      
      // Close dialog
      setIsAddingNote(false);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error adding CRM note:', error);
      toast({
        title: "خطا",
        description: "خطا در افزودن یادداشت CRM.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
            </div>
            
            {/* User Search Section */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="text-sm font-medium">جستجو و انتخاب کاربر:</span>
                </div>
                
                {selectedUser ? (
                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium">{selectedUser.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.phone}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelectedUser}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative space-y-2">
                    <div className="relative">
                      <Input
                        placeholder="جستجو بر اساس نام یا شماره تلفن..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        dir="rtl"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    {isSearching && (
                      <div className="flex justify-center py-1">
                        <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => selectUser(user)}
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchTerm.trim() && !isSearching && searchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-md shadow-lg mt-1 p-3 text-center">
                        <div className="text-sm text-muted-foreground">کاربری یافت نشد</div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={openAddNoteDialog}
                  disabled={!selectedUser}
                  className="flex items-center gap-2 w-fit"
                >
                  <Plus className="w-4 h-4" />
                  افزودن یادداشت
                </Button>
              </div>
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
            <>
              {/* Mobile cards view */}
              <div className="block md:hidden space-y-4">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(note.type)}
                      {getTypeBadge(note.type)}
                      <div className="mr-auto">
                        {getStatusBadge(note.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-muted-foreground">کاربر</div>
                        <div className="font-medium">{note.user_name}</div>
                        <div className="text-sm text-muted-foreground">{note.user_phone}</div>
                      </div>
                      
                      {note.course_title && (
                        <div>
                          <div className="text-xs text-muted-foreground">دوره</div>
                          <div className="text-sm">{note.course_title}</div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-xs text-muted-foreground">محتوا</div>
                        <p className="text-sm leading-relaxed">{note.content}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.created_at)}
                        </div>
                        <Badge variant="outline" className="text-xs">{note.created_by}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
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
                            <span className="font-medium">{note.user_name}</span>
                            <span className="text-sm text-muted-foreground">{note.user_phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{note.course_title}</span>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>افزودن یادداشت CRM</DialogTitle>
            <DialogDescription>
              یادداشت جدید اضافه کنید و در صورت نیاز پیگیری زمان‌بندی کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedUser.name}</div>
                <div className="text-sm text-muted-foreground">{selectedUser.phone}</div>
              </div>
            )}
            
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
                  <SelectItem value="none">بدون دوره</SelectItem>
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

            {/* Follow-up Scheduling Section */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2" dir="rtl">
                <Checkbox
                  id="schedule_followup"
                  checked={newNote.schedule_followup}
                  onCheckedChange={(checked) => 
                    setNewNote({...newNote, schedule_followup: checked as boolean})
                  }
                />
                <Label htmlFor="schedule_followup" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="w-4 h-4" />
                  زمان‌بندی پیگیری
                </Label>
              </div>

              {newNote.schedule_followup && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="followup_title">عنوان پیگیری</Label>
                    <Input
                      id="followup_title"
                      placeholder="مثال: پیگیری پرداخت"
                      value={newNote.followup_title}
                      onChange={(e) => setNewNote({...newNote, followup_title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="followup_date">زمان پیگیری</Label>
                      <Select
                        value={newNote.followup_date_option}
                        onValueChange={(value) => setNewNote({...newNote, followup_date_option: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب زمان" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tomorrow">فردا</SelectItem>
                          <SelectItem value="day_after_tomorrow">پس‌فردا</SelectItem>
                          <SelectItem value="next_week">هفته آینده</SelectItem>
                          <SelectItem value="custom">تاریخ دلخواه</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="followup_time">ساعت</Label>
                      <Input
                        id="followup_time"
                        type="time"
                        value={newNote.followup_time}
                        onChange={(e) => setNewNote({...newNote, followup_time: e.target.value})}
                      />
                    </div>
                  </div>

                  {newNote.followup_date_option === 'custom' && (
                    <div>
                      <Label htmlFor="followup_custom_date">تاریخ دلخواه</Label>
                      <Input
                        id="followup_custom_date"
                        type="date"
                        value={newNote.followup_custom_date}
                        onChange={(e) => setNewNote({...newNote, followup_custom_date: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                لغو
              </Button>
              <Button onClick={addNote} disabled={isSubmitting}>
                {isSubmitting ? 'در حال افزودن...' : 'افزودن یادداشت'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
