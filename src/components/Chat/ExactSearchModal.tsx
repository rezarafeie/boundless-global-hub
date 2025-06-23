
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Phone, AtSign, User, Loader2 } from 'lucide-react';
import { privateMessageService } from '@/lib/privateMessageService';
import type { MessengerUser } from '@/lib/messengerService';
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
  const [searchInput, setSearchInput] = useState('');
  const [foundUser, setFoundUser] = useState<MessengerUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const isPhoneNumber = (input: string) => {
    return /^09\d{9}$/.test(input);
  };

  const isUsername = (input: string) => {
    return input.startsWith('@') && input.length > 1;
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setLoading(true);
    setFoundUser(null);
    setHasSearched(true);

    try {
      let searchTerm = searchInput.trim();
      
      if (isUsername(searchTerm)) {
        // Remove @ prefix for username search
        searchTerm = searchTerm.substring(1);
      }

      const results = await privateMessageService.exactSearch(searchTerm, sessionToken);
      
      if (results.length > 0) {
        const user = results[0];
        if (user.id !== currentUser.id) {
          setFoundUser(user);
        } else {
          toast({
            title: 'خطا',
            description: 'نمی‌توانید با خودتان چت کنید',
            variant: 'destructive'
          });
        }
      } else {
        setFoundUser(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'خطا',
        description: 'خطا در جستجو',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: MessengerUser) => {
    onUserSelect(user);
    handleClose();
  };

  const handleClose = () => {
    setSearchInput('');
    setFoundUser(null);
    setHasSearched(false);
    onClose();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getSearchIcon = () => {
    if (isPhoneNumber(searchInput)) return <Phone className="w-4 h-4" />;
    if (isUsername(searchInput)) return <AtSign className="w-4 h-4" />;
    return <Search className="w-4 h-4" />;
  };

  const getPlaceholder = () => {
    return "شماره تلفن (۰۹۱۲۳۴۵۶۷۸۹) یا @نام_کاربری";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            شروع گفتگوی جدید
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute right-3 top-3 text-muted-foreground">
                {getSearchIcon()}
              </div>
              <Input
                placeholder={getPlaceholder()}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10"
                dir="ltr"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={!searchInput.trim() || loading}
              size="default"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">در حال جستجو...</p>
                </div>
              </div>
            ) : foundUser ? (
              <div
                onClick={() => handleUserSelect(foundUser)}
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors border"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(foundUser.name) }}
                    className="text-white font-medium"
                  >
                    {foundUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base">{foundUser.name}</div>
                  {foundUser.username && (
                    <div className="text-sm text-blue-600">@{foundUser.username}</div>
                  )}
                  <div className="text-xs text-muted-foreground">{foundUser.phone}</div>
                </div>
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            ) : hasSearched ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">کاربری یافت نشد</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    شماره تلفن یا نام کاربری را دقیق وارد کنید
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium mb-1">جستجوی دقیق</p>
                  <p className="text-xs text-muted-foreground">
                    شماره تلفن کامل یا @نام_کاربری دقیق را وارد کنید
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              لغو
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExactSearchModal;
