import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Phone, Users, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWebinarParticipant } from '@/hooks/useWebinarParticipant';
import { useWebinarRealtime } from '@/hooks/useWebinarRealtime';
import InteractionCard from '@/components/Webinar/InteractionCard';
import ReactionBar from '@/components/Webinar/ReactionBar';
import QAPanel from '@/components/Webinar/QAPanel';
import { AnimatePresence } from 'framer-motion';

interface Webinar {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  webinar_link: string;
  iframe_embed_code: string | null;
  status: string;
  host_name: string | null;
  description: string | null;
  allow_late_responses: boolean;
}

const WebinarWatch: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactions' | 'qa'>('interactions');

  const { participant, loading: participantLoading, joinWebinar } = useWebinarParticipant(webinar?.id);
  const {
    activeInteraction,
    previousInteractions,
    responses,
    questions,
    reactionCounts,
    participantCount,
  } = useWebinarRealtime(webinar?.id);

  useEffect(() => {
    if (slug) fetchWebinar();
  }, [slug]);

  const fetchWebinar = async () => {
    try {
      const { data, error } = await supabase
        .from('webinar_entries')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      setWebinar(data);
    } catch {
      setWebinar(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!phoneInput.trim()) return;
    setJoining(true);
    const result = await joinWebinar(phoneInput, nameInput || undefined);
    if (!result) {
      toast({ title: 'خطا در ورود', variant: 'destructive' });
    }
    setJoining(false);
  };

  if (loading || participantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!webinar) return <Navigate to="/404" replace />;

  const isLive = webinar.status === 'live';
  const isEnded = webinar.status === 'ended';

  // If not joined, show join form
  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{webinar.title}</h1>
              {isLive && <Badge className="bg-red-500 text-white">🔴 پخش زنده</Badge>}
              {isEnded && <Badge variant="secondary">پایان‌یافته</Badge>}
              <p className="text-sm text-muted-foreground">برای ورود شماره تلفن خود را وارد کنید</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="+989123456789"
                  dir="ltr"
                  className="pr-10"
                  type="tel"
                />
              </div>
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="نام نمایشی (اختیاری)"
                dir="rtl"
              />
              <Button className="w-full" onClick={handleJoin} disabled={joining || !phoneInput.trim()}>
                {joining ? 'در حال ورود...' : 'ورود به وبینار'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress
  const totalInteractions = (activeInteraction ? 1 : 0) + previousInteractions.length;
  const myResponseCount = responses.filter(r => r.participant_id === participant.id).length;

  // Extract iframe src from embed code
  const getIframeSrc = () => {
    if (!webinar.iframe_embed_code) return webinar.webinar_link;
    const match = webinar.iframe_embed_code.match(/src="([^"]+)"/);
    return match ? match[1] : webinar.webinar_link;
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">{webinar.title}</h1>
            {isLive && <Badge className="bg-red-500 text-white animate-pulse">🔴 زنده</Badge>}
            {isEnded && <Badge variant="secondary">پایان‌یافته</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{participantCount}</span>
            </div>
            {totalInteractions > 0 && (
              <span className="text-xs">
                تعامل: {myResponseCount}/{totalInteractions}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {iframeFailed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">خطا در بارگذاری پخش زنده</p>
                    <Button variant="outline" onClick={() => setIframeFailed(false)}>
                      <RefreshCw className="h-4 w-4 ml-2" />
                      تلاش مجدد
                    </Button>
                  </div>
                ) : (
                  <iframe
                    src={getIframeSrc()}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="fullscreen; autoplay"
                    allowFullScreen
                    onError={() => setIframeFailed(true)}
                  />
                )}
              </div>
            </Card>

            {/* Reactions Bar - Below video on desktop */}
            <div className="mt-3">
              <ReactionBar
                webinarId={webinar.id}
                participantId={participant.id}
                reactionCounts={reactionCounts}
              />
            </div>
          </div>

          {/* Interaction Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tab switcher */}
            <div className="flex gap-2 border-b pb-2">
              <Button
                variant={activeTab === 'interactions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('interactions')}
              >
                تعامل‌ها
              </Button>
              <Button
                variant={activeTab === 'qa' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('qa')}
              >
                پرسش و پاسخ
                {questions.length > 0 && (
                  <Badge variant="secondary" className="mr-1 text-[10px]">{questions.length}</Badge>
                )}
              </Button>
            </div>

            {activeTab === 'interactions' ? (
              <div className="space-y-4">
                {/* Active Interaction */}
                {activeInteraction ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">در حال دریافت تعامل جدید…</p>
                    <AnimatePresence mode="wait">
                      <InteractionCard
                        key={activeInteraction.id}
                        interaction={activeInteraction}
                        participantId={participant.id}
                        responses={responses}
                        isActive={true}
                      />
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <p>هنوز تعاملی شروع نشده…</p>
                    <p className="text-xs mt-1">منتظر بمانید</p>
                  </div>
                )}

                {/* Previous Interactions */}
                {previousInteractions.length > 0 && (
                  <Collapsible open={previousOpen} onOpenChange={setPreviousOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        تعامل‌های قبلی ({previousInteractions.length})
                        <ChevronDown className={`h-4 w-4 transition-transform ${previousOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-2">
                      {previousInteractions.map(interaction => (
                        <InteractionCard
                          key={interaction.id}
                          interaction={interaction}
                          participantId={participant.id}
                          responses={responses}
                          isActive={false}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ) : (
              <QAPanel
                webinarId={webinar.id}
                participantId={participant.id}
                questions={questions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarWatch;
