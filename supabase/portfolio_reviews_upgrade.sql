-- Idempotent upgrade for an existing public.portfolio_reviews table.
-- Run in Supabase Dashboard > SQL Editor after reviewing your existing data.
-- Legacy work_area, relationship, and rating values are retained when present,
-- but no longer required or accepted from public review submissions.

create extension if not exists pgcrypto;

alter table public.portfolio_reviews
  add column if not exists publication_consent boolean not null default false,
  add column if not exists publication_consent_at timestamptz;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'portfolio_reviews'
      and column_name = 'work_area'
  ) then
    alter table public.portfolio_reviews alter column work_area drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'portfolio_reviews'
      and column_name = 'relationship'
  ) then
    alter table public.portfolio_reviews alter column relationship drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'portfolio_reviews'
      and column_name = 'rating'
  ) then
    alter table public.portfolio_reviews alter column rating drop not null;
  end if;
end
$$;

-- Remove only legacy checks that conflict with the current form contract.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.portfolio_reviews'::regclass
      and contype = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%work_area%'
        or pg_get_constraintdef(oid) ilike '%relationship%'
        or pg_get_constraintdef(oid) ilike '%rating%'
        or (
          pg_get_constraintdef(oid) ilike '%review_text%'
          and pg_get_constraintdef(oid) ilike '%1200%'
        )
      )
  loop
    execute format(
      'alter table public.portfolio_reviews drop constraint %I',
      constraint_record.conname
    );
  end loop;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.portfolio_reviews'::regclass
      and conname = 'portfolio_reviews_review_text_length_check'
  ) then
    alter table public.portfolio_reviews
      add constraint portfolio_reviews_review_text_length_check
      check (char_length(btrim(review_text)) between 20 and 1000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.portfolio_reviews'::regclass
      and conname = 'portfolio_reviews_consent_timestamp_check'
  ) then
    alter table public.portfolio_reviews
      add constraint portfolio_reviews_consent_timestamp_check
      check (
        (publication_consent is false and publication_consent_at is null)
        or (publication_consent is true and publication_consent_at is not null)
      );
  end if;
end
$$;

create index if not exists portfolio_reviews_status_created_at_idx
  on public.portfolio_reviews (status, created_at desc);

alter table public.portfolio_reviews enable row level security;

revoke all on table public.portfolio_reviews from anon, authenticated;
grant select, insert on table public.portfolio_reviews to anon, authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_reviews'
  loop
    execute format('drop policy %I on public.portfolio_reviews', policy_record.policyname);
  end loop;
end
$$;

create policy "Public can read approved portfolio reviews"
  on public.portfolio_reviews
  for select
  to anon, authenticated
  using (status = 'approved');

create policy "Public can submit pending portfolio reviews"
  on public.portfolio_reviews
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and publication_consent is true
    and publication_consent_at is not null
  );

revoke update, delete on table public.portfolio_reviews from anon, authenticated;
