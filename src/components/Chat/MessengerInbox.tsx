
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Users, Headphones, MessageSquare, Crown, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import UserProfile from './UserProfile';

interface MessengerInboxProps {
  sessionToken: string;
  onRoomSelect: (room: ChatRoom) => void;
  onUserSelect: (user: MessengerUser) => void;
  selectedRoom?: ChatRoom | null;
  selectedUser?: MessengerUser | null;
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  sessionToken,
  onRoomSelect,
  onUserSelect,
  selectedRoom,
  selectedUser,
  currentUser,
  onUserUpdate
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [supportUsers, setSupportUsers] = useState<MessengerUser[]>([]);
  const [privateConversations, setPrivateConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MessengerUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionToken, currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, supportUsersData, conversationsData] = await Promise.all([
        messengerService.getRooms(sessionToken),
        messengerService.getSupportUsers(currentUser),
        messengerService.getPrivateConversations(currentUser.id)
      ]);
      
      setRooms(roomsData);
      setSupportUsers(supportUsersData);
      setPrivateConversations(conversationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await messengerService.searchUsers(searchTerm.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelectFromSearch = (user: MessengerUser) => {
    onUserSelect(user);
    setShowNewChat(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRoomIcon = (room: ChatRoom) => {
    if (room.is_boundless_only) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    } else {
      return <Users className="w-4 h-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-slate-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">چت‌ها</h2>
          <div className="flex gap-2">
            <Dialog open={showProfile} onOpenChange={setShowProfile}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback 
                      style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                      className="text-white text-xs"
                    >
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>پروفایل کاربری</DialogTitle>
                </DialogHeader>
                <UserProfile user={currentUser} onUserUpdate={onUserUpdate} />
              </DialogContent>
            </Dialog>
            
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>شروع چت جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">جستجو کاربر</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="شماره تلفن یا @username"
                        className="flex-1"
                      />
                      <Button onClick={handleSearch} disabled={searching}>
                        {searching ? 'جستجو...' : 'جستجو'}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      شماره تلفن کامل یا نام کاربری دقیق وارد کنید
                    </p>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>نتایج جستجو</Label>
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelectFromSearch(user)}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-100"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback 
                              style={{ backgroundColor: getAvatarColor(user.name) }}
                              className="text-white text-sm"
                            >
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-slate-500">
                              {user.username ? `@${user.username}` : user.phone}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {/* Support Users - Always at top */}
          {supportUsers.map((user) => (
            <div
              key={`support-${user.id}`}
              onClick={() => onUserSelect(user)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-600 text-white font-medium">
                    <Headphones className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{user.name}</div>
                  <Badge variant="secondary" className="text-xs">
                    پشتیبانی
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">
                  {user.phone === '1' ? 'پشتیبانی آکادمی' : 'پشتیبانی بدون مرز'}
                </div>
              </div>
            </div>
          ))}

          {/* Private Conversations */}
          {privateConversations.map((conversation) => (
            <div
              key={`conv-${conversation.id}`}
              onClick={() => onUserSelect(conversation.otherUser)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedUser?.id === conversation.otherUser.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback 
                  style={{ backgroundColor: getAvatarColor(conversation.otherUser.name) }}
                  className="text-white font-medium"
                >
                  {conversation.otherUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{conversation.otherUser.name}</div>
                {conversation.otherUser.username && (
                  <div className="text-xs text-slate-500">@{conversation.otherUser.username}</div>
                )}
                {conversation.last_message_at && (
                  <div className="text-xs text-slate-400">
                    {new Date(conversation.last_message_at).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Chat Rooms */}
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onRoomSelect(room)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedRoom?.id === room.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(room.name) }}
                    className="text-white font-medium"
                  >
                    {room.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1">
                  {getRoomIcon(room)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate">{room.name}</div>
                  {room.unread_count! > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {room.unread_count}
                    </Badge>
                  )}
                </div>
                {room.description && (
                  <div className="text-xs text-slate-500 truncate">{room.description}</div>
                )}
                {room.last_message && (
                  <div className="text-xs text-slate-500 truncate">{room.last_message}</div>
                )}
              </div>
            </div>
          ))}

          {rooms.length === 0 && supportUsers.length === 0 && privateConversations.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">هیچ چتی یافت نشد</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessengerInbox;
