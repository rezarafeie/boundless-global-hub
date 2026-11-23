import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, User, Headphones, MessageSquare } from 'lucide-react';
import { privateMessageService } from '@/lib/privateMessageService';
import type { MessengerUser } from '@/lib/messengerService';

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: MessengerUser) => void;
  sessionToken: string;
  currentUser: MessengerUser;
}

interface SupportUser {
  id: string;
  name: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  description: string;
}

const StartChatModal: React.FC<StartChatModalProps> = ({
  isOpen,
  onClose,
  onUserSelect,
  sessionToken,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MessengerUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Pinned support users
  const getSupportUsers = (): SupportUser[] => {
    const supportUsers: SupportUser[] = [
      {
        id: 'academy_support',
        name: '🎓 پشتیبانی آکادمی رفیعی',
        type: 'academy_support',
        icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
        description: 'پشتیبانی عمومی برای همه کاربران'
      }
    ];

    // Add boundless support for boundless users
    if (currentUser?.bedoun_marz || currentUser?.bedoun_marz_approved) {
      supportUsers.push({
        id: 'boundless_support',
        name: '🌐 پشتیبانی بدون مرز',
        type: 'boundless_support',
        icon: <Headphones className="w-4 h-4 text-purple-500" />,
        description: 'پشتیبانی ویژه اعضای بدون مرز'
      });
    }

    return supportUsers;
  };

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      // Only search if it's a complete phone number or @username
      const trimmed = searchTerm.trim();
      const isValidPhoneSearch = /^09\d{9}$/.test(trimmed);
      const isValidUsernameSearch = trimmed.startsWith('@') && trimmed.length > 1;
      const isValidExactUsername = !trimmed.includes('@') && trimmed.length >= 3;
      
      if (isValidPhoneSearch || isValidUsernameSearch || isValidExactUsername) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async () => {
    if (!sessionToken) {
      console.error('No session token available');
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', searchTerm.trim());
      
      // Prepare search term - remove @ if present for username search
      let searchQuery = searchTerm.trim();
      if (searchQuery.startsWith('@')) {
        searchQuery = searchQuery.substring(1);
      }
      
      const results = await privateMessageService.exactSearch(searchQuery);
      console.log('Search results:', results);
      
      // Filter out current user
      const filteredResults = results.filter(user => user.id !== currentUser.id);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: MessengerUser) => {
    onUserSelect(user);
    onClose();
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSupportUserSelect = async (supportUser: SupportUser) => {
    const supportMessengerUser: MessengerUser = {
      id: supportUser.type === 'academy_support' ? 999997 : 999998,
      name: supportUser.name,
      phone: supportUser.type === 'academy_support' ? '02128427131' : '02128427132',
      username: supportUser.type === 'academy_support' ? 'support' : 'boundless_support',
      is_approved: true,
      is_support_agent: true,
      is_messenger_admin: false,
      bedoun_marz: supportUser.type === 'boundless_support',
      bedoun_marz_approved: supportUser.type === 'boundless_support',
      bedoun_marz_request: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      role: 'support',
      bio: supportUser.description,
      email: null,
      user_id: null,
      first_name: null,
      last_name: null,
      full_name: null,
      country_code: null,
      signup_source: null,
      notification_enabled: true,
      notification_token: null,
      password_hash: null,
      avatar_url: undefined,
      // New profile fields
      gender: null,
      age: null,
      education: null,
      job: null,
      specialized_program: null,
      country: null,
      province: null
    };

    handleUserSelect(supportMessengerUser);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const supportUsers = getSupportUsers();

  const isValidSearch = () => {
    const trimmed = searchTerm.trim();
    return /^09\d{9}$/.test(trimmed) || 
           (trimmed.startsWith('@') && trimmed.length > 1) ||
           (!trimmed.includes('@') && trimmed.length >= 3);
  };

  const getSearchPlaceholder = () => {
    return "جستجو: 09xxxxxxxxx یا @نام‌کاربری یا نام‌کاربری";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl" dir="rtl">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/60 text-right sm:text-right">
          <DialogTitle className="text-base font-bold text-right">گفتگوی جدید</DialogTitle>
        </DialogHeader>
        <div className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={getSearchPlaceholder()} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 h-10 rounded-full bg-muted border-0 text-right" dir="rtl" autoFocus />
          </div>
          {!searchTerm && supportUsers.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground px-2 mb-1">پشتیبانی</p>
              {supportUsers.map((s) => (
                <button key={s.id} onClick={() => handleSupportUserSelect(s)} dir="rtl"
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted text-right">
                  <Avatar className="w-11 h-11 shrink-0"><AvatarFallback className="bg-muted text-foreground">{s.icon}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">در حال جستجو...</p>
            ) : searchTerm.length > 0 && !isValidSearch() ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">شماره کامل (09xxxxxxxxx) یا نام کاربری را وارد کنید</p>
            ) : isValidSearch() && searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">کاربری یافت نشد</p>
            ) : (
              searchResults.map((user) => (
                <button key={user.id} onClick={() => handleUserSelect(user)} dir="rtl"
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted text-right">
                  <Avatar className="w-11 h-11 shrink-0">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                    <AvatarFallback className="bg-muted text-foreground font-semibold">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    {user.username && <p className="text-xs text-muted-foreground truncate" dir="ltr" style={{ textAlign: 'right' }}>@{user.username}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartChatModal;
