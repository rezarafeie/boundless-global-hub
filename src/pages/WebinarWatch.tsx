import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWebinarParticipant } from '@/hooks/useWebinarParticipant';
import { useWebinarRealtime } from '@/hooks/useWebinarRealtime';
import InteractionCard from '@/components/Webinar/InteractionCard';
import WebinarChat from '@/components/Webinar/WebinarChat';
import ConnectionStatusBanner from '@/components/Webinar/ConnectionStatusBanner';
import {
  readCachedWebinar,
  writeCachedWebinar,
  resolveIframeSrc,
  type CachedWebinar,
} from '@/lib/webinarCache';
import { AnimatePresence } from 'framer-motion';

type Webinar = CachedWebinar;

const WebinarWatch: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  // Hydrate synchronously from local cache: the page shell + iframe render
  // with zero Supabase round-trips. Supabase only refreshes it in background.
  const [webinar, setWebinar] = useState<Webinar | null>(() => readCachedWebinar(slug));
  const [loading, setLoading] = useState(() => !readCachedWebinar(slug));
  const [notFound, setNotFound] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const retryRef = useRef(0);

  const { participant, loading: participantLoading } = useWebinarParticipant(webinar?.id);
  const {
    activeInteraction,
    responses,
    participantCount,
  } = useWebinarRealtime(webinar?.id);

  useEffect(() => {
    if (slug) fetchWebinar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!loading && !participantLoading && webinar && !participant) {
      const wl = new URLSearchParams(window.location.search).get('wl');
      navigate(`/webinar/${slug}/login?redirect=live${wl ? `&wl=${encodeURIComponent(wl)}` : ''}`, { replace: true });
    }
  }, [loading, participantLoading, webinar, participant, slug, navigate]);

  const fetchWebinar = async () => {
    try {
      const { data, error } = await supabase
        .from('webinar_entries')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWebinar(data as Webinar);
        writeCachedWebinar(data as Webinar);
        retryRef.current = 0;
      } else if (!readCachedWebinar(slug)) {
        // Definitive answer from the server: this webinar does not exist.
        setNotFound(true);
      }
    } catch {
      // Network/Supabase failure — keep whatever we already show and retry
      // silently in the background with backoff. Never break the live page.
      const attempt = retryRef.current++;
      if (attempt < 8) {
        setTimeout(fetchWebinar, Math.min(20000, 1500 * Math.pow(1.7, attempt)));
      } else if (!readCachedWebinar(slug)) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || (participantLoading && !participant)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!webinar) return notFound ? <Navigate to="/404" replace /> : null;
  if (!participant) return null;

  const getIframeSrc = () => resolveIframeSrc(webinar);

  const retryIframe = () => {
    setIframeFailed(false);
    setIframeKey(k => k + 1);
  };


  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden" dir="rtl">
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
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 content-start lg:h-full h-full">
          {/* Video Player */}
          <div className="lg:col-span-2 shrink-0">
            <Card className="overflow-hidden border-0 shadow-md rounded-xl">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {iframeFailed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-3 px-6 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      پخش زنده لحظه‌ای در دسترس نیست. لطفاً چند لحظه شکیبا باشید؛ در حال تلاش مجدد هستیم.
                    </p>
                    <Button variant="outline" size="sm" onClick={retryIframe}>
                      <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
                      تلاش مجدد
                    </Button>
                  </div>
                ) : (
                  <iframe
                    key={iframeKey}
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
          <div className="lg:col-span-1 flex flex-col gap-3 min-h-0 lg:h-full flex-1">
            {/* Active Interaction - shows on top when active */}
            {activeInteraction && (
              <div className="shrink-0 max-h-[45vh] lg:max-h-[50%] overflow-y-auto">
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
            <Card className="flex-1 min-h-[280px] lg:min-h-0 border rounded-xl overflow-hidden flex flex-col">
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
