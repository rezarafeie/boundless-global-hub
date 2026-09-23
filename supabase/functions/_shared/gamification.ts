// Shared engine for the gamified 7-day course access system.
// Opt-in per course via public.course_gamification_settings.enabled.
import { supabase } from "./supabase.ts";
import { sendMessage, tgCall } from "./telegram.ts";
import { sendEmail, sendSms } from "./support-followup.ts";
import { gamMessage, gamText } from "./gamificationMessages.ts";

export const HOUR = 3600_000;
export const DAY = 24 * HOUR;

export type GamSettings = {
  course_id: string;
  enabled: boolean;
  free_days: number;
  reactivation_price_usd: number;
  reactivation_days: number;
  mission_hours: number;
  fast_finish_days: number;
  notifications_enabled: boolean;
  messages: Record<string, { title?: string; text?: string }>;
};

export const DEFAULT_SETTINGS = {
  enabled: false,
  free_days: 7,
  reactivation_price_usd: 10,
  reactivation_days: 7,
  mission_hours: 24,
  fast_finish_days: 3,
  notifications_enabled: true,
  messages: {} as Record<string, { title?: string; text?: string }>,
};

export async function resolveGamificationUserId(userId: unknown, email?: unknown): Promise<number | null> {
  const numericId = Number(userId);
  if (Number.isInteger(numericId) && numericId > 0) return numericId;

  const rawId = typeof userId === "string" ? userId.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  let query = supabase.from("chat_users").select("id").limit(1);
  if (rawId && normalizedEmail) query = query.or(`user_id.eq.${rawId},email.eq.${normalizedEmail}`);
  else if (rawId) query = query.eq("user_id", rawId);
  else if (normalizedEmail) query = query.eq("email", normalizedEmail);
  else return null;
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("resolveGamificationUserId failed", { code: error.code, message: error.message });
    return null;
  }
  return data?.id ? Number(data.id) : null;
}

export async function getGamSettings(courseId: string): Promise<GamSettings | null> {
  const { data } = await supabase
    .from("course_gamification_settings")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!data) return null;
  return { ...DEFAULT_SETTINGS, ...(data as any) } as GamSettings;
}

export function humanRemaining(ms: number): string {
  if (ms <= 0) return "۰";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / 60000);
  if (d > 0) return `${d} روز و ${h} ساعت`;
  if (h > 0) return `${h} ساعت و ${m} دقیقه`;
  return `${m} دقیقه`;
}

/* ---------------- access window ---------------- */

export async function ensureAccessWindow(userId: number, courseId: string, enrollmentId?: string | null) {
  const s = await getGamSettings(courseId);
  if (!s?.enabled) return null;

  const { data: existing } = await supabase
    .from("course_access_windows")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) {
    await notifyStudent(userId, courseId, "welcome", existing.id, {
      free_days: s.free_days,
      mission_hours: s.mission_hours,
      fast_finish_days: s.fast_finish_days,
    });
    return existing;
  }

  const startedAt = new Date();
  const { data: created } = await supabase
    .from("course_access_windows")
    .insert({
      user_id: userId,
      course_id: courseId,
      enrollment_id: enrollmentId ?? null,
      started_at: startedAt.toISOString(),
      expires_at: new Date(startedAt.getTime() + s.free_days * DAY).toISOString(),
      status: "active",
      source: "enrollment",
    })
    .select("*")
    .maybeSingle();

  if (created) {
    await ensureNextMission(userId, courseId, s);
    await notifyStudent(userId, courseId, "welcome", created.id, {
      free_days: s.free_days,
      mission_hours: s.mission_hours,
      fast_finish_days: s.fast_finish_days,
    });
  }
  return created;
}

export async function extendAccess(userId: number, courseId: string, days: number, source = "admin") {
  const { data: w } = await supabase
    .from("course_access_windows")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  const base = w && new Date(w.expires_at).getTime() > Date.now() ? new Date(w.expires_at).getTime() : Date.now();
  const expires = new Date(base + days * DAY).toISOString();
  if (!w) {
    const { data } = await supabase.from("course_access_windows").insert({
      user_id: userId, course_id: courseId, expires_at: expires, status: "active", source,
    }).select("*").maybeSingle();
    return data;
  }
  const { data } = await supabase
    .from("course_access_windows")
    .update({ expires_at: expires, status: "active" })
    .eq("id", w.id)
    .select("*")
    .maybeSingle();
  return data;
}

/* ---------------- missions ---------------- */

export async function courseLessons(courseId: string) {
  const { data } = await supabase
    .from("course_lessons")
    .select("id, title, lesson_number, order_index")
    .eq("course_id", courseId)
    .order("lesson_number", { ascending: true });
  return data ?? [];
}

// Opens a mission for the first lesson that has neither a mission nor completed progress.
export async function ensureNextMission(userId: number, courseId: string, s: GamSettings) {
  const lessons = await courseLessons(courseId);
  if (!lessons.length) return null;

  const [{ data: missions }, { data: progress }] = await Promise.all([
    supabase.from("course_missions").select("*").eq("user_id", userId).eq("course_id", courseId),
    supabase.from("user_lesson_progress").select("lesson_id, is_completed").eq("user_id", userId).eq("course_id", courseId),
  ]);

  const open = (missions ?? []).find((m: any) => !m.completed_at);
  if (open) return open;

  const done = new Set<string>([
    ...(missions ?? []).filter((m: any) => m.completed_at).map((m: any) => m.lesson_id),
    ...(progress ?? []).filter((p: any) => p.is_completed).map((p: any) => p.lesson_id),
  ]);

  const next = lessons.find((l: any) => !done.has(l.id));
  if (!next) return null;

  const now = new Date();
  const { data } = await supabase
    .from("course_missions")
    .upsert({
      user_id: userId,
      course_id: courseId,
      lesson_id: next.id,
      unlocked_at: now.toISOString(),
      due_at: new Date(now.getTime() + s.mission_hours * HOUR).toISOString(),
    }, { onConflict: "user_id,lesson_id" })
    .select("*")
    .maybeSingle();
  return data;
}

export async function completeMission(userId: number, courseId: string, lessonId: string) {
  const s = await getGamSettings(courseId);
  if (!s?.enabled) return null;

  const { data: mission } = await supabase
    .from("course_missions")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const now = new Date();
  let streakKept = true;
  if (mission) {
    if (mission.completed_at) {
      return { alreadyDone: true, status: await buildStatus(userId, courseId) };
    }
    streakKept = now.getTime() <= new Date(mission.due_at).getTime();
    await supabase.from("course_missions")
      .update({ completed_at: now.toISOString(), streak_kept: streakKept })
      .eq("id", mission.id);
  } else {
    await supabase.from("course_missions").upsert({
      user_id: userId, course_id: courseId, lesson_id: lessonId,
      unlocked_at: now.toISOString(),
      due_at: new Date(now.getTime() + s.mission_hours * HOUR).toISOString(),
      completed_at: now.toISOString(), streak_kept: true,
    }, { onConflict: "user_id,lesson_id" });
  }

  // recalculate streak
  const { data: all } = await supabase
    .from("course_missions").select("completed_at, streak_kept")
    .eq("user_id", userId).eq("course_id", courseId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: true });
  let streak = 0;
  for (const m of all ?? []) {
    if (m.streak_kept) streak += 1; else streak = 0;
  }

  const { data: w } = await supabase
    .from("course_access_windows").select("*")
    .eq("user_id", userId).eq("course_id", courseId).maybeSingle();
  if (w) {
    await supabase.from("course_access_windows").update({
      streak_count: streak,
      best_streak: Math.max(streak, w.best_streak ?? 0),
    }).eq("id", w.id);
  }

  const nextMission = await ensureNextMission(userId, courseId, s);
  const finished = !nextMission;
  let rewards: any[] = [];

  if (finished && w && !w.completed_at) {
    const days = (Date.now() - new Date(w.started_at).getTime()) / DAY;
    await supabase.from("course_access_windows").update({
      completed_at: new Date().toISOString(),
      completion_days: Number(days.toFixed(2)),
      status: "completed",
    }).eq("id", w.id);
    rewards = await grantRewards(userId, courseId, days);
    await notifyStudent(userId, courseId, "course_completed", w.id, {
      days: days.toFixed(1),
      rewards: rewards.length ? rewards.map((r) => `• ${r.title}`).join("\n") : "هدایای دوره فعال شد",
    });
  }

  const fastDeadline = w ? new Date(new Date(w.started_at).getTime() + s.fast_finish_days * DAY) : null;
  const fastRemaining = fastDeadline ? fastDeadline.getTime() - Date.now() : 0;

  return {
    ok: true,
    streak,
    streakKept,
    finished,
    rewards,
    nextMission,
    message: finished
      ? gamMessage(s.messages, "course_completed", {
        days: w ? ((Date.now() - new Date(w.started_at).getTime()) / DAY).toFixed(1) : "",
      }).text
      : gamText(s.messages, fastRemaining > 0 ? "mission_completed" : "mission_completed_late", {
        remaining: humanRemaining(fastRemaining),
        streak,
      }),
  };
}

/* ---------------- rewards ---------------- */

export function rewardValueLabel(type?: string | null, value?: string | null) {
  if (!value) return "";
  switch (type) {
    case "discount_code":
    case "coupon":
      return `کد تخفیف: ${value}`;
    case "discount_percent":
      return `تخفیف: ${value}٪`;
    case "cash":
    case "credit":
      return `اعتبار: ${value}`;
    case "link":
    case "file":
      return `لینک دریافت: ${value}`;
    default:
      return value;
  }
}

export function formatRewardLines(items: any[]) {
  return items
    .map((r) => {
      const label = rewardValueLabel(r.reward_type, r.reward_value);
      const head = `• ${r.emoji ? `${r.emoji} ` : ""}${r.title}`;
      return label ? `${head}\n   ${label}` : head;
    })
    .join("\n");
}


export async function grantRewards(userId: number, courseId: string, completionDays: number) {
  const { data: rewards } = await supabase
    .from("course_gamification_rewards")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("within_days", { ascending: true });

  const granted: any[] = [];
  for (const r of rewards ?? []) {
    if (completionDays > Number(r.within_days)) continue;
    const { data } = await supabase.from("user_course_rewards").insert({
      user_id: userId,
      course_id: courseId,
      reward_id: r.id,
      title: r.title,
      reward_type: r.reward_type,
      reward_value: r.reward_value,
      granted_by: "system",
    }).select("*").maybeSingle();
    if (data) granted.push(data);
  }

  if (granted.length) {
    await notifyStudent(userId, courseId, "rewards", null, {
      days: completionDays.toFixed(1),
      rewards: granted.map((g) => `• ${g.title}`).join("\n"),
    });
  }
  return granted;
}

/* ---------------- status ---------------- */

export async function buildStatus(userId: number, courseId: string) {
  const s = await getGamSettings(courseId);
  if (!s?.enabled) return { enabled: false };

  let { data: w } = await supabase
    .from("course_access_windows").select("*")
    .eq("user_id", userId).eq("course_id", courseId).maybeSingle();
  if (!w) w = await ensureAccessWindow(userId, courseId);
  if (!w) return { enabled: true, window: null };

  const now = Date.now();
  const expired = new Date(w.expires_at).getTime() <= now && w.status !== "completed";
  if (expired && w.status === "active") {
    await supabase.from("course_access_windows").update({ status: "expired" }).eq("id", w.id);
    w.status = "expired";
  }

  const lessons = await courseLessons(courseId);
  const { data: progress } = await supabase
    .from("user_lesson_progress").select("lesson_id, is_completed")
    .eq("user_id", userId).eq("course_id", courseId);
  const completed = (progress ?? []).filter((p: any) => p.is_completed).length;
  const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;

  // Reconcile legacy or externally-completed progress so a 100% course can never
  // keep an active countdown or receive reminder messages.
  if (lessons.length > 0 && completed >= lessons.length && w.status !== "completed") {
    const days = Math.max(0, (now - new Date(w.started_at).getTime()) / DAY);
    await supabase.from("course_access_windows").update({
      completed_at: w.completed_at ?? new Date().toISOString(),
      completion_days: w.completion_days ?? Number(days.toFixed(2)),
      status: "completed",
    }).eq("id", w.id);
    w.status = "completed";
    w.completed_at = w.completed_at ?? new Date().toISOString();
    w.completion_days = w.completion_days ?? Number(days.toFixed(2));
    const granted = await grantRewards(userId, courseId, days);
    await notifyStudent(userId, courseId, "course_completed", w.id, {
      days: days.toFixed(1),
      rewards: granted.length ? granted.map((r) => `• ${r.title}`).join("\n") : "هدایای دوره فعال شد",
    });
  }

  let mission = null as any;
  if (!expired && w.status !== "completed") {
    mission = await ensureNextMission(userId, courseId, s);
  }
  const missionLesson = mission ? lessons.find((l: any) => l.id === mission.lesson_id) : null;

  const [{ data: earned }, { data: allRewards }] = await Promise.all([
    supabase.from("user_course_rewards").select("*").eq("user_id", userId).eq("course_id", courseId).is("revoked_at", null),
    supabase.from("course_gamification_rewards").select("*").eq("course_id", courseId).eq("is_active", true).order("within_days"),
  ]);

  const startedMs = new Date(w.started_at).getTime();
  const fastDeadline = startedMs + s.fast_finish_days * DAY;

  const { data: courseRow } = await supabase
    .from("courses").select("title, slug, gifts_link").eq("id", courseId).maybeSingle();

  return {
    enabled: true,
    settings: s,
    course: { id: courseId, title: courseRow?.title ?? "", slug: courseRow?.slug ?? "", gifts_link: courseRow?.gifts_link ?? null },
    window: w,
    completed: w.status === "completed" || percent >= 100,
    completionMessage: gamMessage(s.messages, "course_completed", {
      days: w.completion_days ?? Math.max(0, (now - new Date(w.started_at).getTime()) / DAY).toFixed(1),
    }),
    locked: expired && w.status !== "completed",
    remainingMs: w.status === "completed" ? 0 : Math.max(0, new Date(w.expires_at).getTime() - now),
    progressPercent: percent,
    completedLessons: completed,
    totalLessons: lessons.length,
    streak: w.streak_count ?? 0,
    fastFinishRemainingMs: Math.max(0, fastDeadline - now),
    mission: mission ? {
      ...mission,
      lesson_title: missionLesson?.title ?? "",
      lesson_number: missionLesson?.lesson_number ?? null,
      remainingMs: Math.max(0, new Date(mission.due_at).getTime() - now),
    } : null,
    rewards: (allRewards ?? []).map((r: any) => ({
      ...r,
      unlocked: (earned ?? []).some((e: any) => e.reward_id === r.id),
    })),
    earnedRewards: earned ?? [],
  };
}

/* ---------------- notifications ---------------- */

export async function notifyStudent(
  userId: number,
  courseId: string,
  kind: string,
  refId: string | null,
  vars: Record<string, string | number | null | undefined> = {},
) {
  const s = await getGamSettings(courseId);
  if (s && !s.notifications_enabled) return { skipped: true };

  const notificationRef = refId ?? kind;
  const { data: previous } = await supabase
    .from("course_gamification_notifications")
    .select("channels")
    .eq("user_id", userId).eq("course_id", courseId).eq("kind", kind).eq("ref_id", notificationRef)
    .maybeSingle();
  const delivered = new Set<string>(Array.isArray(previous?.channels) ? previous.channels : []);

  const { data: user } = await supabase
    .from("chat_users").select("id, name, full_name, phone, email, telegram_chat_id")
    .eq("id", userId).maybeSingle();
  if (!user) return { skipped: true, reason: "user_not_found" };

  const { data: course } = await supabase.from("courses").select("title, slug").eq("id", courseId).maybeSingle();
  const courseTitle = course?.title ?? "";
  const msg = gamMessage(s?.messages ?? {}, kind, {
    course_title: courseTitle,
    name: user.full_name ?? user.name ?? "",
    free_days: s?.free_days,
    mission_hours: s?.mission_hours,
    fast_finish_days: s?.fast_finish_days,
    price_usd: s?.reactivation_price_usd,
    reactivation_days: s?.reactivation_days,
    ...vars,
  });
  const body = `${msg.title}\n\n${msg.text}\n\n${courseTitle}`;
  const channels = new Set<string>(delivered);
  const errors: Record<string, string> = {};

  // telegram bot
  if (user.telegram_chat_id && !channels.has("telegram_bot")) {
    try {
      const response = await sendMessage(Number(user.telegram_chat_id), body);
      if ((response as any)?.ok) channels.add("telegram_bot");
      else errors.telegram_bot = JSON.stringify(response);
    } catch (e) { errors.telegram_bot = String(e); }
  }

  // telegram business (only when support is activated)
  try {
    const { data: act } = await supabase
      .from("support_activations")
      .select("telegram_id, status")
      .eq("user_id", userId).eq("course_id", courseId)
      .eq("status", "activated")
      .not("telegram_id", "is", null)
      .order("activated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (act?.telegram_id && !channels.has("telegram_business")) {
      const { data: settings } = await supabase
        .from("admin_settings").select("telegram_business_connection_id" as any).eq("id", 1).maybeSingle();
      const bcid = (settings as any)?.telegram_business_connection_id;
      if (bcid) {
        const response = await tgCall("sendMessage", {
          chat_id: Number(act.telegram_id),
          text: body,
          business_connection_id: bcid,
        });
        if ((response as any)?.ok) channels.add("telegram_business");
        else errors.telegram_business = JSON.stringify(response);
      }
    }
  } catch (e) { errors.telegram_business = String(e); }

  if (user.email && !channels.has("email")) {
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9">${body.replace(/\n/g, "<br/>")}</div>`;
    const r = await sendEmail(user.email, msg.title, html);
    if (r.ok) channels.add("email");
    else errors.email = r.error ?? "unknown email error";
  }

  if (user.phone && !channels.has("sms")) {
    const r = await sendSms(user.phone, body, {
      name: user.full_name ?? user.name ?? "",
      course_title: courseTitle,
    }, null);
    if (r.ok) channels.add("sms");
    else errors.sms = r.error ?? "unknown sms error";
  }

  const channelList = [...channels];
  await supabase.from("course_gamification_notifications").upsert({
    user_id: userId,
    course_id: courseId,
    kind,
    ref_id: notificationRef,
    channels: channelList,
    delivery_errors: errors,
    last_attempt_at: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  }, { onConflict: "user_id,course_id,kind,ref_id" });
  if (Object.keys(errors).length) console.error("gamification notification delivery failed", { userId, courseId, kind, errors });

  return { channels: channelList, errors };
}

/* ---------------- retry of incomplete deliveries ---------------- */

// Re-sends the welcome message on channels that were not delivered the first time.
// Typical case: the student activated Telegram support AFTER enrolling, so only the
// email channel succeeded at enrollment time. Channels already delivered are skipped
// by notifyStudent, so no student is ever messaged twice on the same channel.
export async function retryIncompleteWelcomeNotifications(limit = 100) {
  const since = new Date(Date.now() - 14 * DAY).toISOString();
  const { data: rows } = await supabase
    .from("course_gamification_notifications")
    .select("id, user_id, course_id, kind, ref_id, channels")
    .eq("kind", "welcome")
    .gte("sent_at", since)
    .order("sent_at", { ascending: false })
    .limit(500);

  if (!rows?.length) return 0;

  const pending = rows.filter((r: any) => {
    const ch = Array.isArray(r.channels) ? r.channels : [];
    return !ch.includes("telegram_bot") || !ch.includes("telegram_business");
  });
  if (!pending.length) return 0;

  const userIds = [...new Set(pending.map((r: any) => Number(r.user_id)))];
  const { data: users } = await supabase
    .from("chat_users").select("id, telegram_chat_id").in("id", userIds);
  const withBot = new Set((users ?? []).filter((u: any) => u.telegram_chat_id).map((u: any) => Number(u.id)));

  const { data: activations } = await supabase
    .from("support_activations")
    .select("user_id, course_id, status, telegram_id")
    .in("user_id", userIds)
    .eq("status", "activated")
    .not("telegram_id", "is", null);
  const activated = new Set((activations ?? []).map((a: any) => `${a.user_id}:${a.course_id}`));

  let retried = 0;
  for (const r of pending) {
    if (retried >= limit) break;
    const uid = Number(r.user_id);
    const hasNewChannel = withBot.has(uid) || activated.has(`${uid}:${r.course_id}`);
    if (!hasNewChannel) continue;
    const s = await getGamSettings(r.course_id);
    if (!s?.enabled) continue;
    await notifyStudent(uid, r.course_id, "welcome", r.ref_id, {
      free_days: s.free_days,
      mission_hours: s.mission_hours,
      fast_finish_days: s.fast_finish_days,
    });
    retried++;
  }
  return retried;
}

/* ---------------- enrollment backfill ---------------- */

// Starts access windows (and the welcome notification) for students who enrolled in a
// gamified course but never opened it. Limited to enrollments created after the course
// gamification settings were created, so older students are never spammed.
export async function startWindowsForNewEnrollments(limit = 50) {
  const { data: settings } = await supabase
    .from("course_gamification_settings")
    .select("course_id, enabled, created_at")
    .eq("enabled", true);

  let started = 0;
  for (const s of settings ?? []) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, chat_user_id, created_at")
      .eq("course_id", s.course_id)
      .eq("payment_status", "completed")
      .not("chat_user_id", "is", null)
      .gte("created_at", s.created_at)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!enrollments?.length) continue;

    const userIds = [...new Set(enrollments.map((e: any) => e.chat_user_id))];
    const { data: windows } = await supabase
      .from("course_access_windows")
      .select("user_id")
      .eq("course_id", s.course_id)
      .in("user_id", userIds);
    const has = new Set((windows ?? []).map((w: any) => w.user_id));

    for (const e of enrollments) {
      if (started >= limit) return started;
      if (has.has(e.chat_user_id)) continue;
      has.add(e.chat_user_id);
      await ensureAccessWindow(Number(e.chat_user_id), s.course_id, e.id);
      started++;
    }
  }
  return started;
}
