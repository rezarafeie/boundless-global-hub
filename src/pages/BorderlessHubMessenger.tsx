// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Loader2, Plus, MessageSquare, UserPlus, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService, type PrivateConversation } from '@/lib/privateMessageService';
import MessengerChatView from '@/components/Chat/MessengerChatView';
import PrivateChatView from '@/components/Chat/PrivateChatView';
import UserProfileModal from '@/components/Chat/UserProfileModal';
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from '@/integrations/supabase/client';

interface UnifiedChatItem {
  id: string;
  type: 'group' | 'private' | 'support';
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  data: ChatRoom | PrivateConversation | any;
}

const BorderlessHubMessenger: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<MessengerUser | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedUser, setSelectedUser] = useState<MessengerUser | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [selectedSupportConversation, setSelectedSupportConversation] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState<boolean | null>(null);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  const [isUsernameUpdating, setIsUsernameUpdating] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

  const debouncedValue = useDebounce(searchTerm, 500);

  useEffect(() => {
    setDebouncedSearchTerm(debouncedValue);
  }, [debouncedValue]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchUsers(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setIsNotificationsEnabled(user.notification_enabled !== false);
    }
  }, [user]);

  useEffect(() => {
    loadSupportConversations();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('session_token') || '';
      const userEmail = localStorage.getItem('user_email') || '';
      
      const existingUser = await messengerService.getOrCreateChatUser(userEmail);
      setUser(existingUser);
      setNotificationToken(existingUser.notification_token);

      const chatRooms = await messengerService.getRooms();
      setRooms(chatRooms);

      const privateChats = await privateMessageService.getUserConversations(existingUser.id, sessionToken);
      setConversations(privateChats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSupportConversations = async () => {
    try {
      const supportChats = await privateMessageService.getSupportConversations();
      setSupportConversations(supportChats);
    } catch (error) {
      console.error('Error loading support conversations:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری گفتگوهای پشتیبانی',
        variant: 'destructive',
      });
    }
  };

  const searchUsers = async (term: string) => {
    try {
      const results = await privateMessageService.searchUsers(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'خطا',
        description: 'خطا در جستجوی کاربران',
        variant: 'destructive',
      });
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    setSelectedUser(null);
  };

  const handleUserSelect = (user: MessengerUser) => {
    setSelectedUser(user);
    setSelectedRoom(null);
  };

  const handleSupportSelect = (conversation: any) => {
    setSelectedSupportConversation(conversation);
    setSelectedRoom(null);
    setSelectedUser(null);
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setSelectedUser(null);
    setSelectedSupportConversation(null);
  };

  const handleStartChat = (user: any) => {
    // Convert to full MessengerUser type for compatibility
    const fullUser: MessengerUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      phone: user.phone,
      is_approved: true,
      is_messenger_admin: false,
      is_support_agent: false,
      bedoun_marz: false,
      bedoun_marz_approved: false,
      bedoun_marz_request: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      role: 'user',
      email: user.email || null,
      user_id: user.user_id || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      full_name: user.full_name || user.name,
      country_code: user.country_code || null,
      signup_source: user.signup_source || null,
      bio: user.bio || null,
      notification_enabled: user.notification_enabled || true,
      notification_token: user.notification_token || null,
      password_hash: user.password_hash || null
    };
    
    setSelectedUser(fullUser);
    setShowUserProfile(false);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      setCreatingRoom(true);
      await messengerService.createRoom({
        name: newRoomName,
        description: newRoomDescription,
        type: 'group'
      });
      toast({
        title: 'موفق',
        description: 'اتاق با موفقیت ایجاد شد',
      });
      setNewRoomName('');
      setNewRoomDescription('');
      const chatRooms = await messengerService.getRooms();
      setRooms(chatRooms);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد اتاق',
        variant: 'destructive',
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleInviteUser = async () => {
    if (!invitePhone.trim()) return;

    try {
      // TODO: Implement invite user logic
      toast({
        title: 'موفق',
        description: `دعوتنامه به ${invitePhone} ارسال شد`,
      });
      setInvitePhone('');
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'خطا',
        description: 'خطا در دعوت کاربر',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!user) return;

    try {
      setIsNotificationsEnabled(enabled);
      await messengerService.updateNotificationSettings(user.id, enabled);
      toast({
        title: 'موفق',
        description: `اعلان‌ها ${enabled ? 'فعال' : 'غیرفعال'} شدند`,
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بروزرسانی تنظیمات اعلان',
        variant: 'destructive',
      });
    }
  };

  const checkUsername = async (name: string) => {
    if (!name.trim()) {
      setUsernameAvailability(null);
      return;
    }

    setIsUsernameLoading(true);
    try {
      const available = await privateMessageService.checkUsernameAvailability(name, user?.id);
      setUsernameAvailability(available);
    } catch (error) {
      console.error('Error checking username availability:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بررسی نام کاربری',
        variant: 'destructive',
      });
      setUsernameAvailability(false);
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!username.trim() || usernameAvailability !== true || !user) return;

    setIsUsernameUpdating(true);
    try {
      await privateMessageService.updateUsername(user.id, username);
      toast({
        title: 'موفق',
        description: 'نام کاربری با موفقیت تغییر کرد',
      });
      setIsUsernameModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: 'خطا',
        description: 'خطا در تغییر نام کاربری',
        variant: 'destructive',
      });
    } finally {
      setIsUsernameUpdating(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutAlertOpen(false);
    navigate('/');
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatLastMessageTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatLastMessage = (message: string, messageType: string) => {
    if (messageType === 'text') {
      return message.length > 50 ? message.substring(0, 50) + '...' : message;
    } else if (messageType === 'image') {
      return '🖼️ تصویر';
    } else if (messageType === 'voice') {
      return '🎵 پیام صوتی';
    } else if (messageType === 'file') {
      return '📎 فایل';
    }
    return message;
  };

  // Process rooms for unified view with enhanced last message data
  const roomItems: UnifiedChatItem[] = rooms.map(room => ({
    id: `group-${room.id}`,
    type: 'group' as const,
    name: room.name,
    lastMessage: room.last_message 
      ? formatLastMessage(room.last_message.message, room.last_message.message_type)
      : 'پیامی وجود ندارد',
    lastMessageTime: room.last_message_time 
      ? formatLastMessageTime(room.last_message_time)
      : '',
    unreadCount: room.unread_count || 0,
    data: room
  }));

  // Process conversations for unified view
  const conversationItems: UnifiedChatItem[] = conversations.map(conv => ({
    id: `private-${conv.id}`,
    type: 'private' as const,
    name: conv.other_user?.name || 'نامشخص',
    lastMessage: conv.last_message?.message || 'پیامی وجود ندارد',
    lastMessageTime: conv.last_message?.created_at 
      ? formatLastMessageTime(conv.last_message.created_at)
      : '',
    unreadCount: conv.unread_count || 0,
    data: conv
  }));

  // Process support conversations for unified view
  const supportItems: UnifiedChatItem[] = supportConversations.map(conv => ({
    id: `support-${conv.id}`,
    type: 'support' as const,
    name: conv.chat_users?.name || 'پشتیبانی',
    lastMessage: 'آخرین پیام',
    lastMessageTime: '12:00',
    unreadCount: 0,
    data: conv
  }));

  // Combine all chat items
  const chatItems: UnifiedChatItem[] = [...roomItems, ...conversationItems, ...supportItems];

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white dark:bg-slate-900 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            پیام‌رسان
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(user?.name || 'U') }}
                    className="text-white font-medium text-xs"
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowUserProfile(true)}>
                پروفایل
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                تنظیمات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLogoutAlertOpen(true)}>
                خروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="p-3">
          <Input
            type="text"
            placeholder="جستجو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400"
          />
          {searchTerm && searchResults.length > 0 && (
            <div className="mt-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => handleUserSelect(result)}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={result.avatar_url} alt={result.name} />
                    <AvatarFallback 
                      style={{ backgroundColor: getAvatarColor(result.name) }}
                      className="text-white font-medium text-xs"
                    >
                      {result.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-900 dark:text-white">{result.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500 dark:text-slate-400" />
            </div>
          ) : chatItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  هنوز هیچ گفتگویی وجود ندارد
                </p>
                <p className="text-xs text-slate-400">
                  با جستجو در بالا یک گفتگو را شروع کنید
                </p>
              </div>
            </div>
          ) : (
            chatItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                  (selectedRoom?.id === (item.data as ChatRoom).id) || (selectedUser?.id === (item.data as PrivateConversation).other_user?.id)
                    ? 'bg-blue-50 dark:bg-blue-900'
                    : ''
                }`}
                onClick={() => {
                  if (item.type === 'group') {
                    handleRoomSelect(item.data as ChatRoom);
                  } else if (item.type === 'private') {
                    handleUserSelect((item.data as PrivateConversation).other_user);
                  } else if (item.type === 'support') {
                    handleSupportSelect(item.data);
                  }
                }}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={(item.data as any).avatar_url || (item.data as any).other_user?.avatar_url} alt={item.name} />
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(item.name) }}
                    className="text-white font-medium text-sm"
                  >
                    {item.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {item.name}
                    </div>
                    {item.lastMessageTime && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                        {item.lastMessageTime}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.lastMessage}
                    </div>
                    {item.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1">
                        {item.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t dark:border-slate-700">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                شروع گفتگو
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-96">
              <SheetHeader>
                <SheetTitle>شروع گفتگو</SheetTitle>
                <SheetDescription>
                  یک اتاق جدید ایجاد کنید یا یک کاربر را دعوت کنید.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsInviteModalOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                  دعوت کاربر
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageSquare className="w-4 h-4" />
                      ایجاد اتاق
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ایجاد اتاق جدید</AlertDialogTitle>
                      <AlertDialogDescription>
                        یک اتاق جدید ایجاد کنید و با دیگران گفتگو کنید.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2">
                      <Label htmlFor="name">نام اتاق</Label>
                      <Input
                        type="text"
                        id="name"
                        placeholder="نام اتاق"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                      />
                      <Label htmlFor="description">توضیحات</Label>
                      <Textarea
                        id="description"
                        placeholder="توضیحات"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCreateRoom} disabled={creatingRoom}>
                        {creatingRoom ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'ایجاد'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1">
        {selectedRoom || selectedUser ? (
          selectedRoom ? (
            <MessengerChatView
              selectedRoom={selectedRoom}
              selectedUser={null}
              currentUser={user as MessengerUser}
              sessionToken={localStorage.getItem('session_token') || ''}
              onBackToRooms={handleBackToRooms}
            />
          ) : selectedUser ? (
            <PrivateChatView
              conversation={{
                id: 0,
                user1_id: user?.id as number,
                user2_id: selectedUser.id,
                created_at: new Date().toISOString(),
                last_message_at: new Date().toISOString(),
                other_user: selectedUser,
                unread_count: 0
              }}
              currentUser={user as MessengerUser}
              sessionToken={localStorage.getItem('session_token') || ''}
              onBack={handleBackToRooms}
            />
          ) : null
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                یک گفتگو انتخاب کنید
              </p>
              <p className="text-sm text-slate-400">
                از لیست سمت چپ یک گفتگو یا گروه انتخاب کنید
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>دعوت کاربر</DialogTitle>
            <DialogDescription>
              شماره تلفن کاربر مورد نظر را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                شماره تلفن
              </Label>
              <Input
                type="tel"
                id="phone"
                placeholder="شماره تلفن"
                className="col-span-3"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" onClick={handleInviteUser} className="mr-2">
              دعوت
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Modal */}
      <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>گفتگو با پشتیبانی</DialogTitle>
            <DialogDescription>
              یک گفتگو با پشتیبانی ایجاد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {supportConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                onClick={() => handleSupportSelect(conversation)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={conversation.chat_users?.avatar_url} alt={conversation.chat_users?.name} />
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(conversation.chat_users?.name || 'U') }}
                    className="text-white font-medium text-xs"
                  >
                    {conversation.chat_users?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 dark:text-white">{conversation.chat_users?.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">آخرین پیام</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsSupportModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" className="mr-2">
              شروع گفتگو
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تنظیمات</DialogTitle>
            <DialogDescription>
              تنظیمات حساب کاربری خود را تغییر دهید.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">اعلان‌ها</Label>
              <Switch
                id="notifications"
                checked={isNotificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsUsernameModalOpen(true)}>
              تغییر نام کاربری
            </Button>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsSettingsOpen(false)}>
              انصراف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Username Modal */}
      <Dialog open={isUsernameModalOpen} onOpenChange={setIsUsernameModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تغییر نام کاربری</DialogTitle>
            <DialogDescription>
              نام کاربری جدید خود را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                نام کاربری
              </Label>
              <Input
                type="text"
                id="username"
                placeholder="نام کاربری"
                className="col-span-3"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  checkUsername(e.target.value);
                }}
              />
            </div>
            {usernameAvailability === false && (
              <p className="text-red-500 text-sm">این نام کاربری قبلا انتخاب شده است.</p>
            )}
            {usernameAvailability === true && (
              <p className="text-green-500 text-sm">این نام کاربری در دسترس است.</p>
            )}
            {isUsernameLoading && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsUsernameModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" onClick={handleUsernameChange} className="mr-2" disabled={usernameAvailability !== true || isUsernameUpdating}>
              {isUsernameUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'ذخیره'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Alert */}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>خروج از حساب کاربری</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>خروج</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={user}
        onStartChat={handleStartChat}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default BorderlessHubMessenger;
