import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Play, Square, Plus, Users, BarChart3, Send, Trash2, Eye, Clock, Pin,
  Check, EyeOff, Radio, ArrowRight, Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWebinarRealtime } from '@/hooks/useWebinarRealtime';
import { useUserRole } from '@/hooks/useUserRole';
import QAPanel from '@/components/Webinar/QAPanel';

interface Webinar {
  id: string;
  title: string;
  slug: string;
  status: string;
  iframe_embed_code: string | null;
  host_name: string | null;
  start_date: string;
  allow_late_responses: boolean;
}

interface InteractionForm {
  type: string;
  title: string;
  question: string;
  options: { id: string; text: string; is_correct: boolean }[];
  settings: {
    allow_late: boolean;
    show_results_immediately: boolean;
    timer_duration: number;
    points_enabled: boolean;
    anonymous: boolean;
    char_limit: number;
    button_label: string;
    link_url: string;
    cta_description: string;
    scale_max: number;
    explanation: string;
  };
}

const defaultForm: InteractionForm = {
  type: 'poll',
  title: '',
  question: '',
  options: [
    { id: '1', text: '', is_correct: false },
    { id: '2', text: '', is_correct: false },
  ],
  settings: {
    allow_late: false,
    show_results_immediately: true,
    timer_duration: 30,
    points_enabled: false,
    anonymous: false,
    char_limit: 200,
    button_label: 'مشاهده',
    link_url: '',
    cta_description: '',
    scale_max: 5,
    explanation: '',
  },
};

const WebinarHostPanel: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const { user: authUser } = useAuth();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<InteractionForm>({ ...defaultForm });

  const {
    interactions,
    activeInteraction,
    previousInteractions,
    responses,
    questions,
    reactionCounts,
    participantCount,
    refetchInteractions,
  } = useWebinarRealtime(webinar?.id);

  useEffect(() => {
    if (slug) fetchWebinar();
  }, [slug]);

  const fetchWebinar = async () => {
    const { data } = await supabase
      .from('webinar_entries')
      .select('*')
      .eq('slug', slug)
      .single();
    setWebinar(data);
    setLoading(false);
  };

  const updateWebinarStatus = async (status: string) => {
    if (!webinar) return;
    const updates: any = { status };
    if (status === 'ended') updates.ended_at = new Date().toISOString();
    await supabase.from('webinar_entries').update(updates).eq('id', webinar.id);
    setWebinar(prev => prev ? { ...prev, status } : null);
    toast({ title: status === 'live' ? '🔴 وبینار شروع شد' : 'وبینار پایان یافت' });
  };

  const createInteraction = async () => {
    if (!webinar || !form.title) return;
    const maxOrder = interactions.length > 0 ? Math.max(...interactions.map(i => i.order_index)) + 1 : 0;

    const { error } = await supabase.from('webinar_interactions').insert({
      webinar_id: webinar.id,
      type: form.type,
      title: form.title,
      question: form.question || null,
      options: ['poll', 'quiz'].includes(form.type) ? form.options.filter(o => o.text.trim()) : null,
      settings: form.settings,
      status: 'draft',
      order_index: maxOrder,
    });

    if (error) {
      toast({ title: 'خطا در ایجاد تعامل', variant: 'destructive' });
    } else {
      toast({ title: 'تعامل ایجاد شد ✅' });
      setCreateOpen(false);
      setForm({ ...defaultForm });
      refetchInteractions();
    }
  };

  const pushLive = async (interactionId: string) => {
    // End any active interaction first
    if (activeInteraction) {
      await supabase.from('webinar_interactions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', activeInteraction.id);
    }
    await supabase.from('webinar_interactions').update({ status: 'active', activated_at: new Date().toISOString() }).eq('id', interactionId);
    refetchInteractions();
    toast({ title: 'تعامل فعال شد 🚀' });
  };

  const endInteraction = async (interactionId: string) => {
    await supabase.from('webinar_interactions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', interactionId);
    refetchInteractions();
  };

  const deleteInteraction = async (interactionId: string) => {
    await supabase.from('webinar_interactions').delete().eq('id', interactionId);
    refetchInteractions();
  };

  const addOption = () => {
    if (form.options.length >= 4) return;
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { id: String(prev.options.length + 1), text: '', is_correct: false }],
    }));
  };

  if (loading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  // Check access: allow admin role OR messenger admin
  const isMessengerAdmin = authUser?.isMessengerUser && authUser?.messengerData?.is_messenger_admin;
  const hasAccess = role === 'admin' || role === 'sales_manager' || isMessengerAdmin;

  if (!hasAccess) {
    return <div className="text-center py-20 text-muted-foreground">دسترسی غیرمجاز</div>;
  }

  if (!webinar) return <Navigate to="/404" replace />;

  const typeLabels: Record<string, string> = {
    poll: '📊 نظرسنجی', quiz: '🧠 کوییز', checkin: '✋ حضور',
    task: '📝 تکلیف', cta: '🔗 لینک', reaction: '⚡ واکنش',
  };

  const getResponseStats = (interactionId: string) => {
    const ir = responses.filter(r => r.interaction_id === interactionId);
    return { total: ir.length, responses: ir };
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{webinar.title}</h1>
              <p className="text-xs text-muted-foreground">کنترل پنل میزبان</p>
            </div>
            <Badge className={webinar.status === 'live' ? 'bg-red-500 text-white animate-pulse' : webinar.status === 'ended' ? 'bg-muted' : 'bg-amber-500 text-white'}>
              {webinar.status === 'live' ? '🔴 زنده' : webinar.status === 'ended' ? 'پایان‌یافته' : 'پیش‌نویس'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participantCount} شرکت‌کننده</span>
            </div>
            {webinar.status !== 'live' && webinar.status !== 'ended' && (
              <Button className="bg-red-500 hover:bg-red-600" onClick={() => updateWebinarStatus('live')}>
                <Radio className="h-4 w-4 ml-2" />
                شروع پخش زنده
              </Button>
            )}
            {webinar.status === 'live' && (
              <Button variant="destructive" onClick={() => updateWebinarStatus('ended')}>
                <Square className="h-4 w-4 ml-2" />
                پایان وبینار
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="live" className="space-y-4">
          <TabsList>
            <TabsTrigger value="live">داشبورد زنده</TabsTrigger>
            <TabsTrigger value="interactions">تعامل‌ها</TabsTrigger>
            <TabsTrigger value="qa">پرسش و پاسخ</TabsTrigger>
            <TabsTrigger value="timeline">تایم‌لاین</TabsTrigger>
          </TabsList>

          {/* Live Dashboard */}
          <TabsContent value="live" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{participantCount}</p>
                <p className="text-xs text-muted-foreground">شرکت‌کننده</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{interactions.length}</p>
                <p className="text-xs text-muted-foreground">کل تعامل‌ها</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{responses.length}</p>
                <p className="text-xs text-muted-foreground">کل پاسخ‌ها</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{questions.length}</p>
                <p className="text-xs text-muted-foreground">سوال‌ها</p>
              </CardContent></Card>
            </div>

            {/* Reaction counts */}
            <Card>
              <CardHeader><CardTitle className="text-sm">واکنش‌ها</CardTitle></CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                <span>✅ فهمیدم: {reactionCounts.understood || 0}</span>
                <span>🤔 دوباره بگو: {reactionCounts.repeat || 0}</span>
                <span>🔥 عالی: {reactionCounts.excellent || 0}</span>
                <span>🧠 مهم: {reactionCounts.important || 0}</span>
              </CardContent>
            </Card>

            {/* Active interaction preview */}
            {activeInteraction && (
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge className="bg-green-500 text-white">فعال</Badge>
                      {activeInteraction.title}
                    </CardTitle>
                    <Button variant="destructive" size="sm" onClick={() => endInteraction(activeInteraction.id)}>
                      <Square className="h-3 w-3 ml-1" />
                      پایان
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Show live results */}
                  {['poll', 'quiz'].includes(activeInteraction.type) && activeInteraction.options && (
                    <div className="space-y-2">
                      {(activeInteraction.options as any[]).map((opt: any) => {
                        const optResponses = responses.filter(r => r.interaction_id === activeInteraction.id && r.answer?.option_id === opt.id);
                        const total = responses.filter(r => r.interaction_id === activeInteraction.id).length;
                        const pct = total > 0 ? Math.round((optResponses.length / total) * 100) : 0;
                        return (
                          <div key={opt.id} className="relative overflow-hidden rounded-lg border p-2">
                            <div className="absolute inset-0 bg-primary/10" style={{ width: `${pct}%` }} />
                            <div className="relative flex justify-between text-sm">
                              <span>{opt.text} {opt.is_correct && '✅'}</span>
                              <span>{optResponses.length} ({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-xs text-muted-foreground">مجموع پاسخ‌ها: {getResponseStats(activeInteraction.id).total}</p>
                    </div>
                  )}
                  {activeInteraction.type === 'task' && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {responses.filter(r => r.interaction_id === activeInteraction.id).map(r => (
                        <div key={r.id} className="p-2 border rounded text-sm">{r.answer?.text}</div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Interactions Management */}
          <TabsContent value="interactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">مدیریت تعامل‌ها</h2>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 ml-2" />ایجاد تعامل</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>ایجاد تعامل جدید</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>نوع تعامل</Label>
                      <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="poll">📊 نظرسنجی</SelectItem>
                          <SelectItem value="quiz">🧠 کوییز</SelectItem>
                          <SelectItem value="checkin">✋ حضور</SelectItem>
                          <SelectItem value="task">📝 تکلیف</SelectItem>
                          <SelectItem value="cta">🔗 لینک</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>عنوان (داخلی)</Label>
                      <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثلا: نظرسنجی اول" />
                    </div>
                    <div>
                      <Label>سوال / پرامپت</Label>
                      <Textarea value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="متن سوال..." rows={2} />
                    </div>

                    {/* Options for poll/quiz */}
                    {['poll', 'quiz'].includes(form.type) && (
                      <div className="space-y-2">
                        <Label>گزینه‌ها</Label>
                        {form.options.map((opt, idx) => (
                          <div key={opt.id} className="flex gap-2 items-center">
                            <Input
                              value={opt.text}
                              onChange={e => {
                                const newOpts = [...form.options];
                                newOpts[idx].text = e.target.value;
                                setForm(p => ({ ...p, options: newOpts }));
                              }}
                              placeholder={`گزینه ${idx + 1}`}
                              className="flex-1"
                            />
                            {form.type === 'quiz' && (
                              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                <input
                                  type="radio"
                                  name="correct"
                                  checked={opt.is_correct}
                                  onChange={() => {
                                    const newOpts = form.options.map((o, i) => ({ ...o, is_correct: i === idx }));
                                    setForm(p => ({ ...p, options: newOpts }));
                                  }}
                                />
                                صحیح
                              </label>
                            )}
                          </div>
                        ))}
                        {form.options.length < 4 && (
                          <Button variant="ghost" size="sm" onClick={addOption}>+ گزینه</Button>
                        )}
                      </div>
                    )}

                    {/* CTA settings */}
                    {form.type === 'cta' && (
                      <div className="space-y-2">
                        <div><Label>لینک</Label><Input value={form.settings.link_url} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, link_url: e.target.value } }))} placeholder="https://..." dir="ltr" /></div>
                        <div><Label>متن دکمه</Label><Input value={form.settings.button_label} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, button_label: e.target.value } }))} /></div>
                        <div><Label>توضیح</Label><Input value={form.settings.cta_description} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, cta_description: e.target.value } }))} /></div>
                      </div>
                    )}

                    {/* Quiz settings */}
                    {form.type === 'quiz' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label>تایمر (ثانیه)</Label>
                          <Input type="number" value={form.settings.timer_duration} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, timer_duration: parseInt(e.target.value) || 30 } }))} className="w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={form.settings.points_enabled} onCheckedChange={v => setForm(p => ({ ...p, settings: { ...p.settings, points_enabled: v } }))} />
                          <Label>امتیازدهی</Label>
                        </div>
                        <div><Label>توضیح پاسخ</Label><Input value={form.settings.explanation} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, explanation: e.target.value } }))} /></div>
                      </div>
                    )}

                    {/* Common settings */}
                    <div className="space-y-3 border-t pt-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={form.settings.allow_late} onCheckedChange={v => setForm(p => ({ ...p, settings: { ...p.settings, allow_late: v } }))} />
                        <Label>اجازه پاسخ دیرهنگام</Label>
                      </div>
                      {['poll'].includes(form.type) && (
                        <div className="flex items-center gap-2">
                          <Switch checked={form.settings.show_results_immediately} onCheckedChange={v => setForm(p => ({ ...p, settings: { ...p.settings, show_results_immediately: v } }))} />
                          <Label>نمایش نتایج فوری</Label>
                        </div>
                      )}
                    </div>

                    <Button onClick={createInteraction} className="w-full">ذخیره پیش‌نویس</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Interaction list */}
            <div className="space-y-3">
              {interactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>هنوز تعاملی ایجاد نشده</p>
                  <p className="text-xs mt-1">از دکمه بالا تعامل جدید بسازید</p>
                </div>
              ) : (
                interactions.map(interaction => {
                  const stats = getResponseStats(interaction.id);
                  return (
                    <Card key={interaction.id} className={interaction.status === 'active' ? 'border-primary ring-1 ring-primary/20' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={interaction.status === 'active' ? 'default' : interaction.status === 'draft' ? 'outline' : 'secondary'}>
                              {interaction.status === 'active' ? '🟢 فعال' : interaction.status === 'draft' ? 'پیش‌نویس' : 'پایان‌یافته'}
                            </Badge>
                            <span className="text-sm font-medium">{interaction.title}</span>
                            <span className="text-xs text-muted-foreground">{typeLabels[interaction.type]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{stats.total} پاسخ</span>
                            {interaction.status === 'draft' && (
                              <>
                                <Button size="sm" onClick={() => pushLive(interaction.id)}>
                                  <Play className="h-3 w-3 ml-1" />فعال کن
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteInteraction(interaction.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {interaction.status === 'active' && (
                              <Button size="sm" variant="destructive" onClick={() => endInteraction(interaction.id)}>
                                <Square className="h-3 w-3 ml-1" />پایان
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Q&A */}
          <TabsContent value="qa">
            <Card>
              <CardHeader><CardTitle className="text-sm">مدیریت پرسش و پاسخ</CardTitle></CardHeader>
              <CardContent>
                <QAPanel
                  webinarId={webinar.id}
                  participantId={undefined}
                  questions={questions}
                  isHost={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader><CardTitle className="text-sm">تایم‌لاین جلسه</CardTitle></CardHeader>
              <CardContent>
                {interactions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">هنوز تعاملی ثبت نشده</p>
                ) : (
                  <div className="space-y-3">
                    {interactions.map(i => (
                      <div key={i.id} className="flex items-center gap-3 border-r-2 border-primary/30 pr-4 py-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{i.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {typeLabels[i.type]} • {getResponseStats(i.id).total} پاسخ
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-left">
                          {i.activated_at && <p>شروع: {new Date(i.activated_at).toLocaleTimeString('fa-IR')}</p>}
                          {i.ended_at && <p>پایان: {new Date(i.ended_at).toLocaleTimeString('fa-IR')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WebinarHostPanel;
