import { streamResponse, transcribeAudioStream } from 'npm:@lovable.dev/ai-gateway@0.1.11'

/**
 * Persian call transcription pipeline:
 *  1. speech-to-text (streamed)
 *  2. conservative spelling/punctuation correction (streamed) — never rewrites meaning.
 * Callers receive deltas through the optional callbacks; the final strings are returned.
 */
export const TRANSCRIBE_MODEL = 'openai/gpt-4o-transcribe' as const
export const CORRECTION_MODEL = 'openai/gpt-6-astra' as const

export const CORRECTION_INSTRUCTIONS = `تو ویرایشگر املایی متن پیاده‌شدهٔ تماس‌های تلفنی فارسی (فروش و پشتیبانی یک آکادمی آموزشی) هستی.
فقط غلط‌ها را تصحیح کن و هیچ چیز دیگری را تغییر نده:
- غلط‌های املایی و تایپی، کلماتی که سیستم گفتار‌به‌متن اشتباه شنیده و از روی بافت جمله واضح است، نیم‌فاصله‌ها و علائم نگارشی ساده را درست کن.
- اعداد، نام‌ها، مبلغ‌ها، تاریخ‌ها و اصطلاحات را حفظ کن.
- جمله را بازنویسی، خلاصه، رسمی یا مؤدبانه نکن؛ لحن محاوره‌ای را دقیقاً نگه دار. چیزی اضافه یا حذف نکن، ترتیب را تغییر نده و دربارهٔ متن توضیح نده.
- اگر بخشی نامفهوم است و مطمئن نیستی، همان را بدون تغییر بگذار.
خروجی فقط متن تصحیح‌شده باشد.`

type Delta = (text: string) => void

export async function streamTranscription(file: Blob, onDelta?: Delta): Promise<string> {
  const stream = await transcribeAudioStream({ model: TRANSCRIBE_MODEL, file, language: 'fa' })
  let text = ''
  let done: string | null = null
  for await (const ev of stream as AsyncIterable<any>) {
    if (ev?.type === 'transcript.text.delta' && typeof ev.delta === 'string') {
      text += ev.delta
      onDelta?.(ev.delta)
    } else if (ev?.type === 'transcript.text.done' && typeof ev.text === 'string') {
      done = ev.text
    } else if (ev?.type === 'error' || ev?.error) {
      throw new Error(`خطای سرویس تبدیل گفتار: ${JSON.stringify(ev.error ?? ev).slice(0, 300)}`)
    }
  }
  return (done ?? text).trim()
}

/** Rejects a "correction" that changed too much — then the raw text is kept. */
export function acceptCorrection(raw: string, corrected: string): boolean {
  const a = raw.trim(), b = corrected.trim()
  if (!b) return false
  const ratio = b.length / Math.max(1, a.length)
  return ratio >= 0.8 && ratio <= 1.2
}

export async function streamCorrection(raw: string, onDelta?: Delta): Promise<string> {
  const stream = await streamResponse({
    model: CORRECTION_MODEL,
    instructions: CORRECTION_INSTRUCTIONS,
    input: raw,
    reasoning: { effort: 'low' },
  })
  let text = ''
  for await (const ev of stream as AsyncIterable<any>) {
    if (ev?.type === 'response.output_text.delta' && typeof ev.delta === 'string') {
      text += ev.delta
      onDelta?.(ev.delta)
    } else if (ev?.type === 'error' || ev?.type === 'response.failed') {
      throw new Error('تصحیح متن ناموفق بود')
    }
  }
  return text.trim()
}
