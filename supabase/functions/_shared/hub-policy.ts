import { z } from 'npm:zod@3.23.8';

export class HubError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Hash both values to a fixed-size buffer; never branch on matching prefixes.
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([a, b].map(value =>
    crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const x = new Uint8Array(left), y = new Uint8Array(right);
  let difference = 0;
  for (let i = 0; i < 32; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}

export async function authorizeHub(header: string | null, secret: string | undefined) {
  const match = /^Bearer ([^\s]+)$/.exec(header || '');
  if (!secret || !match || !(await constantTimeEqual(match[1], secret))) {
    throw new HubError(401, 'دسترسی غیرمجاز است');
  }
}

const identitySchema = z.object({
  hub_user_id: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  name: z.string().trim().min(1).max(200),
}).strict();

export function parseHubUser(header: string | null) {
  try {
    if (!header || header.length > 4096) throw new Error();
    const trimmed = header.trim();
    let raw: string;
    if (trimmed.startsWith('{') || trimmed.startsWith('%')) raw = decodeURIComponent(trimmed);
    else {
      if (!/^[A-Za-z0-9_-]+={0,2}$/.test(trimmed)) throw new Error();
      const bin = atob(trimmed.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/'));
      raw = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
    }
    return identitySchema.parse(JSON.parse(raw));
  } catch { throw new HubError(400, 'اطلاعات کاربر هاب معتبر نیست'); }
}

const slug = z.object({ slug: z.string().min(1).max(200) }).strict();
const empty = z.object({}).strict();
export const actionSchemas = {
  'courses.list': empty,
  'course.get': slug,
  'me.enrollments': empty,
  'course.enroll': slug,
  'me.progress': slug,
  'lesson.complete': z.object({ lesson_id: z.string().uuid() }).strict(),
  'lesson.uncomplete': z.object({ lesson_id: z.string().uuid() }).strict(),
  'tests.list': empty,
  'test.get': slug,
  'test.submit': z.object({
    slug: z.string().min(1).max(200),
    answers: z.record(z.union([z.string().max(100), z.number().finite()])).refine(v => Object.keys(v).length <= 1000),
    birth_year: z.number().int().min(1900).max(2100),
    sex: z.enum(['male', 'female']),
  }).strict(),
  'me.tests': empty,
  'test.result': z.object({ attempt_id: z.string().uuid() }).strict(),
  'support.create': z.object({ subject: z.string().trim().min(1).max(200), message: z.string().trim().min(1).max(10000) }).strict(),
  'me.tickets': empty,
};
export type HubAction = keyof typeof actionSchemas;

export function parseAction(action: string, body: unknown): { action: HubAction; payload: Record<string, any> } {
  if (!Object.hasOwn(actionSchemas, action)) throw new HubError(404, 'عملیات هاب یافت نشد');
  const key = action as HubAction;
  const parsed = actionSchemas[key].safeParse(body);
  if (!parsed.success) throw new HubError(400, 'اطلاعات درخواست معتبر نیست');
  return { action: key, payload: parsed.data };
}

export function effectiveCoursePrice(course: Record<string, any>, now = Date.now()) {
  const base = Math.max(0, Number(course.price) || 0);
  if (course.is_sale_enabled && course.sale_price != null &&
    (!course.sale_expires_at || new Date(course.sale_expires_at).getTime() > now)) {
    return Math.min(base, Math.max(0, Number(course.sale_price)));
  }
  return base;
}

export function mapQuestionnaire(raw: any) {
  if (!Array.isArray(raw?.questions) || !raw.questions.length) throw new HubError(502, 'سوالات آزمون از ای‌سنج دریافت نشد');
  const rows = raw.questions.filter((question: any) => !('row_show' in question && 'comment' in question && !('row' in question)));
  if (!rows.length) throw new HubError(502, 'سوالات آزمون از ای‌سنج دریافت نشد');
  return rows.map((question: any) => {
    if (!Number.isInteger(Number(question.row)) || !Array.isArray(question.answers) || !question.answers.length) {
      throw new HubError(502, 'ساختار سوالات ای‌سنج معتبر نیست');
    }
    if (!question.title || question.answers.some((answer: any) => !answer.title)) throw new HubError(502, 'متن سوالات این آزمون توسط ای‌سنج ارائه نشده است');
    return {
      id: String(question.row), text: String(question.title),
      options: question.answers.map((answer: any) => {
        if (!Number.isFinite(Number(answer.value)) || !answer.title) throw new HubError(502, 'گزینه آزمون معتبر نیست');
        return { value: String(answer.value), label: String(answer.title) };
      }),
    };
  });
}

export function validateAnswers(questions: ReturnType<typeof mapQuestionnaire>, answers: Record<string, unknown>) {
  if (Object.keys(answers).length !== questions.length) throw new HubError(400, 'به تمام سوالات آزمون پاسخ دهید');
  return questions.map((q: any) => {
    const value = answers[q.id];
    if (value == null || !q.options.some((o: any) => o.value === String(value))) throw new HubError(400, 'پاسخ آزمون معتبر نیست');
    return { row: Number(q.id), value: Number(value) };
  });
}

export function resultHtml(result: any): string {
  const html = typeof result === 'string' ? result : result?.html ?? result?.htmlContent ?? result?.html_content ?? result?.response;
  if (typeof html !== 'string' || !html.trim().startsWith('<')) throw new HubError(502, 'نتیجه آزمون هنوز آماده نیست');
  return html;
}

// Match the existing enrollment-success Esanj adapter: DB year stays Gregorian.
export const esanjBirthYear = (gregorianYear: number) => gregorianYear - 621;