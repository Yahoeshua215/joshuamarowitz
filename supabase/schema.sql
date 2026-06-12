-- Future Supabase schema for Josh Log migration
-- Run this when switching CONTENT_BACKEND=supabase

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null check (category in ('personal', 'work')),
  tags text[] not null default '{}',
  date_start date not null,
  date_end text not null,
  summary text not null,
  status text not null check (status in ('shipped', 'prototype', 'experiment')),
  links jsonb default '{}',
  images jsonb not null default '[]',
  case_study jsonb,
  featured boolean not null default false,
  sort_order integer not null default 0,
  source_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_category_idx on projects (category);
create index if not exists projects_date_start_idx on projects (date_start desc);
create index if not exists projects_tags_idx on projects using gin (tags);

-- Storage bucket: project-images (public read, authenticated write)
