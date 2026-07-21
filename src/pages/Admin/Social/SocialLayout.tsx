import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, Users, Settings, ArrowLeft } from 'lucide-react';

const nav = [
  { to: '/enroll/admin/social', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/enroll/admin/social/inbox', label: 'صندوق پیام‌ها', icon: Inbox },
  { to: '/enroll/admin/social/accounts', label: 'اکانت‌ها', icon: Users },
  { to: '/enroll/admin/social/settings', label: 'تنظیمات', icon: Settings },
];

const SocialLayout: React.FC = () => {
  const { pathname } = useLocation();
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
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
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

      {/* Mobile top nav */}
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
