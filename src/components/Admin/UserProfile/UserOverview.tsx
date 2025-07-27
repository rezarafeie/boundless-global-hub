
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Globe, UserCheck } from 'lucide-react';
import type { ChatUser } from '@/lib/supabase';

interface UserOverviewProps {
  user: ChatUser | {
    id: number;
    name: string;
    email?: string;
    phone: string;
    created_at: string;
    last_seen?: string;
    is_approved: boolean;
    is_messenger_admin: boolean;
    bedoun_marz_approved: boolean;
    signup_source?: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    country_code?: string;
    [key: string]: any;
  };
}

export function UserOverview({ user }: UserOverviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'نامشخص';
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewUserDetails = (userId: number) => {
    window.open(`/enroll/admin/users/${userId}`, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            اطلاعات شخصی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">شناسه کاربر</label>
              <p className="font-medium text-sm sm:text-base">#{user.id}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">شناسه داخلی</label>
              <p className="font-medium text-sm sm:text-base">{user.user_id || 'نامشخص'}</p>
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-medium text-muted-foreground">نام کامل</label>
            <button
              onClick={() => handleViewUserDetails(user.id)}
              className="font-medium text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline block w-full text-right"
            >
              {user.name}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">نام</label>
              <p className="font-medium text-sm sm:text-base">{user.first_name || 'نامشخص'}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">نام خانوادگی</label>
              <p className="font-medium text-sm sm:text-base">{user.last_name || 'نامشخص'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">ایمیل</label>
              <p className="font-medium text-sm sm:text-base break-all">{user.email || 'نامشخص'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">شماره تلفن</label>
              <p className="font-medium text-sm sm:text-base" dir="ltr">{user.country_code || ''} {user.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
