// Telegram webhook — thin entry point around the shared bot brain.
import { serveBotWebhook } from '../_shared/bot-core.ts';

serveBotWebhook('telegram');
