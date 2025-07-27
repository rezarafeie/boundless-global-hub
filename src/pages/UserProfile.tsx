import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Shield, 
  Crown, 
  AlertCircle, 
  MessageSquare, 
  Activity, 
  CreditCard, 
  Key,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import UserCRM from '@/components/Admin/UserProfile/UserCRM';
import { UserOverview } from '@/components/Admin/UserProfile/UserOverview';
import { UserEnrollments } from '@/components/Admin/UserProfile/UserEnrollments';
import { UserLicenses } from '@/components/Admin/UserProfile/UserLicenses';
import { UserActivity } from '@/components/Admin/UserProfile/UserActivity';

interface UserData {
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
  username: string;
  bio: string;
  is_support_agent: boolean;
  avatar_url: string;
}

const UserProfile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (phone) {
      fetchUser(phone);
    }
  }, [phone]);

  const fetchUser = async (phone: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadges = (user: UserData) => {
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

  if (!phone) return <div>No phone number provided.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">User Profile</h1>
              <p className="text-muted-foreground">View and manage user details</p>
            </div>
          </div>
        </div>

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
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">User ID: #{user.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadges(user)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.first_name?.charAt(0)}
                        {user.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                    {user.username && (
                      <a 
                        href={`https://t.me/${user.username}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:underline text-sm flex items-center justify-center gap-1 mt-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        @{user.username}
                      </a>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Joined: {formatDate(user.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Phone: {user.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Email: {user.email}
                      </p>
                    </div>
                    {user.bio && (
                      <div className="mt-4 p-3 rounded-md bg-secondary">
                        <p className="text-sm text-muted-foreground">{user.bio}</p>
                      </div>
                    )}
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
                <UserCRM 
                  userId={user.id}
                  userName={user.name}
                  userPhone={user.phone}
                  userEmail={user.email}
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <UserActivity userId={user.id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
