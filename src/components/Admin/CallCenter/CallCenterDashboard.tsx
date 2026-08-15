import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, PhoneCall, ListTodo, Users, Settings } from 'lucide-react';

const CallCenterOverview = React.lazy(() => import('@/pages/Admin/CallCenter/CallCenterOverview'));
const CallsList = React.lazy(() => import('@/pages/Admin/CallCenter/CallsList'));
const CallQueues = React.lazy(() => import('@/pages/Admin/CallCenter/CallQueues'));
const CallAgents = React.lazy(() => import('@/pages/Admin/CallCenter/CallAgents'));
const CallCenterSettings = React.lazy(() => import('@/pages/Admin/CallCenter/CallCenterSettings'));

const Fallback = () => <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;

const CallCenterDashboard: React.FC = () => (
  <Tabs defaultValue="overview" dir="rtl" className="space-y-4">
    <TabsList className="flex-wrap h-auto">
      <TabsTrigger value="overview" className="gap-1"><LayoutDashboard className="h-4 w-4" /> نمای کلی</TabsTrigger>
      <TabsTrigger value="calls" className="gap-1"><PhoneCall className="h-4 w-4" /> تماس‌ها</TabsTrigger>
      <TabsTrigger value="queues" className="gap-1"><ListTodo className="h-4 w-4" /> صف‌ها</TabsTrigger>
      <TabsTrigger value="agents" className="gap-1"><Users className="h-4 w-4" /> کارشناسان</TabsTrigger>
      <TabsTrigger value="settings" className="gap-1"><Settings className="h-4 w-4" /> تنظیمات</TabsTrigger>
    </TabsList>

    <TabsContent value="overview"><Suspense fallback={<Fallback />}><CallCenterOverview /></Suspense></TabsContent>
    <TabsContent value="calls"><Suspense fallback={<Fallback />}><CallsList /></Suspense></TabsContent>
    <TabsContent value="queues"><Suspense fallback={<Fallback />}><CallQueues /></Suspense></TabsContent>
    <TabsContent value="agents"><Suspense fallback={<Fallback />}><CallAgents /></Suspense></TabsContent>
    <TabsContent value="settings"><Suspense fallback={<Fallback />}><CallCenterSettings /></Suspense></TabsContent>
  </Tabs>
);

export default CallCenterDashboard;
