import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, Calendar, Phone, Mail, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  bedoun_marz_approved: boolean;
  signup_source: string;
}

export default function UsersOverview() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterBy]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id, name, email, phone, created_at, is_approved, is_messenger_admin, bedoun_marz_approved, signup_source')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);

      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'approved' && user.is_approved) ||
        (filterBy === 'admin' && user.is_messenger_admin) ||
        (filterBy === 'boundless' && user.bedoun_marz_approved);

      return matchesSearch && matchesFilter;
    });

    setFilteredUsers(filtered);
  };

  const getStatusBadges = (user: User) => {
    const badges = [];
    if (user.is_approved) badges.push(<Badge key="approved" variant="default">Approved</Badge>);
    if (user.is_messenger_admin) badges.push(<Badge key="admin" variant="destructive">Admin</Badge>);
    if (user.bedoun_marz_approved) badges.push(<Badge key="boundless" variant="secondary">Boundless</Badge>);
    return badges;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const handleViewProfile = (userId: number) => {
    navigate(`/enroll/admin/users/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline">{filteredUsers.length} Users</Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="approved">Approved Only</SelectItem>
                <SelectItem value="admin">Admins Only</SelectItem>
                <SelectItem value="boundless">Boundless Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">#{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {user.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getStatusBadges(user)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewProfile(user.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}