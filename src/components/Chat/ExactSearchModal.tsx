
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, User, Users, Loader2, MessageSquare, Headphones } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';

interface ExactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: MessengerUser) => void;
  sessionToken: string;
  currentUser: MessengerUser;
}

const ExactSearchModal: React.FC<ExactSearchModalProps> = ({
  isOpen,
  onClose,
  onUserSelect,
  sessionToken,
  currentUser
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MessengerUser[]>([]);
  const [supportUsers, setSupportUsers] = useState<MessengerUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  React.useEffect(() => {
    if (isOpen && currentUser) {
      loadSupportUsers();
    }
  }, [isOpen, currentUser]);

  const loadSupportUsers = async () => {
    try {
      const users = await messengerService.getSupportUsers(currentUser);
      setSupportUsers(users);
    } catch (error) {
      console.error('Error loading support users:', error);
    }
  };

  const handleSearch = async () => {
    const cleanTerm = searchTerm.trim();
    
    if (!cleanTerm) {
      toast({
        title: 'خطا',
        description: 'لطفاً چیزی برای جستجو وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    if (cleanTerm.length < 2) {
      toast({
        title: 'خطا',
        description: 'حداقل ۲ کاراکتر وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSearching(true);
      const results = await messengerService.searchUsers(cleanTerm);
      setSearchResults(results);
      setShowResults(true);
      
      if (results.length === 0) {
        toast({
          title: 'نتیجه‌ای یافت نشد',
          description: 'کاربری با این مشخصات پیدا نشد. برای جستجو دقیق از شماره تلفن یا نام کاربری (@username) استفاده کنید.',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'خطا',
        description: 'خطا در جستجو. لطفاً دوباره تلاش کنید.',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUserSelect = (user: MessengerUser) => {
    if (user.id === currentUser.id) {
      toast({
        title: 'خطا',
        description: 'نمی‌توانید با خودتان گفتگو کنید',
        variant: 'destructive'
      });
      return;
    }
    
    onUserSelect(user);
    onClose();
    
    // Reset state
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getSupportUserIcon = (user: MessengerUser) => {
    if (user.id === 999997) {
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    } else if (user.id === 999998) {
      return <Headphones className="w-4 h-4 text-purple-500" />;
    }
    return <User className="w-4 h-4 text-green-500" />;
  };

  const getSupportUserBadge = (user: MessengerUser) => {
    if (user.id === 999997) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">پشتیبانی عمومی</Badge>;
    } else if (user.id === 999998) {
      return <Badge className="bg-purple-100 text-purple-800 text-xs">پشتیبانی بدون مرز</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">پشتیبانی</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            شروع گفتگوی جدید
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="جستجو با نام، شماره تلفن یا @نام‌کاربری"
                className="flex-1"
                disabled={searching}
              />
              <Button 
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="text-xs text-slate-500 space-y-1">
              <p>💡 برای جستجوی دقیق:</p>
              <ul className="space-y-1 mr-4">
                <li>• شماره تلفن: ۰۹۱۲۱۲۳۴۵۶۷</li>
                <li>• نام کاربری: @username</li>
                <li>• نام: جستجوی عمومی در نام‌ها</li>
              </ul>
            </div>
          </div>

          {/* Support Users Section */}
          {supportUsers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Headphones className="w-4 h-4" />
                پشتیبانی
              </div>
              <div className="space-y-2">
                {supportUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback 
                          style={{ backgroundColor: getAvatarColor(user.name) }}
                          className="text-white font-medium"
                        >
                          {user.id === 999997 ? '🎓' : '🌐'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1">
                        {getSupportUserIcon(user)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{user.name}</span>
                        {getSupportUserBadge(user)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user.id === 999997 ? 'پشتیبانی عمومی برای همه کاربران' : 'پشتیبانی ویژه اعضای بدون مرز'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Search className="w-4 h-4" />
                نتایج جستجو ({searchResults.length})
              </div>
              
              {searchResults.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{user.name}</span>
                          {user.username && (
                            <span className="text-xs text-blue-600">@{user.username}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.phone}
                        </div>
                      </div>
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">کاربری پیدا نشد</p>
                  <p className="text-xs mt-1">جستجوی خود را دقیق‌تر کنید</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExactSearchModal;
