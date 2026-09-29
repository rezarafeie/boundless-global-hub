// Send every reviewed assignment / challenge mission (answers + AI analysis) to coaches/admins
// via Telegram bot (Bale fallback) and a formatted email.
import { supabase } from "./supabase.ts";
import { sendMessage } from "./telegram.ts";
import { baleSendMessage, stripHtml } from "./bale.ts";
import { sendEmail } from "./support-followup.ts";
import { coachEmails } from "./challenge.ts";

const SITE = "https://academy.rafiei.co";
const DEFAULT_COACH = "rezarafeie13@gmail.com";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function fmtAnswer(v: unknown): string {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? (x as any)?.name ?? (x as any)?.url ?? JSON.stringify(x) : String(x))).join("، ");
  if (typeof v === "object") return (v as any).url ?? (v as any).name ?? JSON.stringify(v);
  return String(v);
}

export async function notifySubmissionReview(submissionId: string) {
  try {
    const { data: sub } = await supabase.from("assignment_submissions").select("*").eq("id", submissionId).maybeSingle();
    if (!sub) return;
    const { data: a } = await supabase.from("assignments").select("*").eq("id", sub.assignment_id).maybeSingle();
    if (!a) return;
    const { data: student } = await supabase.from("chat_users").select("full_name, name, phone, email").eq("id", sub.student_id).maybeSingle();

    // Context: challenge mission or course assignment
    let context = "";
    let link = `${SITE}/admin/assignments/${a.id}/submissions`;
    let emails: string[] = [DEFAULT_COACH];
    const { data: variants } = await supabase.from("challenge_variants").select("challenge_id, day_id").eq("assignment_id", a.id).limit(1);
    const v = variants?.[0];
    if (v) {
      const [{ data: ch }, { data: day }] = await Promise.all([
        supabase.from("challenges").select("title, slug, coach_email").eq("id", v.challenge_id).maybeSingle(),
        supabase.from("challenge_days").select("day_number, title").eq("id", v.day_id).maybeSingle(),
      ]);
      if (ch) {
        context = `🏁 چالش «${ch.title}»${day ? ` — روز ${day.day_number}${day.title ? `: ${day.title}` : ""}` : ""}`;
        link = `${SITE}/challenges/${ch.slug}`;
        emails = coachEmails(ch);
      }
    } else if (a.course_id) {
      const { data: c } = await supabase.from("courses").select("title").eq("id", a.course_id).maybeSingle();
      if (c) context = `📚 دوره «${c.title}»`;
    }

    const answers = (sub.answers ?? {}) as Record<string, unknown>;
    const qa = ((a.blocks ?? []) as any[])
      .filter((b) => answers[b.id] !== undefined && !["title", "description", "hint"].includes(b.type))
      .map((b) => ({ q: b.label || b.type, a: fmtAnswer(answers[b.id]) }));
    for (const f of (sub.files ?? []) as any[]) qa.push({ q: "📎 فایل", a: f.url });

    const fb = (sub.ai_feedback ?? {}) as any;
    const list = (k: string) => (Array.isArray(fb[k]) ? fb[k].map(String) : []);
    const name = student?.full_name || student?.name || `کاربر ${sub.student_id}`;
    const title = `📝 تمرین جدید: ${a.title}`;

    // ---------- Telegram (HTML) ----------
    const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);
    const sec = (h: string, items: string[]) => (items.length ? `\n<b>${h}</b>\n${items.map((x) => `• ${esc(cut(x, 400))}`).join("\n")}` : "");
    let tg = [
      `<b>${esc(title)}</b>`,
      context ? esc(context) : "",
      `👤 <b>${esc(name)}</b>${student?.phone ? ` | ${esc(student.phone)}` : ""}`,
      "",
      "<b>━━ پاسخ‌های دانشجو ━━</b>",
      ...qa.map((x, i) => `<b>${i + 1}. ${esc(cut(x.q, 150))}</b>\n${esc(cut(x.a, 600))}`),
      "",
      `<b>━━ تحلیل هوش مصنوعی ━━</b>${typeof fb.score === "number" ? `\n⭐️ امتیاز: <b>${fb.score}/100</b>` : ""}`,
      fb.summary ? esc(cut(String(fb.summary).replace(/[#*`]/g, ""), 900)) : "",
      sec("✅ نقاط قوت", list("strengths")) + sec("⚠️ قابل بهبود", list("weaknesses")) + sec("➡️ قدم بعدی", list("next_steps")),
    ].filter((x) => x !== null).join("\n");
    if (tg.length > 4000) tg = tg.slice(0, 3990) + "…";
    const keyboard = [[{ text: "🔎 مشاهده کامل", url: link }]];

    // ---------- Email (HTML) ----------
    const li = (items: string[], color: string) => items.map((x) => `<li style="margin:4px 0">${esc(x)}</li>`).join("") ? `<ul style="margin:6px 0;padding-right:20px;color:${color}">${items.map((x) => `<li style="margin:4px 0;color:#1f2937">${esc(x)}</li>`).join("")}</ul>` : "";
    const box = (h: string, items: string[], color: string) => items.length ? `<h4 style="margin:14px 0 4px;color:${color}">${h}</h4>${li(items, color)}` : "";
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#f5f5f4;padding:24px">
<div style="max-width:640px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e7e5e4">
<div style="background:#1c1917;color:#fafaf9;padding:18px 22px"><div style="font-size:18px;font-weight:bold">${esc(title)}</div>${context ? `<div style="opacity:.8;margin-top:4px;font-size:13px">${esc(context)}</div>` : ""}</div>
<div style="padding:18px 22px;line-height:1.9;color:#1f2937">
<div style="background:#fafaf9;border-radius:10px;padding:10px 14px;font-size:14px">👤 <b>${esc(name)}</b>${student?.phone ? ` · ${esc(student.phone)}` : ""}${student?.email ? ` · ${esc(student.email)}` : ""}</div>
<h3 style="margin:20px 0 8px;border-bottom:2px solid #e7e5e4;padding-bottom:6px">پاسخ‌های دانشجو</h3>
${qa.map((x, i) => `<div style="margin:10px 0"><div style="font-weight:bold;font-size:14px">${i + 1}. ${esc(x.q)}</div><div style="background:#f8fafc;border-right:3px solid #94a3b8;padding:8px 12px;border-radius:6px;white-space:pre-wrap;font-size:14px">${/^https?:\/\//.test(x.a) ? `<a href="${esc(x.a)}">${esc(x.a)}</a>` : esc(x.a)}</div></div>`).join("") || "<p>—</p>"}
<h3 style="margin:22px 0 8px;border-bottom:2px solid #e7e5e4;padding-bottom:6px">تحلیل هوش مصنوعی ${typeof fb.score === "number" ? `<span style="background:#16a34a;color:#fff;border-radius:20px;padding:2px 12px;font-size:13px;margin-right:6px">${fb.score}/100</span>` : ""}</h3>
${fb.summary ? `<p style="white-space:pre-wrap">${esc(String(fb.summary).replace(/[#*`]/g, ""))}</p>` : ""}
${box("✅ نقاط قوت", list("strengths"), "#15803d")}${box("⚠️ نقاط قابل بهبود", list("weaknesses"), "#b45309")}${box("➡️ قدم بعدی", list("next_steps"), "#1d4ed8")}
<p style="margin-top:22px"><a href="${link}" style="background:#1c1917;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">مشاهده کامل</a></p>
</div></div></div>`;

    for (const email of emails) {
      const { data: coach } = await supabase.from("chat_users").select("telegram_chat_id, bale_chat_id").ilike("email", email).limit(1).maybeSingle();
      try {
        if (coach?.telegram_chat_id) await sendMessage(Number(coach.telegram_chat_id), tg, { keyboard } as any);
        else if (coach?.bale_chat_id) await baleSendMessage(Number(coach.bale_chat_id), stripHtml(`${tg}\n\n${link}`));
      } catch (e) { console.warn("submission bot notify failed", e); }
      try { await sendEmail(email, `${title} — ${name}`, html); } catch (e) { console.warn("submission email failed", e); }
    }
  } catch (e) {
    console.error("notifySubmissionReview failed", e);
  }
}
