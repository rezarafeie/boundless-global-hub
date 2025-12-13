import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, TrendingUp, User, Phone, GraduationCap, ShoppingCart, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedWebhookManager } from '@/lib/enhancedWebhookManager';

interface ConsultationBooking {
  id: string;
  user_id: number;
  full_name: string;
  phone: string;
  email: string | null;
  status: string;
  deal_id: string | null;
  crm_added: boolean;
  slot?: {
    date: string;
    start_time: string;
  };
}

interface Course {
  id: string;
  title: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
}

interface CRMStatus {
  id: string;
  label: string;
  color: string;
}

interface Props {
  booking: ConsultationBooking | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ConsultationType = 'sales' | 'education' | null;

const DEAL_STATUSES = [
  { value: 'interested', label: 'علاقه‌مند' },
  { value: 'waiting_payment', label: 'در انتظار پرداخت' },
  { value: 'followup_required', label: 'نیاز به پیگیری' },
  { value: 'paid', label: 'پرداخت شده' },
  { value: 'failed', label: 'ناموفق' }
];

const NEXT_ACTIONS = [
  { value: 'payment_followup', label: 'پیگیری پرداخت' },
  { value: 'cancel', label: 'لغو' },
  { value: 'call_again', label: 'تماس مجدد' },
  { value: 'no_action', label: 'بدون اقدام' },
  { value: 'other', label: 'سایر' }
];

const ConsultationCRMDialog: React.FC<Props> = ({ booking, open, onClose, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [crmStatuses, setCrmStatuses] = useState<CRMStatus[]>([]);
  const [salesAgents, setSalesAgents] = useState<{ id: number; name: string }[]>([]);
  
  // Consultation type selection
  const [consultationType, setConsultationType] = useState<ConsultationType>(null);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productType, setProductType] = useState<'course' | 'service'>('course');
  const [dealStatus, setDealStatus] = useState('interested');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [nextAction, setNextAction] = useState('payment_followup');
  const [notes, setNotes] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [createDeal, setCreateDeal] = useState(true);
  
  // Education consultation - simpler form
  const [educationCourse, setEducationCourse] = useState('');
  const [educationNotes, setEducationNotes] = useState('');

  useEffect(() => {
    if (open) {
      // Reset consultation type on open
      setConsultationType(null);
      setEducationCourse('');
      setEducationNotes('');
      fetchData();
      if (booking) {
        setNotes(`مشاوره از تاریخ ${booking.slot?.date || ''}`);
        setEducationNotes(`مشاوره آموزشی از تاریخ ${booking.slot?.date || ''}`);
      }
    }
  }, [open, booking]);

  const fetchData = async () => {
    const [coursesRes, productsRes, statusesRes, agentsRes] = await Promise.all([
      supabase.from('courses').select('id, title, price').eq('is_active', true),
      supabase.from('products').select('id, name'),
      supabase.from('crm_statuses').select('id, label, color').eq('is_active', true),
      supabase.from('chat_users')
        .select('id, name')
        .or('role.eq.sales_agent,role.eq.sales_manager,is_messenger_admin.eq.true')
    ]);
    
    setCourses(coursesRes.data || []);
    setProducts(productsRes.data || []);
    setCrmStatuses(statusesRes.data || []);
    setSalesAgents(agentsRes.data || []);
    
    if (user?.messengerData?.id) {
      setAssignedAgent(user.messengerData.id.toString());
    }
  };

  const getCurrentUserName = () => {
    if (user?.messengerData?.name) return user.messengerData.name;
    if (user?.academyData) return `${user.academyData.first_name} ${user.academyData.last_name}`;
    return 'مدیر';
  };

  const handleClose = () => {
    setConsultationType(null);
    onClose();
  };

  // Education consultation submit (simple form)
  const handleEducationSubmit = async () => {
    if (!booking || !educationCourse) {
      toast({ title: 'لطفا دوره را انتخاب کنید', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const selectedCourse = courses.find(c => c.id === educationCourse);
      const crmContent = `
مشاوره آموزشی
دوره: ${selectedCourse?.title || ''}
${educationNotes ? `یادداشت: ${educationNotes}` : ''}
منبع: مشاوره (${booking.id.slice(0, 8)})
      `.trim();

      await supabase
        .from('crm_notes')
        .insert({
          user_id: booking.user_id,
          type: 'education_consultation',
          content: crmContent,
          course_id: educationCourse,
          status: 'مشاوره آموزشی',
          created_by: getCurrentUserName()
        });

      await supabase
        .from('consultation_bookings')
        .update({
          crm_added: true,
          status: 'completed'
        })
        .eq('id', booking.id);

      toast({ title: 'CRM مشاوره آموزشی ثبت شد' });
      onSuccess();
    } catch (error: any) {
      console.error('CRM Error:', error);
      toast({ title: 'خطا در ثبت CRM', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Sales consultation submit (full form with deal)
  const handleSalesSubmit = async () => {
    if (!booking || !selectedProduct) {
      toast({ title: 'لطفا محصول را انتخاب کنید', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const courseId = productType === 'course' ? selectedProduct : null;
      const productId = productType === 'service' ? selectedProduct : null;
      
      const statusMap: Record<string, string> = {
        'interested': 'علاقه‌مند',
        'waiting_payment': 'در انتظار پرداخت',
        'followup_required': 'نیاز به پیگیری',
        'paid': 'پرداخت شده',
        'failed': 'ناموفق'
      };

      const crmContent = `
محصول: ${productType === 'course' ? courses.find(c => c.id === selectedProduct)?.title : products.find(p => p.id === selectedProduct)?.name}
وضعیت: ${statusMap[dealStatus]}
مبلغ مورد انتظار: ${expectedAmount ? `${Number(expectedAmount).toLocaleString()} تومان` : 'نامشخص'}
اقدام بعدی: ${NEXT_ACTIONS.find(a => a.value === nextAction)?.label}
${notes ? `یادداشت: ${notes}` : ''}
منبع: مشاوره فروش (${booking.id.slice(0, 8)})
      `.trim();

      const { data: crmData, error: crmError } = await supabase
        .from('crm_notes')
        .insert({
          user_id: booking.user_id,
          type: 'consultation',
          content: crmContent,
          course_id: courseId,
          status: statusMap[dealStatus],
          created_by: getCurrentUserName()
        })
        .select()
        .single();

      if (crmError) throw crmError;

      let dealId: string | null = null;
      if (createDeal && productType === 'course' && assignedAgent) {
        const selectedCourse = courses.find(c => c.id === selectedProduct);
        const price = expectedAmount ? Number(expectedAmount) : (selectedCourse?.price || 0);

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('phone', booking.phone)
          .eq('course_id', selectedProduct)
          .single();

        if (enrollment) {
          const { data: dealData, error: dealError } = await supabase
            .from('deals')
            .insert({
              enrollment_id: enrollment.id,
              course_id: selectedProduct,
              price: price,
              assigned_salesperson_id: parseInt(assignedAgent),
              assigned_by_id: user?.messengerData?.id || parseInt(assignedAgent),
              status: dealStatus === 'paid' ? 'won' : 'in_progress',
              consultation_id: booking.id,
              notes: notes
            })
            .select()
            .single();

          if (!dealError && dealData) {
            dealId = dealData.id;
          }
        } else {
          const { data: newEnrollment, error: enrollError } = await supabase
            .from('enrollments')
            .insert({
              full_name: booking.full_name,
              phone: booking.phone,
              email: booking.email || '',
              course_id: selectedProduct,
              payment_amount: price,
              payment_status: dealStatus === 'paid' ? 'completed' : 'pending',
              payment_method: 'consultation'
            })
            .select()
            .single();

          if (!enrollError && newEnrollment) {
            const { data: dealData } = await supabase
              .from('deals')
              .insert({
                enrollment_id: newEnrollment.id,
                course_id: selectedProduct,
                price: price,
                assigned_salesperson_id: parseInt(assignedAgent),
                assigned_by_id: user?.messengerData?.id || parseInt(assignedAgent),
                status: dealStatus === 'paid' ? 'won' : 'in_progress',
                consultation_id: booking.id,
                notes: notes
              })
              .select()
              .single();

            if (dealData) dealId = dealData.id;
          }
        }
      }

      await supabase
        .from('consultation_bookings')
        .update({
          crm_added: true,
          deal_id: dealId,
          status: 'completed'
        })
        .eq('id', booking.id);

      try {
        const userData = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', booking.user_id)
          .single();

        if (userData.data) {
          await enhancedWebhookManager.sendCRMNoteCreated(
            userData.data,
            crmData,
            productType === 'course' ? courses.find(c => c.id === selectedProduct) : null
          );
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      toast({ 
        title: 'CRM ثبت شد', 
        description: dealId ? 'معامله ایجاد و به فروش انتقال یافت' : undefined 
      });
      onSuccess();
    } catch (error: any) {
      console.error('CRM Error:', error);
      toast({ title: 'خطا در ثبت CRM', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ثبت CRM از مشاوره
          </DialogTitle>
        </DialogHeader>

        {/* User Info Card - Always visible */}
        <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{booking.full_name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span dir="ltr">{booking.phone}</span>
            </p>
          </div>
          {booking.crm_added && (
            <Badge className="bg-green-500/10 text-green-600">CRM ثبت شده</Badge>
          )}
        </div>

        {/* Step 1: Consultation Type Selection */}
        {consultationType === null && (
          <div className="py-6">
            <p className="text-center text-muted-foreground mb-6">نوع مشاوره را انتخاب کنید</p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => setConsultationType('sales')}
              >
                <ShoppingCart className="h-8 w-8 text-primary" />
                <span className="font-medium">مشاوره فروش</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:border-blue-500 hover:bg-blue-500/5"
                onClick={() => setConsultationType('education')}
              >
                <GraduationCap className="h-8 w-8 text-blue-500" />
                <span className="font-medium">مشاوره آموزش</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2a: Education Consultation - Simple Form */}
        {consultationType === 'education' && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => setConsultationType(null)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                <GraduationCap className="h-3 w-3 ml-1" />
                مشاوره آموزش
              </Badge>
            </div>

            <div className="space-y-4 py-2">
              <div>
                <Label>دوره *</Label>
                <Select value={educationCourse} onValueChange={setEducationCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دوره..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>یادداشت</Label>
                <Textarea
                  value={educationNotes}
                  onChange={(e) => setEducationNotes(e.target.value)}
                  rows={3}
                  placeholder="یادداشت اختیاری..."
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>انصراف</Button>
              <Button onClick={handleEducationSubmit} disabled={loading || !educationCourse}>
                {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                ثبت CRM
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2b: Sales Consultation - Full Form */}
        {consultationType === 'sales' && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => setConsultationType(null)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <ShoppingCart className="h-3 w-3 ml-1" />
                مشاوره فروش
              </Badge>
            </div>

            <div className="space-y-4 py-2">
              {/* Product Type */}
              <div>
                <Label>نوع محصول</Label>
                <Select value={productType} onValueChange={(v: 'course' | 'service') => {
                  setProductType(v);
                  setSelectedProduct('');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">دوره آموزشی</SelectItem>
                    <SelectItem value="service">خدمات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Product Selection */}
              <div>
                <Label>{productType === 'course' ? 'دوره' : 'خدمت'} *</Label>
                <Select value={selectedProduct} onValueChange={(v) => {
                  setSelectedProduct(v);
                  if (productType === 'course') {
                    const course = courses.find(c => c.id === v);
                    if (course) setExpectedAmount(course.price.toString());
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کنید..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productType === 'course' 
                      ? courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title} - {c.price.toLocaleString()} تومان
                          </SelectItem>
                        ))
                      : products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Deal Status */}
              <div>
                <Label>وضعیت</Label>
                <Select value={dealStatus} onValueChange={setDealStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expected Amount */}
              <div>
                <Label>مبلغ مورد انتظار (تومان)</Label>
                <Input
                  type="number"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  placeholder="مبلغ..."
                />
              </div>

              {/* Next Action */}
              <div>
                <Label>اقدام بعدی</Label>
                <Select value={nextAction} onValueChange={setNextAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEXT_ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Agent */}
              {productType === 'course' && (
                <div>
                  <Label>فروشنده</Label>
                  <Select value={assignedAgent} onValueChange={setAssignedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب فروشنده..." />
                    </SelectTrigger>
                    <SelectContent>
                      {salesAgents.map(a => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Create Deal Toggle */}
              {productType === 'course' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createDeal"
                    checked={createDeal}
                    onChange={(e) => setCreateDeal(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="createDeal" className="text-sm flex items-center gap-1 cursor-pointer">
                    <TrendingUp className="h-4 w-4" />
                    ایجاد معامله در پایپ‌لاین فروش
                  </Label>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>یادداشت</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="یادداشت اختیاری..."
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>انصراف</Button>
              <Button onClick={handleSalesSubmit} disabled={loading || !selectedProduct}>
                {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                ثبت CRM
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationCRMDialog;
