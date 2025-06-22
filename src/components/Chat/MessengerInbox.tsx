import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { messengerService, type MessengerUser, type ChatRoom } from '@/lib/messengerService';

interface MessengerInboxProps {
  currentUser: MessengerUser | null;
  onRoomSelect: (room: ChatRoom) => void;
  selectedRoom: ChatRoom | null;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  currentUser,
  onRoomSelect,
  selectedRoom
}) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const handleEnterSupportPanel = () => {
    navigate('/hub/support');
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        navigate('/login');
        return;
      }

      const fetchedRooms = await messengerService.getRooms(sessionToken);
      setRooms(fetchedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            گفتگوها
          </h2>
          {currentUser.is_support_agent && (
            <Button
              onClick={handleEnterSupportPanel}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🎧 ورود به پنل پشتیبانی
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Input
            type="text"
            placeholder="جستجو در گفتگوها..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <CardContent className="h-full flex items-center justify-center">
            <p className="text-center text-slate-500 dark:text-slate-400">
              در حال بارگذاری گفتگوها...
            </p>
          </CardContent>
        ) : filteredRooms.length === 0 ? (
          <CardContent className="h-full flex items-center justify-center">
            <p className="text-center text-slate-500 dark:text-slate-400">
              هیچ گفتگویی یافت نشد.
            </p>
          </CardContent>
        ) : (
          filteredRooms.map(room => (
            <Card
              key={room.id}
              className={`mb-0 border-none shadow-none rounded-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedRoom?.id === room.id ? 'bg-blue-50 dark:bg-blue-950' : ''
              }`}
              onClick={() => onRoomSelect(room)}
            >
              <CardContent className="p-3">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  {room.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {room.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MessengerInbox;
