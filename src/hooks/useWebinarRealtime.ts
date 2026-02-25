import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useWebinarRealtime = (webinarId: string | undefined) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [participantCount, setParticipantCount] = useState(0);

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
    if (!interactionIds.length) return;
    const { data } = await supabase
      .from('webinar_responses')
      .select('*')
      .in('interaction_id', interactionIds);
    if (data) setResponses(data);
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
    const types = ['understood', 'repeat', 'excellent', 'important'];
    const counts: Record<string, number> = {};
    for (const type of types) {
      const { count } = await supabase
        .from('webinar_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('webinar_id', webinarId)
        .eq('reaction_type', type);
      counts[type] = count || 0;
    }
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

  useEffect(() => {
    if (!webinarId) return;

    fetchInteractions();
    fetchQuestions();
    fetchReactionCounts();
    fetchParticipantCount();

    // Realtime subscriptions
    const channel = supabase
      .channel(`webinar-${webinarId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_interactions', filter: `webinar_id=eq.${webinarId}` }, () => fetchInteractions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_responses' }, () => {
        // Refetch responses for current interactions
        const ids = interactions.map(i => i.id);
        if (ids.length) fetchResponses(ids);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_questions', filter: `webinar_id=eq.${webinarId}` }, () => fetchQuestions())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'webinar_reactions', filter: `webinar_id=eq.${webinarId}` }, () => fetchReactionCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_participants', filter: `webinar_id=eq.${webinarId}` }, () => fetchParticipantCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [webinarId]);

  // Fetch responses whenever interactions change
  useEffect(() => {
    const ids = interactions.map(i => i.id);
    if (ids.length) fetchResponses(ids);
  }, [interactions, fetchResponses]);

  const activeInteraction = interactions.find(i => i.status === 'active') || null;
  const previousInteractions = interactions.filter(i => i.status === 'ended');

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
