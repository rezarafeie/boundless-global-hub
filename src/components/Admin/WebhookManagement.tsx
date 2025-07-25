import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Plus, Send, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_EVENTS = [
  { value: 'enrollment_created', label: 'ثبت نام جدید' },
  { value: 'enrollment_paid_successful', label: 'پرداخت موفق ثبت نام' },
  { value: 'enrollment_manual_payment_submitted', label: 'ارسال پرداخت دستی' },
  { value: 'enrollment_manual_payment_approved', label: 'تایید پرداخت دستی' },
  { value: 'enrollment_manual_payment_rejected', label: 'رد پرداخت دستی' },
  { value: 'user_created', label: 'کاربر جدید' },
  { value: 'email_linked_existing_account', label: 'لینک ایمیل به حساب موجود' },
  { value: 'sso_access_link_generated', label: 'تولید لینک دسترسی SSO' },
  { value: 'rafiei_player_license_generated', label: 'تولید لایسنس پلیر رفیعی' }
];

const DEFAULT_BODY_TEMPLATE = {
  event_type: '{{event_type}}',
  timestamp: '{{timestamp}}',
  user: {
    id: '{{data.user.id}}',
    name: '{{data.user.name}}',
    email: '{{data.user.email}}',
    phone: '{{data.user.phone}}'
  },
  course: {
    id: '{{data.course.id}}',
    title: '{{data.course.title}}',
    slug: '{{data.course.slug}}',
    price: '{{data.course.price}}'
  },
  enrollment: {
    id: '{{data.enrollment.id}}',
    payment_status: '{{data.enrollment.payment_status}}',
    payment_amount: '{{data.enrollment.payment_amount}}',
    created_at: '{{data.enrollment.created_at}}'
  },
  sso_tokens: '{{data.sso_tokens}}',
  license: '{{data.license}}'
};

interface WebhookConfig {
  id?: string;
  name: string;
  url: string;
  event_type: string;
  course_id?: string | null;
  is_active: boolean;
  headers: any;
  body_template: any;
}

interface WebhookLog {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  sent_at: string;
  success: boolean;
}

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<WebhookConfig>({
    name: '',
    url: '',
    event_type: '',
    course_id: null,
    is_active: true,
    headers: {},
    body_template: DEFAULT_BODY_TEMPLATE
  });

  useEffect(() => {
    fetchWebhooks();
    fetchLogs();
    fetchCourses();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select(`
          *,
          courses(title, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching webhooks:', error);
        toast({
          title: 'خطا',
          description: `خطا در بارگیری وب‌هوک‌ها: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }
      
      console.log('Fetched webhooks:', data);
      setWebhooks(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگیری وب‌هوک‌ها',
        variant: 'destructive'
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select(`
          *,
          webhook_configurations!inner(name)
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگیری لاگ‌ها',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    console.log('Starting handleSave with formData:', formData);
    
    // Validate required fields
    if (!formData.name || !formData.url || !formData.event_type) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای الزامی را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    // Validate URL format
    try {
      new URL(formData.url);
    } catch {
      toast({
        title: 'خطا',
        description: 'آدرس URL معتبر نیست',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to save webhook...');
      
      if (selectedWebhook) {
        console.log('Updating existing webhook:', selectedWebhook.id);
        // Update existing webhook
        const { error } = await supabase
          .from('webhook_configurations')
          .update(formData)
          .eq('id', selectedWebhook.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Webhook updated successfully');
        toast({ title: 'موفقیت', description: 'وب‌هوک با موفقیت به‌روزرسانی شد' });
      } else {
        console.log('Creating new webhook...');
        // Create new webhook
        const { data, error } = await supabase
          .from('webhook_configurations')
          .insert(formData)
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Webhook created successfully:', data);
        toast({ title: 'موفقیت', description: 'وب‌هوک جدید با موفقیت ایجاد شد' });
      }

      await fetchWebhooks();
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'خطا',
        description: `خطا در ذخیره وب‌هوک: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'موفقیت', description: 'وب‌هوک با موفقیت حذف شد' });
      fetchWebhooks();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف وب‌هوک',
        variant: 'destructive'
      });
    }
  };

  const handleTest = async (webhook: WebhookConfig) => {
    setLoading(true);
    try {
      const testPayload = {
        event_type: webhook.event_type,
        timestamp: new Date().toISOString(),
        data: {
          user: { id: 1, name: 'کاربر تست', email: 'test@example.com', phone: '09123456789' },
          course: { id: '1', title: 'دوره تست', slug: 'test-course', price: 100000 },
          enrollment: { id: '1', payment_status: 'completed', payment_amount: 100000, created_at: new Date().toISOString() }
        }
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(testPayload)
      });

      const responseText = await response.text();

      // Log the test
      await supabase.from('webhook_logs').insert({
        webhook_config_id: webhook.id,
        event_type: webhook.event_type,
        payload: testPayload,
        response_status: response.status,
        response_body: responseText,
        success: response.ok
      });

      toast({
        title: response.ok ? 'موفقیت' : 'خطا',
        description: response.ok ? 'تست وب‌هوک موفق بود' : `تست وب‌هوک ناموفق: ${response.status}`,
        variant: response.ok ? 'default' : 'destructive'
      });

      fetchLogs();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تست وب‌هوک',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      event_type: '',
      course_id: null,
      is_active: true,
      headers: {},
      body_template: DEFAULT_BODY_TEMPLATE
    });
    setSelectedWebhook(null);
  };

  const openEditModal = (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    setFormData(webhook);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت وب‌هوک‌ها</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن وب‌هوک
        </Button>
      </div>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList>
          <TabsTrigger value="webhooks">وب‌هوک‌ها</TabsTrigger>
          <TabsTrigger value="logs">لاگ‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>لیست وب‌هوک‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>رویداد</TableHead>
                    <TableHead>دوره</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Plus className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">هیچ وب‌هوکی تعریف نشده است</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                          >
                            افزودن اولین وب‌هوک
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>{webhook.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {WEBHOOK_EVENTS.find(e => e.value === webhook.event_type)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {webhook.course_id ? (
                            <Badge variant="secondary">
                              {(webhook as any).courses?.title || 'دوره نامشخص'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">همه دوره‌ها</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={webhook.is_active ? "default" : "secondary"}>
                            {webhook.is_active ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTest(webhook)}
                              disabled={loading}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(webhook)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(webhook.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>لاگ وب‌هوک‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>وب‌هوک</TableHead>
                    <TableHead>رویداد</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>زمان</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{(log as any).webhook_configurations?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {WEBHOOK_EVENTS.find(e => e.value === log.event_type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span>{log.response_status || 'خطا'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(log.sent_at).toLocaleString('fa-IR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsLogModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWebhook ? 'ویرایش وب‌هوک' : 'افزودن وب‌هوک جدید'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">نام *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="نام وب‌هوک"
                required
              />
            </div>

            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/webhook"
                required
              />
            </div>

            <div>
              <Label htmlFor="event_type">نوع رویداد *</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب رویداد" />
                </SelectTrigger>
                <SelectContent>
                  {WEBHOOK_EVENTS.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course">دوره (اختیاری)</Label>
              <Select 
                value={formData.course_id || 'all'} 
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  course_id: value === 'all' ? null : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دوره‌ها</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                اگر دوره‌ای انتخاب نکنید، وب‌هوک برای همه دوره‌ها اجرا می‌شود
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>فعال</Label>
            </div>

            <div>
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={JSON.stringify(formData.headers, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData({ ...formData, headers: JSON.parse(e.target.value) });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="body_template">Body Template (JSON)</Label>
              <Textarea
                id="body_template"
                value={JSON.stringify(formData.body_template, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData({ ...formData, body_template: JSON.parse(e.target.value) });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={10}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}>
                انصراف
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Detail Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات لاگ وب‌هوک</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <Label>رویداد</Label>
                <p className="text-sm">{WEBHOOK_EVENTS.find(e => e.value === selectedLog.event_type)?.label}</p>
              </div>
              
              <div>
                <Label>وضعیت پاسخ</Label>
                <p className="text-sm">{selectedLog.response_status || 'خطا'}</p>
              </div>

              {selectedLog.error_message && (
                <div>
                  <Label>پیام خطا</Label>
                  <p className="text-sm text-red-500">{selectedLog.error_message}</p>
                </div>
              )}

              <div>
                <Label>Payload ارسالی</Label>
                <Textarea
                  value={JSON.stringify(selectedLog.payload, null, 2)}
                  readOnly
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              {selectedLog.response_body && (
                <div>
                  <Label>پاسخ دریافتی</Label>
                  <Textarea
                    value={selectedLog.response_body}
                    readOnly
                    rows={4}
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}