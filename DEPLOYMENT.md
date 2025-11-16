## Vercel Deployment Guide

TrimFinder already builds cleanly on Vercel, but a few production considerations are required before you click “Deploy”.

### 1. Use a Production Database

SQLite files (e.g., `prisma/dev.db`) live on the filesystem and will not persist on Vercel’s serverless platform. Pick a hosted database (Neon, Supabase, Railway Postgres, etc.) and update `DATABASE_URL` accordingly, for example:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/db?sslmode=require"
```

Run your migrations against the production database once:

```bash
npx prisma migrate deploy
```

### 2. Move PDF Storage Off the Filesystem

`/api/upload` currently writes PDFs into `public/uploads/`, which is read-only in Vercel. Choose one of:

- **Object storage**: S3, R2, or Supabase Storage. Update `/api/upload` and `/api/source-books/[id]` to write/delete files there and store the public URL in `filePath`.
- **Vercel Blob** (beta): swap the `fs` calls with the Vercel Blob SDK.

Until you make that change, uploads will only work locally; production deploys should point to a bucket that already contains the PDFs.

### 3. Required Environment Variables

Add these under **Project → Settings → Environment Variables** (or via `vercel env add`):

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Connection string for the hosted Postgres/PlanetScale DB. |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -hex 32`. |
| `NEXTAUTH_URL` | `https://trimfinder.vercel.app` (or your custom domain). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional bootstrap admin credentials. |
| `USER_EMAIL` / `USER_PASSWORD` | Optional bootstrap non-admin user. |
| Storage keys | Whatever your chosen storage vendor requires (e.g., `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`). |

> Tip: run `vercel env pull .env.production` to sync settings locally.

### 4. Connect the GitHub Repo

1. Push `main` to GitHub (already done).
2. In Vercel, click **Add New → Project → Import GitHub Repository**, pick `Heydonia/Trimfinder`.
3. Framework preset: **Next.js** (auto-detected). Build command `npm run build`. Output directory `.next`.
4. Paste the environment variables.
5. Deploy. Every push to `main` will trigger production, other branches create preview deploys.

### 5. CLI Workflow (Optional)

```bash
npm install -g vercel
vercel login
vercel link                # inside the TrimFinder folder
vercel env pull .env.local # keep envs in sync
vercel --prod              # manual production deploy
```

### 6. Post-Deploy Checks

- **Prisma migrations**: Vercel runs `npm run build`, so ensure `prisma generate` succeeds in CI (Next does this automatically). For schema changes, run `npx prisma migrate deploy` against the prod DB (via GitHub Action or manually).
- **PDF uploads**: Verify the new storage integration. These endpoints need the `NODEJS` runtime (already exported in each route).
- **API limits**: `pdf-parse` and Prisma work best on the Node runtime; make sure the new storage + DB changes keep each request under Vercel’s execution time (default 10s on the Hobby plan).

### 7. Recommended Enhancements

- Add a cron or webhook to clean orphaned PDFs in storage.
- Configure branch protections in GitHub so only reviewed PRs deploy.
- Add monitoring (e.g., Vercel Analytics or Log Drains) to observe `/api/search` performance.

