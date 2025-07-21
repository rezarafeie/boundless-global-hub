import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Globe, UserCheck } from 'lucide-react';

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

interface UserOverviewProps {
  user: User;
}

export function UserOverview({ user }: UserOverviewProps) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="font-medium">#{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Internal User ID</label>
              <p className="font-medium">{user.user_id || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <p className="font-medium">{user.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">First Name</label>
              <p className="font-medium">{user.first_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
              <p className="font-medium">{user.last_name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="font-medium">{user.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="font-medium">{user.country_code || ''} {user.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Approval Status</label>
            <div className="mt-1">
              <Badge variant={user.is_approved ? "default" : "secondary"}>
                {user.is_approved ? "Approved" : "Pending Approval"}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Admin Status</label>
            <div className="mt-1">
              <Badge variant={user.is_messenger_admin ? "destructive" : "outline"}>
                {user.is_messenger_admin ? "Admin" : "Regular User"}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Boundless Status</label>
            <div className="mt-1">
              <Badge variant={user.bedoun_marz_approved ? "secondary" : "outline"}>
                {user.bedoun_marz_approved ? "Boundless Approved" : "Not Boundless"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Signup Source</label>
              <p className="font-medium">{user.signup_source || 'Website'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Information */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
              <p className="font-medium">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Seen</label>
              <p className="font-medium">{formatDate(user.last_seen)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}