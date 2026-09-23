// Bale webhook — exact mirror of the Telegram bot, same shared bot brain.
import { serveBotWebhook } from '../_shared/bot-core.ts';

serveBotWebhook('bale', { secret: Deno.env.get('BALE_WEBHOOK_SECRET') ?? '' });
