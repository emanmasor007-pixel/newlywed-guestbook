insert into public.site_settings (key, value, updated_at)
values ('hijri_date', '10 Rejab 1448 H', now())
on conflict (key) do update
set value = excluded.value,
    updated_at = excluded.updated_at;
