# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

Database migrations via Drizzle Kit:
```bash
npx drizzle-kit generate   # Generate migration from schema changes
npx drizzle-kit migrate    # Apply migrations
npx drizzle-kit studio     # Open Drizzle Studio (DB GUI)
```

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Auth:** Clerk (`@clerk/nextjs`)
- **Database:** Neon PostgreSQL (serverless) + Drizzle ORM
- **Storage:** Vercel Blob (media uploads)
- **State/Data:** TanStack React Query (stale time: 60s, no refetch on focus)
- **UI:** Tailwind CSS 4, Radix UI, Lucide icons, Motion (animations), Sonner (toasts)
- **Themes:** `next-themes` with custom CSS theme files in `app/styles/themes/`

## Architecture

iGravity is a space-themed social platform (Twitter/X-like) with posts, comments, and user profiles.

### Route Groups

- `app/(auth)/` — Login/signup pages (Clerk catch-all routing)
- `app/(main)/` — Protected app routes with shared `BottomNav`
- `app/page.tsx` — Public landing page

**Route protection** is handled in `middleware.ts` via `clerkMiddleware`. `/home` and `/profile` are protected; authenticated users are redirected from `/` and auth routes to `/home`.

### Data Layer

All database operations are **server actions** in `lib/actions.ts` (`"use server"`). There is no separate API layer — components call these functions directly.

**Schema** (`lib/db/schema.ts`):
- `profiles` — synced from Clerk (`clerk_user_id` is the link)
- `posts` — belong to a profile, support text content, links, and media
- `comments` — belong to posts, support threading via `parent_id`

Foreign keys use cascade deletes throughout. The DB connection is in `lib/db/index.ts` using `DATABASE_URL` (pooled via pgbouncer) for most operations.

### Auth ↔ DB Sync

Clerk is the source of truth for auth. `upsertProfile()` in `lib/actions.ts` syncs Clerk user data to the `profiles` table. This must be called when a user first accesses the app.

### Component Organization

`components/gravity-components/` contains all app-specific components:
- `landing-page/` — Animated sections for the public landing page
- `cards/` — Card components (e.g., user suggestions)
- Post/comment flow: `Feed` → `PostCard` → `CommentSection` → `CommentItem`

`components/ui/` contains shadcn/ui primitives (do not edit these directly).

### Theming

Six theme flavors defined as CSS files in `app/styles/themes/`. The active theme is persisted in `localStorage`. Dark/light mode is handled separately via `next-themes`.

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — Neon pooled connection string
- `DATABASE_URL_UNPOOLED` — Direct connection (used for migrations)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token (the store **must be set to public access** in the Vercel dashboard; private stores will reject uploads)

## Media Uploads

Image uploads go through `app/api/upload/route.ts` using a server-side `put()` from `@vercel/blob`. The client sends a `FormData` POST to `/api/upload`; the route authenticates via Clerk, validates file type (JPEG/PNG/GIF/WebP) and size (≤5MB), then uploads to Vercel Blob and returns `{ url }`.

Do **not** use the `@vercel/blob/client` `upload()` / `handleUpload()` client-token flow — it was replaced with this server-side approach because the client token flow hangs silently on upload errors instead of throwing.
