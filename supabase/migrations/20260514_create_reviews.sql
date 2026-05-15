create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'order_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
  end if;
end
$$;

alter table public.products
  add column if not exists title text,
  add column if not exists img text,
  add column if not exists seller_id uuid references auth.users(id) on delete cascade,
  add column if not exists rating numeric(3,2) not null default 0,
  add column if not exists total_reviews integer not null default 0,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'name'
  ) then
    execute '
      update public.products
      set title = coalesce(title, name)
      where title is null
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image_url'
  ) then
    execute '
      update public.products
      set img = coalesce(img, image_url)
      where img is null
    ';
  end if;
end
$$;

alter table public.products
  alter column title set not null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.orders
  add column if not exists buyer_id uuid references auth.users(id) on delete cascade,
  add column if not exists seller_id uuid references auth.users(id) on delete cascade,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_title text not null,
  product_type public.product_type not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);

alter table public.order_items
  add column if not exists product_title text,
  add column if not exists product_type public.product_type;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  student_id text,
  full_name text not null default '',
  email text,
  phone text,
  course text,
  class text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists student_id text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists course text,
  add column if not exists class text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reviews_reviewer_product_order_unique unique (reviewer_id, product_id, order_id)
);

alter table public.reviews
  add column if not exists reviewer_id uuid references auth.users(id) on delete cascade,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'user_id'
  ) then
    execute '
      update public.orders
      set buyer_id = coalesce(buyer_id, user_id)
      where buyer_id is null
    ';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reviews'
      and column_name = 'user_id'
  ) then
    execute '
      update public.reviews
      set reviewer_id = coalesce(reviewer_id, user_id)
      where reviewer_id is null
    ';
  end if;
end
$$;

update public.order_items oi
set product_title = p.title
from public.products p
where oi.product_id = p.id
  and oi.product_title is null;

update public.order_items oi
set product_type = p.product_type
from public.products p
where oi.product_id = p.id
  and oi.product_type is null;

alter table public.orders
  alter column buyer_id set not null,
  alter column seller_id set not null;

alter table public.order_items
  alter column product_title set not null,
  alter column product_type set not null;

alter table public.reviews
  alter column reviewer_id set not null;

alter table public.reviews
  drop constraint if exists reviews_user_product_order_unique;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_reviewer_product_order_unique'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_reviewer_product_order_unique unique (reviewer_id, product_id, order_id);
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    student_id,
    full_name,
    email,
    phone,
    course,
    class,
    avatar_url,
    created_at,
    updated_at
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'student_id', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, nullif(new.raw_user_meta_data ->> 'email', '')),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'course', ''),
    nullif(new.raw_user_meta_data ->> 'class', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    coalesce(new.created_at, timezone('utc', now())),
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    student_id = excluded.student_id,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    course = excluded.course,
    class = excluded.class,
    avatar_url = excluded.avatar_url,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.can_review_order_product(
  p_reviewer_id uuid,
  p_order_id uuid,
  p_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    inner join public.order_items oi on oi.order_id = o.id
    where o.id = p_order_id
      and o.buyer_id = p_reviewer_id
      and o.status = 'delivered'
      and oi.product_id = p_product_id
  );
$$;

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created_reviews_profile on auth.users;
create trigger on_auth_user_created_reviews_profile
after insert or update of raw_user_meta_data on auth.users
for each row
execute function public.sync_profile_from_auth_user();

insert into public.profiles (
  id,
  student_id,
  full_name,
  email,
  phone,
  course,
  class,
  avatar_url,
  created_at,
  updated_at
)
select
  u.id,
  nullif(u.raw_user_meta_data ->> 'student_id', ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.email, nullif(u.raw_user_meta_data ->> 'email', '')),
  nullif(u.raw_user_meta_data ->> 'phone', ''),
  nullif(u.raw_user_meta_data ->> 'course', ''),
  nullif(u.raw_user_meta_data ->> 'class', ''),
  nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
  coalesce(u.created_at, timezone('utc', now())),
  timezone('utc', now())
from auth.users u
on conflict (id) do update
set
  student_id = excluded.student_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  course = excluded.course,
  class = excluded.class,
  avatar_url = excluded.avatar_url,
  updated_at = timezone('utc', now());

create index if not exists orders_buyer_id_status_idx
  on public.orders (buyer_id, status, created_at desc);

create index if not exists orders_seller_id_status_idx
  on public.orders (seller_id, status, created_at desc);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create index if not exists reviews_product_id_idx
  on public.reviews (product_id, created_at desc);

create index if not exists reviews_reviewer_id_idx
  on public.reviews (reviewer_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can read reviews" on public.reviews;
create policy "Authenticated users can read reviews"
on public.reviews
for select
to authenticated
using (true);

drop policy if exists "Users can create delivered-order reviews" on public.reviews;
create policy "Users can create delivered-order reviews"
on public.reviews
for insert
to authenticated
with check (
  auth.uid() = reviewer_id
  and public.can_review_order_product(auth.uid(), order_id, product_id)
);

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
on public.reviews
for update
to authenticated
using (auth.uid() = reviewer_id)
with check (auth.uid() = reviewer_id);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
on public.reviews
for delete
to authenticated
using (auth.uid() = reviewer_id);

grant execute on function public.can_review_order_product(uuid, uuid, uuid) to authenticated;
