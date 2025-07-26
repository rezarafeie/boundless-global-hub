
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type MessengerUser } from '@/lib/messengerService';

interface MessengerUserProfileProps {
  user: MessengerUser;
  onClose: () => void;
  onUserUpdate: (user: MessengerUser) => void;
}

const MessengerUserProfile: React.FC<MessengerUserProfileProps> = ({
  user,
  onClose,
  onUserUpdate
}) => {
  const [name, setName] = React.useState(user.name);
  const [bio, setBio] = React.useState(user.bio || '');

  const handleSave = async () => {
    // TODO: Implement user profile update logic
    const updatedUser = { ...user, name, bio };
    onUserUpdate(updatedUser);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Phone: {user.phone}</p>
              {user.email && (
                <p className="text-sm text-muted-foreground">Email: {user.email}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <Label htmlFor="user-bio">Bio</Label>
            <Textarea
              id="user-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessengerUserProfile;
