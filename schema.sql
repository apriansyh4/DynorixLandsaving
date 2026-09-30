-- =====================================================================
-- DinorixLand-Sal — skema database Supabase
-- MODE: SATU AKUN UTAMA (hanya pemilik yang bisa masuk & melihat data)
--
-- CARA PAKAI:
--   1. Ganti email di bagian "AKUN UTAMA" paling bawah file ini
--      (cari tulisan GANTI_DENGAN_EMAIL_KAMU) dengan email akun yang sudah
--      ada di Supabase: Authentication -> Users.
--   2. Salin SELURUH file ini ke SQL Editor -> New query -> Run.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- ---------- Profil pengguna ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------- Transaksi ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text not null check (char_length(description) between 1 and 80),
  amount bigint not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- ---------- Jatah (budget) bulanan per kategori ----------
create table if not exists public.budgets (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null,
  monthly_limit bigint not null check (monthly_limit >= 0),
  primary key (user_id, category)
);

-- ---------- Sarang tabungan (1 target per pengguna) ----------
create table if not exists public.savings_goals (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'Tabungan Impian' check (char_length(name) between 1 and 60),
  target bigint not null default 5000000 check (target > 0),
  saved bigint not null default 0 check (saved >= 0),
  updated_at timestamptz not null default now()
);

-- ---------- Pemilik aplikasi (akun utama) ----------
create table if not exists public.app_owner (
  id boolean primary key default true check (id),   -- hanya boleh 1 baris
  user_id uuid not null references auth.users (id) on delete cascade
);
alter table public.app_owner enable row level security;  -- tanpa policy: tidak bisa dibaca langsung

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.app_owner where user_id = auth.uid());
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- ---------- Row Level Security: hanya akun utama, dan hanya datanya sendiri ----------
alter table public.profiles      enable row level security;
alter table public.transactions  enable row level security;
alter table public.budgets       enable row level security;
alter table public.savings_goals enable row level security;

drop policy if exists "profil milik sendiri - baca" on public.profiles;
create policy "profil milik sendiri - baca" on public.profiles
  for select to authenticated using ((select auth.uid()) = id and (select public.is_owner()));
drop policy if exists "profil milik sendiri - ubah" on public.profiles;
create policy "profil milik sendiri - ubah" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id and (select public.is_owner()))
  with check ((select auth.uid()) = id and (select public.is_owner()));
drop policy if exists "profil milik sendiri - buat" on public.profiles;
create policy "profil milik sendiri - buat" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id and (select public.is_owner()));

drop policy if exists "transaksi milik sendiri" on public.transactions;
create policy "transaksi milik sendiri" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id and (select public.is_owner()))
  with check ((select auth.uid()) = user_id and (select public.is_owner()));

drop policy if exists "budget milik sendiri" on public.budgets;
create policy "budget milik sendiri" on public.budgets
  for all to authenticated
  using ((select auth.uid()) = user_id and (select public.is_owner()))
  with check ((select auth.uid()) = user_id and (select public.is_owner()));

drop policy if exists "tabungan milik sendiri" on public.savings_goals;
create policy "tabungan milik sendiri" on public.savings_goals
  for all to authenticated
  using ((select auth.uid()) = user_id and (select public.is_owner()))
  with check ((select auth.uid()) = user_id and (select public.is_owner()));

-- ---------- Fungsi: total pemasukan & pengeluaran sepanjang waktu ----------
create or replace function public.get_totals()
returns table (total_income bigint, total_expense bigint)
language sql stable security invoker set search_path = ''
as $$
  select
    coalesce(sum(amount) filter (where type = 'income'), 0)::bigint,
    coalesce(sum(amount) filter (where type = 'expense'), 0)::bigint
  from public.transactions
  where user_id = auth.uid();
$$;

-- ---------- Fungsi: setor (+) / ambil (-) tabungan secara atomik ----------
create or replace function public.adjust_savings(delta bigint)
returns public.savings_goals
language plpgsql security invoker set search_path = ''
as $$
declare
  g public.savings_goals;
begin
  update public.savings_goals
     set saved = saved + delta, updated_at = now()
   where user_id = auth.uid()
  returning * into g;
  if not found then
    raise exception 'Target tabungan belum dibuat';
  end if;
  return g;
end;
$$;

revoke all on function public.get_totals() from public, anon;
revoke all on function public.adjust_savings(bigint) from public, anon;
grant execute on function public.get_totals() to authenticated;
grant execute on function public.adjust_savings(bigint) to authenticated;

-- ---------- Trigger: siapkan data awal saat pengguna baru mendaftar ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.budgets (user_id, category, monthly_limit) values
    (new.id, 'makan',     1500000),
    (new.id, 'transport',  600000),
    (new.id, 'belanja',    800000),
    (new.id, 'tagihan',   1200000),
    (new.id, 'hiburan',    400000)
  on conflict do nothing;

  insert into public.savings_goals (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- AKUN UTAMA
-- Ganti email di bawah dengan email akun yang SUDAH ADA di
-- Authentication -> Users, lalu jalankan file ini.
-- Blok ini juga menyiapkan profil, jatah bulanan, dan sarang tabungan
-- untuk akun tersebut (karena akunnya dibuat sebelum trigger ada).
-- =====================================================================
do $$
declare
  owner_email text := 'GANTI_DENGAN_EMAIL_KAMU@gmail.com';   -- <<< GANTI DI SINI
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(trim(owner_email));
  if uid is null then
    raise exception 'Akun "%" tidak ditemukan di Authentication -> Users. Periksa ejaan emailnya.', owner_email;
  end if;

  insert into public.app_owner (id, user_id) values (true, uid)
  on conflict (id) do update set user_id = excluded.user_id;

  insert into public.profiles (id, display_name)
  values (uid, split_part(owner_email, '@', 1))
  on conflict (id) do nothing;

  insert into public.budgets (user_id, category, monthly_limit) values
    (uid, 'makan',     1500000),
    (uid, 'transport',  600000),
    (uid, 'belanja',    800000),
    (uid, 'tagihan',   1200000),
    (uid, 'hiburan',    400000)
  on conflict do nothing;

  insert into public.savings_goals (user_id) values (uid)
  on conflict (user_id) do nothing;

  raise notice 'Akun utama DinorixLand-Sal: % (%)', owner_email, uid;
end;
$$;

-- Cek hasil (opsional): harus menampilkan email akun utama
-- select u.email from public.app_owner o join auth.users u on u.id = o.user_id;
