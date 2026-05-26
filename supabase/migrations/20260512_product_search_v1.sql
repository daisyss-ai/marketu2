create extension if not exists unaccent;
create extension if not exists pg_trgm;

alter table public.products
add column if not exists search_vector tsvector;

create or replace function public.products_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.subject, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.category, ''))), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.location, ''))), 'C') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.description, ''))), 'D');

  return new;
end;
$$;

drop trigger if exists products_search_vector_update on public.products;

create trigger products_search_vector_update
before insert or update of title, subject, category, location, description
on public.products
for each row
execute function public.products_search_vector_update();

update public.products
set search_vector =
  setweight(to_tsvector('portuguese', unaccent(coalesce(title, ''))), 'A') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(subject, ''))), 'A') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(category, ''))), 'B') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(location, ''))), 'C') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(description, ''))), 'D')
where search_vector is null;

create index if not exists products_search_vector_gin_idx
on public.products using gin (search_vector);

create index if not exists products_title_trgm_idx
on public.products using gin (title gin_trgm_ops);

create index if not exists products_subject_trgm_idx
on public.products using gin (subject gin_trgm_ops);

create index if not exists products_location_trgm_idx
on public.products using gin (location gin_trgm_ops);

create or replace function public.search_products_v1(
  p_search text default null,
  p_category text default null,
  p_condition text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_grade_level integer default null,
  p_subject text default null,
  p_product_type text default null,
  p_location text default null,
  p_min_rating numeric default null,
  p_sort text default 'newest',
  p_page integer default 1,
  p_limit integer default 12
)
returns table (
  id text,
  title text,
  category text,
  price numeric,
  description text,
  condition text,
  product_type text,
  grade_level integer,
  subject text,
  location text,
  seller text,
  user_id text,
  img text,
  rating numeric,
  reviews integer,
  created_at timestamptz,
  search_rank real,
  total_count bigint
)
language plpgsql
stable
security invoker
as $$
declare
  normalized_sort text := coalesce(nullif(trim(p_sort), ''), 'newest');
  normalized_page integer := greatest(coalesce(p_page, 1), 1);
  normalized_limit integer := least(greatest(coalesce(p_limit, 12), 1), 48);
  normalized_search text := nullif(trim(p_search), '');
  search_query tsquery;
begin
  if normalized_search is not null then
    search_query := websearch_to_tsquery('portuguese', unaccent(normalized_search));
  end if;

  return query
  with filtered as (
    select
      p.*,
      case
        when search_query is null then 0::real
        else ts_rank_cd(p.search_vector, search_query, 32)
      end as search_rank
    from public.products p
    where (p_category is null or p.category = p_category)
      and (p_condition is null or p.condition = p_condition)
      and (p_min_price is null or p.price >= p_min_price)
      and (p_max_price is null or p.price <= p_max_price)
      and (p_grade_level is null or p.grade_level = p_grade_level)
      and (p_subject is null or lower(p.subject) = lower(p_subject))
      and (p_product_type is null or p.product_type = p_product_type)
      and (p_location is null or lower(p.location) = lower(p_location))
      and (p_min_rating is null or coalesce(p.rating, 0) >= p_min_rating)
      and (
        search_query is null
        or p.search_vector @@ search_query
        or unaccent(coalesce(p.title, '')) ilike '%' || unaccent(normalized_search) || '%'
      )
  ),
  counted as (
    select
      filtered.*,
      count(*) over () as total_count
    from filtered
  )
  select
    counted.id::text,
    counted.title,
    counted.category,
    counted.price,
    counted.description,
    counted.condition,
    counted.product_type,
    counted.grade_level,
    counted.subject,
    counted.location,
    counted.seller,
    counted.user_id::text,
    counted.img,
    counted.rating,
    counted.reviews,
    counted.created_at,
    counted.search_rank,
    counted.total_count
  from counted
  order by
    case when normalized_sort = 'relevance' then counted.search_rank end desc nulls last,
    case when normalized_sort = 'rating' then counted.rating end desc nulls last,
    case when normalized_sort = 'price_asc' then counted.price end asc nulls last,
    case when normalized_sort = 'price_desc' then counted.price end desc nulls last,
    counted.created_at desc
  offset (normalized_page - 1) * normalized_limit
  limit normalized_limit;
end;
$$;
