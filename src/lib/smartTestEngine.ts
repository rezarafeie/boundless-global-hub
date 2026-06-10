import type { Answers, Condition, SmartField, SmartForm } from '@/data/boundlessSmartTest/types';
import { FINAL_REJECT_RADIO_VALUES, READY_TO_PAY_FIELD_ID } from '@/data/boundlessSmartTest';

export function evalCondition(cond: Condition | undefined, answers: Answers): boolean {
  if (!cond || !cond.rules || cond.rules.length === 0) return true;
  const check = (r: { field: string; op: string; value: string }) => {
    const a = answers[r.field] ?? '';
    switch (r.op) {
      case 'is': return a === r.value;
      case 'isnot':
      case 'is not': return a !== r.value;
      case 'contains': return a.includes(r.value);
      case '>': return a !== '' && Number(a) > Number(r.value);
      case '<': return a !== '' && Number(a) < Number(r.value);
      default: return a === r.value;
    }
  };
  return cond.logic === 'any' ? cond.rules.some(check) : cond.rules.every(check);
}

export function splitPages(form: SmartForm): SmartField[][] {
  const pages: SmartField[][] = [[]];
  for (const f of form.fields) {
    if (f.kind === 'page') pages.push([]);
    else pages[pages.length - 1].push(f);
  }
  return pages.filter((p) => p.length > 0);
}

export function visibleFields(fields: SmartField[], answers: Answers): SmartField[] {
  return fields.filter((f) => evalCondition(f.showIf, answers));
}

export function validatePage(fields: SmartField[], answers: Answers): string[] {
  const invalid: string[] = [];
  for (const f of visibleFields(fields, answers)) {
    if (f.kind === 'text' || f.kind === 'email' || f.kind === 'number' || f.kind === 'tel' || f.kind === 'radio') {
      const val = (answers[f.id] ?? '').toString().trim();
      // All input fields are required unless explicitly required=false
      const isRequired = (f as any).required !== false;
      if (isRequired && !val) { invalid.push(f.id); continue; }
      if (f.kind === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { invalid.push(f.id); continue; }
    }
  }
  return invalid;
}

/** Compute final outcome based on answers. */
export function computeFinalOutcome(answers: Answers): 'passed' | 'rejected' | null {
  for (const [fid, rejects] of Object.entries(FINAL_REJECT_RADIO_VALUES)) {
    const v = answers[fid];
    if (v && rejects.some((r) => v.includes(r))) return 'rejected';
  }
  const ready = answers[READY_TO_PAY_FIELD_ID];
  if (ready && ready.startsWith('بله')) return 'passed';
  return null;
}

/** Look at a page's visible HTML field contents to infer outcome label (legacy). */
export function detectOutcome(fields: SmartField[], answers: Answers): 'passed' | 'rejected' | null {
  const visible = visibleFields(fields, answers);
  for (const f of visible) {
    if (f.kind === 'html') {
      if (f.html.includes('متاسفانه') || f.html.includes('واجد شرایط نیستید')) return 'rejected';
      if (f.html.includes('تبریک میگم') || f.html.includes('مجوز اولیه')) return 'passed';
    }
  }
  return null;
}
