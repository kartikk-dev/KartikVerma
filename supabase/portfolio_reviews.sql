-- Portfolio review carousel: run once in Supabase Dashboard > SQL Editor.
-- Public visitors can read approved reviews and submit new pending reviews.
-- Visitors cannot approve, edit, or delete reviews.

create extension if not exists pgcrypto;

create table if not exists public.portfolio_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null check (char_length(btrim(reviewer_name)) between 2 and 60),
  reviewer_role text check (reviewer_role is null or char_length(reviewer_role) <= 80),
  work_area text not null check (char_length(work_area) between 1 and 100),
  relationship text not null check (char_length(relationship) between 1 and 100),
  rating integer not null check (rating between 1 and 5),
  review_title text check (review_title is null or char_length(review_title) <= 90),
  review_text text not null check (char_length(btrim(review_text)) between 20 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists portfolio_reviews_status_created_at_idx
  on public.portfolio_reviews (status, created_at desc);

alter table public.portfolio_reviews enable row level security;

-- Least-privilege grants for the public portfolio section.
revoke all on table public.portfolio_reviews from anon, authenticated;
grant select, insert on table public.portfolio_reviews to anon, authenticated;

-- Remove any pre-existing policies on this table before creating the two intended policies.
-- This avoids an older permissive policy accidentally exposing pending reviews.
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

-- The website can read approved reviews only.
create policy "Public can read approved portfolio reviews"
  on public.portfolio_reviews
  for select
  to anon, authenticated
  using (status = 'approved');

-- The website may submit pending reviews only; no public approval path exists.
create policy "Public can submit pending portfolio reviews"
  on public.portfolio_reviews
  for insert
  to anon, authenticated
  with check (status = 'pending');

-- Explicitly deny public UPDATE and DELETE capabilities via table grants.
revoke update, delete on table public.portfolio_reviews from anon, authenticated;
