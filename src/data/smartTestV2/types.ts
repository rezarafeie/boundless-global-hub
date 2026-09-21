export type PathId = 'dropshipping' | 'drop_service' | 'digital_product' | 'ai' | 'vibe_coding';

export const PATH_IDS: PathId[] = ['dropshipping', 'drop_service', 'digital_product', 'ai', 'vibe_coding'];

export const PATH_LABELS: Record<PathId, string> = {
  dropshipping: 'Dropshipping',
  drop_service: 'Drop Service',
  digital_product: 'Digital Product',
  ai: 'AI Business & Services',
  vibe_coding: 'Vibe Coding',
};

export const PATH_FA: Record<PathId, string> = {
  dropshipping: 'فروشگاه بین‌المللی (Dropshipping)',
  drop_service: 'فروش خدمات (Drop Service)',
  digital_product: 'محصول دیجیتال',
  ai: 'کسب‌وکار و خدمات هوش مصنوعی',
  vibe_coding: 'ساخت ابزار و اپ (Vibe Coding)',
};

export type Scores = Partial<Record<PathId, number>>;

export type Option = {
  value: string;
  label: string;
  scores?: Scores;
  reason?: string;
  exclusive?: boolean;
};

export type StageId = 'self' | 'conditions' | 'work_model' | 'blockers' | 'goal' | 'analysis';

export type Question = {
  id: string;
  stage: StageId;
  kind: 'single' | 'multi' | 'rank';
  title: string;
  hint?: string;
  maxSelect?: number;
  options: Option[];
};

export type Answers = Record<string, string | string[]>;

export type Evidence = { path: PathId; delta: number; reason: string };

export type PathResult = { path: PathId; raw: number; match: number };

export type Contradiction = { key: string; text: string };

export type Profile = {
  commercial: number;
  creative: number;
  technical: number;
  execution: number;
  risk: number;
  type: string;
};

export type V2Result = {
  ranked: PathResult[];
  recommended: PathResult;
  alternative: PathResult;
  notNow: PathResult | null;
  evidence: Evidence[];
  readiness: number;
  confidence: 'high' | 'medium' | 'low';
  confidenceFa: string;
  profile: Profile;
  contradictions: Contradiction[];
  objections: string[];
  reasonsForRecommended: Evidence[];
  weakness: string | null;
};
