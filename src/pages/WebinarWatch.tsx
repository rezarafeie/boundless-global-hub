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
import {
  readCachedWebinar,
  writeCachedWebinar,
  resolveWebinarEmbed,
  buildEmbedDocument,
  type CachedWebinar,
} from '@/lib/webinarCache';
import { startWebinarEntrySync } from '@/lib/webinarEntryQueue';
import { resolveAutoInteraction } from '@/lib/webinarPlayback';
import { subscribeWebinarBroadcast } from '@/lib/webinarBroadcast';
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
  } = useWebinarRealtime(webinar?.id, {
    // Playback mode: cards appear/disappear automatically, driven by the
    // timeline captured during the original live session.
    autoTimeline: !!webinar?.auto_interactions_enabled,
    playbackStartedAt: webinar?.playback_started_at ?? null,
  });

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

  // Live chat settings: react instantly to host toggles (on/off/private)
  // via broadcast, with a light poll as a safety net for missed events.
  useEffect(() => {
    if (!webinar?.id) return;
    const unsubscribe = subscribeWebinarBroadcast(webinar.id, {
      settings: (payload: any) => {
        if (!payload) return;
        setWebinar(prev => {
          if (!prev) return prev;
          const next = {
            ...prev,
            chat_enabled: payload.chat_enabled ?? prev.chat_enabled,
            chat_mode: payload.chat_mode ?? prev.chat_mode,
            auto_interactions_enabled: payload.auto_interactions_enabled ?? prev.auto_interactions_enabled,
            playback_started_at:
              payload.playback_started_at !== undefined ? payload.playback_started_at : prev.playback_started_at,
          };
          writeCachedWebinar(next);
          return next;
        });
      },
    });
    const poll = window.setInterval(() => { fetchWebinar(); }, 20000);
    return () => {
      unsubscribe();
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webinar?.id]);

  // Push locally-admitted viewers to the backend every 5 minutes until the
  // webinar ends. The live page itself never waits on this.
  const statusRef = useRef<string | undefined>(webinar?.status);
  statusRef.current = webinar?.status;
  useEffect(() => {
    if (!webinar?.id) return;
    return startWebinarEntrySync(() => statusRef.current === 'ended');
  }, [webinar?.id]);

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

  const embed = resolveWebinarEmbed(webinar);
  const chatOff = !webinar.chat_enabled || webinar.chat_mode === 'off';

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
        <div className="flex flex-col gap-3 content-start lg:h-full h-full lg:grid lg:grid-cols-3">
          {/* Video Player */}
          <div className="shrink-0 lg:col-span-2">
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
                ) : embed.mode === 'html' ? (
                  <iframe
                    key={iframeKey}
                    srcDoc={buildEmbedDocument(embed.value)}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                    onError={() => setIframeFailed(true)}
                  />
                ) : (
                  <iframe
                    key={iframeKey}
                    src={embed.value}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    onError={() => setIframeFailed(true)}
                  />
                )}

              </div>
            </Card>
          </div>

          {/* Right Panel: Active Interaction (or webinar info) on top + Chat */}
          <div className="lg:col-span-1 flex flex-col gap-3 min-h-0 lg:h-full flex-1">
            {activeInteraction ? (
              <div className="shrink-0 overflow-y-auto">
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
              <Card className="shrink-0 border rounded-xl p-4 space-y-2">
                <h2 className="text-sm font-bold text-foreground">{webinar.title}</h2>
                {webinar.host_name && (
                  <p className="text-xs text-muted-foreground">ارائه‌دهنده: {webinar.host_name}</p>
                )}
                {webinar.start_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(webinar.start_date).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}
                  </p>
                )}
                {webinar.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6 whitespace-pre-line">
                    {webinar.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/80 pt-1">
                  در طول وبینار، کارت‌های تعاملی همین‌جا نمایش داده می‌شوند.
                </p>
              </Card>
            )}

            {/* Chat Panel - fills remaining space, hidden when chat is deactivated */}
            {!chatOff && (
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
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WebinarWatch;
