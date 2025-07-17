import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Crown, Hash, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatRoom } from '@/lib/messengerService';

interface SuperGroupManagementProps {
  currentUser: any;
  sessionToken: string;
}

const SuperGroupManagement: React.FC<SuperGroupManagementProps> = ({
  currentUser,
  sessionToken
}) => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.is_messenger_admin) {
      loadGroups();
    }
  }, [currentUser]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری گروه‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSuperGroup = async (groupId: number, isCurrentlySuper: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_super_group: !isCurrentlySuper })
        .eq('id', groupId);

      if (error) throw error;

      setGroups(prev => prev.map(group =>
        group.id === groupId 
          ? { ...group, is_super_group: !isCurrentlySuper }
          : group
      ));

      toast({
        title: 'موفق',
        description: `گروه ${!isCurrentlySuper ? 'به سوپر گروه تبدیل شد' : 'از سوپر گروه خارج شد'}`,
      });
    } catch (error) {
      console.error('Error updating super group status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت سوپر گروه',
        variant: 'destructive',
      });
    }
  };

  if (!currentUser?.is_messenger_admin) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">شما دسترسی ادمین ندارید</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Crown className="w-5 h-5 text-yellow-600" />
        <h2 className="text-xl font-semibold">مدیریت سوپر گروه‌ها</h2>
      </div>

      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {group.name}
                </div>
                {group.is_super_group && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    سوپر گروه
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor={`super-${group.id}`} className="text-sm">
                  سوپر گروه
                </Label>
                <Switch
                  id={`super-${group.id}`}
                  checked={group.is_super_group || false}
                  onCheckedChange={() => toggleSuperGroup(group.id, group.is_super_group || false)}
                />
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {group.description || 'بدون توضیحات'}
            </p>
            
            {group.is_super_group && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    این گروه دارای قابلیت موضوعات (Topics) است
                  </span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  کاربران می‌توانند در موضوعات مختلف پیام ارسال کنند
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {groups.length === 0 && (
        <div className="text-center p-8">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">هیچ گروهی موجود نیست</p>
        </div>
      )}
    </div>
  );
};

export default SuperGroupManagement;