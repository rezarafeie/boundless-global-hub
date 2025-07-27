
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield, Plus, Search, Filter, MessageSquare, Calendar, User, Phone, Mail, MapPin, Tag, Clock, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { messengerService } from '@/lib/messengerService';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Header from '@/components/Layout/Header';

interface CRMNote {
  id: string;
  user_id: string;
  note: string;
  created_at: string;
  created_by: string;
  tags?: string[];
  chat_users?: {
    id: string;
    phone: string;
    full_name: string;
    username: string;
  } | null;
}

interface CRMUser {
  id: string;
  phone: string;
  full_name: string;
  username: string;
  created_at: string;
  last_seen?: string;
  is_active?: boolean;
  location?: string;
  notes_count?: number;
}

const CRMAdmin: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  // CRM Data
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // New note form
  const [newNote, setNewNote] = useState({
    user_id: '',
    note: '',
    tags: [] as string[],
  });
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Check user role and access
  useEffect(() => {
    const checkUserRole = async () => {
      if (isLoading) return;

      if (!isAuthenticated || !user) {
        setCheckingRole(false);
        setHasAccess(false);
        return;
      }

      try {
        const detailedUser = await messengerService.getUserByPhone(user.phone || '');
        
        if (!detailedUser) {
          setHasAccess(false);
          setCheckingRole(false);
          return;
        }

        const allowedRoles = ['admin', 'enrollments_manager'];
        const userRole = detailedUser.role || 'user';
        
        if (allowedRoles.includes(userRole) || detailedUser.is_messenger_admin) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setHasAccess(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [isAuthenticated, user, isLoading]);

  // Load CRM data
  useEffect(() => {
    if (hasAccess) {
      loadCRMData();
    }
  }, [hasAccess]);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      
      // Load notes with user info
      const { data: notesData, error: notesError } = await supabase
        .from('crm_notes')
        .select(`
          *,
          chat_users:user_id (
            id,
            phone,
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      
      const validNotes = notesData?.filter(note => note.chat_users !== null) || [];
      
      setNotes(validNotes);
      
      // Extract unique agents - add null check for chat_users
      const uniqueAgents = [...new Set(validNotes.map(note => note.created_by).filter(Boolean))];
      setAgents(uniqueAgents);
    } catch (error) {
      console.error('Error loading CRM data:', error);
      toast.error('خطا در بارگذاری داده‌های CRM');
    } finally {
      setLoading(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const searchTermLower = searchTerm.toLowerCase();
    const noteContentLower = note.note.toLowerCase();

    const matchesSearchTerm = searchTerm ? noteContentLower.includes(searchTermLower) : true;
    const matchesAgent = selectedAgent ? note.created_by === selectedAgent : true;

    return matchesSearchTerm && matchesAgent;
  });

  // Add new note
  const handleAddNote = async () => {
    setIsAddingNote(true);
    try {
      const { data, error } = await supabase
        .from('crm_notes')
        .insert([
          {
            user_id: newNote.user_id,
            note: newNote.note,
            created_by: user?.phone,
            tags: newNote.tags,
          },
        ]);

      if (error) throw error;

      toast.success('یادداشت جدید با موفقیت اضافه شد');
      setNewNote({ user_id: '', note: '', tags: [] });
      loadCRMData(); // Reload data
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('خطا در افزودن یادداشت جدید');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Show loading while checking authentication
  if (isLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated or user doesn't have required role
  if (!isAuthenticated || !user || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-800">دسترسی محدود</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-red-700">
                شما مجوز دسترسی به این بخش را ندارید. این صفحه فقط برای مدیران سیستم قابل دسترسی است.
              </p>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
                variant="outline"
              >
                بازگشت به صفحه اصلی
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت CRM</h1>
          <p className="text-gray-600">مدیریت یادداشت‌ها و اطلاعات کاربران</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="mr-2 text-muted-foreground">در حال بارگذاری...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    فیلترها
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="search">جستجو</Label>
                    <Input
                      id="search"
                      placeholder="جستجو در یادداشت‌ها..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="agent">نماینده</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="انتخاب نماینده" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">همه نمایندگان</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent} value={agent}>
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      یادداشت‌های CRM
                    </CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 ml-2" />
                          یادداشت جدید
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>افزودن یادداشت جدید</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="note-content">متن یادداشت</Label>
                            <Textarea
                              id="note-content"
                              placeholder="یادداشت خود را وارد کنید..."
                              value={newNote.note}
                              onChange={(e) => setNewNote({...newNote, note: e.target.value})}
                              className="mt-1"
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAddNote}
                              disabled={!newNote.note.trim() || isAddingNote}
                            >
                              {isAddingNote ? 'در حال افزودن...' : 'افزودن'}
                            </Button>
                            <Button variant="outline" onClick={() => setNewNote({user_id: '', note: '', tags: []})}>
                              انصراف
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">هیچ یادداشتی یافت نشد</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNotes.map((note) => (
                        <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-medium">
                                  {note.chat_users?.full_name || note.chat_users?.username || 'کاربر ناشناس'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {note.chat_users?.phone}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{note.created_by}</Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(note.created_at).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{note.note}</p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {note.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 ml-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMAdmin;
