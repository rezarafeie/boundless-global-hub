import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Eye, Loader2, MessageCircle, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import UserTelegramDetails from '@/components/Admin/UserProfile/UserTelegramDetails';

interface Row {
  id: number;
  name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  is_messenger_admin: boolean | null;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  telegram_linked_at: string | null;
  last_seen: string | null;
}

const PAGE_SIZE = 25;

const TelegramUsers: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_users')
      .select(
        'id, name, full_name, phone, email, role, is_messenger_admin, telegram_chat_id, telegram_username, telegram_linked_at, last_seen' as any,
      )
      .not('telegram_chat_id', 'is', null)
      .order('telegram_linked_at', { ascending: false })
      .limit(1000);
    setUsers((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter((u) =>
      [
        u.name,
        u.full_name,
        u.phone,
        u.email,
        u.telegram_username,
        String(u.telegram_chat_id ?? ''),
      ].some((v) => v && String(v).toLowerCase().includes(q)),
    );
  }, [users, search]);

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmt = (v?: string | null) => (v ? format(new Date(v), 'yyyy-MM-dd HH:mm') : '—');

  return (
    <div className="p-4 md:p-8 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/enroll/admin')}>
            <ArrowRight className="w-4 h-4 ml-2" /> بازگشت
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> مدیریت کاربران تلگرام
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">
            کاربران متصل به تلگرام ({filtered.length.toLocaleString('fa-IR')})
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-8"
              placeholder="جستجو بر اساس نام، تلفن، ایمیل، chat_id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">کاربری یافت نشد.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>ایمیل</TableHead>
                      <TableHead>Chat ID</TableHead>
                      <TableHead>یوزرنیم</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>زمان اتصال</TableHead>
                      <TableHead>آخرین بازدید</TableHead>
                      <TableHead className="text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((u) => {
                      const role = u.is_messenger_admin ? 'admin' : u.role ?? '—';
                      return (
                        <TableRow key={u.id}>
                          <TableCell>{u.full_name || u.name || '—'}</TableCell>
                          <TableCell dir="ltr">{u.phone || '—'}</TableCell>
                          <TableCell dir="ltr">{u.email || '—'}</TableCell>
                          <TableCell dir="ltr" className="font-mono">{u.telegram_chat_id}</TableCell>
                          <TableCell dir="ltr">{u.telegram_username ? `@${u.telegram_username}` : '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{role}</Badge>
                          </TableCell>
                          <TableCell>{fmt(u.telegram_linked_at)}</TableCell>
                          <TableCell>{fmt(u.last_seen)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(u)}>
                                <Eye className="w-4 h-4 ml-1" /> تلگرام
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/enroll/admin/users/${u.id}`)}
                              >
                                پروفایل
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    قبلی
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    صفحه {page} از {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    بعدی
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(v) => !v && setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              جزئیات تلگرام: {selectedUser?.full_name || selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserTelegramDetails
              userId={selectedUser.id}
              telegramChatId={selectedUser.telegram_chat_id}
              telegramUsername={selectedUser.telegram_username}
              telegramLinkedAt={selectedUser.telegram_linked_at}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TelegramUsers;
