import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hash, Crown } from 'lucide-react';
import TopicManagement from './TopicManagement';
// Dynamic import for SuperGroupManagement
const SuperGroupManagement = React.lazy(() => import('@/components/Chat/SuperGroupManagement'));

const TopicManagementTab = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string>('');

  React.useEffect(() => {
    // Get current user and session from localStorage or context
    const token = localStorage.getItem('messenger_session_token');
    if (token) {
      setSessionToken(token);
      // You might want to validate the session here and get user details
    }
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            مدیریت موضوعات
          </TabsTrigger>
          <TabsTrigger value="super-groups" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            سوپر گروه‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-6">
          <TopicManagement />
        </TabsContent>

        <TabsContent value="super-groups" className="space-y-6">
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          }>
            <SuperGroupManagement 
              currentUser={currentUser}
              sessionToken={sessionToken}
            />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopicManagementTab;