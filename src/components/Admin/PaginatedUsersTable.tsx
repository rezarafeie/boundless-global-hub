import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  username: string | null;
  is_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  created_at: string;
  user_id: string | null;
}

const PaginatedUsersTable: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 150);
  const usersPerPage = 50;
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get total count first
      let countQuery = supabase
        .from('chat_users')
        .select('*', { count: 'exact', head: true });
        
      if (debouncedSearchTerm) {
        countQuery = countQuery.or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%,username.ilike.%${debouncedSearchTerm}%`);
      }
      
      const { count } = await countQuery;
      
      // Get paginated data
      const offset = (currentPage - 1) * usersPerPage;
      let dataQuery = supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + usersPerPage - 1);
        
      if (debouncedSearchTerm) {
        dataQuery = dataQuery.or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%,username.ilike.%${debouncedSearchTerm}%`);
      }

      const { data, error } = await dataQuery;

      if (error) throw error;
      
      setUsers(data || []);
      setTotalUsers(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری کاربران",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (user: ChatUser) => {
    if (user.is_approved) {
      return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">در انتظار تایید</Badge>;
  };

  const getRoleBadges = (user: ChatUser) => {
    const badges = [];
    
    if (user.is_messenger_admin) {
      badges.push(<Badge key="admin" variant="secondary" className="bg-purple-100 text-purple-800">ادمین</Badge>);
    }
    
    if (user.bedoun_marz || user.bedoun_marz_approved) {
      badges.push(<Badge key="boundless" variant="secondary" className="bg-blue-100 text-blue-800">بدون مرز</Badge>);
    }
    
    if (user.is_support_agent) {
      badges.push(<Badge key="support" variant="secondary" className="bg-indigo-100 text-indigo-800">پشتیبان</Badge>);
    }
    
    return badges;
  };

  const handleUserClick = (userId: number) => {
    window.location.href = `/enroll/admin/users/${userId}`;
  };

  if (loading && currentPage === 1) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={isMobile ? "flex flex-col gap-3" : "flex items-center justify-between"}>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            مدیریت کاربران
            <Badge variant="secondary">{totalUsers} کاربر</Badge>
          </div>
          <div className={isMobile ? "relative space-y-2" : "relative w-80 space-y-2"}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="جستجوی نام، ایمیل، تلفن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {loading && searchTerm && (
              <div className="flex justify-center py-1">
                <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 && !loading ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm ? 'هیچ کاربری یافت نشد' : 'هنوز کاربری ثبت نشده است'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Users Table/Cards */}
            {isMobile ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleUserClick(user.id)}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{user.name}</h3>
                          {getStatusBadge(user)}
                        </div>
                        <div className="space-y-2 text-sm">
                           <div><span className="font-medium">تلفن:</span> {user.phone}</div>
                          {user.username && (
                            <div><span className="font-medium">نام کاربری:</span> <code className="bg-muted px-1 py-0.5 rounded text-xs">@{user.username}</code></div>
                          )}
                          <div><span className="font-medium">تاریخ عضویت:</span> {formatDate(user.created_at)}</div>
                        </div>
                        {getRoleBadges(user).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {getRoleBadges(user)}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(user.id);
                          }}
                        >
                          مشاهده جزئیات
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                       <TableHead>نام</TableHead>
                       <TableHead>تلفن</TableHead>
                       <TableHead>نام کاربری</TableHead>
                       <TableHead>وضعیت</TableHead>
                       <TableHead>نقش‌ها</TableHead>
                       <TableHead>تاریخ عضویت</TableHead>
                       <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                         <TableCell className="font-medium">{user.name}</TableCell>
                         <TableCell>{user.phone}</TableCell>
                         <TableCell>
                          {user.username ? (
                            <code className="bg-muted px-2 py-1 rounded text-sm">@{user.username}</code>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(user)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getRoleBadges(user)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserClick(user.id)}
                          >
                            مشاهده
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  نمایش {(currentPage - 1) * usersPerPage + 1} تا{' '}
                  {Math.min(currentPage * usersPerPage, totalUsers)} از {totalUsers} کاربر
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    قبلی
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    صفحه {currentPage} از {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    بعدی
                    <ChevronLeft className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaginatedUsersTable;
