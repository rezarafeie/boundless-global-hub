import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown, Loader2, Save, Play, RefreshCw } from 'lucide-react';
import { callCenter, tehranDateTime } from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';

const RULES: Record<string, string> = { support: 'پشتیبانی باز', consultation: 'مشاوره فعال', assigned_agent: 'کارشناس اختصاصی', student: 'دانشجو', webinar: 'وبینار یا ثبت‌نام اخیر', unknown: 'ناشناس', after_hours: 'خارج ساعت کاری', agent_unavailable: 'کارشناس غیرفعال', agent_unmapped: 'کارشناس بدون مقصد', lookup_failed: 'خطای شناسایی' };
const DESTINATIONS = [['default_destination','مقصد پیش‌فرض'],['student_destination','پشتیبانی دانشجویان'],['sales_destination','فروش'],['webinar_destination','وبینار و ثبت‌نام اخیر'],['unknown_destination','تماس‌گیرنده ناشناس'],['unavailable_fallback','جایگزین کارشناس'],['after_hours_destination','خارج ساعت کاری']];
const DAYS = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];

export default function CallRoutingSettings() {
  const { toast } = useToast();
  const [config,setConfig] = useState<any>(null);
  const [agents,setAgents] = useState<any[]>([]);
  const [requests,setRequests] = useState<any[]>([]);
  const [phone,setPhone] = useState('');
  const [at,setAt] = useState('');
  const [result,setResult] = useState<any>(null);
  const [busy,setBusy] = useState('');
  const [error,setError] = useState('');
  const loadRequests = () => callCenter.data('list-call-control-requests').then(r=>setRequests(r.requests??[]));
  useEffect(()=>{
    Promise.all([callCenter.data('get-routing-config'),callCenter.agentExtensions(),loadRequests()])
      .then(([r,a])=>{setConfig({...r.config,priority:r.config.priority??['support','consultation','assigned_agent','student','webinar']});setAgents(a.extensions??[]);})
      .catch(e=>setError(e.message));
  },[]);
  const patch = (key:string,value:unknown) => setConfig((c:any)=>({...c,[key]:value}));
  const move = (index:number,delta:number) => {
    const priority=[...config.priority]; const target=index+delta;
    if(target<0||target>=priority.length)return;
    [priority[index],priority[target]]=[priority[target],priority[index]];patch('priority',priority);
  };
  const save = async()=>{setBusy('save');try{await callCenter.data('save-routing-config',{config:{...config,mode:'capture'}});toast({title:'قوانین آزمایشی ذخیره شد'});}catch(e){toast({title:'خطا',description:(e as Error).message,variant:'destructive'});}finally{setBusy('');}};
  const simulate = async()=>{setBusy('test');setResult(null);try{setResult(await callCenter.data('simulate-routing',{phone,at:at?new Date(`${at}:00+03:30`).toISOString():undefined}));}catch(e){toast({title:'خطا',description:(e as Error).message,variant:'destructive'});}finally{setBusy('');}};
  if(error)return <p role="alert" className="text-destructive">{error}</p>;
  if(!config)return <Loader2 aria-label="در حال بارگذاری هدایت تماس" className="h-5 w-5 animate-spin"/>;
  return <section className="space-y-5 border-t pt-5" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">هدایت تماس</h3><Badge variant="secondary">آزمایشی — هدایت واقعی خاموش</Badge></div>
    <div className="grid gap-3 sm:grid-cols-2">{DESTINATIONS.map(([key,label])=><div className="space-y-1" key={key}><Label htmlFor={`route-${key}`}>{label}</Label><Input id={`route-${key}`} dir="ltr" value={config[key]??''} onChange={e=>patch(key,e.target.value)}/></div>)}</div>
    <div className="flex items-center justify-between gap-3"><Label htmlFor="route-consultation">هدایت مشاوره فعال</Label><Switch id="route-consultation" checked={config.consultation_enabled!==false} onCheckedChange={v=>patch('consultation_enabled',v)}/></div>
    <div className="space-y-3"><div className="flex items-center justify-between"><Label htmlFor="route-hours">ساعت کاری تهران</Label><Switch id="route-hours" checked={!!config.business_hours} onCheckedChange={v=>patch('business_hours',v?{days:[6,0,1,2,3,4],start:'09:00',end:'18:00'}:undefined)}/></div>
      {config.business_hours&&<><div className="flex flex-wrap gap-2">{DAYS.map((day,i)=><div className="flex items-center gap-1" key={day}><Switch aria-label={day} checked={config.business_hours.days.includes(i)} onCheckedChange={v=>patch('business_hours',{...config.business_hours,days:v?[...config.business_hours.days,i]:config.business_hours.days.filter((d:number)=>d!==i)})}/><span className="text-xs">{day}</span></div>)}</div><div className="grid grid-cols-2 gap-3">{['start','end'].map(k=><div key={k}><Label>{k==='start'?'شروع':'پایان'}</Label><Input aria-label={k==='start'?'شروع ساعت کاری':'پایان ساعت کاری'} type="time" value={config.business_hours[k]} onChange={e=>patch('business_hours',{...config.business_hours,[k]:e.target.value})}/></div>)}</div></>}
    </div>
    <div className="space-y-2"><h4 className="font-medium">اولویت شناسایی</h4>{config.priority.map((rule:string,i:number)=><div key={rule} className="flex items-center justify-between border-b py-2 gap-2"><span>{i+1}. {RULES[rule]}</span><div className="flex gap-1"><Button title="اولویت بالاتر" aria-label={`اولویت بالاتر ${RULES[rule]}`} size="icon" variant="ghost" disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp className="h-4 w-4"/></Button><Button title="اولویت پایین‌تر" aria-label={`اولویت پایین‌تر ${RULES[rule]}`} size="icon" variant="ghost" disabled={i===config.priority.length-1} onClick={()=>move(i,1)}><ArrowDown className="h-4 w-4"/></Button></div></div>)}</div>
    {agents.length>0&&<div className="space-y-2"><h4 className="font-medium">مقصد کارشناسان</h4>{agents.filter(a=>a.user_id).map(a=><div className="grid gap-2 sm:grid-cols-2 items-center" key={a.id}><Label htmlFor={`route-agent-${a.id}`}>{a.display_name||a.email} {!a.is_active&&'— غیرفعال'}</Label><Input id={`route-agent-${a.id}`} dir="ltr" value={config.agent_destinations?.[String(a.user_id)]??''} onChange={e=>patch('agent_destinations',{...config.agent_destinations,[String(a.user_id)]:e.target.value})}/></div>)}</div>}
    <Button onClick={save} disabled={!!busy} className="gap-2">{busy==='save'?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}ذخیره قوانین</Button>
    <div className="space-y-3 border-t pt-4"><h4 className="font-semibold">شبیه‌سازی تماس</h4><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="routing-phone">شماره تماس‌گیرنده</Label><Input id="routing-phone" dir="ltr" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div><Label htmlFor="routing-at">زمان تهران (اختیاری)</Label><Input id="routing-at" type="datetime-local" dir="ltr" value={at} onChange={e=>setAt(e.target.value)}/></div></div><Button variant="outline" onClick={simulate} disabled={!!busy||!phone} className="gap-2">{busy==='test'?<Loader2 className="h-4 w-4 animate-spin"/>:<Play className="h-4 w-4"/>}آزمایش بدون تماس</Button>{result&&<div role="status" className="space-y-2 border-r-2 border-primary pr-3"><p>مقصد: <b dir="ltr">{result.decision.destination||'تنظیم نشده'}</b></p><p>دلیل: {RULES[result.decision.reason]||result.decision.reason}</p><div className="flex flex-wrap gap-2">{result.caller_facts?.isStudent&&<Badge>دانشجو</Badge>}{result.caller_facts?.assignedAgentId&&<Badge variant="secondary">دارای کارشناس</Badge>}{result.caller_facts?.recentWebinarOrCheckout&&<Badge variant="outline">ثبت‌نام اخیر</Badge>}</div></div>}</div>
    <div className="space-y-2 border-t pt-4"><div className="flex justify-between items-center"><h4 className="font-semibold">درخواست‌های کنترل تماس</h4><Button size="icon" variant="ghost" aria-label="تازه‌سازی درخواست‌ها" title="تازه‌سازی درخواست‌ها" onClick={()=>loadRequests().catch(e=>setError(e.message))}><RefreshCw className="h-4 w-4"/></Button></div>{!requests.length?<p className="text-sm text-muted-foreground">هنوز درخواستی دریافت نشده است.</p>:requests.map(r=><details key={r.id} className="border-b py-2"><summary className="cursor-pointer text-sm">{tehranDateTime(r.created_at)} — {RULES[r.decision?.reason]||r.decision?.reason}</summary><pre dir="ltr" className="overflow-auto text-xs max-h-64 p-2 bg-muted">{JSON.stringify({body:r.body,decision:r.decision},null,2)}</pre></details>)}</div>
  </section>;
}