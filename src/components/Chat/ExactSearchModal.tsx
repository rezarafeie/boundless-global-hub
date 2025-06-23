
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageCircle, User } from 'lucide-react';
import { privateMessageService } from '@/lib/privateMessageService';
import type { MessengerUser } from '@/lib/messengerService';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MessengerUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    if (searchTerm.trim().length < 2) return;
    
    setLoading(true);
    try {
      const results = await privateMessageService.searchUsers(searchTerm, sessionToken);
      const filteredResults = results.filter(user => user.id !== currentUser.id);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
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

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 border-gray-200 focus:border-blue-500"
              dir="rtl"
            />
          </div>

          <ScrollArea className="h-64">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">در حال جستجو...</div>
              </div>
            ) : searchResults.length === 0 && searchTerm ? (
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
