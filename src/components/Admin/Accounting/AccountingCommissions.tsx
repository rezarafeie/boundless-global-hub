import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, DollarSign, Users, TrendingUp, CreditCard } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface Agent {
  id: number;
  name: string;
  phone: string;
}

interface Course {
  id: string;
  title: string;
}

interface Product {
  id: string;
  name: string;
}

interface CommissionRate {
  id: string;
  agent_id: number;
  course_id: string | null;
  product_id: string | null;
  commission_percent: number;
  is_active: boolean;
  agent?: { name: string };
  course?: { title: string } | null;
  product?: { name: string } | null;
}

interface EarnedCommission {
  id: string;
  agent_id: number;
  invoice_id: string;
  amount: number;
  status: string;
  created_at: string;
  agent?: { name: string };
  invoice?: { invoice_number: string; total_amount: number };
}

interface CommissionPayment {
  id: string;
  agent_id: number;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  paid_at: string;
  agent?: { name: string };
}

export const AccountingCommissions: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [earnedCommissions, setEarnedCommissions] = useState<EarnedCommission[]>([]);
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [rateForm, setRateForm] = useState({
    agent_id: '',
    item_type: 'course',
    item_id: '',
    commission_percent: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    agent_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sales agents - users with sales roles OR admins
      const [agentsRes, coursesRes, productsRes, ratesRes, earnedRes, paymentsRes] = await Promise.all([
        supabase.from('chat_users').select('id, name, phone').or('role.in.(sales_agent,sales_manager,admin),is_messenger_admin.eq.true'),
        supabase.from('courses').select('id, title').eq('is_active', true),
        supabase.from('products').select('id, name').eq('is_active', true),
        supabase.from('agent_commissions').select('*').eq('is_active', true),
        supabase.from('earned_commissions').select('*').order('created_at', { ascending: false }),
        supabase.from('commission_payments').select('*').order('paid_at', { ascending: false })
      ]);

      if (agentsRes.data) setAgents(agentsRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (productsRes.data) setProducts(productsRes.data as Product[]);

      // Enrich commission rates with names
      if (ratesRes.data) {
        const enrichedRates = await Promise.all(
          ratesRes.data.map(async (rate) => {
            const [agentRes, courseRes, productRes] = await Promise.all([
              supabase.from('chat_users').select('name').eq('id', rate.agent_id).single(),
              rate.course_id ? supabase.from('courses').select('title').eq('id', rate.course_id).single() : Promise.resolve({ data: null }),
              rate.product_id ? supabase.from('products').select('name').eq('id', rate.product_id).single() : Promise.resolve({ data: null })
            ]);
            return {
              ...rate,
              agent: agentRes.data,
              course: courseRes.data,
              product: productRes.data
            };
          })
        );
        setCommissionRates(enrichedRates);
      }

      // Enrich earned commissions
      if (earnedRes.data) {
        const enrichedEarned = await Promise.all(
          earnedRes.data.map(async (ec) => {
            const [agentRes, invoiceRes] = await Promise.all([
              supabase.from('chat_users').select('name').eq('id', ec.agent_id).single(),
              supabase.from('invoices').select('invoice_number, total_amount').eq('id', ec.invoice_id).single()
            ]);
            return {
              ...ec,
              agent: agentRes.data,
              invoice: invoiceRes.data
            };
          })
        );
        setEarnedCommissions(enrichedEarned);
      }

      // Enrich commission payments
      if (paymentsRes.data) {
        const enrichedPayments = await Promise.all(
          paymentsRes.data.map(async (cp) => {
            const agentRes = await supabase.from('chat_users').select('name').eq('id', cp.agent_id).single();
            return { ...cp, agent: agentRes.data };
          })
        );
        setCommissionPayments(enrichedPayments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطا در دریافت اطلاعات');
    }
    setLoading(false);
  };

  const handleCreateRate = async () => {
    if (!rateForm.agent_id || !rateForm.item_id || !rateForm.commission_percent) {
      toast.error('لطفا همه فیلدها را پر کنید');
      return;
    }

    try {
      const { error } = await supabase.from('agent_commissions').insert({
        agent_id: parseInt(rateForm.agent_id),
        course_id: rateForm.item_type === 'course' ? rateForm.item_id : null,
        product_id: rateForm.item_type !== 'course' ? rateForm.item_id : null,
        commission_percent: parseFloat(rateForm.commission_percent)
      });

      if (error) throw error;

      toast.success('نرخ کمیسیون با موفقیت تعریف شد');
      setIsRateDialogOpen(false);
      setRateForm({ agent_id: '', item_type: 'course', item_id: '', commission_percent: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating rate:', error);
      toast.error('خطا در ثبت نرخ کمیسیون');
    }
  };

  const handlePayCommission = async () => {
    if (!paymentForm.agent_id || !paymentForm.amount) {
      toast.error('لطفا همه فیلدها را پر کنید');
      return;
    }

    try {
      // Get current user
      const sessionData = localStorage.getItem('messenger_session');
      const session = sessionData ? JSON.parse(sessionData) : null;
      const paidBy = session?.user?.id || null;

      const { data: payment, error } = await supabase.from('commission_payments').insert({
        agent_id: parseInt(paymentForm.agent_id),
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number || null,
        notes: paymentForm.notes || null,
        paid_by: paidBy
      }).select().single();

      if (error) throw error;

      // Mark pending earned commissions as paid
      await supabase
        .from('earned_commissions')
        .update({ status: 'paid', commission_payment_id: payment.id })
        .eq('agent_id', parseInt(paymentForm.agent_id))
        .eq('status', 'pending');

      toast.success('پرداخت کمیسیون با موفقیت ثبت شد');
      setIsPaymentDialogOpen(false);
      setPaymentForm({ agent_id: '', amount: '', payment_method: 'bank_transfer', reference_number: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error paying commission:', error);
      toast.error('خطا در ثبت پرداخت');
    }
  };

  // Calculate agent statistics
  const agentStats = agents.map(agent => {
    const earned = earnedCommissions
      .filter(ec => ec.agent_id === agent.id)
      .reduce((sum, ec) => sum + Number(ec.amount), 0);
    const paid = commissionPayments
      .filter(cp => cp.agent_id === agent.id)
      .reduce((sum, cp) => sum + Number(cp.amount), 0);
    return {
      ...agent,
      totalEarned: earned,
      totalPaid: paid,
      pending: earned - paid
    };
  });

  const totalEarned = earnedCommissions.reduce((sum, ec) => sum + Number(ec.amount), 0);
  const totalPaid = commissionPayments.reduce((sum, cp) => sum + Number(cp.amount), 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">مدیریت کمیسیون‌ها</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Plus className="ml-1 md:ml-2 h-4 w-4" />
                <span className="text-xs md:text-sm">تعریف نرخ</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعریف نرخ کمیسیون</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نماینده فروش</Label>
                  <Select value={rateForm.agent_id} onValueChange={v => setRateForm({...rateForm, agent_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نماینده" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نوع محصول</Label>
                  <Select value={rateForm.item_type} onValueChange={v => setRateForm({...rateForm, item_type: v, item_id: ''})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">دوره آموزشی</SelectItem>
                      <SelectItem value="product">خدمات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>محصول</Label>
                  <Select value={rateForm.item_id} onValueChange={v => setRateForm({...rateForm, item_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب محصول" />
                    </SelectTrigger>
                    <SelectContent>
                      {rateForm.item_type === 'course'
                        ? courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)
                        : products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>درصد کمیسیون</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={rateForm.commission_percent}
                    onChange={e => setRateForm({...rateForm, commission_percent: e.target.value})}
                    placeholder="مثلا: 10"
                  />
                </div>
                <Button className="w-full" onClick={handleCreateRate}>ثبت نرخ</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-none">
                <CreditCard className="ml-1 md:ml-2 h-4 w-4" />
                <span className="text-xs md:text-sm">پرداخت کمیسیون</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>پرداخت کمیسیون</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نماینده فروش</Label>
                  <Select value={paymentForm.agent_id} onValueChange={v => {
                    const agent = agentStats.find(a => a.id.toString() === v);
                    setPaymentForm({
                      ...paymentForm, 
                      agent_id: v,
                      amount: agent ? agent.pending.toString() : ''
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نماینده" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentStats.filter(a => a.pending > 0).map(a => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name} - مانده: {a.pending.toLocaleString()} تومان
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>مبلغ (تومان)</Label>
                  <Input 
                    type="number"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label>روش پرداخت</Label>
                  <Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm({...paymentForm, payment_method: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">انتقال بانکی</SelectItem>
                      <SelectItem value="cash">نقدی</SelectItem>
                      <SelectItem value="card_to_card">کارت به کارت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>شماره پیگیری</Label>
                  <Input 
                    value={paymentForm.reference_number}
                    onChange={e => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label>یادداشت</Label>
                  <Textarea 
                    value={paymentForm.notes}
                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                  />
                </div>
                <Button className="w-full" onClick={handlePayCommission}>ثبت پرداخت</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totalEarned.toLocaleString()}</div>
                <p className="text-muted-foreground">کل کمیسیون کسب شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalPaid.toLocaleString()}</div>
                <p className="text-muted-foreground">پرداخت شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{(totalEarned - totalPaid).toLocaleString()}</div>
                <p className="text-muted-foreground">در انتظار پرداخت</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{commissionRates.length}</div>
                <p className="text-muted-foreground">نرخ‌های تعریف شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">نمایندگان</TabsTrigger>
          <TabsTrigger value="rates">نرخ‌ها</TabsTrigger>
          <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نماینده</TableHead>
                    <TableHead>کل کمیسیون</TableHead>
                    <TableHead>پرداخت شده</TableHead>
                    <TableHead>مانده</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentStats.filter(a => a.totalEarned > 0).map(agent => (
                    <TableRow key={agent.id}>
                      <TableCell>{agent.name}</TableCell>
                      <TableCell>{agent.totalEarned.toLocaleString()} تومان</TableCell>
                      <TableCell className="text-green-600">{agent.totalPaid.toLocaleString()} تومان</TableCell>
                      <TableCell className={agent.pending > 0 ? 'text-orange-600' : ''}>
                        {agent.pending.toLocaleString()} تومان
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نماینده</TableHead>
                    <TableHead>محصول</TableHead>
                    <TableHead>درصد کمیسیون</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionRates.map(rate => (
                    <TableRow key={rate.id}>
                      <TableCell>{rate.agent?.name}</TableCell>
                      <TableCell>{rate.course?.title || rate.product?.name}</TableCell>
                      <TableCell>
                        <Badge>{rate.commission_percent}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نماینده</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>روش پرداخت</TableHead>
                    <TableHead>شماره پیگیری</TableHead>
                    <TableHead>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.agent?.name}</TableCell>
                      <TableCell>{Number(payment.amount).toLocaleString()} تومان</TableCell>
                      <TableCell>
                        {payment.payment_method === 'bank_transfer' ? 'انتقال بانکی' :
                         payment.payment_method === 'cash' ? 'نقدی' : 'کارت به کارت'}
                      </TableCell>
                      <TableCell>{payment.reference_number || '-'}</TableCell>
                      <TableCell>{format(new Date(payment.paid_at), 'yyyy/MM/dd')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingCommissions;
