/// <reference types="node" />
import { it as test } from 'node:test';
import { deepStrictEqual, rejects } from 'node:assert';
import { courseEnrollmentCounts } from './courseEnrollmentCounts';

test('dashboard counts all 1001 actual registration records instead of the first 1000', async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({ course_id: i < 900 ? 'taste' : 'iran' }));
  const pages: number[][] = [];
  const counts = await courseEnrollmentCounts(async (from, to) => {
    pages.push([from, to]);
    return rows.slice(from, to + 1);
  });
  deepStrictEqual(counts, { taste: 900, iran: 101 });
  deepStrictEqual(pages, [[0, 999], [1000, 1999]]);
});

test('an exactly full page is followed by another query before returning complete counts', async () => {
  const rows = Array.from({ length: 2000 }, () => ({ course_id: 'taste' }));
  const pages: number[] = [];
  deepStrictEqual(await courseEnrollmentCounts(async (from, to) => {
    pages.push(from);
    return rows.slice(from, to + 1);
  }), { taste: 2000 });
  deepStrictEqual(pages, [0, 1000, 2000]);
});

test('a failed later page never returns a partial count as a complete report', async () => {
  await rejects(courseEnrollmentCounts(async (from) => {
    if (from > 0) throw new Error('query failed');
    return Array.from({ length: 1000 }, () => ({ course_id: 'taste' }));
  }), /query failed/);
});