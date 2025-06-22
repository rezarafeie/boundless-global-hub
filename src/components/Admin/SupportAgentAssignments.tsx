
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCheck, UserX, MessageCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser, type SupportThreadType, type SupportAgentAssignment } from '@/lib/messengerService';

const SupportAgentAssignments: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [threadTypes, setThreadTypes] = useState<SupportThreadType[]>([]);
  const [assignments, setAssignments] = useState<SupportAgentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, threadTypesData, assignmentsData] = await Promise.all([
        messengerService.getApprovedUsers(),
        messengerService.getThreadTypes(),
        messengerService.getSupportAgentAssignments()
      ]);
      
      setUsers(usersData);
      setThreadTypes(threadTypesData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignAgent = async () => {
    if (!selectedAgent || !selectedThread) {
      toast({
        title: 'خطا',
        description: 'لطفاً پشتیبان و نوع پشتیبانی را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      await messengerService.assignSupportAgent(parseInt(selectedAgent), parseInt(selectedThread));
      await fetchData();
      setSelectedAgent('');
      setSelectedThread('');
      
      toast({
        title: 'موفق',
        description: 'پشتیبان با موفقیت اختصاص داده شد',
      });
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: 'خطا',
        description: 'خطا در اختصاص پشتیبان',
        variant: 'destructive',
      });
    }
  };

  const handleUnassignAgent = async (agentId: number, threadTypeId: number) => {
    try {
      await messengerService.unassignSupportAgent(agentId, threadTypeId);
      await fetchData();
      
      toast({
        title: 'موفق',
        description: 'پشتیبان از این نوع پشتیبانی حذف شد',
      });
    } catch (error) {
      console.error('Error unassigning agent:', error);
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
        <CardContent className="p-8">
          <p className="text-center">در حال بارگذاری...</p>
        </CardContent>
      </Card>
    );
  }

  const supportAgents = users.filter(user => user.is_support_agent);

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            اختصاص پشتیبان به کانال‌های پشتیبانی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">انتخاب پشتیبان</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب پشتیبان" />
                </SelectTrigger>
                <SelectContent>
                  {supportAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">انتخاب کانال پشتیبانی</label>
              <Select value={selectedThread} onValueChange={setSelectedThread}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کانال" />
                </SelectTrigger>
                <SelectContent>
                  {threadTypes.map((thread) => (
                    <SelectItem key={thread.id} value={thread.id.toString()}>
                      {thread.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleAssignAgent} className="w-full">
              <UserCheck className="w-4 h-4 mr-2" />
              اختصاص پشتیبان
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>پشتیبانان اختصاص داده شده</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              هیچ پشتیبانی اختصاص داده نشده است
            </p>
          ) : (
            <div className="space-y-4">
              {threadTypes.map((thread) => {
                const threadAssignments = assignments.filter(a => a.thread_type_id === thread.id);
                
                return (
                  <div key={thread.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{thread.display_name}</h3>
                      <Badge variant={thread.is_boundless_only ? "secondary" : "outline"}>
                        {thread.is_boundless_only ? 'ویژه بدون مرز' : 'عمومی'}
                      </Badge>
                    </div>
                    
                    {threadAssignments.length === 0 ? (
                      <p className="text-slate-500 text-sm">هیچ پشتیبانی اختصاص داده نشده</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {threadAssignments.map((assignment) => {
                          const agent = users.find(u => u.id === assignment.agent_id);
                          return (
                            <div key={assignment.id} className="flex items-center justify-between bg-slate-50 rounded p-2">
                              <span className="text-sm font-medium">{agent?.name}</span>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUnassignAgent(assignment.agent_id, assignment.thread_type_id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportAgentAssignments;
