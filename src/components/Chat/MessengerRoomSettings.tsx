
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type MessengerRoom, type MessengerUser } from '@/lib/messengerService';

interface MessengerRoomSettingsProps {
  room: MessengerRoom;
  currentUser: MessengerUser;
  onClose: () => void;
  onRoomUpdate: (room: MessengerRoom) => void;
}

const MessengerRoomSettings: React.FC<MessengerRoomSettingsProps> = ({
  room,
  currentUser,
  onClose,
  onRoomUpdate
}) => {
  const [name, setName] = React.useState(room.name);
  const [description, setDescription] = React.useState(room.description || '');

  const handleSave = async () => {
    // TODO: Implement room update logic
    const updatedRoom = { ...room, name, description };
    onRoomUpdate(updatedRoom);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Room Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name"
            />
          </div>
          
          <div>
            <Label htmlFor="room-description">Description</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter room description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!currentUser.is_messenger_admin}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessengerRoomSettings;
