# Josh Log

A changelog-style portfolio for personal experiments and product design work. Built local-first with a file-based content store, designed to migrate to Vercel + Supabase later.

## Features

- Reverse-chronological timeline with expand/collapse entries
- Personal vs Work segmentation with tag filtering
- Image carousels, links, and Problem/Solution/Outcome case studies
- Dark and light mode (Linear-inspired, minimal design)
- Password-protected admin for creating and editing entries

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin is at `/admin` (default password in `.env.local`).

## Content structure

Each project lives in `content/projects/<slug>/`:

- `entry.json` — metadata, summary, tags, images, links
- `case-study.md` — optional Problem / Solution / Outcome narrative

Images are stored in `public/projects/<slug>/`.

## Scripts

```bash
npm run inventory   # Scan ~/ for candidate projects
npm run backfill    # Generate seed content from personal projects
npm run screenshots   # Capture static Playwright screenshots
npm run capture-tours # Record scripted WebM walkthroughs for runnable apps
```

## Future migration

Set `CONTENT_BACKEND=supabase` and configure Supabase env vars. Schema lives in `supabase/schema.sql`. The `SupabaseContentStore` stub is ready for implementation.

## Stack

Next.js 16 · TypeScript · Tailwind CSS · next-themes · zod · react-markdown
