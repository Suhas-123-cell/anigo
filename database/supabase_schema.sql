-- =============================================
-- AniGO Supabase (PostgreSQL) Schema
-- Run in Supabase SQL Editor
-- =============================================

-- Enable UUID generation helpers (safe if already enabled)
create extension if not exists pgcrypto;

-- Users table
create table if not exists public.users (
    id bigint generated always as identity primary key,
    username text not null unique,
    password_hash text not null,
    level integer not null default 1,
    total_xp integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_users_username on public.users (username);
create index if not exists idx_users_level on public.users (level);

-- Inventory table
create table if not exists public.inventory (
    id bigint generated always as identity primary key,
    user_id bigint not null references public.users(id) on delete cascade,
    character_name text not null,
    rarity text not null default 'common',
    caught_at timestamptz not null default now()
);

create index if not exists idx_inventory_user_id on public.inventory (user_id);
create index if not exists idx_inventory_character on public.inventory (character_name);

-- Optional spawns table (current backend uses in-memory spawns)
create table if not exists public.spawns (
    id text primary key default gen_random_uuid()::text,
    character_name text not null,
    rarity text,
    latitude double precision not null,
    longitude double precision not null,
    expires_at timestamptz,
    created_at timestamptz not null default now()
);

-- Keep updated_at fresh on updates
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- Test data (password: test123)
insert into public.users (username, password_hash)
values
  ('player1', '$2a$10$X7jzJ.9BqQ8xVq9Zq9Zq9.OZq9Zq9Zq9Zq9Zq9Zq9Zq9Zq9Zq9Zq9Zq'),
  ('testuser', '$2a$10$X7jzJ.9BqQ8xVq9Zq9Zq9.OZq9Zq9Zq9Zq9Zq9Zq9Zq9Zq9Zq9Zq9Zq')
on conflict (username) do nothing;

insert into public.inventory (user_id, character_name, rarity)
select u.id, x.character_name, x.rarity
from (
  values
    ('player1', 'Naruto Uzumaki', 'rare'),
    ('player1', 'Goku', 'rare'),
    ('testuser', 'Luffy', 'legendary')
) as x(username, character_name, rarity)
join public.users u on u.username = x.username
on conflict do nothing;
