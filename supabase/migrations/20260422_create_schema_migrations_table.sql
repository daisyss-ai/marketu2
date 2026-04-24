-- Some Supabase Dashboard views expect this table to exist.
-- If you are not using the Supabase CLI migrations workflow, it may be missing.

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  inserted_at timestamptz not null default now()
);

