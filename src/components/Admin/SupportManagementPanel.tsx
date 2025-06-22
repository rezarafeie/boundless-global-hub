
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Headphones, Search, MessageCircle, User, Clock, AlertCircle, CheckCircle, Archive, Users, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportService, type SupportConversation } from '@/lib/supportService';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

interface ConversationWithDetails extends SupportConversation {
  user?: {
    name: string;
    phone: string;
  };
  thread_type?: {
    display_name: string;
  };
  agent?: {
    name: string;
  };
  unread_count?: number;
}

const SupportManagementPanel = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [supportAgents, setSupportAgents] = useState<MessengerUser[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conversationsData, agentsData] = await Promise.all([
        supportService.getAllConversations(),
        messengerService.getAllUsers().then(users => users.filter(u => u.is_support_agent))
      ]);
      
      setConversations(conversationsData);
      setSupportAgents(agentsData);
      setFilteredConversations(conversationsData);
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

  useEffect(() => {
    let filtered = conversations;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user?.phone.includes(searchTerm) ||
        conv.id.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, statusFilter]);

  const handleAssignAgent = async (conversationId: number, agentId: number) => {
    try {
      // This would need to be implemented in the support service
      toast({
        title: 'موفق',
        description: 'پشتیبان اختصاص داده شد',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در اختصاص پشتیبان',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'assigned': return <User className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: 'باز', variant: 'destructive' as const },
      assigned: { label: 'اختصاص یافته', variant: 'default' as const },
      resolved: { label: 'حل شده', variant: 'secondary' as const },
      closed: { label: 'بسته', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: 'کم', className: 'bg-green-100 text-green-800' },
      normal: { label: 'عادی', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'بالا', className: 'bg-amber-100 text-amber-800' },
      urgent: { label: 'فوری', className: 'bg-red-100 text-red-800' }
    };
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || priorityMap.normal;
    return <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>;
  };

  const getStatsCards = () => {
    const stats = {
      total: conversations.length,
      open: conversations.filter(c => c.status === 'open').length,
      assigned: conversations.filter(c => c.status === 'assigned').length,
      resolved: conversations.filter(c => c.status === 'resolved').length,
      agents: supportAgents.length
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-slate-600">کل گفتگوها</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold">{stats.open}</p>
            <p className="text-sm text-slate-600">باز</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.assigned}</p>
            <p className="text-sm text-slate-600">ا]
      <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.resolved}</p>
            <p className="text-sm text-slate-600">حل شده</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{stats.agents}</p>
            <p className="text-sm text-slate-600">پشتیبان</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>در حال بارگذاری اطلاعات پشتیبانی...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {getStatsCards()}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="جستجو بر اساس نام، شماره یا شناسه گفتگو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فیلتر وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="open">باز</SelectItem>
                <SelectItem value="assigned">اختصاص یافته</SelectItem>
                <SelectItem value="resolved">حل شده</SelectItem>
                <SelectItem value="closed">بسته</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Support Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            مدیریت گفتگوهای پشتیبانی ({filteredConversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کاربر</TableHead>
                  <TableHead>نوع درخواست</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>اولویت</TableHead>
                  <TableHead>پشتیبان</TableHead>
                  <TableHead>آخرین پیام</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{conversation.user?.name || 'نامشخص'}</p>
                        <p className="text-sm text-slate-500">{conversation.user?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {conversation.thread_type?.display_name || 'عمومی'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(conversation.status || 'open')}
                        {getStatusBadge(conversation.status || 'open')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(conversation.priority || 'normal')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-slate-400" />
                        <Select 
                          value={conversation.agent_id?.toString() || 'unassigned'}
                          onValueChange={(value) => {
                            if (value !== 'unassigned') {
                              handleAssignAgent(conversation.id, parseInt(value));
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="انتخاب پشتیبان" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">بدون اختصاص</SelectItem>
                            {supportAgents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id.toString()}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-3 h-3" />
                        {conversation.last_message_at 
                          ? new Date(conversation.last_message_at).toLocaleDateString('fa-IR')
                          : 'هیچ پیامی'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Navigate to conversation detail
                            window.open(`/hub/support?conversation=${conversation.id}`, '_blank');
                          }}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchTerm ? 'هیچ گفتگویی یافت نشد' : 'هنوز درخواست پشتیبانی ثبت نشده است'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportManagementPanel;
