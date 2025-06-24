
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, User, Headphones, MessageSquare } from 'lucide-react';
import { privateMessageService } from '@/lib/privateMessageService';
import type { MessengerUser } from '@/lib/messengerService';

interface ExactSearchModalProps {
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

const ExactSearchModal: React.FC<ExactSearchModalProps> = ({
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
      
      const results = await privateMessageService.exactSearch(searchQuery, sessionToken);
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
    // Create a mock MessengerUser for support
    const supportMessengerUser: MessengerUser = {
      id: supportUser.type === 'academy_support' ? 999997 : 999998,
      name: supportUser.name,
      phone: supportUser.type === 'academy_support' ? '02128427131' : '02128427132',
      username: supportUser.type === 'academy_support' ? 'support' : 'boundless_support',
      is_approved: true,
      is_support_agent: true,
      is_messenger_admin: false,
      bedoun_marz: false,
      bedoun_marz_approved: false,
      bedoun_marz_request: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      role: 'support',
      bio: supportUser.description
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            شروع گفتگوی جدید
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Pinned Support Users */}
          {supportUsers.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground px-1">
                پشتیبانی سریع
              </div>
              {supportUsers.map((supportUser) => (
                <div
                  key={supportUser.id}
                  onClick={() => handleSupportUserSelect(supportUser)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-blue-300 dark:border-blue-700">
                      <AvatarFallback className="bg-blue-500 text-white font-medium">
                        {supportUser.type === 'academy_support' ? '🎓' : '🌐'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1">
                      {supportUser.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm text-blue-700 dark:text-blue-300">
                        {supportUser.name}
                      </div>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        پشتیبانی
                      </Badge>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {supportUser.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={getSearchPlaceholder()}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>

          <ScrollArea className="h-64">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">در حال جستجو...</div>
              </div>
            ) : searchTerm.length > 0 && !isValidSearch() ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground text-center">
                  لطفاً شماره موبایل کامل (09xxxxxxxxx)، @نام‌کاربری یا نام کاربری وارد کنید
                </div>
              </div>
            ) : isValidSearch() && searchResults.length === 0 && !loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">کاربری یافت نشد</div>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback 
                        style={{ backgroundColor: getAvatarColor(user.name) }}
                        className="text-white font-medium"
                      >
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{user.name}</div>
                      {user.username && (
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                    </div>
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              لغو
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExactSearchModal;
