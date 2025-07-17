
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Settings, Crown } from 'lucide-react';
import ChatManagementTab from './ChatManagementTab';
import UserManagementTab from './UserManagementTab';
import TopicManagementTab from './TopicManagementTab';
import { useToast } from '@/hooks/use-toast';
import { messengerService } from '@/lib/messengerService';
// Dynamic import to resolve module loading issues
const SuperGroupManagement = React.lazy(() => import('@/components/Chat/SuperGroupManagement'));

const MessengerAdminSection = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('messenger_session_token');
      if (!token) {
        throw new Error('لطفاً ابتدا وارد شوید');
      }

      console.log('Validating session token for admin access...');
      const result = await messengerService.validateSession(token);
      console.log('Session validation result:', result);
      
      if (!result || !result.valid) {
        throw new Error('جلسه نامعتبر است');
      }

      console.log('User admin status:', result.user.is_messenger_admin);
      
      if (!result.user.is_messenger_admin) {
        throw new Error('شما دسترسی به این بخش ندارید');
      }

      setSessionToken(token);
      setCurrentUser(result.user);
      console.log('Admin access granted for user:', result.user.name);
    } catch (error: any) {
      console.error('Admin access error:', error);
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-slate-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="chat-management" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger 
            value="chat-management" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            <span>مدیریت چت</span>
          </TabsTrigger>
          <TabsTrigger 
            value="user-management" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <Users className="w-5 h-5" />
            <span>مدیریت کاربران</span>
          </TabsTrigger>
          <TabsTrigger 
            value="topic-management" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <Settings className="w-5 h-5" />
            <span>مدیریت موضوعات</span>
          </TabsTrigger>
          <TabsTrigger 
            value="super-groups" 
            className="flex flex-col items-center gap-2 py-4 text-xs sm:text-sm"
          >
            <Crown className="w-5 h-5" />
            <span>سوپر گروه‌ها</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat-management" className="space-y-6">
          <ChatManagementTab />
        </TabsContent>

        <TabsContent value="user-management" className="space-y-6">
          <UserManagementTab />
        </TabsContent>

        <TabsContent value="topic-management" className="space-y-6">
          <TopicManagementTab />
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

export default MessengerAdminSection;
