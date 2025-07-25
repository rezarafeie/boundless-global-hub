import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, User, CreditCard, Key, MessageSquare, Activity } from 'lucide-react';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import { UserCRM } from '@/components/Admin/UserProfile/UserCRM';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  last_seen: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  bedoun_marz_approved: boolean;
  signup_source: string;
  user_id: string;
  first_name: string;
  last_name: string;
  country_code: string;
}

interface UserProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ isOpen, onClose, userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId && isOpen) {
      fetchUser(parseInt(userId));
    }
  }, [userId, isOpen]);

  const fetchUser = async (id: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadges = (user: User) => {
    const badges = [];
    if (user.is_approved) badges.push(<Badge key="approved" variant="default">Approved</Badge>);
    if (user.is_messenger_admin) badges.push(<Badge key="admin" variant="destructive">Admin</Badge>);
    if (user.bedoun_marz_approved) badges.push(<Badge key="boundless" variant="secondary">Boundless</Badge>);
    return badges;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 rounded-none border-0 p-0 bg-background overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between p-4 border-b">
            <DialogTitle className="text-lg font-semibold">User Profile</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading user profile...</p>
                </div>
              </div>
            ) : !user ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">User Not Found</h2>
                  <p className="text-muted-foreground">The requested user could not be found.</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">User ID: #{user.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadges(user)}
                  </div>
                </div>

                {/* Quick Info Card */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <User className="w-8 h-8" />
                        </div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{formatDate(user.created_at).split(' ')[0]}</p>
                        <p className="text-sm text-muted-foreground">Registration Date</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">{formatDate(user.last_seen).split(' ')[0]}</p>
                        <p className="text-sm text-muted-foreground">Last Seen</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-secondary">{user.signup_source || 'Website'}</p>
                        <p className="text-sm text-muted-foreground">Source</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="enrollments" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Enrollments
                    </TabsTrigger>
                    <TabsTrigger value="licenses" className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Licenses
                    </TabsTrigger>
                    <TabsTrigger value="crm" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      CRM
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Activity
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <UserOverview user={user} />
                  </TabsContent>

                  <TabsContent value="enrollments" className="mt-6">
                    <UserEnrollments userId={user.id} />
                  </TabsContent>

                  <TabsContent value="licenses" className="mt-6">
                    <UserLicenses userId={user.id} userPhone={user.phone} />
                  </TabsContent>

                  <TabsContent value="crm" className="mt-6">
                    <UserCRM userId={user.id} />
                  </TabsContent>

                  <TabsContent value="activity" className="mt-6">
                    <UserActivity userId={user.id} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfilePopup;