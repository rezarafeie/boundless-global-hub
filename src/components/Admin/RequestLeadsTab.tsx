import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  User, 
  Calendar, 
  Search, 
  Loader2,
  UserPlus,
  Filter,
  Eye,
  Sparkles,
  RefreshCw,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';

interface LeadRequest {
  id: string;
  phone: string;
  name: string | null;
  answers: any;
  ai_recommendation: any;
  status: string;
  assigned_agent_id: number | null;
  created_at: string;
  updated_at: string;
  assigned_agent?: { name: string } | null;
}

interface Agent {
  id: number;
  user_id: number;
  name: string;
}

export function RequestLeadsTab() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadRequest[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<LeadRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('lead_requests')
        .select(`
          *,
          assigned_agent:chat_users!lead_requests_assigned_agent_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];

      // Apply search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(l => 
          l.phone?.toLowerCase().includes(term) ||
          l.name?.toLowerCase().includes(term)
        );
      }

      // Apply budget filter
      if (budgetFilter !== 'all') {
        filteredData = filteredData.filter(l => {
          const ans = l.answers as Record<string, any> | null;
          return ans?.budget === budgetFilter;
        });
      }

      setLeads(filteredData);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری لیدها',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('sales_agents')
      .select(`
        id,
        user_id,
        chat_users!inner(name)
      `)
      .eq('is_active', true);

    const agents: Agent[] = (data || []).map((sa: any) => ({
      id: sa.id,
      user_id: sa.user_id,
      name: sa.chat_users?.name || 'Unknown'
    }));

    setAgents(agents);
  };

  const handleAssignAgent = async () => {
    if (!selectedLead || !selectedAgentId) return;

    setAssignLoading(true);
    try {
      // Get the user_id from the sales agent
      const agent = agents.find(a => a.id === parseInt(selectedAgentId));
      if (!agent) throw new Error('Agent not found');

      const { error } = await supabase
        .from('lead_requests')
        .update({ 
          assigned_agent_id: agent.user_id,
          status: 'assigned'
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      toast({ title: 'موفقیت', description: 'لید با موفقیت به کارشناس اختصاص یافت' });
      setShowAssign(false);
      setSelectedAgentId('');
      fetchLeads();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: 'خطا',
        description: 'خطا در اختصاص کارشناس',
        variant: 'destructive'
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lead_requests')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      fetchLeads();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['شناسه', 'تلفن', 'نام', 'هدف', 'وضعیت فعلی', 'علاقه‌مندی‌ها', 'بودجه', 'پیشنهاد AI', 'وضعیت', 'کارشناس', 'تاریخ'].join(','),
      ...leads.map(l => [
        l.id,
        l.phone,
        l.name || '',
        l.answers?.goal || '',
        l.answers?.current_status || '',
        l.answers?.interests?.join(' - ') || '',
        l.answers?.budget || '',
        l.ai_recommendation?.recommendation || '',
        l.status,
        l.assigned_agent?.name || '',
        format(new Date(l.created_at), 'yyyy/MM/dd HH:mm')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lead-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      new: { label: 'جدید', variant: 'default' },
      assigned: { label: 'اختصاص یافته', variant: 'secondary' },
      contacted: { label: 'تماس گرفته شده', variant: 'outline' },
      converted: { label: 'تبدیل شده', variant: 'default' },
      rejected: { label: 'رد شده', variant: 'destructive' }
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">درخواست‌های مشاوره</h2>
          <p className="text-muted-foreground">لیدهای جمع‌آوری شده از صفحه درخواست</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLeads}>
            <RefreshCw className="w-4 h-4 ml-2" />
            بروزرسانی
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 ml-2" />
            خروجی CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو (تلفن یا نام)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="new">جدید</SelectItem>
                <SelectItem value="assigned">اختصاص یافته</SelectItem>
                <SelectItem value="contacted">تماس گرفته شده</SelectItem>
                <SelectItem value="converted">تبدیل شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="بودجه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه بودجه‌ها</SelectItem>
                <SelectItem value="رایگان">رایگان</SelectItem>
                <SelectItem value="تا ۵۰۰ هزار تومان">تا ۵۰۰ هزار</SelectItem>
                <SelectItem value="۵۰۰ هزار تا ۲ میلیون">۵۰۰ هزار تا ۲ میلیون</SelectItem>
                <SelectItem value="بالای ۲ میلیون">بالای ۲ میلیون</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchLeads} disabled={loading}>
              <Filter className="w-4 h-4 ml-2" />
              فیلتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{leads.length}</div>
            <div className="text-sm text-muted-foreground">کل درخواست‌ها</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {leads.filter(l => l.status === 'new').length}
            </div>
            <div className="text-sm text-muted-foreground">جدید</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.ai_recommendation).length}
            </div>
            <div className="text-sm text-muted-foreground">با پیشنهاد AI</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {leads.filter(l => l.assigned_agent_id).length}
            </div>
            <div className="text-sm text-muted-foreground">اختصاص یافته</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              هیچ درخواستی یافت نشد
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تلفن</TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>بودجه</TableHead>
                  <TableHead>پیشنهاد AI</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>کارشناس</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-mono" dir="ltr">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {lead.phone}
                      </div>
                    </TableCell>
                    <TableCell>{lead.name || '-'}</TableCell>
                    <TableCell>
                      {lead.answers?.budget ? (
                        <Badge variant="outline">{lead.answers.budget}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {lead.ai_recommendation ? (
                        <div className="flex items-center gap-1 text-primary">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm truncate max-w-[150px]">
                            {lead.ai_recommendation.recommendation}
                          </span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) => handleStatusChange(lead.id, v)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">جدید</SelectItem>
                          <SelectItem value="assigned">اختصاص یافته</SelectItem>
                          <SelectItem value="contacted">تماس گرفته شده</SelectItem>
                          <SelectItem value="converted">تبدیل شده</SelectItem>
                          <SelectItem value="rejected">رد شده</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {lead.assigned_agent?.name || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), 'yyyy/MM/dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowAssign(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>جزئیات درخواست</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">تلفن</div>
                    <div className="font-mono" dir="ltr">{selectedLead.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">نام</div>
                    <div>{selectedLead.name || '-'}</div>
                  </div>
                </div>

                {selectedLead.answers && Object.keys(selectedLead.answers).length > 0 && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium mb-2">پاسخ‌های پرسشنامه</div>
                    <div className="space-y-2 text-sm">
                      {selectedLead.answers.goal && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">هدف:</span>
                          <span>{selectedLead.answers.goal}</span>
                        </div>
                      )}
                      {selectedLead.answers.current_status && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">وضعیت فعلی:</span>
                          <span>{selectedLead.answers.current_status}</span>
                        </div>
                      )}
                      {selectedLead.answers.interests?.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">علاقه‌مندی‌ها:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedLead.answers.interests.map((i: string) => (
                              <Badge key={i} variant="secondary">{i}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedLead.answers.budget && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">بودجه:</span>
                          <span>{selectedLead.answers.budget}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedLead.ai_recommendation && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      پیشنهاد هوش مصنوعی
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg">
                      <div className="font-medium">
                        {selectedLead.ai_recommendation.recommendation}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {selectedLead.ai_recommendation.explanation}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 text-sm text-muted-foreground">
                  <div>تاریخ ثبت: {format(new Date(selectedLead.created_at), 'yyyy/MM/dd HH:mm')}</div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اختصاص به کارشناس</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب کارشناس..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                onClick={handleAssignAgent}
                disabled={!selectedAgentId || assignLoading}
                className="flex-1"
              >
                {assignLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'اختصاص'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAssign(false)}
              >
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RequestLeadsTab;
