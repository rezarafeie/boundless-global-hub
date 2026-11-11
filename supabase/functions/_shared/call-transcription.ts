import { streamChatCompletion, streamResponse, transcribeAudioStream } from 'npm:@lovable.dev/ai-gateway@0.1.11'

/**
 * Persian call transcription pipeline:
 *  1. speech-to-text (streamed)
 *  2. conservative spelling/punctuation correction (streamed) — never rewrites meaning.
 * Callers receive deltas through the optional callbacks; the final strings are returned.
 */
export const TRANSCRIBE_MODEL = 'openai/gpt-4o-transcribe' as const
export const CORRECTION_MODEL = 'openai/gpt-6-astra' as const
export const DIARIZE_MODEL = 'google/gemini-3.8-flash' as const

export const CORRECTION_INSTRUCTIONS = `تو ویرایشگر املایی متن پیاده‌شدهٔ تماس‌های تلفنی فارسی (فروش و پشتیبانی یک آکادمی آموزشی) هستی.
فقط غلط‌ها را تصحیح کن و هیچ چیز دیگری را تغییر نده:
- غلط‌های املایی و تایپی، کلماتی که سیستم گفتار‌به‌متن اشتباه شنیده و از روی بافت جمله واضح است، نیم‌فاصله‌ها و علائم نگارشی ساده را درست کن.
- اعداد، نام‌ها، مبلغ‌ها، تاریخ‌ها و اصطلاحات را حفظ کن.
- جمله را بازنویسی، خلاصه، رسمی یا مؤدبانه نکن؛ لحن محاوره‌ای را دقیقاً نگه دار. چیزی اضافه یا حذف نکن، ترتیب را تغییر نده و دربارهٔ متن توضیح نده.
- نام‌های رایج در این تماس‌ها: «آکادمی رفیعی»، «سید عباس رفیعی»، «دوره مزه بدون مرز»، «بدون مرز»، «پشتیبانی تلگرام/بله». اگر عبارتی آشکارا اشتباه‌شنیده‌شدهٔ یکی از این‌هاست (مثلاً «آزاد هستم وضع خودمی رفیق» به‌جای «از آکادمی رفیعی»)، آن را درست کن.
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

export type Segment = { speaker: 'agent' | 'customer'; text: string }

const DIARIZE_PROMPT = `فایل صوتی یک تماس تلفنی فارسی بین «فروشنده» (کارشناس آکادمی رفیعی) و «مشتری» است. با دقت به صدا گوش کن و متن کامل و دقیق مکالمه را بنویس.
قوانین:
- هر نوبت صحبت در یک خط جدا و با پیشوند دقیق «فروشنده: » یا «مشتری: ».
- دقیقاً همان چیزی که گفته شده؛ محاوره‌ای، بدون خلاصه، بدون بازنویسی، بدون افزودن و بدون حذف. فقط املای درست، نیم‌فاصله و علائم نگارشی.
- نام‌های رایج: آکادمی رفیعی، سید عباس رفیعی، دوره مزه بدون مرز، بدون مرز، پشتیبانی تلگرام/بله.
- بخش نامفهوم را با [نامفهوم] مشخص کن.
- یک پیش‌نویس ماشینی (ممکن است غلط داشته باشد) برای کمک داده شده؛ مرجع اصلی صداست.
فقط خطوط مکالمه را خروجی بده.`

export function parseSegments(text: string): Segment[] {
  const out: Segment[] = []
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^(فروشنده|مشتری)\s*[:：]\s*(.*)$/)
    if (m) out.push({ speaker: m[1] === 'فروشنده' ? 'agent' : 'customer', text: m[2].trim() })
    else if (line.trim() && out.length) out[out.length - 1].text += ' ' + line.trim()
  }
  return out.filter((s) => s.text)
}

/** Listens to the audio itself and returns corrected, speaker-separated lines. */
export async function streamDiarizedCorrection(file: Blob, raw: string, onDelta?: Delta): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
  const stream = await streamChatCompletion({
    model: DIARIZE_MODEL,
    messages: [{ role: 'user', content: [
      { type: 'text', text: `${DIARIZE_PROMPT}\n\nپیش‌نویس:\n${raw.slice(0, 20000)}` },
      { type: 'input_audio', input_audio: { data: btoa(bin), format: 'mp3' } },
    ] }],
  } as any)
  let text = ''
  for await (const ev of stream as AsyncIterable<any>) {
    const d = ev?.choices?.[0]?.delta?.content
    if (typeof d === 'string' && d) { text += d; onDelta?.(d) }
    else if (ev?.error) throw new Error('تفکیک گوینده ناموفق بود')
  }
  return text.trim()
}

export function acceptDiarized(raw: string, segments: Segment[]): boolean {
  if (segments.length < 2) return false
  const len = segments.reduce((n, s) => n + s.text.length, 0)
  const ratio = len / Math.max(1, raw.trim().length)
  return ratio >= 0.6 && ratio <= 1.6
}

export const segmentsToText = (segs: Segment[]) =>
  segs.map((s) => `${s.speaker === 'agent' ? 'فروشنده' : 'مشتری'}: ${s.text}`).join('\n')
