## TrimFinder

Upload Toyota source-book PDFs, extract per-page text, and search for trims or features with instant PDF previews.

### Tech stack

- Next.js 14 (App Router, TypeScript)
- Prisma + SQLite
- pdf-parse for text extraction
- NextAuth credentials auth

### Setup

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Visit `http://localhost:3000` for the login/search UI, `http://localhost:3000/accounts` for managing dealership logins (admins only), and `http://localhost:3000/upload` to ingest source books (admins only).

Create a `.env` file with:

```bash
DATABASE_URL="file:./dev.db"
ADMIN_EMAIL="dealer@example.com"      # env-based admin (optional)
ADMIN_PASSWORD="change-me"
USER_EMAIL="agent@example.com"        # env-based regular user (optional)
USER_PASSWORD="change-me"
NEXTAUTH_SECRET="set-a-strong-secret"
NEXTAUTH_URL="http://localhost:3000"
```

You can also create additional users from the Accounts page (admin role required). Only admin users can access `/upload` and `/accounts`.

### Data flow

1. Upload a PDF with model name + optional year.
2. The file is stored under `public/uploads/`.
3. Text is extracted per page and stored in SQLite (`SourceBook` + `Page` tables).
4. Keyword searches hit `/api/search`, returning ranked pages with snippets.
5. Selecting a result opens the PDF in a new tab using `#page=<n>`.

### Useful scripts

- `npm run dev` – start the development server on port 3000.
- `npm run build && npm run start` – production build + serve.
- `npm run lint` – run ESLint.
- `npm run prisma:studio` – open Prisma Studio.
