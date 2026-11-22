import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { novinhub } from '../_shared/novinhub.ts';

Deno.test('NovinHub conversation reply uses the documented JSON content payload', async () => {
  const originalFetch = globalThis.fetch;
  const oldToken = Deno.env.get('NOVINHUB_API_KEY');
  Deno.env.set('NOVINHUB_API_KEY', 'test-only-token');
  try {
    let called = false;
    globalThis.fetch = async (input, init) => {
      called = true;
      assertEquals(String(input), 'https://api.novinhub.com/token/v2/conversation/123/reply');
      assertEquals(init?.method, 'POST');
      assertEquals(new Headers(init?.headers).get('Content-Type'), 'application/json');
      assertEquals(JSON.parse(String(init?.body)), { content: 'فعال‌سازی پشتیبانی' });
      return new Response(JSON.stringify({ id: 456 }), { status: 200 });
    };
    assertEquals(await novinhub.reply('123', 'فعال‌سازی پشتیبانی'), { id: 456 });
    assertEquals(called, true);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldToken === undefined) Deno.env.delete('NOVINHUB_API_KEY'); else Deno.env.set('NOVINHUB_API_KEY', oldToken);
  }
});