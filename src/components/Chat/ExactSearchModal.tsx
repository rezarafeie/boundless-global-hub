
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  const validateSearchTerm = (term: string): { isValid: boolean; message: string } => {
    if (!term.trim()) {
      return { isValid: false, message: 'لطفاً نام کاربری یا شماره تلفن وارد کنید' };
    }

    // Check if it's a phone number (starts with 09 and is 11 digits)
    const phoneRegex = /^09\d{9}$/;
    if (phoneRegex.test(term)) {
      return { isValid: true, message: '' };
    }

    // Check if it's a valid username (at least 3 characters, alphanumeric and underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    if (term.startsWith('@')) {
      const username = term.slice(1);
      if (usernameRegex.test(username)) {
        return { isValid: true, message: '' };
      }
    } else if (usernameRegex.test(term)) {
      return { isValid: true, message: '' };
    }

    return { 
      isValid: false, 
      message: 'نام کاربری باید حداقل ۳ کاراکتر باشد یا شماره تلفن معتبر وارد کنید (مثل: 09123456789)' 
    };
  };

  const handleSearch = async () => {
    const validation = validateSearchTerm(searchTerm);
    
    if (!validation.isValid) {
      setSearchError(validation.message);
      return;
    }

    setLoading(true);
    setSearchError('');
    setHasSearched(true);

    try {
      const results = await messengerService.searchUsers(searchTerm, sessionToken);
      
      // Filter out current user
      const filteredResults = results.filter(user => user.id !== currentUser.id);
      
      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0) {
        setSearchError('کاربری با این مشخصات یافت نشد');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchError('خطا در جستجو. دوباره تلاش کنید.');
      toast({
        title: 'خطا',
        description: 'خطا در جستجوی کاربر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: MessengerUser) => {
    onUserSelect(user);
    onClose();
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchError('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchError('');
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            جستجوی کاربر
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">نام کاربری یا شماره تلفن</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="search"
                placeholder="@username یا 09123456789"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchError('');
                }}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Search Hints */}
            <div className="mt-2 text-xs text-slate-500 space-y-1">
              <p>• نام کاربری: @username یا username</p>
              <p>• شماره تلفن: 09123456789</p>
              <p>• جستجو دقیق: نام کاربری یا شماره تلفن کامل وارد کنید</p>
            </div>
            
            {searchError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Search Results */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">در حال جستجو...</p>
              </div>
            </div>
          )}

          {!loading && hasSearched && searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <CheckCircle className="w-4 h-4" />
                <span>{searchResults.length} کاربر یافت شد</span>
              </div>
              
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback 
                      style={{ backgroundColor: getAvatarColor(user.name) }}
                      className="text-white font-medium"
                    >
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {user.bedoun_marz_approved && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                          بدون مرز
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {user.phone}
                      {user.username && ` • @${user.username}`}
                    </div>
                  </div>
                  
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}

          {!loading && hasSearched && searchResults.length === 0 && !searchError && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 mb-2">کاربری یافت نشد</p>
              <p className="text-xs text-slate-400">
                نام کاربری یا شماره تلفن دقیق وارد کنید
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExactSearchModal;
