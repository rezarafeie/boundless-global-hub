import { supabase } from '@/integrations/supabase/client';
import { QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import type { Answers, PathId } from '@/data/smartTestV2/types';
import type { V2Result } from '@/data/smartTestV2/types';
import { collectEvidence, scoreFromEvidence, buildProfile, detectContradictions } from '@/lib/smartTestV2/engine';

export type CheckpointInsight = { observation: string; tone: 'aligned' | 'conflict' | 'caution'; evidence: string[] };

export type AdaptiveQuestion = {
  id: string;
  question: string;
  reason: string;
  resolves: PathId[];
  expected_information_gain: string;
  options: { value: string; label: string; leans: PathId | 'none' }[];
};

export type AiDiagnosis = {
  recommended_path: PathId;
  secondary_path: PathId;
  long_term_fit: PathId;
  best_starting_path: PathId;
  hybrid_label: string | null;
  confidence: 'high' | 'medium' | 'low';
  diagnosis: string;
  why_this_path: { point: string; evidence: string[] }[];
  why_not_secondary_yet: string;
  biggest_advantage: { title: string; explanation: string };
  biggest_risk: { title: string; explanation: string };
  contradictions: { title: string; explanation: string; evidence: string[] }[];
  objection_response: string | null;
  readiness_interpretation: string;
  first_30_days: { title: string; action: string; output: string }[];
  first_90_days_direction: string;
  personalized_next_step: string;
  recommended_next_action: 'continue_maza' | 'start_course' | 'consultation' | 'boundless';
  path_comparison?: { path: PathId; fit: string; friction: string }[];
  execution_gaps?: { area: string; gap: string; next_step: string }[];
  personalized_stack?: { name: string; purpose: string }[];
};

const asArray = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** Readable label(s) for an answer, so the model reads meaning instead of option codes. */
export const labelFor = (qid: string, value: string | string[] | undefined): string | string[] => {
  const question = QUESTION_BY_ID[qid];
  const pick = (v: string) => question?.options.find((o) => o.value === v)?.label || v;
  if (Array.isArray(value)) return value.map(pick);
  return value ? pick(value) : '';
};

/** Structured context shared by every AI call — built from the existing V2 data, never duplicated storage. */
export function buildContext(answers: Answers, extra: Record<string, unknown> = {}) {
  const evidence = collectEvidence(answers);
  const scored = scoreFromEvidence(evidence);
  const profile = buildProfile(answers, evidence);
  return {
    current_stage: labelFor('q1_stage', answers.q1_stage),
    available_time: labelFor('q2_time', answers.q2_time),
    available_capital: labelFor('q3_capital', answers.q3_capital),
    interests: labelFor('q4_interest', answers.q4_interest),
    interest_ranking: asArray(answers.q5_rank).map((v) => labelFor('q4_interest', v)),
    skills: labelFor('q6_skills', answers.q6_skills),
    first_500_scenario: labelFor('q7_scenario', answers.q7_scenario),
    risk_tolerance: labelFor('q8_risk', answers.q8_risk),
    monetization_preference: labelFor('q9_speed', answers.q9_speed),
    english_level: labelFor('q10_english', answers.q10_english),
    technical_comfort: labelFor('q11_tech', answers.q11_tech),
    objections: labelFor('q12_objections', answers.q12_objections),
    goal_12_months: labelFor('q13_goal', answers.q13_goal),
    priority_tradeoff: labelFor('q14_tradeoff', answers.q14_tradeoff),
    final_scenario: labelFor('q15_notification', answers.q15_notification),
    preferred_name: answers.meta_name || '',
    prior_experience: answers.meta_experience || '',
    commitment_90_days: answers.commit_90 || '',
    weekly_execution_hours: answers.commit_hours || '',
    action_readiness: answers.action_readiness || '',
    objection_resolution: Object.fromEntries(Object.entries(answers).filter(([key]) => key.startsWith('resolve_'))),
    raw_answers: answers,
    path_scores: Object.fromEntries(scored.map((s) => [s.path, s.match])),
    profile_dimensions: profile,
    scoring_evidence: evidence.map((e) => ({ path: e.path, delta: e.delta, reason: e.reason })),
    detected_contradictions: detectContradictions(answers).map((c) => c.text),
    ...extra,
  };
}

async function invoke(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('smart-test-v2-diagnose', { body: payload });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

export async function runCheckpoint(
  submissionId: string | null,
  checkpoint: number,
  answers: Answers,
  previous: Record<string, CheckpointInsight>,
): Promise<CheckpointInsight | null> {
  try {
    const context = buildContext(answers, {
      checkpoint,
      previous_ai_insights: Object.values(previous).map((p) => p.observation),
    });
    return (await invoke({ mode: 'checkpoint', checkpoint, submissionId, context })) as CheckpointInsight;
  } catch (e) {
    console.error('stv2 checkpoint failed', e);
    return null;
  }
}

export async function runAdaptive(
  submissionId: string | null,
  answers: Answers,
  previous: Record<string, CheckpointInsight>,
): Promise<AdaptiveQuestion[]> {
  try {
    const context = buildContext(answers, { previous_ai_insights: Object.values(previous).map((p) => p.observation) });
    const data = await invoke({ mode: 'adaptive', submissionId, context });
    return Array.isArray(data?.questions) ? (data.questions as AdaptiveQuestion[]) : [];
  } catch (e) {
    console.error('stv2 adaptive failed', e);
    return [];
  }
}

export async function runFinalDiagnosis(
  submissionId: string | null,
  answers: Answers,
  result: V2Result,
  checkpoints: Record<string, CheckpointInsight>,
  adaptiveQuestions: AdaptiveQuestion[],
  adaptiveAnswers: Record<string, string>,
  userContext: Record<string, unknown> = {},
): Promise<AiDiagnosis> {
  const context = buildContext(answers, {
    deterministic_recommended: result.recommended.path,
    deterministic_alternative: result.alternative.path,
    readiness: result.readiness,
    deterministic_confidence: result.confidence,
    previous_ai_insights: Object.entries(checkpoints).map(([k, v]) => ({ checkpoint: k, observation: v.observation, tone: v.tone })),
    adaptive_questions: adaptiveQuestions.map((q) => ({
      question: q.question,
      resolves: q.resolves,
      answer: q.options.find((o) => o.value === adaptiveAnswers[q.id])?.label || null,
      leans: q.options.find((o) => o.value === adaptiveAnswers[q.id])?.leans || null,
    })),
    ...userContext,
  });
  return (await invoke({ mode: 'final', submissionId, context })) as AiDiagnosis;
}
