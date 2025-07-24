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

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
              <p className="font-medium text-sm sm:text-base">{user.name}</p>
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

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              وضعیت حساب کاربری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">وضعیت تایید</label>
              <div className="mt-1">
                <Badge variant={user.is_approved ? "default" : "secondary"} className="text-xs">
                  {user.is_approved ? "تایید شده" : "در انتظار تایید"}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">سطح دسترسی</label>
              <div className="mt-1">
                <Badge variant={user.is_messenger_admin ? "destructive" : "outline"} className="text-xs">
                  {user.is_messenger_admin ? "مدیر" : "کاربر عادی"}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">وضعیت بدون مرز</label>
              <div className="mt-1">
                <Badge variant={user.bedoun_marz_approved ? "secondary" : "outline"} className="text-xs">
                  {user.bedoun_marz_approved ? "بدون مرز تایید شده" : "بدون مرز نیست"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <div className="flex-1">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">منبع ثبت‌نام</label>
                <p className="font-medium text-sm sm:text-base">{user.signup_source || 'وب‌سایت'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            زمان‌بندی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">تاریخ ثبت‌نام</label>
              <p className="font-medium text-sm sm:text-base">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">آخرین بازدید</label>
              <p className="font-medium text-sm sm:text-base">{formatDate(user.last_seen || '')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}