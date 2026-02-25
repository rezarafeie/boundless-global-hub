import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactions' | 'qa'>('interactions');

  const { participant, loading: participantLoading } = useWebinarParticipant(webinar?.id);
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

  // Redirect to login if not a participant
  useEffect(() => {
    if (!loading && !participantLoading && webinar && !participant) {
      navigate(`/webinar/${slug}/login?redirect=live`, { replace: true });
    }
  }, [loading, participantLoading, webinar, participant, slug, navigate]);

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

  if (loading || participantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!webinar) return <Navigate to="/404" replace />;
  if (!participant) return null; // Will redirect via useEffect

  const isLive = webinar.status === 'live';
  const isEnded = webinar.status === 'ended';

  const totalInteractions = (activeInteraction ? 1 : 0) + previousInteractions.length;
  const myResponseCount = responses.filter(r => r.participant_id === participant.id).length;

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
