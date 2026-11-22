import { esanjBirthYear, HubError, mapQuestionnaire, resultHtml } from '../_shared/hub-policy.ts';

// Use the academy's existing login service; no provider credentials leave this adapter.
export class HubEsanj {
  private token: string | null = null;
  constructor(private invoke: (name: string, body: Record<string, unknown>) => Promise<any>) {}
  private async request(path: string, body?: Record<string, unknown>) {
    if (!this.token) {
      const auth = await this.invoke('esanj-auth', {});
      if (typeof auth.token !== 'string') throw new HubError(502, 'اتصال به ای‌سنج برقرار نشد');
      this.token = auth.token;
    }
    const response = await fetch(`https://esanj.org/api/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      const operation = path.split(/[/?]/)[0];
      const errorBody = await response.json().catch(() => ({}));
      const validationFields = errorBody?.errors && typeof errorBody.errors === 'object' ? Object.keys(errorBody.errors) : [];
      console.error('Hub Esanj provider rejected operation', { operation, status: response.status, validationFields });
      throw new HubError(502, operation === 'employees' || operation === 'employee'
        ? 'ای‌سنج اطلاعات حساب کاربر را نپذیرفت؛ با پشتیبانی تماس بگیرید'
        : 'پاسخ ای‌سنج دریافت نشد؛ دوباره تلاش کنید');
    }
    const text = await response.text();
    try { return JSON.parse(text); } catch { return text; }
  }
  async questionnaire(testId: number) { return mapQuestionnaire(await this.request(`questionnaire/${testId}`)); }
  async employee(user: { hub_user_id: string; name: string; phone: string | null }, birthYear: number, sex: string) {
    // Preserve phone-based employees when available; otherwise use the stable mapped Hub identity.
    const username = user.phone || `hub-${user.hub_user_id}`;
    const result = await this.request(`employees?username=${encodeURIComponent(username)}`);
    const found = result?.employees?.find((employee: any) => employee.username === username);
    if (found?.id) return Number(found.id);
    const created = await this.request('employee/create', {
      username, name: user.name, phone_number: user.phone, birth_year: esanjBirthYear(birthYear), sex, is_active: 1,
    });
    if (!created?.employee?.id) throw new HubError(502, 'حساب آزمون ایجاد نشد');
    return Number(created.employee.id);
  }
  async submit(testId: number, uuid: string, employeeId: number, age: number, sex: string, answers: Array<{row: number; value: number}>) {
    await this.request(`interpretation/${testId}/json/${uuid}`, {
      employee_id: String(employeeId), age, sex,
      ...Object.fromEntries(answers.map(answer => [`q${answer.row}`, answer.value])),
    });
  }
  async result(uuid: string) { return resultHtml(await this.request(`interpretation/html/${uuid}`)); }
}