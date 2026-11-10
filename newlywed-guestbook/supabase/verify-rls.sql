-- Read-only check for the tables used by the guestbook.
-- Guest submissions are stored in public.submissions; this app has no public.guests table.
with expected(table_name) as (
  values
    ('submissions'),
    ('music_tracks'),
    ('photos'),
    ('voice_messages'),
    ('site_settings'),
    ('guests')
)
select
  expected.table_name,
  relation.oid is not null as table_exists,
  coalesce(relation.relrowsecurity, false) as rls_enabled,
  coalesce(relation.relforcerowsecurity, false) as rls_forced,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', policy.policyname,
        'command', policy.cmd,
        'roles', policy.roles,
        'using', policy.qual,
        'with_check', policy.with_check
      )
    ) filter (where policy.policyname is not null),
    '[]'::jsonb
  ) as policies
from expected
left join pg_class as relation
  on relation.relname = expected.table_name
  and relation.relnamespace = 'public'::regnamespace
  and relation.relkind in ('r', 'p')
left join pg_policies as policy
  on policy.schemaname = 'public'
  and policy.tablename = expected.table_name
group by expected.table_name, relation.oid, relation.relrowsecurity, relation.relforcerowsecurity
order by expected.table_name;
