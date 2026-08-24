import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subscribeWebinarBroadcast } from '@/lib/webinarBroadcast';

interface Interaction {
  id: string;
  webinar_id: string;
  type: string;
  title: string;
  question: string | null;
  options: any;
  settings: any;
  status: string;
  order_index: number;
  activated_at: string | null;
  ended_at: string | null;
  created_at: string;
}

interface Response {
  id: string;
  interaction_id: string;
  participant_id: string;
  answer: any;
  is_correct: boolean | null;
  points: number;
  created_at: string;
}

interface Question {
  id: string;
  webinar_id: string;
  participant_id: string;
  question_text: string;
  upvotes: number;
  is_pinned: boolean;
  is_answered: boolean;
  is_hidden: boolean;
  is_featured: boolean;
  created_at: string;
}

interface Options {
  /**
   * Host panels need the full per-answer feed (there is only one host, so the
   * fan-out cost is fine). Viewer pages must NOT subscribe to every answer of
   * every webinar — at 500 concurrent viewers that is a quadratic explosion.
   */
  isHost?: boolean;
}

const REACTION_THROTTLE_MS = 5000;
const PARTICIPANT_THROTTLE_MS = 10000;
const HOST_RESPONSE_THROTTLE_MS = 2000;

export const useWebinarRealtime = (webinarId: string | undefined, options: Options = {}) => {
  const { isHost = false } = options;

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [participantCount, setParticipantCount] = useState(0);
  const interactionIdsRef = useRef<string[]>([]);

  // --- throttling helpers -------------------------------------------------
  const timersRef = useRef<Record<string, number | null>>({});
  const throttle = useCallback((key: string, ms: number, fn: () => void) => {
    if (timersRef.current[key]) return;
    timersRef.current[key] = window.setTimeout(() => {
      timersRef.current[key] = null;
      fn();
    }, ms);
  }, []);

  useEffect(() => () => {
    Object.values(timersRef.current).forEach(t => { if (t) window.clearTimeout(t); });
    timersRef.current = {};
  }, []);

  const fetchInteractions = useCallback(async () => {
    if (!webinarId) return;
    const { data } = await supabase
      .from('webinar_interactions')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('order_index', { ascending: true });
    if (data) setInteractions(data);
  }, [webinarId]);

  const fetchResponses = useCallback(async (interactionIds: string[]) => {
    if (!interactionIds.length) {
      setResponses([]);
      return;
    }
    const { data } = await supabase
      .from('webinar_responses')
      .select('*')
      .in('interaction_id', interactionIds);
    if (data) setResponses(data);
  }, []);

  const appendResponse = useCallback((row: Response) => {
    setResponses(prev => (prev.some(r => r.id === row.id) ? prev : [...prev, row]));
  }, []);

  const fetchQuestions = useCallback(async () => {
    if (!webinarId) return;
    const { data } = await supabase
      .from('webinar_questions')
      .select('*')
      .eq('webinar_id', webinarId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });
    if (data) setQuestions(data);
  }, [webinarId]);

  const fetchReactionCounts = useCallback(async () => {
    if (!webinarId) return;
    // Single lightweight read instead of one count query per reaction type.
    const { data } = await supabase
      .from('webinar_reactions')
      .select('reaction_type')
      .eq('webinar_id', webinarId);
    const counts: Record<string, number> = { understood: 0, repeat: 0, excellent: 0, important: 0 };
    (data || []).forEach((r: any) => {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
    });
    setReactionCounts(counts);
  }, [webinarId]);

  const fetchParticipantCount = useCallback(async () => {
    if (!webinarId) return;
    const { count } = await supabase
      .from('webinar_participants')
      .select('*', { count: 'exact', head: true })
      .eq('webinar_id', webinarId);
    setParticipantCount(count || 0);
  }, [webinarId]);

  // --- base subscriptions --------------------------------------------------
  // Host (single client) keeps postgres_changes: authoritative and cheap.
  // Viewers (up to thousands) use Realtime Broadcast — no per-row RLS
  // authorization, so the fan-out does not saturate Realtime workers.
  useEffect(() => {
    if (!webinarId) return;

    fetchInteractions();
    fetchQuestions();
    fetchReactionCounts();
    fetchParticipantCount();

    if (isHost) {
      const channel = supabase
        .channel(`webinar-${webinarId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_interactions', filter: `webinar_id=eq.${webinarId}` }, () => fetchInteractions())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_questions', filter: `webinar_id=eq.${webinarId}` }, () => fetchQuestions())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'webinar_reactions', filter: `webinar_id=eq.${webinarId}` }, () => {
          throttle('reactions', REACTION_THROTTLE_MS, fetchReactionCounts);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_participants', filter: `webinar_id=eq.${webinarId}` }, () => {
          throttle('participants', PARTICIPANT_THROTTLE_MS, fetchParticipantCount);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    const unsubscribe = subscribeWebinarBroadcast(webinarId, {
      interaction: () => throttle('interactions', VIEWER_INTERACTION_THROTTLE_MS, fetchInteractions),
      question: () => throttle('questions', VIEWER_QUESTION_THROTTLE_MS, fetchQuestions),
      reaction: (payload: any) => {
        const type = payload?.type;
        if (!type) return;
        setReactionCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
      },
    });

    // Safety net: broadcast is fire-and-forget, so reconcile periodically.
    const reconcile = window.setInterval(() => {
      fetchInteractions();
      fetchReactionCounts();
      fetchParticipantCount();
    }, VIEWER_RECONCILE_MS);

    return () => {
      unsubscribe();
      window.clearInterval(reconcile);
    };
  }, [webinarId, isHost, fetchInteractions, fetchQuestions, fetchReactionCounts, fetchParticipantCount, throttle]);

  const activeInteraction = interactions.find(i => i.status === 'active') || null;
  const previousInteractions = interactions.filter(i => i.status === 'ended');
  const activeInteractionId = activeInteraction?.id ?? null;

  // --- answers -------------------------------------------------------------
  // Host: full feed across all interactions of this webinar, throttled refetch.
  useEffect(() => {
    if (!webinarId || !isHost) return;
    const ids = interactions.map(i => i.id);
    interactionIdsRef.current = ids;
    if (!ids.length) return;

    fetchResponses(ids);

    const channel = supabase
      .channel(`webinar-responses-host-${webinarId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_responses' }, (payload: any) => {
        const id = payload?.new?.interaction_id || payload?.old?.interaction_id;
        if (!id || !interactionIdsRef.current.includes(id)) return;
        throttle('host-responses', HOST_RESPONSE_THROTTLE_MS, () => fetchResponses(interactionIdsRef.current));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webinarId, isHost, interactions.map(i => i.id).join(','), fetchResponses, throttle]);

  // Viewer: only the currently active interaction, via broadcast.
  useEffect(() => {
    if (isHost || !webinarId) return;
    if (!activeInteractionId) {
      setResponses([]);
      return;
    }

    interactionIdsRef.current = [activeInteractionId];
    fetchResponses([activeInteractionId]);

    const unsubscribe = subscribeWebinarBroadcast(webinarId, {
      response: (payload: any) => {
        if (!payload?.id || payload.interaction_id !== activeInteractionId) return;
        appendResponse(payload as Response);
      },
    });

    return () => { unsubscribe(); };
  }, [isHost, webinarId, activeInteractionId, fetchResponses, appendResponse]);


  return {
    interactions,
    activeInteraction,
    previousInteractions,
    responses,
    questions,
    reactionCounts,
    participantCount,
    refetchInteractions: fetchInteractions,
    refetchQuestions: fetchQuestions,
    refetchReactionCounts: fetchReactionCounts,
  };
};
