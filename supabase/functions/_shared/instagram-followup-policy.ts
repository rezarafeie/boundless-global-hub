export function instagramActivationPending(activation: { status?: string; activated_at?: string | null } | null): boolean {
  return !!activation && activation.status !== 'activated' && !activation.activated_at;
}

export function instagramEnrollmentMatches(activation: any, enrollment: any): boolean {
  return !!activation?.enrollment_id && !!enrollment &&
    String(enrollment.id) === String(activation.enrollment_id) &&
    String(enrollment.chat_user_id) === String(activation.user_id) &&
    String(enrollment.course_id) === String(activation.course_id) &&
    ['completed', 'success'].includes(enrollment.payment_status);
}