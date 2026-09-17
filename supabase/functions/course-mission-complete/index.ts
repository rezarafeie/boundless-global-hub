import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { completeMission, buildStatus } from "../_shared/gamification.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { userId, lessonId, courseId } = await req.json();
    const uid = Number(userId);
    if (!uid || !lessonId) return json({ success: false, error: "userId و lessonId الزامی است" }, 400);

    let cid = courseId as string | undefined;
    if (!cid) {
      const { data } = await supabase.from("course_lessons").select("course_id").eq("id", lessonId).maybeSingle();
      cid = data?.course_id;
    }
    if (!cid) return json({ success: false, error: "دوره یافت نشد" }, 404);

    const result = await completeMission(uid, cid, lessonId);
    if (!result) return json({ success: true, enabled: false });

    const status = await buildStatus(uid, cid);
    return json({ success: true, ...result, status });
  } catch (e) {
    return json({ success: false, error: String((e as Error).message ?? e) }, 500);
  }
});
