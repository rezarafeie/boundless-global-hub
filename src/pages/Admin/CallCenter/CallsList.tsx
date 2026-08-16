import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import CallsTable from '@/components/CallCenter/CallsTable';
import { callCenter, CallRow } from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

interface Props { missedOnly?: boolean }

const RANGES: { value: string; label: string; days: number | null }[] = [
  { value: 'all', label: 'همه تاریخ‌ها', days: null },
  { value: '1', label: 'امروز', days: 1 },
  { value: '7', label: '۷ روز اخیر', days: 7 },
  { value: '30', label: '۳۰ روز اخیر', days: 30 },
  { value: '90', label: '۹۰ روز اخیر', days: 90 },
  { value: 'custom', label: 'بازه دلخواه', days: null },
];

const CallsList: React.FC<Props> = ({ missedOnly }) => {
  const { toast } = useToast();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [total, setTotal] = useState(0);
  const [providerTotal, setProviderTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('all');
  const [status, setStatus] = useState('all');
  const [agentId, setAgentId] = useState('all');
  const [range, setRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [periodSyncVersion, setPeriodSyncVersion] = useState(0);
  const debouncedSearch = useDebounce(search, 400);
  const pageSize = 20;

  const { fromISO, toISO } = useMemo(() => {
    if (range === 'all') return { fromISO: undefined, toISO: undefined };
    if (range === 'custom') {
      return {
        fromISO: customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : undefined,
        toISO: customTo ? new Date(`${customTo}T23:59:59`).toISOString() : undefined,
      };
    }

    const days = RANGES.find((item) => item.value === range)?.days;
    return {
      fromISO: days ? new Date(Date.now() - days * 24 * 3600 * 1000).toISOString() : undefined,
      toISO: undefined,
    };
  }, [range, customFrom, customTo]);

  useEffect(() => { callCenter.agentList().then((r) => setAgents(r.agents)).catch(() => {}); }, []);

  useEffect(() => {
    let active = true;
    if (!fromISO && !toISO) return () => { active = false; };
    setLoading(true);
    callCenter.syncNow(false, { from: fromISO, to: toISO })
      .then(() => { if (active) setPeriodSyncVersion((value) => value + 1); })
      .catch((e) => { if (active) toast({ title: 'خطا در دریافت تماس‌های بازه', description: (e as Error).message, variant: 'destructive' }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fromISO, toISO]);

  useEffect(() => {
    let active = true;
    const loadCalls = async () => {
      setLoading(true);
      try {
        const res = await callCenter.calls({
      page, pageSize,
      search: debouncedSearch || undefined,
      direction: direction !== 'all' ? direction : undefined,
      status: status !== 'all' ? status : undefined,
      agentId: agentId !== 'all' ? Number(agentId) : undefined,
      missed: missedOnly || undefined,
      from: fromISO,
      to: toISO,
        });
        if (active) { setCalls(res.calls); setTotal(res.total); setProviderTotal(res.providerTotal ?? res.total); }
      } catch (e) {
        if (active) toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' });
      } finally { if (active) setLoading(false); }
    };
    loadCalls();
    return () => { active = false; };
  }, [page, debouncedSearch, direction, status, agentId, missedOnly, fromISO, toISO, periodSyncVersion]);

  useEffect(() => { setPage(1); }, [debouncedSearch, direction, status, agentId, missedOnly, fromISO, toISO]);

  useEffect(() => {
    // The provider's all-time count is persisted once in sync state. Once it
    // exceeds the locally stored count, subsequent mounts reuse that baseline.
    callCenter.syncNow(false, { allTimeCount: true }).catch(() => {});
  }, []);

  const pages = Math.max(1, Math.ceil(total / pageSize));


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{missedOnly ? 'تماس‌های از دست رفته' : 'تماس‌ها'}</h2>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString('fa-IR')} رکورد
          {range === 'all' && providerTotal > total ? ` از ${providerTotal.toLocaleString('fa-IR')} تماس دفترشما` : ''}
        </p>
      </div>

      <Card>
        <CardContent className="p-3 grid gap-2 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو با شماره، نام یا ایمیل" className="pr-9" />
          </div>
          {!missedOnly && (
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger><SelectValue placeholder="نوع تماس" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه تماس‌ها</SelectItem>
                <SelectItem value="incoming">ورودی</SelectItem>
                <SelectItem value="outgoing">خروجی</SelectItem>
              </SelectContent>
            </Select>
          )}
          {!missedOnly && (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="وضعیت" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="answered">پاسخ داده شده</SelectItem>
                <SelectItem value="no_answer">بی‌پاسخ</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
                <SelectItem value="failed">ناموفق</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger><SelectValue placeholder="کارشناس" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه کارشناسان</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.full_name || a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="بازه زمانی" /></SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {range === 'custom' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">از تاریخ</label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">تا تاریخ</label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>


      <CallsTable calls={calls} loading={loading} />

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronRight className="h-4 w-4" /> قبلی
          </Button>
          <span className="text-sm text-muted-foreground">صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            بعدی <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CallsList;
