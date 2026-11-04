create table public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  moves jsonb not null check (
    jsonb_typeof(moves) = 'array' and jsonb_array_length(moves) between 5 and 16
  ),
  result text not null check (result in ('X', 'O', 'draw')),
  created_at timestamptz not null default now()
);

create index games_owner_created_at on public.games (owner_id, created_at desc);
alter table public.games enable row level security;
revoke all on public.games from anon, authenticated;
grant select, insert on public.games to service_role;
