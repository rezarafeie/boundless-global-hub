import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GamMission {
  id: string;
  lesson_id: string;
  lesson_title: string;
  lesson_number?: number | null;
  remainingMs: number;
}

export interface GamReward {
  id: string;
  title: string;
  description?: string | null;
  emoji?: string | null;
  within_days: number;
  reward_type?: string | null;
  reward_value?: string | null;
  unlocked?: boolean;
}

export interface GamStatus {
  enabled: boolean;
  settings?: any;
  window?: any;
  locked?: boolean;
  remainingMs?: number;
  progressPercent?: number;
  completedLessons?: number;
  totalLessons?: number;
  streak?: number;
  fastFinishRemainingMs?: number;
  mission?: GamMission | null;
  rewards?: GamReward[];
  earnedRewards?: any[];
}

export function formatRemaining(ms?: number | null): string {
  if (!ms || ms <= 0) return '۰';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} روز و ${hours} ساعت`;
  if (hours > 0) return `${hours} ساعت و ${minutes} دقیقه`;
  return `${minutes} دقیقه`;
}

export function useCourseGamification(courseId?: string | null, courseSlug?: string | null) {
  const { user } = useAuth();
  const [status, setStatus] = useState<GamStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id || (!courseId && !courseSlug)) {
      setLoading(false);
      return;
    }
    try {
      // finish a returning reactivation payment first
      const params = new URLSearchParams(window.location.search);
      const authority = params.get('Authority') || params.get('authority');
      if (params.get('reactivate') === '1' && authority && params.get('course')) {
        await supabase.functions.invoke('course-reactivation-payment', {
          body: { action: 'verify', userId: Number(user.id), courseId: params.get('course'), authority },
        });
        const clean = window.location.pathname;
        window.history.replaceState({}, '', clean);
      }

      const { data, error } = await supabase.functions.invoke('course-access-status', {
        body: { userId: Number(user.id), courseId, courseSlug },
      });
      if (error) throw error;
      setStatus(data as GamStatus);
    } catch (e) {
      console.error('gamification status error', e);
      setStatus({ enabled: false });
    } finally {
      setLoading(false);
    }
  }, [user?.id, courseId, courseSlug]);

  useEffect(() => { refresh(); }, [refresh]);

  // local ticking so countdowns move without refetching (1s, for live FOMO countdowns)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const elapsed = tick * 1000;
  const live: GamStatus | null = status
    ? {
        ...status,
        remainingMs: status.remainingMs != null ? Math.max(0, status.remainingMs - elapsed) : undefined,
        fastFinishRemainingMs:
          status.fastFinishRemainingMs != null ? Math.max(0, status.fastFinishRemainingMs - elapsed) : undefined,
        mission: status.mission
          ? { ...status.mission, remainingMs: Math.max(0, status.mission.remainingMs - elapsed) }
          : null,
      }
    : null;

  const completeMission = useCallback(
    async (lessonId: string) => {
      if (!user?.id) return null;
      const { data, error } = await supabase.functions.invoke('course-mission-complete', {
        body: { userId: Number(user.id), lessonId, courseId },
      });
      if (error) throw error;
      setStatus((data as any)?.status ?? null);
      setTick(0);
      return data as any;
    },
    [user?.id, courseId],
  );

  return { status: live, loading, refresh, completeMission };
}
