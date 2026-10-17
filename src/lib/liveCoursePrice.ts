import { supabase } from "@/integrations/supabase/client";
import { TetherlandService } from "@/lib/tetherlandService";

/** Returns the real current Toman price of a course (live USD rate for dollar-priced courses). */
export async function resolveLivePrice(course: { price?: number | null; use_dollar_price?: boolean | null; usd_price?: number | null }): Promise<number> {
  const stored = Number(course.price || 0);
  if (course.use_dollar_price && course.usd_price) {
    try {
      return Math.round(await TetherlandService.convertUSDToIRR(Number(course.usd_price)));
    } catch (e) {
      console.warn("Live rate unavailable, using stored price", e);
    }
  }
  return stored;
}

export async function fetchLiveCoursePrice(slug: string): Promise<{ id: string; price: number } | null> {
  const { data } = await supabase
    .from("courses")
    .select("id, price, use_dollar_price, usd_price")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, price: await resolveLivePrice(data as any) };
}
