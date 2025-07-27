
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Plus, 
  X, 
  FileText, 
  Phone, 
  MessageSquare, 
  Users, 
  Calendar 
} from 'lucide-react';
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

interface Props {
  courses: Course[];
  onAddNote: (userId: number) => void;
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

const CRMActivities: React.FC<Props> = ({ courses, onAddNote }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCRMNotes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchCRMNotes = async () => {
    try {
      setLoading(true);
      
      // Fetch CRM notes
      const { data: notesData, error: notesError } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch chat users for enrichment
      const { data: chatUsersData, error: chatUsersError } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .eq('is_approved', true);

      if (chatUsersError) throw chatUsersError;

      // Enrich notes with user and course data
      const enrichedNotes = (notesData || []).map(note => {
        const user = chatUsersData?.find(u => u.id === note.user_id);
        const course = courses.find(c => c.id === note.course_id);
        
        return {
          ...note,
          user_name: user?.name || 'نامشخص',
          user_phone: user?.phone || '',
          course_title: course?.title || 'بدون دوره'
        };
      });

      setNotes(enrichedNotes);
      
      // Extract unique agents
      const uniqueAgents = [...new Set(enrichedNotes.map(note => note.created_by))];
      setAgents(uniqueAgents);
      
    } catch (error) {
      console.error('Error fetching CRM notes:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری فعالیت‌های CRM.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
  };

  const handleAddNote = () => {
    if (!selectedUser) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا کاربر را انتخاب کنید.",
        variant: "destructive"
      });
      return;
    }
    onAddNote(selectedUser.id);
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

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        فعالیت‌های CRM ({filteredNotes.length})
      </h3>
      
      {/* User Search Section */}
      <div className="border rounded-lg p-4 bg-muted/50 mb-4">
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
            <div className="relative">
              <Input
                placeholder="جستجو بر اساس نام یا شماره تلفن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                dir="rtl"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
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
              
              {isSearching && (
                <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg mt-1 p-3 text-center">
                  <div className="text-sm text-muted-foreground">در حال جستجو...</div>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={handleAddNote}
            disabled={!selectedUser}
            className="flex items-center gap-2 w-fit"
          >
            <Plus className="w-4 h-4" />
            افزودن یادداشت
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
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

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
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
      )}
    </div>
  );
};

export default CRMActivities;
