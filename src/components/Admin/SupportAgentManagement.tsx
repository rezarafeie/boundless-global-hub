
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supportAgentService, chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { HeadphonesIcon, Phone, Trash2, UserPlus, Users } from 'lucide-react';
import type { SupportAgent } from '@/types/supabase';

const SupportAgentManagement: React.FC = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const agentList = await supportAgentService.getAgents();
      setAgents(agentList);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری لیست پشتیبان‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentPhone.trim()) {
      toast({
        title: 'خطا',
        description: 'شماره تلفن پشتیبان را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      // Find user by phone
      const allUsers = await chatUserService.getAllUsers();
      const user = allUsers.find(u => u.phone === newAgentPhone.trim());
      
      if (!user) {
        toast({
          title: 'خطا',
          description: 'کاربری با این شماره تلفن یافت نشد',
          variant: 'destructive',
        });
        return;
      }

      if (!user.is_approved) {
        toast({
          title: 'خطا',
          description: 'ابتدا کاربر باید تایید شود',
          variant: 'destructive',
        });
        return;
      }

      await supportAgentService.createAgent(newAgentPhone.trim(), user.id);
      setNewAgentPhone('');
      await loadAgents();
      
      toast({
        title: 'موفق',
        description: 'پشتیبان جدید اضافه شد',
      });
    } catch (error: any) {
      if (error.message.includes('duplicate key')) {
        toast({
          title: 'خطا',
          description: 'این شماره قبلاً به عنوان پشتیبان ثبت شده است',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'خطا',
          description: 'خطا در اضافه کردن پشتیبان',
          variant: 'destructive',
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAgent = async (agentId: number) => {
    try {
      await supportAgentService.removeAgent(agentId);
      await loadAgents();
      
      toast({
        title: 'موفق',
        description: 'پشتیبان حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف پشتیبان',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <HeadphonesIcon className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-300">در حال بارگذاری...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            اضافه کردن پشتیبان جدید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAgent} className="space-y-4">
            <div>
              <Label htmlFor="agent-phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                شماره تلفن پشتیبان
              </Label>
              <Input
                id="agent-phone"
                value={newAgentPhone}
                onChange={(e) => setNewAgentPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                className="mt-2"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                کاربر باید قبلاً در سیستم ثبت‌نام کرده و تایید شده باشد
              </p>
            </div>
            <Button type="submit" disabled={adding} className="w-full">
              {adding ? 'در حال اضافه کردن...' : 'اضافه کردن پشتیبان'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            لیست پشتیبان‌ها ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <HeadphonesIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">
                هنوز پشتیبانی تعریف نشده است
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: any) => (
                <Card key={agent.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <HeadphonesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {agent.chat_users?.name || 'نام نامشخص'}
                          </CardTitle>
                          <p className="text-sm text-slate-500">
                            {agent.phone}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        پشتیبان
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">
                        از {new Date(agent.created_at).toLocaleDateString('fa-IR')}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveAgent(agent.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportAgentManagement;
