-- Run once in your Supabase SQL editor. Safe to rerun; does not erase menu data.
begin;

create table if not exists public.menu_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.menu_admins enable row level security;
revoke all on public.menu_admins from anon, authenticated;
grant select on public.menu_admins to authenticated;
drop policy if exists "Staff can see their own membership" on public.menu_admins;
create policy "Staff can see their own membership" on public.menu_admins
  for select to authenticated using (user_id = (select auth.uid()));
-- No client-side insert/update/delete policy: provision users through the dashboard.

create table if not exists public.menu_config (
  id integer primary key check (id = 1),
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and data ?& array['schemaVersion', 'items', 'categories', 'settings']
    and data @> '{"schemaVersion":1}'::jsonb
    and jsonb_typeof(data->'items') = 'array'
    and jsonb_typeof(data->'categories') = 'array'
    and jsonb_typeof(data->'settings') = 'object'
  ),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);
alter table public.menu_config enable row level security;
revoke all on public.menu_config from anon, authenticated;
grant select on public.menu_config to anon, authenticated;
grant insert, update on public.menu_config to authenticated;
drop policy if exists "Public display can read menu" on public.menu_config;
create policy "Public display can read menu" on public.menu_config for select to anon, authenticated using (true);
drop policy if exists "Staff can initialise menu" on public.menu_config;
create policy "Staff can initialise menu" on public.menu_config for insert to authenticated
  with check (exists(select 1 from public.menu_admins where user_id = (select auth.uid())));
drop policy if exists "Staff can publish menu" on public.menu_config;
create policy "Staff can publish menu" on public.menu_config for update to authenticated
  using (exists(select 1 from public.menu_admins where user_id = (select auth.uid())))
  with check (exists(select 1 from public.menu_admins where user_id = (select auth.uid())));

create or replace function public.menu_config_revision() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.version <> old.version + 1 then
    raise exception 'Menu version must increase by exactly one';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists menu_config_revision on public.menu_config;
create trigger menu_config_revision before update on public.menu_config
  for each row execute function public.menu_config_revision();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Staff can upload menu images" on storage.objects;
create policy "Staff can upload menu images" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and exists(select 1 from public.menu_admins where user_id = (select auth.uid())));
-- Public bucket serves images. Files use unique names and cannot be overwritten by clients.

commit;

-- NEXT: create an email/password user in Authentication > Users (auto-confirm email).
-- Copy the user's UUID, replace the example below, and run the INSERT separately:
-- insert into public.menu_admins (user_id) values ('YOUR-USER-UUID') on conflict do nothing;
-- Open /admin, sign in, then publish the initial menu.
-- To revoke a user's editing access, remove its menu_admins row in the SQL editor.
