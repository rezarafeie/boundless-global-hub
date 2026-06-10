import type { Answers, Condition, SmartField, SmartForm } from '@/data/boundlessSmartTest/types';

export function evalCondition(cond: Condition | undefined, answers: Answers): boolean {
  if (!cond || !cond.rules || cond.rules.length === 0) return true;
  const check = (r: { field: string; op: string; value: string }) => {
    const a = answers[r.field] ?? '';
    switch (r.op) {
      case 'is': return a === r.value;
      case 'isnot':
      case 'is not': return a !== r.value;
      case 'contains': return a.includes(r.value);
      case '>': return Number(a) > Number(r.value);
      case '<': return Number(a) < Number(r.value);
      default: return a === r.value;
    }
  };
  return cond.logic === 'any' ? cond.rules.some(check) : cond.rules.every(check);
}

/** Split fields by `page` markers. Each segment is a page. */
export function splitPages(form: SmartForm): SmartField[][] {
  const pages: SmartField[][] = [[]];
  for (const f of form.fields) {
    if (f.kind === 'page') {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(f);
    }
  }
  return pages.filter((p) => p.length > 0);
}

export function visibleFields(fields: SmartField[], answers: Answers): SmartField[] {
  return fields.filter((f) => evalCondition(f.showIf, answers));
}

/** Validate that all visible required inputs on a page are filled. Returns first invalid field id. */
export function validatePage(fields: SmartField[], answers: Answers): string | null {
  for (const f of visibleFields(fields, answers)) {
    if ((f.kind === 'text' || f.kind === 'email' || f.kind === 'number' || f.kind === 'tel' || f.kind === 'radio')) {
      const val = answers[f.id]?.trim?.() ?? '';
      if ((f as any).required && !val) return f.id;
      if (f.kind === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return f.id;
    }
  }
  return null;
}

/** Look at a page's visible HTML field contents to infer outcome label. */
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
