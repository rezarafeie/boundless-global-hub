import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Loader2, Trophy, Zap } from 'lucide-react';
import { challengeApi } from '@/lib/challenge/schema';

const faNum = (n: number | string) => Number(n).toLocaleString('fa-IR');

const ChallengesHome: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    challengeApi('list', { userId: user?.id, email: (user as any)?.email })
      .then((d) => setItems(d.challenges || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const mine = items.filter((c) => c.participation && c.status !== 'finished');
  const upcoming = items.filter((c) => !c.participation && ['scheduled', 'active'].includes(c.status));
  const done = items.filter((c) => c.status === 'finished');

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">چالش‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">هر روز یک ماموریت شخصی، قدم به قدم تا نتیجه.</p>
      </header>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {mine.map((c) => {
        const pct = Math.round(((c.participation.completed || 0) / Math.max(1, c.days_count)) * 100);
        return (
          <Card key={c.id} className="overflow-hidden border-primary/30">
            {c.cover_image && <img src={c.cover_image} alt="" className="h-40 w-full object-cover" />}
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{c.title}</h2>
                <Badge>روز {faNum(Math.max(1, c.today))} از {faNum(c.days_count)}</Badge>
              </div>
              <Progress value={pct} />
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-lg bg-muted p-3"><Flame className="mx-auto mb-1 h-4 w-4 text-primary" />{faNum(c.participation.streak)} روز</div>
                <div className="rounded-lg bg-muted p-3"><Zap className="mx-auto mb-1 h-4 w-4 text-primary" />{faNum(c.participation.xp)} امتیاز</div>
                <div className="rounded-lg bg-muted p-3"><Trophy className="mx-auto mb-1 h-4 w-4 text-primary" />{faNum(Math.max(0, c.days_count - c.today))} روز مانده</div>
              </div>
              <Button asChild size="lg" className="w-full"><Link to={`/challenges/${c.slug}`}>ادامه چالش</Link></Button>
            </CardContent>
          </Card>
        );
      })}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">چالش‌های در دسترس</h2>
          {upcoming.map((c) => (
            <Card key={c.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{faNum(c.days_count)} روز · شروع {new Date(c.start_date).toLocaleDateString('fa-IR')}</p>
              </div>
              <Button asChild variant="outline"><Link to={`/challenges/${c.slug}`}>مشاهده و شرکت</Link></Button>
            </CardContent></Card>
          ))}
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">چالش‌های پایان‌یافته</h2>
          {done.map((c) => (
            <Card key={c.id}><CardContent className="flex items-center justify-between p-4">
              <p className="font-medium">{c.title}</p>
              <Button asChild variant="ghost"><Link to={`/challenges/${c.slug}`}>مشاهده</Link></Button>
            </CardContent></Card>
          ))}
        </section>
      )}

      {!items.length && !error && <p className="py-16 text-center text-muted-foreground">فعلاً چالشی در دسترس نیست.</p>}
    </div>
  );
};

export default ChallengesHome;
