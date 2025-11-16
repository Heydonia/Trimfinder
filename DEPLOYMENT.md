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

### 2. Configure Object Storage

Uploads now use S3-compatible storage by default. Set the `S3_*` environment variables (bucket, region, access keys, and optional endpoint/public URL) so `/api/upload` writes PDFs to your bucket and `/api/source-books/[id]` deletes them there. Without those variables the app falls back to `public/uploads/`, which only works locally.

### 3. Required Environment Variables

Add these under **Project → Settings → Environment Variables** (or via `vercel env add`):

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Connection string for the hosted Postgres DB. |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -hex 32`. |
| `NEXTAUTH_URL` | `https://trimfinder.vercel.app` (or your custom domain). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional bootstrap admin credentials. |
| `USER_EMAIL` / `USER_PASSWORD` | Optional bootstrap non-admin user. |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Required for storing PDFs in S3/R2/Supabase Storage. |
| `S3_ENDPOINT` / `S3_PUBLIC_URL_BASE` | Optional overrides for non-AWS providers/CDNs. |

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

---

## Fly.io Quickstart

Fly is now pre-configured in this repo (`fly.toml`, `Dockerfile`, `.dockerignore`, GitHub Action). Here’s how to use it:

1. `fly auth login` and run `fly deploy` from the project root. The existing `trimfinder-app` plus the attached Postgres cluster `trimfinder-db` (and optional uploads volume for local fallback) will be used automatically.
2. Required secrets:
   - `DATABASE_URL` (already set when we attached the Fly Postgres cluster)
   - `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, `USER_PASSWORD`
   - `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optional `S3_ENDPOINT` / `S3_PUBLIC_URL_BASE`
   - Set/rotate via `fly secrets set KEY=value`.
3. PDFs are served from S3/R2 when the secrets above exist; otherwise the app still falls back to the `uploads` volume mounted at `/app/public/uploads`.
4. The Docker image runs `npx prisma migrate deploy && npm run start` on boot, so Prisma stays in sync with the Postgres schema.
5. Optional GitHub Actions deploy: set `FLY_API_TOKEN` in repo secrets and the provided workflow will deploy on every push to `main`.

