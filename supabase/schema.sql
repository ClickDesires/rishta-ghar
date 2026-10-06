-- Rishta Ghar database setup
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again; it only creates what is missing and replaces functions/policies.
--
-- Who sees what
--   • Signed-in members: published profiles (first name only), their own application and their own interests.
--   • Bureau staff (rows in public.staff): everything, including full names, phones, guardians and private photos.
--   • Signed-out visitors: only the bureau's contact details.

-- ───────────────────────── staff ─────────────────────────
create table if not exists public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff where user_id = auth.uid()) $$;

-- ───────────────────────── bureau settings ─────────────────────────
create table if not exists public.settings (
  id    int primary key default 1 check (id = 1),
  phone text not null default '',
  hours text not null default '',
  addr  text not null default ''
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ───────────────────────── profile ids: RG-1001… brides, RG-2001… grooms ─────────────────────────
create sequence if not exists public.bride_pid_seq start 1001;
create sequence if not exists public.groom_pid_seq start 2001;

create or replace function public.next_pid(g text)
returns text
language sql volatile security definer set search_path = public
as $$ select 'RG-' || (case when g = 'F' then nextval('public.bride_pid_seq') else nextval('public.groom_pid_seq') end)::text $$;

-- ───────────────────────── applications (one per account, private) ─────────────────────────
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  full_name     text not null check (length(trim(full_name)) > 0),
  phone         text not null check (length(trim(phone)) > 0),
  guardian      text not null default '',
  gender        text not null check (gender in ('F', 'M')),
  dob           date not null,
  height_in     int  check (height_in between 48 and 90),
  marital       text not null default 'Never married',
  caste         text not null default '',
  mother_tongue text not null default '',
  sect          text not null default 'Sunni',
  practice      text not null default 'Practising',
  salah         text not null default 'Prays 5 times',
  hijab         text not null default '',
  education     text not null default 'Bachelor''s',
  degree        text not null default '',
  profession    text not null check (length(trim(profession)) > 0),
  city          text not null check (length(trim(city)) > 0),
  father        text not null default '',
  siblings      text not null default '',
  about         text not null default '' check (length(about) <= 2000),
  photo_path    text,                       -- in the private-photos bucket
  photo_private boolean not null default true,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected', 'removal', 'removed')),
  pid           text,
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz
);

-- Members can only submit or resubmit (status → pending) or ask for removal; staff decide everything else.
create or replace function public.applications_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.dob > (current_date - interval '18 years') then
    raise exception 'Profiles can only be registered for people aged 18 or over';
  end if;
  if public.is_staff() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.pid := null;
    new.reviewed_at := null;
    new.submitted_at := now();
  else
    new.user_id := old.user_id;
    new.pid := old.pid;
    new.reviewed_at := old.reviewed_at;
    if new.status = 'removal' and old.status = 'approved' then
      new.submitted_at := old.submitted_at;
    else
      new.status := 'pending';
      new.submitted_at := now();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists applications_guard on public.applications;
create trigger applications_guard before insert or update on public.applications
  for each row execute function public.applications_guard();

-- ───────────────────────── published profiles (what members browse) ─────────────────────────
create table if not exists public.profiles (
  pid            text primary key,
  application_id uuid references public.applications (id) on delete set null,
  first_name     text not null,
  gender         text not null check (gender in ('F', 'M')),
  dob            date not null,
  height_in      int,
  marital        text not null default '',
  caste          text not null default '',
  mother_tongue  text not null default '',
  sect           text not null default '',
  practice       text not null default '',
  salah          text not null default '',
  hijab          text not null default '',
  education      text not null default '',
  degree         text not null default '',
  profession     text not null default '',
  city           text not null default '',
  father         text not null default '',
  siblings       text not null default '',
  about          text not null default '',
  photo_path     text,                      -- in the public-photos bucket; null when private or none
  photo_private  boolean not null default false,
  verified       boolean not null default false,
  hidden         boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ───────────────────────── vault: bureau-only details for each published profile ─────────────────────────
create table if not exists public.vault (
  pid                text primary key references public.profiles (pid) on delete cascade,
  user_id            uuid references auth.users (id) on delete set null,
  full_name          text not null,
  phone              text not null default '',
  guardian           text not null default '',
  private_photo_path text                   -- in the private-photos bucket
);

-- ───────────────────────── interests ─────────────────────────
create table if not exists public.interests (
  id         bigint generated always as identity primary key,
  from_user  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pid        text not null references public.profiles (pid) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_user, pid)
);

create or replace function public.interests_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_staff() then
    new.from_user := auth.uid();
    new.status := 'pending';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists interests_guard on public.interests;
create trigger interests_guard before insert or update on public.interests
  for each row execute function public.interests_guard();

-- ───────────────────────── row level security ─────────────────────────
alter table public.staff        enable row level security;
alter table public.settings     enable row level security;
alter table public.applications enable row level security;
alter table public.profiles     enable row level security;
alter table public.vault        enable row level security;
alter table public.interests    enable row level security;

drop policy if exists "see own staff row" on public.staff;
create policy "see own staff row" on public.staff for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "anyone reads settings" on public.settings;
create policy "anyone reads settings" on public.settings for select to anon, authenticated using (true);
drop policy if exists "staff edit settings" on public.settings;
create policy "staff edit settings" on public.settings for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read own or staff" on public.applications;
create policy "read own or staff" on public.applications for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists "create own" on public.applications;
create policy "create own" on public.applications for insert to authenticated
  with check (user_id = auth.uid() or public.is_staff());
drop policy if exists "update own or staff" on public.applications;
create policy "update own or staff" on public.applications for update to authenticated
  using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
drop policy if exists "staff delete" on public.applications;
create policy "staff delete" on public.applications for delete to authenticated using (public.is_staff());

drop policy if exists "members read live profiles" on public.profiles;
create policy "members read live profiles" on public.profiles for select to authenticated
  using (not hidden or public.is_staff());
drop policy if exists "staff manage profiles" on public.profiles;
create policy "staff manage profiles" on public.profiles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff only" on public.vault;
create policy "staff only" on public.vault for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read own or staff" on public.interests;
create policy "read own or staff" on public.interests for select to authenticated
  using (from_user = auth.uid() or public.is_staff());
drop policy if exists "registered members send" on public.interests;
create policy "registered members send" on public.interests for insert to authenticated
  with check (
    public.is_staff()
    or (from_user = auth.uid() and exists (select 1 from public.applications a where a.user_id = auth.uid()))
  );
drop policy if exists "staff update" on public.interests;
create policy "staff update" on public.interests for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "withdraw own pending" on public.interests;
create policy "withdraw own pending" on public.interests for delete to authenticated
  using ((from_user = auth.uid() and status = 'pending') or public.is_staff());

-- ───────────────────────── staff actions ─────────────────────────
create or replace function public.approve_application(app_id uuid, public_photo text default null)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  a public.applications;
  new_pid text;
begin
  if not public.is_staff() then raise exception 'Only bureau staff can approve profiles'; end if;
  select * into a from public.applications where id = app_id for update;
  if not found then raise exception 'Application not found'; end if;
  new_pid := coalesce(a.pid, public.next_pid(a.gender));

  insert into public.profiles as p (
    pid, application_id, first_name, gender, dob, height_in, marital, caste, mother_tongue, sect, practice, salah, hijab,
    education, degree, profession, city, father, siblings, about, photo_path, photo_private, updated_at)
  values (
    new_pid, a.id, split_part(trim(a.full_name), ' ', 1), a.gender, a.dob, a.height_in, a.marital, a.caste, a.mother_tongue,
    a.sect, a.practice, a.salah, case when a.gender = 'F' then a.hijab else '' end, a.education, a.degree, a.profession,
    a.city, a.father, a.siblings, a.about, public_photo, (a.photo_path is not null and a.photo_private), now())
  on conflict (pid) do update set
    application_id = excluded.application_id, first_name = excluded.first_name, gender = excluded.gender, dob = excluded.dob,
    height_in = excluded.height_in, marital = excluded.marital, caste = excluded.caste, mother_tongue = excluded.mother_tongue,
    sect = excluded.sect, practice = excluded.practice, salah = excluded.salah, hijab = excluded.hijab,
    education = excluded.education, degree = excluded.degree, profession = excluded.profession, city = excluded.city,
    father = excluded.father, siblings = excluded.siblings, about = excluded.about, photo_path = excluded.photo_path,
    photo_private = excluded.photo_private, updated_at = now();

  insert into public.vault (pid, user_id, full_name, phone, guardian, private_photo_path)
  values (new_pid, a.user_id, a.full_name, a.phone, a.guardian, a.photo_path)
  on conflict (pid) do update set
    user_id = excluded.user_id, full_name = excluded.full_name, phone = excluded.phone,
    guardian = excluded.guardian, private_photo_path = excluded.private_photo_path;

  update public.applications set status = 'approved', pid = new_pid, reviewed_at = now() where id = a.id;
  return new_pid;
end $$;

-- For families who come to the office or phone in: staff publish directly, no application needed.
create or replace function public.staff_add_profile(p jsonb, public_photo text default null, private_photo text default null)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  r public.applications;
  new_pid text;
begin
  if not public.is_staff() then raise exception 'Only bureau staff can add profiles'; end if;
  r := jsonb_populate_record(null::public.applications, p);
  if r.full_name is null or r.gender is null or r.dob is null then raise exception 'Name, gender and date of birth are required'; end if;
  if r.dob > (current_date - interval '18 years') then raise exception 'Profiles can only be registered for people aged 18 or over'; end if;
  new_pid := public.next_pid(r.gender);

  insert into public.profiles (
    pid, first_name, gender, dob, height_in, marital, caste, mother_tongue, sect, practice, salah, hijab,
    education, degree, profession, city, father, siblings, about, photo_path, photo_private)
  values (
    new_pid, split_part(trim(r.full_name), ' ', 1), r.gender, r.dob, r.height_in, coalesce(r.marital, ''), coalesce(r.caste, ''),
    coalesce(r.mother_tongue, ''), coalesce(r.sect, ''), coalesce(r.practice, ''), coalesce(r.salah, ''),
    case when r.gender = 'F' then coalesce(r.hijab, '') else '' end, coalesce(r.education, ''), coalesce(r.degree, ''),
    coalesce(r.profession, ''), coalesce(r.city, ''), coalesce(r.father, ''), coalesce(r.siblings, ''), coalesce(r.about, ''),
    public_photo, (private_photo is not null and public_photo is null));

  insert into public.vault (pid, full_name, phone, guardian, private_photo_path)
  values (new_pid, r.full_name, coalesce(r.phone, ''), coalesce(r.guardian, ''), private_photo);
  return new_pid;
end $$;

create or replace function public.remove_profile(target text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_staff() then raise exception 'Only bureau staff can remove profiles'; end if;
  update public.applications set status = 'removed', reviewed_at = now() where pid = target;
  delete from public.profiles where pid = target;
end $$;

revoke all on function public.next_pid(text) from public, anon, authenticated;
revoke all on function public.approve_application(uuid, text) from public, anon;
revoke all on function public.staff_add_profile(jsonb, text, text) from public, anon;
revoke all on function public.remove_profile(text) from public, anon;
grant execute on function public.approve_application(uuid, text) to authenticated;
grant execute on function public.staff_add_profile(jsonb, text, text) to authenticated;
grant execute on function public.remove_profile(text) to authenticated;
grant execute on function public.is_staff() to anon, authenticated;

-- ───────────────────────── photo storage ─────────────────────────
-- public-photos:  photos shown on published profiles (staff upload them on approval)
-- private-photos: what members upload, in a folder named after their user id; only they and staff can open them
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-photos', 'public-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
       ('private-photos', 'private-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "staff manage public photos" on storage.objects;
create policy "staff manage public photos" on storage.objects for all to authenticated
  using (bucket_id = 'public-photos' and public.is_staff())
  with check (bucket_id = 'public-photos' and public.is_staff());

drop policy if exists "own private photos" on storage.objects;
create policy "own private photos" on storage.objects for all to authenticated
  using (bucket_id = 'private-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()))
  with check (bucket_id = 'private-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

-- ───────────────────────── make yourself staff ─────────────────────────
-- After you sign in to the app once, run this with your own email:
--   insert into public.staff (user_id) select id from auth.users where email = 'you@example.com';
