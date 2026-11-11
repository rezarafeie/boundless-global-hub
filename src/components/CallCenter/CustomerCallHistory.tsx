import { useEffect, useState } from 'react';
import CallsTable from './CallsTable';
import { Button } from '@/components/ui/button';
import { callCenter, type CallRow } from '@/lib/callCenterService';
export default function CustomerCallHistory({userId}:{userId:number}){
 const [calls,setCalls]=useState<CallRow[]>([]);const [page,setPage]=useState(1);const [total,setTotal]=useState(0);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{let active=true;setLoading(true);setError('');callCenter.calls({userId,page,pageSize:20}).then(r=>{if(active){setCalls(r.calls);setTotal(r.total);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[userId,page]);
 return <section className="space-y-3" dir="rtl"><h3 className="text-lg font-semibold">تاریخچه تماس‌ها</h3>{error?<p role="alert" className="text-destructive">{error}</p>:<CallsTable calls={calls} loading={loading}/>}<div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={loading||page===1} onClick={()=>setPage(p=>p-1)}>قبلی</Button><span>{page} / {Math.max(1,Math.ceil(total/20))}</span><Button variant="outline" disabled={loading||page*20>=total} onClick={()=>setPage(p=>p+1)}>بعدی</Button></div></section>;
}