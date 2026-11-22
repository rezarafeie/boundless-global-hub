export type EnrollmentCountRow = { course_id: string | null };

// Fetch every page: PostgREST's row limit is not the total number of registrations.
export async function courseEnrollmentCounts(
  fetchPage: (from: number, to: number) => Promise<EnrollmentCountRow[]>,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const rows = await fetchPage(offset, offset + pageSize - 1);
    for (const row of rows) {
      if (row.course_id) counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
    }
    if (rows.length < pageSize) return counts;
  }
}