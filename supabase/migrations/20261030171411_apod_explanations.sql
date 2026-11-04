create table public.apod_explanations (
  date date primary key check (date >= '1995-06-16'),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  title_he text,
  summary_he text,
  tags text[],
  created_at timestamptz not null default now(),
  check (
    (status = 'ready' and title_he is not null and btrim(title_he) <> ''
      and summary_he is not null and btrim(summary_he) <> ''
      and tags is not null and cardinality(tags) between 1 and 5
      and array_position(tags, null) is null
      and tags <@ array['galaxy', 'planet', 'nebula', 'earth', 'sun', 'moon', 'star', 'spaceflight']::text[])
    or (status <> 'ready' and title_he is null and summary_he is null and tags is null)
  )
);

alter table public.apod_explanations enable row level security;
revoke all on public.apod_explanations from anon, authenticated;
grant select, insert, update on public.apod_explanations to service_role;
