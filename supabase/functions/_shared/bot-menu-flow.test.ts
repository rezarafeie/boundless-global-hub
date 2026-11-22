import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// An isolated, fake credential only for this mocked test process; never use live DB credentials.
Deno.env.set('SUPABASE_URL', 'https://bot-menu-test.supabase.co');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-only-key');
const { handleUpdate } = await import('./bot-core.ts');
const { runWithChannel } = await import('./channel.ts');

async function fixture(role: string | null, work: (messages: any[], requests: URL[]) => Promise<void>, reportAccess = false) {
  const previous = globalThis.fetch;
  const messages: any[] = [], requests: URL[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname !== 'bot-menu-test.supabase.co') {
      const body = JSON.parse(String(init?.body));
      messages.push({ method: url.pathname.split('/').pop(), ...body });
      return Response.json({ ok: true, result: { message_id: 900 + messages.length } });
    }
    requests.push(url);
    const table = url.pathname.split('/').pop();
    if (init?.method && init.method !== 'GET' && init.method !== 'HEAD') return Response.json([]);
    let data: unknown = [];
    if (table === 'chat_users') data = role ? { id: 42, name: 'Test user', role, phone: null } : null;
    if (table === 'admin_settings') data = { telegram_sales_ai_enabled: true, telegram_ai_assistant_enabled: true };
    if (table === 'telegram_bot_sessions') data = null;
    if (table === 'telegram_enrollment_report_access') data = reportAccess ? { active: true, can_manage: false } : null;
    if (table === 'telegram_forms') data = [
      { id: '11111111-full-id', title: 'Hidden', is_active: true, show_in_bot: false },
      { id: '22222222-full-id', title: 'Selected', is_active: true, show_in_bot: true },
    ];
    return Response.json(data, { headers: { 'content-range': '0-0/0' } });
  };
  try { await runWithChannel('telegram', () => work(messages, requests)); } finally { globalThis.fetch = previous; }
}
const message = (text: string) => ({ message: { text, from: { id: 12345 }, chat: { id: 12345, type: 'private' } } });

Deno.test('admin and ordinary accounts receive the same common menu actions, with only selected forms', async () => {
  const menus: string[][] = [];
  for (const role of ['admin', 'student']) await fixture(role, async (messages, requests) => {
    await handleUpdate(message('/start'));
    menus.push(messages.at(-1).reply_markup.inline_keyboard.flat().map((b: any) => b.callback_data));
    const formQuery = requests.find(u => u.pathname.endsWith('/telegram_forms'));
    assertEquals(formQuery?.searchParams.get('show_in_bot'), 'eq.true');
  });
  assertEquals(menus[0], menus[1]);
  assertEquals(menus[0], ['sales:start', 'ai:start', 'form:start:22222222', 'student:browse:0', 'student:profile']);
});
Deno.test('admin reply button opens the existing management flow on a new bot message', async () => {
  await fixture('admin', async messages => {
    await handleUpdate(message('⚙️ مدیریت سیستم'));
    assertEquals(messages.map(m => m.method), ['sendMessage', 'editMessageText']);
    assertEquals(messages[1].message_id, 901);
    assertEquals(messages[1].reply_markup.inline_keyboard[0][0].callback_data, 'admin:stats');
  });
});
Deno.test('student sending administrator keyboard text is denied without management access', async () => {
  await fixture('student', async messages => {
    await handleUpdate(message('⚙️ مدیریت سیستم'));
    assertEquals(messages.map(m => m.method), ['sendMessage']);
    assertEquals(messages[0].reply_markup, undefined);
  });
});
Deno.test('unlinked delegated reader gets report keyboard while normal account linking remains available', async () => {
  await fixture(null, async messages => {
    await handleUpdate(message('/start'), true);
    const keyboard = messages.find(m => m.reply_markup?.keyboard)?.reply_markup.keyboard;
    assertEquals(keyboard[0], [{ text: '📊 آمار ثبت‌نام دوره‌ها' }]);
    assertEquals(messages.at(-1).reply_markup.inline_keyboard.flat().some((b: any) => b.callback_data === 'login:start'), true);
  }, true);
});
Deno.test('home reply restores privileged keyboard and common menu after input mode', async () => {
  await fixture('admin', async messages => {
    await handleUpdate(message('🏠 منوی اصلی'));
    assertEquals(messages.some(m => m.reply_markup?.keyboard?.flat().some((b: any) => b.text === '⚙️ مدیریت سیستم')), true);
    assertEquals(messages.at(-1).reply_markup.inline_keyboard.flat().some((b: any) => b.callback_data === 'student:profile'), true);
  });
});