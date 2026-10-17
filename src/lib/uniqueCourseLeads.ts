interface CourseLeadIdentity {
  id: string;
  course_id?: string;
  chat_user_id?: number | null;
  phone?: string | null;
  email?: string | null;
  is_assigned?: boolean;
}

export function normalizeLeadPhone(phone: string | null | undefined): string {
  let digits = (phone || '').replace(/[۰-۹٠-٩]/g, c =>
    String('۰۱۲۳۴۵۶۷۸۹'.includes(c) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(c) : '٠١٢٣٤٥٦٧٨٩'.indexOf(c))
  ).replace(/\D/g, '');
  if (/^0098\d{10}$/.test(digits)) digits = digits.slice(2);
  if (/^09\d{9}$/.test(digits)) digits = `98${digits.slice(1)}`;
  if (/^9\d{9}$/.test(digits)) digits = `98${digits}`;
  return digits;
}

// Deduplicate only already-authorized records; never fetch another agent's data.
export function uniqueCourseLeads<T extends CourseLeadIdentity>(leads: T[]): T[] {
  const groups = new Map<string, T>();
  for (const lead of leads) {
    const identity = lead.chat_user_id != null ? `user:${lead.chat_user_id}`
      : normalizeLeadPhone(lead.phone) ? `phone:${normalizeLeadPhone(lead.phone)}`
      : lead.email?.trim() ? `email:${lead.email.trim().toLowerCase()}` : `record:${lead.id}`;
    const key = `${lead.course_id || ''}:${identity}`;
    const existing = groups.get(key);
    if (!existing || (!existing.is_assigned && lead.is_assigned)) groups.set(key, lead);
  }
  return [...groups.values()];
}