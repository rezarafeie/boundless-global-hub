import { describe, it as test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { uniqueCourseLeads } from './uniqueCourseLeads';

describe('one lead per person and course', () => {
  test('four completed Boundless Taste enrollments produce one lead', () => {
    const rows = Array.from({ length: 4 }, (_, i) => ({ id: String(i), course_id: 'b97c19b7-98d3-4891-b00f-93bfb7711487', chat_user_id: 12, payment_status: 'completed', payment_amount: 0 }));
    deepStrictEqual(uniqueCourseLeads(rows).map(r => r.id), ['0']);
  });
  test('normalizes Iranian phone formats and Persian digits without an account id', () => {
    const rows = ['09123456789', '+98 912 345 6789', '۹۱۲۳۴۵۶۷۸۹', '00989123456789'].map((phone, i) => ({ id: String(i), course_id: 'taste', phone }));
    strictEqual(uniqueCourseLeads(rows).length, 1);
  });
  test('different courses and different known users remain separate', () => {
    strictEqual(uniqueCourseLeads([{ id: 'a', course_id: 'taste', chat_user_id: 1 }, { id: 'b', course_id: 'other', chat_user_id: 1 }, { id: 'c', course_id: 'taste', chat_user_id: 2 }]).length, 3);
  });
  test('keeps an assigned enrollment rather than an unassigned repeat', () => {
    deepStrictEqual(uniqueCourseLeads([{ id: 'a', chat_user_id: 1, is_assigned: false }, { id: 'b', chat_user_id: 1, is_assigned: true }]).map(r => r.id), ['b']);
  });
  test('unidentified records are never merged', () => {
    strictEqual(uniqueCourseLeads([{ id: 'a' }, { id: 'b' }]).length, 2);
  });
});