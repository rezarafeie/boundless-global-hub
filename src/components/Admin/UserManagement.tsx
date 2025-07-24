
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Phone, Mail, Calendar } from 'lucide-react';
import { chatUserAdminService } from '@/lib/chatUserAdmin';
import { useDebounce } from '@/hooks/use-debounce';
import type { ChatUser } from '@/lib/supabase';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search function using the same logic as the working support search
  const performSearch = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setTotalResults(0);
      return;
    }

    try {
      setLoading(true);
      // Search all users (both approved and pending)
      const result = await chatUserAdminService.getAllUsers(term);
      setSearchResults(result.users);
      setTotalResults(result.total);
      console.log('Search results:', { found: result.users.length, total: result.total, term });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when debounced term changes
  React.useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (user: ChatUser) => {
    if (user.is_approved) {
      return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">در انتظار تایید</Badge>;
    }
  };

  const getRoleBadges = (user: ChatUser) => {
    const badges = [];
    
    if (user.is_messenger_admin) {
      badges.push(<Badge key="admin" className="bg-purple-100 text-purple-800">ادمین</Badge>);
    }
    
    if (user.bedoun_marz || user.bedoun_marz_approved) {
      badges.push(<Badge key="boundless" className="bg-blue-100 text-blue-800">بدون مرز</Badge>);
    }
    
    if (user.is_support_agent) {
      badges.push(<Badge key="support" className="bg-indigo-100 text-indigo-800">پشتیبان</Badge>);
    }
    
    return badges;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">جستجوی کاربران</h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              جستجو در تمام کاربران
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="جستجوی نام، نام کاربری، تلفن، ایمیل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchTerm && searchTerm.length < 2 && (
              <p className="text-sm text-muted-foreground">
                حداقل 2 کاراکتر وارد کنید
              </p>
            )}
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">در حال جستجو...</p>
              </div>
            )}
            
            {!loading && debouncedSearchTerm && debouncedSearchTerm.length >= 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {totalResults > 0 ? `${totalResults} کاربر یافت شد` : 'هیچ کاربری یافت نشد'}
                  </p>
                  {totalResults > 0 && (
                    <p className="text-sm text-orange-600">
                      جستجو: "{debouncedSearchTerm}"
                    </p>
                  )}
                </div>
                
                {searchResults.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{user.name}</h3>
                                {getStatusBadge(user)}
                                {getRoleBadges(user)}
                              </div>
                              
                              <div className="text-sm text-muted-foreground space-y-1">
                                {user.username && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    @{user.username}
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                                
                                {user.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  عضویت: {formatDate(user.created_at)}
                                </div>
                                
                                {user.user_id && (
                                  <div className="text-xs text-muted-foreground">
                                    ID: {user.user_id}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
