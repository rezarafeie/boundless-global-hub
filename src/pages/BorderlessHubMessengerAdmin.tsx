
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messengerService, type MessengerUser, type ChatRoom } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserRowProps {
  user: MessengerUser;
  onUpdateRole: (userId: number, updates: { is_support_agent?: boolean; is_messenger_admin?: boolean }) => Promise<void>;
}

const UserRow: React.FC<UserRowProps> = ({ user, onUpdateRole }) => {
  const [isSupportAgent, setIsSupportAgent] = useState(user.is_support_agent || false);
  const [isMessengerAdmin, setIsMessengerAdmin] = useState(user.is_messenger_admin || false);

  useEffect(() => {
    setIsSupportAgent(user.is_support_agent || false);
    setIsMessengerAdmin(user.is_messenger_admin || false);
  }, [user]);

  const handleSupportAgentChange = async (checked: boolean) => {
    setIsSupportAgent(checked);
    await onUpdateRole(user.id, { is_support_agent: checked });
  };

  const handleMessengerAdminChange = async (checked: boolean) => {
    setIsMessengerAdmin(checked);
    await onUpdateRole(user.id, { is_messenger_admin: checked });
  };

  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell>{user.phone}</TableCell>
      <TableCell>
        <Switch checked={isSupportAgent} onCheckedChange={handleSupportAgentChange} id={`support-agent-${user.id}`} />
      </TableCell>
      <TableCell>
        <Switch checked={isMessengerAdmin} onCheckedChange={handleMessengerAdminChange} id={`messenger-admin-${user.id}`} />
      </TableCell>
    </TableRow>
  );
};

const BorderlessHubMessengerAdmin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'general',
    description: '',
    is_boundless_only: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (!sessionToken) {
      navigate('/login');
    } else {
      fetchUsers();
      fetchRooms();
    }
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await messengerService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('No session token found');
      }
      const fetchedRooms = await messengerService.getRooms(sessionToken);
      setRooms(fetchedRooms);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, updates: { is_support_agent?: boolean; is_messenger_admin?: boolean }) => {
    try {
      await messengerService.updateUserRole(userId, updates);
      fetchUsers();
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) return;
    
    try {
      const roomData = {
        name: newRoom.name,
        type: newRoom.type,
        description: newRoom.description,
        is_boundless_only: newRoom.is_boundless_only,
        is_active: true
      };

      await messengerService.createRoom(roomData);
      setNewRoom({ name: '', type: 'general', description: '', is_boundless_only: false });
      fetchRooms();
      
      toast({
        title: 'موفقیت',
        description: 'اتاق جدید با موفقیت ایجاد شد',
      });
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ایجاد اتاق',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await messengerService.deleteRoom(roomId);
      fetchRooms();
      toast({
        title: 'Success',
        description: 'Room deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete room',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Messenger Admin Panel</h1>

      {/* User Management */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">User Management</h2>
        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of all messenger users.</TableCaption>
            <TableHead>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Support Agent</TableHead>
                <TableHead>Messenger Admin</TableHead>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <UserRow key={user.id} user={user} onUpdateRole={handleUpdateUserRole} />
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Room Management */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Room Management</h2>

        {/* Create Room Form */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a type" defaultValue="general" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academy_support">Academy Support</SelectItem>
                    <SelectItem value="boundless_support">Boundless Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input id="description" value={newRoom.description} onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_boundless_only" className="text-right">
                  Boundless Only
                </Label>
                <Switch id="is_boundless_only" checked={newRoom.is_boundless_only} onCheckedChange={(checked) => setNewRoom({ ...newRoom, is_boundless_only: checked })} className="col-span-3" />
              </div>
            </div>
            <Button onClick={handleCreateRoom}>Create Room</Button>
          </DialogContent>
        </Dialog>

        {/* Room List */}
        <div className="rounded-md border mt-4">
          <Table>
            <TableCaption>List of chat rooms.</TableCaption>
            <TableHead>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Boundless Only</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>{room.description}</TableCell>
                  <TableCell>{room.is_boundless_only ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};

export default BorderlessHubMessengerAdmin;
