# Deploying to Vercel with Neon PostgreSQL

Three applications, one repository, one database. This document covers the
shape of the deployment, the exact settings for each project, how to move
your local database to Neon, and the two things that do **not** work on
serverless without further work.

---

## 1. The shape: three projects, one repository

Do not try to deploy the workspace as a single project. Vercel builds one
application per project, and these three have different runtimes, different
environment variables and different release risks — you want to be able to
redeploy the website without touching the API.

Create **three Vercel projects, all importing the same GitHub repository**,
each with a different Root Directory:

| Vercel project | Root Directory    | Framework preset | Serves                   |
| -------------- | ----------------- | ---------------- | ------------------------ |
| `kts-api`      | `apps/api`        | **Other**        | The REST API             |
| `kts-web`      | `apps/public-web` | Next.js          | The public website       |
| `kts-admin`    | `apps/admin-web`  | Next.js          | The administration panel |

Deploy them in that order the first time: the websites read from the API at
build time, so the API needs a URL before they can build.

## 2. Why your first build failed

Five workspace packages — `@kts/shared-types`, `@kts/config`,
`@kts/validation`, `@kts/api-client` and `@kts/seo` — are consumed as
compiled output (`dist/index.js`), and `dist/` is git-ignored. Vercel clones
the repository, runs `pnpm install`, then runs `next build` inside
`apps/admin-web`. Nothing in that sequence ever builds those packages, so the
imports cannot resolve.

Each application now has a `vercel-build` script, which Vercel runs in
preference to the default:

```jsonc
// apps/admin-web/package.json
"vercel-build": "pnpm --filter \"@kts/admin-web^...\" build && next build"
```

`<package>^...` is pnpm's "the dependencies of this package, not the package
itself", so it builds exactly what the app needs, in dependency order. This
was verified locally by deleting every `dist/` directory and running the
script from a clean state.

**You do not need to change the Build Command in the Vercel dashboard.**
Leave it on the default; Vercel picks up `vercel-build` automatically.

## 3. Neon: create the database

1. Create a Neon project and a database named
   `key-tech-solutions-portfolio-management`.
2. From the Neon dashboard, copy **two** connection strings:
   - the **pooled** one — its host contains `-pooler`
   - the **direct** one — no `-pooler`

Both matter, and mixing them up causes problems that only appear under load:

| Variable              | Which string | Why                                                                                                                                   |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | **pooled**   | Serverless functions open a connection per instance. Without the pooler you exhaust Postgres connection slots under any real traffic. |
| `DATABASE_DIRECT_URL` | **direct**   | Migrations take advisory locks and run DDL, which a transaction pooler cannot carry correctly.                                        |

The Prisma schema already declares both, so nothing needs changing:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_DIRECT_URL")
}
```

Append `?sslmode=require` to both if Neon's copied strings do not already
include it.

## 4. Move your local database to Neon

Two options. Pick one.

### Option A — schema and data exactly as they are locally

Use this if you have edited content locally and want to keep it.

```bash
# 1. Dump the local database (custom format, no owner/ACL noise)
"/c/Program Files/PostgreSQL/16/bin/pg_dump.exe" \
  --format=custom --no-owner --no-privileges \
  --dbname="postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/key-tech-solutions-portfolio-management" \
  --file=kts-local.dump
```

```bash
# 2. Restore into Neon, using the DIRECT connection string
"/c/Program Files/PostgreSQL/16/bin/pg_restore.exe" \
  --no-owner --no-privileges --clean --if-exists \
  --dbname="YOUR_NEON_DIRECT_URL" \
  kts-local.dump
```

```bash
# 3. Tell Prisma the existing schema is already at the latest migration,
#    so it does not try to apply it again
DATABASE_URL="YOUR_NEON_POOLED_URL" \
DATABASE_DIRECT_URL="YOUR_NEON_DIRECT_URL" \
npx prisma migrate resolve --applied 20260101000000_init --schema prisma/schema.prisma
```

If your password contains `@`, `:`, `/`, `#` or `?`, percent-encode it inside
the URL — `#` becomes `%23`, `@` becomes `%40`.

Delete `kts-local.dump` afterwards. It contains password hashes and every
lead and application in your database.

### Option B — clean schema plus fresh sample content

Use this if your local data is only the seeded sample content. It is simpler
and leaves a correct migration history.

```bash
DATABASE_URL="YOUR_NEON_POOLED_URL" \
DATABASE_DIRECT_URL="YOUR_NEON_DIRECT_URL" \
npx prisma migrate deploy --schema prisma/schema.prisma

DATABASE_URL="YOUR_NEON_POOLED_URL" \
DATABASE_DIRECT_URL="YOUR_NEON_DIRECT_URL" \
SEED_ADMIN_EMAIL="you@yourdomain.com" \
SEED_ADMIN_PASSWORD="a-strong-one-you-choose" \
npx tsx prisma/seed.ts
```

### Either way

Run migrations **from your machine**, never from a build step. A container
that migrates on boot will race itself the moment you run two instances, and
a failed deploy should not leave a half-applied schema. There is no migration
in any `vercel-build` script for exactly this reason.

## 5. Project settings and environment variables

Set these in **Settings → Environment Variables** for each project, for
Production and Preview. Generate every secret fresh — do not reuse the values
from your local `.env`.

```bash
# Generates one secret; run it once per secret you need
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### `kts-api` (Root Directory `apps/api`, preset **Other**)

| Variable                                | Value                                                     |
| --------------------------------------- | --------------------------------------------------------- |
| `NODE_ENV`                              | `production`                                              |
| `DATABASE_URL`                          | Neon **pooled** string                                    |
| `DATABASE_DIRECT_URL`                   | Neon **direct** string                                    |
| `SESSION_SECRET`                        | freshly generated, 32 bytes                               |
| `REVALIDATE_SECRET`                     | freshly generated                                         |
| `PREVIEW_SECRET`                        | freshly generated                                         |
| `SESSION_COOKIE_SECURE`                 | `true`                                                    |
| `API_PUBLIC_URL`                        | `https://kts-api.vercel.app`                              |
| `PUBLIC_SITE_URL`                       | `https://kts-web.vercel.app`                              |
| `ADMIN_SITE_URL`                        | `https://kts-admin.vercel.app`                            |
| `CORS_ORIGINS`                          | `https://kts-web.vercel.app,https://kts-admin.vercel.app` |
| `MAIL_DRIVER`                           | `smtp` (or `console` to start)                            |
| `MAIL_FROM`, `MAIL_NOTIFY_TO`, `SMTP_*` | your mail provider's                                      |
| `STORAGE_DRIVER`                        | see section 7 — uploads need a decision                   |

`CORS_ORIGINS` must list the real deployed origins. Anything not in that list
is refused by the browser, and sign-in fails with no useful error — this is
the single most common cause of "the admin panel does nothing" after a
deploy. Add your preview domains too if you use them.

### `kts-web` (Root Directory `apps/public-web`, preset Next.js)

| Variable                | Value                        |
| ----------------------- | ---------------------------- |
| `NEXT_PUBLIC_SITE_URL`  | `https://kts-web.vercel.app` |
| `NEXT_PUBLIC_API_URL`   | `https://kts-api.vercel.app` |
| `API_INTERNAL_URL`      | `https://kts-api.vercel.app` |
| `NEXT_PUBLIC_SITE_NAME` | `Key Tech Solutions`         |
| `REVALIDATE_SECRET`     | the same value as the API's  |

### `kts-admin` (Root Directory `apps/admin-web`, preset Next.js)

| Variable                    | Value                        |
| --------------------------- | ---------------------------- |
| `NEXT_PUBLIC_ADMIN_API_URL` | `https://kts-api.vercel.app` |
| `NEXT_PUBLIC_SITE_URL`      | `https://kts-web.vercel.app` |

`NEXT_PUBLIC_*` values are compiled into the browser bundle at build time, so
changing one requires a redeploy, not just a restart. Never put a database
credential or a secret behind that prefix — the secret scanner
(`pnpm secrets:scan`) fails the build if you do.

## 6. Custom domains

Once real domains are attached, update every URL above to match, in all three
projects, and redeploy the two websites so the `NEXT_PUBLIC_*` values are
rebuilt. Cookies are set for the API's own domain; if you put the API on a
different registrable domain from the admin panel, browsers will treat the
session cookie as third-party and block it. Use subdomains of one domain:

```
api.yourdomain.com     admin.yourdomain.com     www.yourdomain.com
```

## 7. What does not work on serverless yet

Two honest limitations. Neither is a bug in the code; both are consequences
of running on functions rather than a server.

### Uploads are blocked until object storage is wired up

`STORAGE_DRIVER=local` writes to disk. On Vercel the filesystem is read-only
apart from `/tmp`, and `/tmp` disappears when the instance does — so uploaded
images and CVs would either fail outright or vanish.

`STORAGE_DRIVER=s3` is **a stub**. `S3StorageProvider` validates its
configuration and then throws:

```
S3 storage is not implemented yet (put). Use STORAGE_DRIVER=local,
or implement S3StorageProvider.
```

So until a real object-storage driver exists, on Vercel you can deploy and
run everything **except** the media library and CV uploads. Everything
already in the database — including seeded content — displays normally.

The fix is to implement `S3StorageProvider` against one of:

- **Vercel Blob** — least setup, native to the platform
- **Cloudflare R2** — S3-compatible, no egress fees
- **AWS S3** — S3-compatible, the most portable

Tell me which you want and I will implement it. The interface it must satisfy
is small and already defined in `apps/api/src/common/storage/`.

### Rate limiting counts per instance, not globally

`@fastify/rate-limit` keeps its counters in memory. Every warm function
instance has its own, so the effective limit is roughly
`RATE_LIMIT_MAX × number of live instances`. The limits still stop a naive
flood from a single caller, but they are not a hard global ceiling. If you
need one, point the plugin at Redis (Upstash works well on Vercel) — that is
a configuration change in `app.factory.ts`, not a redesign.

### Also worth knowing

- **Cold starts.** The first request to an idle instance builds the Nest
  application and opens a database connection. Expect roughly a second.
  `maxDuration` is set to 30s in `apps/api/vercel.json`.
- **Scheduled publication.** Content set to `SCHEDULED` becomes visible when
  something asks for it, since there is no background worker. If you need
  precise timing, add a Vercel Cron hitting a revalidation endpoint.

## 8. After the first deploy

1. Sign in to the admin panel and change the seed administrator's password,
   or delete that account once a real one exists.
2. Check `https://kts-api.vercel.app/health/ready` returns 200.
3. Check the public site renders content, not empty sections — empty usually
   means `API_INTERNAL_URL` is wrong or CORS is rejecting the build.
4. Replace the sample content and remove the sample-content notices.
5. Rotate your local database password if it has ever been shared.

## 9. Deployment checklist

```
[ ] Neon project created, both connection strings copied
[ ] Schema applied to Neon (migrate deploy, or restore + migrate resolve)
[ ] Data seeded or restored, and verified in the Neon console
[ ] kts-api deployed, /health/ready returns 200
[ ] CORS_ORIGINS lists both website origins exactly
[ ] kts-web deployed, homepage renders real content
[ ] kts-admin deployed, sign-in works and the dashboard loads
[ ] Seed administrator password changed
[ ] Object storage decided on if uploads are needed
```
