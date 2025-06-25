
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

interface SupportRoom {
  id: string;
  name: string;
  description: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  isPermanent: boolean;
  phone: string;
  username: string;
}

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: MessengerUser) => void;
  sessionToken: string;
  currentUser: MessengerUser;
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

  // Define support rooms
  const supportRooms: SupportRoom[] = [
    {
      id: '1',
      name: 'پشتیبانی عمومی',
      description: 'پشتیبانی عمومی برای همه کاربران',
      type: 'academy_support',
      icon: <MessageSquare className="w-4 h-4" />,
      isPermanent: true,
      phone: '09000000001',
      username: 'academy_support'
    }
  ];

  // Add boundless support for eligible users
  if (currentUser?.bedoun_marz || currentUser?.bedoun_marz_approved) {
    supportRooms.push({
      id: '2',
      name: 'پشتیبانی بدون مرز',
      description: 'پشتیبانی ویژه اعضای بدون مرز',
      type: 'boundless_support',
      icon: <Headphones className="w-4 h-4" />,
      isPermanent: true,
      phone: '09000000002',
      username: 'boundless_support'
    });
  }

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
      // Filter out current user
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

  const handleSupportRoomSelect = (room: SupportRoom) => {
    // Create a mock user for support room
    const supportUser: MessengerUser = {
      id: room.type === 'academy_support' ? 999997 : 999998,
      name: room.name,
      phone: room.phone,
      username: room.username,
      is_approved: true,
      is_support_agent: true,
      is_messenger_admin: false,
      bedoun_marz: room.type === 'boundless_support',
      bedoun_marz_approved: room.type === 'boundless_support',
      bedoun_marz_request: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      role: 'support'
    };
    
    handleUserSelect(supportUser);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Filter support rooms based on search
  const filteredSupportRooms = supportRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.phone.includes(searchTerm)
  );

  // Filter search results to include username search
  const filteredSearchResults = searchResults.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.phone.includes(searchTerm)
  );

  const showSupportRooms = !searchTerm || filteredSupportRooms.length > 0;
  const showSearchResults = searchTerm && (filteredSearchResults.length > 0 || loading);

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
              placeholder="جستجو با نام، نام کاربری یا شماره تلفن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>

          <ScrollArea className="h-64">
            {/* Support Rooms */}
            {showSupportRooms && (
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground px-2">
                  پشتیبانی
                </h3>
                {filteredSupportRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleSupportRoomSelect(room)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback 
                        style={{ backgroundColor: room.type === 'academy_support' ? '#6366F1' : '#10B981' }}
                        className="text-white font-medium"
                      >
                        {room.type === 'academy_support' ? '🎓' : '🌐'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{room.name}</div>
                      <div className="text-xs text-muted-foreground">{room.description}</div>
                      <div className="text-xs text-muted-foreground">@{room.username}</div>
                    </div>
                    {room.icon}
                  </div>
                ))}
              </div>
            )}

            {/* Search Results */}
            {showSearchResults && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-2">
                  کاربران
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">در حال جستجو...</div>
                  </div>
                ) : filteredSearchResults.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">کاربری یافت نشد</div>
                  </div>
                ) : (
                  filteredSearchResults.map((user) => (
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
                  ))
                )}
              </div>
            )}

            {/* No search term - show instructions */}
            {!searchTerm && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    برای شروع گفتگو، پشتیبانی را انتخاب کنید یا نام کاربر مورد نظر را جستجو کنید
                  </p>
                </div>
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

export default StartChatModal;
