import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, Users, Settings, ArrowLeft, MessageCircle, UserPlus, Image, Calendar, BarChart3, BookOpen, Bell, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { messengerService } from '@/lib/messengerService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const nav = [
  { to: '/enroll/admin/social', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/enroll/admin/social/inbox', label: 'صندوق پیام‌ها', icon: Inbox },
  { to: '/enroll/admin/social/comments', label: 'کامنت‌ها', icon: MessageCircle },
  { to: '/enroll/admin/social/leads', label: 'لیدها', icon: UserPlus },
  { to: '/enroll/admin/social/posts', label: 'پست‌ها', icon: Image },
  { to: '/enroll/admin/social/planner', label: 'برنامه‌ریز', icon: Calendar },
  { to: '/enroll/admin/social/analytics', label: 'آمار', icon: BarChart3 },
  { to: '/enroll/admin/social/knowledge', label: 'دانش AI', icon: BookOpen },
  { to: '/enroll/admin/social/notifications', label: 'اعلان‌ها', icon: Bell },
  { to: '/enroll/admin/social/accounts', label: 'اکانت‌ها', icon: Users },
  { to: '/enroll/admin/social/settings', label: 'تنظیمات', icon: Settings },
];

const ALLOWED_ROLES = ['admin', 'social_admin', 'enrollments_manager'];

const SocialLayout: React.FC = () => {
  useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    (async () => {
      if (isLoading) return;
      if (!isAuthenticated || !user) { setHasAccess(false); setChecking(false); return; }
      try {
        const detailed = await messengerService.getUserByPhone(user.phone || '');
        const role = detailed?.role || 'user';
        setHasAccess(ALLOWED_ROLES.includes(role) || !!detailed?.is_messenger_admin);
      } catch {
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    })();
  }, [isAuthenticated, user, isLoading]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>دسترسی مجاز نیست</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            برای دسترسی به Social CRM باید نقش «مدیر شبکه‌های اجتماعی» یا «مدیر» داشته باشید.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background flex">
      <aside className="w-64 border-l border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold">Social CRM</h1>
          <p className="text-xs text-muted-foreground mt-1">مدیریت اینستاگرام و پیام‌ها</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <a
            href="/enroll/admin"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به پنل مدیریت
          </a>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-card border-b z-40 flex overflow-x-auto">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-3 text-xs whitespace-nowrap ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="flex-1 pt-14 md:pt-0 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default SocialLayout;
