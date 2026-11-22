create table public.telegram_enrollment_report_access (
  telegram_user_id bigint primary key check (telegram_user_id > 0)
);

alter table public.telegram_enrollment_report_access enable row level security;
revoke all on table public.telegram_enrollment_report_access from public, anon, authenticated;
grant select, insert, delete on table public.telegram_enrollment_report_access to service_role;

create function public.get_telegram_enrollment_report(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_first_day date default null,
  p_last_day date default null
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select
      coalesce(p_start_at, p_first_day::timestamp at time zone 'Asia/Tehran') as starts_at,
      coalesce(p_end_at, (p_last_day + 1)::timestamp at time zone 'Asia/Tehran') as ends_at
  ),
  counts as (
    select e.course_id,
           count(*) as total,
           count(*) filter (where e.payment_status in ('success', 'completed')) as completed
    from public.enrollments e
    cross join bounds b
    where e.created_at >= b.starts_at and e.created_at < b.ends_at
    group by e.course_id
  ),
  report_courses as (
    select c.id, c.title,
           coalesce(n.total, 0) as total,
           coalesce(n.completed, 0) as completed
    from public.courses c
    left join counts n on n.course_id = c.id
  )
  select jsonb_build_object(
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'total', coalesce((select sum(total) from report_courses), 0),
    'completed', coalesce((select sum(completed) from report_courses), 0),
    'courses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', title,
        'total', total,
        'completed', completed
      ) order by total desc, title, id)
      from report_courses
    ), '[]'::jsonb)
  )
  from bounds b
  where b.starts_at < b.ends_at;
$$;

revoke all on function public.get_telegram_enrollment_report(timestamptz, timestamptz, date, date) from public, anon, authenticated;
grant execute on function public.get_telegram_enrollment_report(timestamptz, timestamptz, date, date) to service_role;
