// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageCircle, Plus, Users, Headphones, MessageSquare, Settings, User, Upload, Camera, WifiOff } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useNavigate } from 'react-router-dom';
import StartChatModal from './StartChatModal';
import { useRealtimeChatUpdates } from '@/hooks/useRealtimeChatUpdates';

interface MessengerInboxProps {
  sessionToken: string;
  onRoomSelect: (room: ChatRoom) => void;
  onUserSelect: (user: MessengerUser) => void;
  selectedRoom: ChatRoom | null;
  selectedUser: MessengerUser | null;
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
  isOffline?: boolean;
  onLogout?: () => void;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  sessionToken,
  onRoomSelect,
  onUserSelect,
  selectedRoom,
  selectedUser,
  currentUser,
  onUserUpdate,
  isOffline = false,
  onLogout
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [sessionToken]);

  // Set up realtime subscriptions for chat updates
  const { refreshConversations, refreshRooms } = useRealtimeChatUpdates({
    currentUser,
    sessionToken,
    isOffline,
    onConversationsUpdate: setConversations,
    onRoomsUpdate: setRooms,
    onSupportConversationsUpdate: setSupportConversations
  });

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading messenger data...');
      
      if (isOffline) {
        // Load cached data when offline
        const cachedRooms = JSON.parse(localStorage.getItem('cached_rooms') || '[]');
        const cachedConversations = JSON.parse(localStorage.getItem('cached_conversations') || '[]');
        const cachedSupportConversations = JSON.parse(localStorage.getItem('cached_support_conversations') || '[]');
        
        console.log('Loading cached data (offline mode)');
        setRooms(cachedRooms);
        setConversations(cachedConversations);
        setSupportConversations(cachedSupportConversations);
      } else {
        // Load from server when online
        const [roomsData, conversationsData, supportConversationsData] = await Promise.all([
          messengerService.getRooms(),
          privateMessageService.getUserConversations(currentUser.id, sessionToken),
          messengerService.getConversations(currentUser.id)
        ]);

        console.log('Loaded rooms:', roomsData);
        console.log('Loaded conversations:', conversationsData);
        console.log('Loaded support conversations:', supportConversationsData);

        // Show all active rooms - no filtering
        const activeRooms = roomsData.filter(room => room.is_active);
        
        // Cache the data for offline use
        localStorage.setItem('cached_rooms', JSON.stringify(activeRooms));
        localStorage.setItem('cached_conversations', JSON.stringify(conversationsData));
        localStorage.setItem('cached_support_conversations', JSON.stringify(supportConversationsData));
        
        setRooms(activeRooms);
        setConversations(conversationsData);
        setSupportConversations(supportConversationsData);
      }
    } catch (error) {
      console.error('Error loading messenger data:', error);
      
      // Fallback to cached data on error
      const cachedRooms = JSON.parse(localStorage.getItem('cached_rooms') || '[]');
      const cachedConversations = JSON.parse(localStorage.getItem('cached_conversations') || '[]');
      const cachedSupportConversations = JSON.parse(localStorage.getItem('cached_support_conversations') || '[]');
      
      if (cachedRooms.length > 0 || cachedConversations.length > 0 || cachedSupportConversations.length > 0) {
        console.log('Loading cached data as fallback');
        setRooms(cachedRooms);
        setConversations(cachedConversations);
        setSupportConversations(cachedSupportConversations);
      }
    } finally {
      setLoading(false);
    }
  };

  // Smooth update without loading states
  const updateConversationsList = async () => {
    if (!sessionToken) return;
    
    try {
      const [freshConversations, freshSupportConversations] = await Promise.all([
        privateMessageService.getUserConversations(currentUser.id, sessionToken),
        messengerService.getConversations(currentUser.id)
      ]);
      setConversations(freshConversations);
      setSupportConversations(freshSupportConversations);
    } catch (error) {
      console.error('Error updating conversations:', error);
    }
  };

  // Update the refresh function to include support conversations
  const refreshSupportConversations = async () => {
    if (!currentUser || isOffline) return;
    
    try {
      const freshSupportConversations = await messengerService.getConversations(currentUser.id);
      setSupportConversations(freshSupportConversations);
      localStorage.setItem('cached_support_conversations', JSON.stringify(freshSupportConversations));
    } catch (error) {
      console.error('Error refreshing support conversations:', error);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.phone?.includes(searchTerm)
  );

  // Remove duplicates from support conversations by grouping them
  const uniqueSupportConversations = supportConversations.reduce((acc, conv) => {
    // Check if we already have a conversation with the same name
    const existing = acc.find(existing => existing.name === conv.name);
    if (!existing) {
      acc.push(conv);
    } else {
      // Keep the one with more recent activity or higher unread count
      if (conv.last_message_time > existing.last_message_time || conv.unread_count > existing.unread_count) {
        const index = acc.indexOf(existing);
        acc[index] = conv;
      }
    }
    return acc;
  }, []);

  const filteredSupportConversations = uniqueSupportConversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleStartChat = () => {
    setShowStartChatModal(true);
  };

  const handleUserSelectFromModal = (user: MessengerUser) => {
    onUserSelect(user);
    setShowStartChatModal(false);
    // Refresh conversations to show the new chat immediately
    setTimeout(() => {
      refreshConversations();
    }, 500);
  };

  const handleSupportConversationSelect = (supportConv: any) => {
    // Create a support user object for consistency
    const supportUser = {
      id: 1,
      name: 'پشتیبانی',
      username: 'support',
      phone: '',
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
      email: null,
      user_id: null,
      first_name: null,
      last_name: null,
      full_name: null,
      country_code: null,
      signup_source: null,
      bio: null,
      notification_enabled: true,
      notification_token: null,
      password_hash: null,
      avatar_url: null
    };
    
    // Pass the conversation_id as a property on the user object for support conversations
    supportUser.conversation_id = supportConv.conversation_id;
    onUserSelect(supportUser);
  };

  const fmtTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' }) === now.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });
    return sameDay
      ? d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })
      : d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', timeZone: 'Asia/Tehran' });
  };

  const openSupport = (supportConv?: any) => {
    if (supportConv) return handleSupportConversationSelect(supportConv);
    handleSupportConversationSelect({ conversation_id: undefined });
  };

  type Row = { key: string; title: string; preview: string; time?: string; unread?: number; avatar?: string; icon?: React.ReactNode; active?: boolean; onClick: () => void };
  const supportRows: Row[] = filteredSupportConversations.map((c) => ({
    key: `support-${c.id}`, title: c.name || 'پشتیبانی', preview: c.last_message || 'گفتگوی پشتیبانی', time: c.last_message_time,
    unread: c.unread_count, icon: <Headphones className="w-5 h-5" />, onClick: () => openSupport(c),
  }));
  const groupRows: Row[] = filteredRooms.map((room) => ({
    key: `room-${room.id}`, title: room.name || 'گروه', preview: room.description || 'گروه', avatar: room.avatar_url,
    icon: <Users className="w-5 h-5" />, active: selectedRoom?.id === room.id, onClick: () => onRoomSelect(room),
  }));
  const privateRows: Row[] = filteredConversations.map((c) => ({
    key: `pv-${c.id}`, title: c.other_user?.name || c.other_user?.username || 'کاربر', preview: c.last_message?.message || (c.last_message?.media_url ? 'فایل' : 'گفتگوی جدید'),
    time: c.last_message?.created_at, unread: c.unread_count, avatar: c.other_user?.avatar_url,
    active: selectedUser?.id === c.other_user?.id,
    onClick: () => {
      onUserSelect(c.other_user);
      if (c.unread_count > 0) { privateMessageService.markMessagesAsRead(c.id, currentUser.id); setTimeout(() => updateConversationsList(), 100); }
    },
  }));
  const sortByTime = (rows: Row[]) => [...rows].sort((a, b) => (b.time ? Date.parse(b.time) : 0) - (a.time ? Date.parse(a.time) : 0));
  const rows: Row[] = activeTab === 'groups' ? groupRows
    : activeTab === 'personal' ? sortByTime(privateRows)
    : activeTab === 'support' ? (supportRows.length ? supportRows : [{ key: 'support-new', title: 'پشتیبانی', preview: 'راهنمایی و پشتیبانی', icon: <Headphones className="w-5 h-5" />, onClick: () => openSupport() }])
    : [...sortByTime([...supportRows, ...privateRows]), ...groupRows];

  const tabs = [
    { id: 'all', label: 'همه' },
    { id: 'personal', label: 'شخصی' },
    { id: 'groups', label: 'گروه‌ها' },
    { id: 'support', label: 'پشتیبانی' },
  ];

  return (
    <div className="h-full flex flex-col bg-background" dir="rtl">
      <div className="px-4 pt-3 pb-2 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between h-11">
          <Button size="icon" variant="ghost" onClick={() => navigate('/profile')} className="h-9 w-9 rounded-full" aria-label="پروفایل">
            <User className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">پیام‌ها</h1>
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-destructive' : 'bg-primary/70'}`} title={isOffline ? 'آفلاین' : 'متصل'} />
          </div>
          <Button size="icon" variant="ghost" onClick={handleStartChat} className="h-9 w-9 rounded-full" aria-label="گفتگوی جدید">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={isOffline ? 'جستجو آفلاین...' : 'جستجو'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 h-9 text-sm rounded-full bg-muted border-0 focus-visible:ring-1"
            dir="rtl"
          />
        </div>
        <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 h-8 rounded-full text-sm whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="py-1 w-full">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2"><div className="h-3 w-1/2 bg-muted rounded animate-pulse" /><div className="h-3 w-3/4 bg-muted rounded animate-pulse" /></div>
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              {isOffline ? <WifiOff className="w-10 h-10 text-muted-foreground mb-3" /> : <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />}
              <p className="text-sm text-muted-foreground">{searchTerm ? 'نتیجه‌ای یافت نشد' : 'هنوز گفتگویی ندارید'}</p>
              {!isOffline && <Button variant="outline" size="sm" onClick={handleStartChat} className="mt-4 rounded-full">شروع گفتگو</Button>}
            </div>
          ) : (
            rows.map((r) => (
              <button
                key={r.key}
                onClick={r.onClick}
                dir="rtl"
                className={`w-full max-w-full overflow-hidden flex items-center gap-3 px-3 py-2 text-right transition-colors ${r.active ? 'bg-accent' : 'hover:bg-muted/70 active:bg-muted'}`}
              >
                <Avatar className="w-12 h-12 shrink-0">
                  {r.avatar && <AvatarImage src={r.avatar} alt={r.title} />}
                  <AvatarFallback className="bg-muted text-foreground font-semibold">
                    {r.icon && !r.avatar ? r.icon : r.title.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 overflow-hidden border-b border-border/50 pb-2 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold truncate min-w-0 flex-1 text-right" dir="auto">{r.title}</p>
                    <span className={`text-xs shrink-0 ${r.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{fmtTime(r.time)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-sm text-muted-foreground truncate min-w-0 flex-1 text-right" dir="auto">{r.preview}</p>
                    {r.unread > 0 && (
                      <span className="shrink-0 bg-primary text-primary-foreground text-[11px] font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                        {r.unread > 99 ? '99+' : r.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <StartChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onUserSelect={handleUserSelectFromModal}
        sessionToken={sessionToken}
        currentUser={currentUser}
      />
    </div>
  );
};

export default MessengerInbox;
