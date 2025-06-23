
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Headphones } from 'lucide-react';

interface SupportRoom {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ReactNode;
  isPermanent: boolean;
}

interface SupportRoomsSelectorProps {
  onRoomSelect: (room: SupportRoom) => void;
  currentUser: any;
}

const SupportRoomsSelector: React.FC<SupportRoomsSelectorProps> = ({
  onRoomSelect,
  currentUser
}) => {
  const supportRooms: SupportRoom[] = [
    {
      id: '1',
      name: 'پشتیبانی آکادمی',
      description: 'پشتیبانی عمومی آکادمی',
      type: 'academy_support',
      icon: <Headphones className="w-4 h-4" />,
      isPermanent: true
    }
  ];

  // Add boundless support for eligible users
  if (currentUser?.bedoun_marz || currentUser?.bedoun_marz_approved) {
    supportRooms.push({
      id: '2',
      name: 'پشتیبانی بدون مرز',
      description: 'پشتیبانی ویژه اعضای بدون مرز',
      type: 'boundless_support',
      icon: <MessageCircle className="w-4 h-4" />,
      isPermanent: true
    });
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            بخش‌های پشتیبانی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {supportRooms.map((room) => (
            <Button
              key={room.id}
              variant="outline"
              className="w-full justify-start gap-2 h-auto p-3"
              onClick={() => onRoomSelect(room)}
            >
              {room.icon}
              <div className="text-left">
                <div className="font-medium">{room.name}</div>
                <div className="text-xs text-slate-500">{room.description}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportRoomsSelector;
