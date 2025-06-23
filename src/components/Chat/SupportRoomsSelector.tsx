
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Headphones, Phone, MessageCircle, Shield, Users, AlertCircle } from 'lucide-react';
import { supportRoomService, type SupportRoom } from '@/lib/supportRoomService';
import { type MessengerUser } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';

interface SupportRoomsSelectorProps {
  currentUser: MessengerUser;
  onRoomSelect: (room: SupportRoom) => void;
}

const SupportRoomsSelector: React.FC<SupportRoomsSelectorProps> = ({
  currentUser,
  onRoomSelect
}) => {
  const [supportRooms, setSupportRooms] = useState<SupportRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSupportRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching support rooms for user:', currentUser.id);
        
        const rooms = await supportRoomService.getUserSupportRooms(currentUser.id);
        console.log('Fetched support rooms:', rooms);
        
        setSupportRooms(rooms);
        
        if (rooms.length === 0) {
          console.log('No support rooms found for user. User roles:', {
            is_approved: currentUser.is_approved,
            bedoun_marz: currentUser.bedoun_marz,
            is_messenger_admin: currentUser.is_messenger_admin
          });
        }
      } catch (error: any) {
        console.error('Error fetching support rooms:', error);
        setError(error.message || 'خطا در بارگذاری اتاق‌های پشتیبانی');
        toast({
          title: 'خطا',
          description: 'خطا در بارگذاری اتاق‌های پشتیبانی',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchSupportRooms();
    }
  }, [currentUser.id, toast]);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'crown': return <Crown className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      case 'message-circle': return <MessageCircle className="w-5 h-5" />;
      case 'shield': return <Shield className="w-5 h-5" />;
      case 'users': return <Users className="w-5 h-5" />;
      default: return <Headphones className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-slate-900 dark:text-white">
          اتاق‌های پشتیبانی
        </h3>
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">خطا در بارگذاری</p>
          <p className="text-sm text-slate-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-600 hover:underline text-sm"
          >
            تلاش مجدد
          </button>
        </CardContent>
      </Card>
    );
  }

  if (supportRooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">هیچ اتاق پشتیبانی در دسترس نیست</p>
          <p className="text-xs text-slate-400">
            ممکن است نیاز به تایید حساب کاربری یا دسترسی خاص داشته باشید
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-slate-900 dark:text-white">
        اتاق‌های پشتیبانی ({supportRooms.length})
      </h3>
      
      {supportRooms.map((room) => (
        <Card 
          key={room.id}
          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          onClick={() => onRoomSelect(room)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${room.color}20` }}
              >
                {getIconComponent(room.icon)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-900 dark:text-white truncate">
                    {room.name}
                  </h4>
                  {room.is_default && (
                    <Badge variant="outline" className="text-xs">
                      پیش‌فرض
                    </Badge>
                  )}
                </div>
                
                {room.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {room.description}
                  </p>
                )}
              </div>
              
              <div className="text-left text-slate-400">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SupportRoomsSelector;
