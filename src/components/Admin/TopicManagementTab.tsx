import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hash, Crown } from 'lucide-react';
import { messengerService } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import TopicManagement from './TopicManagement';
// Dynamic import for SuperGroupManagement
const SuperGroupManagement = React.lazy(() => import('@/components/Chat/SuperGroupManagement'));

const TopicManagementTab = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const validateSession = async () => {
      try {
        const token = localStorage.getItem('messenger_session_token');
        if (token) {
          setSessionToken(token);
          const user = await messengerService.validateSession(token);
          if (user) {
            setCurrentUser(user);
          } else {
            toast({
              title: 'خطا',
              description: 'جلسه کاربری نامعتبر است',
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        toast({
          title: 'خطا',
          description: 'خطا در تایید جلسه کاربری',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentUser?.is_messenger_admin) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">شما دسترسی ادمین ندارید</p>
      </div>
    );
  }

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
          <TopicManagement 
            currentUser={currentUser}
            sessionToken={sessionToken}
          />
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