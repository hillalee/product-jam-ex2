drop table public.apod_explanations;

create table public.apod_explanations (
  date date primary key,
  title_he text not null,
  summary_he text not null,
  tags text[] not null,
  created_at timestamptz not null default now()
);

alter table public.apod_explanations enable row level security;
grant select, insert on public.apod_explanations to service_role;
