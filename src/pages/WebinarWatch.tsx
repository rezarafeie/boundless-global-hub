import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWebinarParticipant } from '@/hooks/useWebinarParticipant';
import { useWebinarRealtime } from '@/hooks/useWebinarRealtime';
import InteractionCard from '@/components/Webinar/InteractionCard';
import WebinarChat from '@/components/Webinar/WebinarChat';
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
  chat_enabled: boolean;
  chat_mode: string;
}

const WebinarWatch: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeFailed, setIframeFailed] = useState(false);

  const { participant, loading: participantLoading } = useWebinarParticipant(webinar?.id);
  const {
    activeInteraction,
    previousInteractions,
    responses,
    participantCount,
  } = useWebinarRealtime(webinar?.id);

  useEffect(() => {
    if (slug) fetchWebinar();
  }, [slug]);

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
  if (!participant) return null;

  const isLive = webinar.status === 'live';
  const isEnded = webinar.status === 'ended';

  const getIframeSrc = () => {
    if (!webinar.iframe_embed_code) return webinar.webinar_link;
    const match = webinar.iframe_embed_code.match(/src="([^"]+)"/);
    return match ? match[1] : webinar.webinar_link;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir="rtl">
      {/* Minimal Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/lovable-uploads/d03b7d97-8f42-4806-a04a-add408342460.png" 
              alt="Rafiei Academy" 
              className="h-6 w-auto dark:hidden" 
            />
            <img 
              src="/lovable-uploads/e743fe4f-8642-41ec-a4bf-7d749942d8b6.png" 
              alt="Rafiei Academy" 
              className="h-6 w-auto hidden dark:block" 
            />
            <span className="w-px h-4 bg-border/60" />
            <h1 className="text-sm font-semibold text-foreground">{webinar.title}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{participantCount * 8}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-0 shadow-md rounded-xl">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {iframeFailed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-3">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">خطا در بارگذاری پخش زنده</p>
                    <Button variant="outline" size="sm" onClick={() => setIframeFailed(false)}>
                      <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
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
          </div>

          {/* Right Panel: Active Interaction on top + Chat */}
          <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
            {/* Active Interaction - shows on top when active */}
            {activeInteraction && (
              <div className="shrink-0">
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
            )}


            {/* Chat Panel - fills remaining space */}
            <Card className="flex-1 min-h-0 border rounded-xl overflow-hidden flex flex-col">
              <WebinarChat
                webinarId={webinar.id}
                participantId={participant.id}
                displayName={participant.display_name || 'ناشناس'}
                chatEnabled={webinar.chat_enabled}
                chatMode={webinar.chat_mode as 'public' | 'private' | 'off'}
                isHost={false}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarWatch;
