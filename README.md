# Key Tech Solutions — Portfolio Management Platform

A business portfolio management platform: a public marketing website, an
administration panel, and the REST API and PostgreSQL database behind them.
Every page, menu, redirect and SEO field the website renders is editable in
the admin panel. Nothing on the public site is hardcoded content.

> **Sample content.** The database is seeded with clearly-labelled development
> sample content so the site is usable immediately. No customer names,
> testimonials, revenue figures, project counts, awards, certifications,
> partnerships, employee numbers or office addresses have been invented.
> Where a real figure is unavailable the section is omitted rather than
> filled in. Replace the sample content before the site goes live.

---

## Contents

1. [What this is](#1-what-this-is)
2. [Architecture](#2-architecture)
3. [Repository layout](#3-repository-layout)
4. [Technology choices](#4-technology-choices)
5. [Requirements](#5-requirements)
6. [Environment variables](#6-environment-variables)
7. [Database setup](#7-database-setup)
8. [First run](#8-first-run)
9. [Running with Docker](#9-running-with-docker)
10. [Everyday commands](#10-everyday-commands)
11. [The public website](#11-the-public-website)
12. [The administration panel](#12-the-administration-panel)
13. [Content model](#13-content-model)
14. [Publication workflow](#14-publication-workflow)
15. [Roles and permissions](#15-roles-and-permissions)
16. [Media and documents](#16-media-and-documents)
17. [SEO](#17-seo)
18. [Redirects](#18-redirects)
19. [Caching and revalidation](#19-caching-and-revalidation)
20. [Leads, quotes and applications](#20-leads-quotes-and-applications)
21. [Email](#21-email)
22. [Audit logging](#22-audit-logging)
23. [Security](#23-security)
24. [Accessibility and performance](#24-accessibility-and-performance)
25. [Testing](#25-testing)
26. [Code quality](#26-code-quality)
27. [Deploying to production](#27-deploying-to-production)
28. [Backups and recovery](#28-backups-and-recovery)
29. [Troubleshooting](#29-troubleshooting)
30. [Conventions](#30-conventions)

---

## 1. What this is

Three deployable applications and one database:

| Application    | Package           | Default port | Purpose                                   |
| -------------- | ----------------- | ------------ | ----------------------------------------- |
| Public website | `@kts/public-web` | 3000         | What visitors and search engines see      |
| Admin panel    | `@kts/admin-web`  | 3001         | Where the business edits everything       |
| REST API       | `@kts/api`        | 4000         | The only thing that talks to the database |

The website never connects to PostgreSQL. It reads the API over HTTP and
caches the responses; the admin panel writes through the same API with a
session cookie. One database, one schema, one set of rules about what is
public — enforced in the API, not in the page that happens to render it.

## 2. Architecture

```
                    ┌────────────────────┐
  visitors ───────▶ │  public-web :3000  │ ─┐
                    │  Next.js App Router│  │  HTTP + cache tags
                    └────────────────────┘  │
                                            ├──▶ ┌──────────────┐     ┌────────────┐
                    ┌────────────────────┐  │    │  api :4000   │ ──▶ │ PostgreSQL │
  editors ────────▶ │  admin-web :3001   │ ─┘    │  NestJS      │     │            │
                    │  Next.js + TanStack│       │  + Fastify   │     └────────────┘
                    └────────────────────┘       └──────────────┘
                                                        │
                                                        ▼
                                                 uploads/  (local)
                                                 or S3-compatible storage
```

Two rules keep this honest:

- **One visibility rule.** `publicVisibilityWhere()` decides what counts as
  published. The public endpoints, the sitemap, related-content lookups and
  the website's route resolver all use it, so they can never disagree about
  whether a page exists.
- **One validation schema.** The Zod schemas in `@kts/validation` run in the
  browser for instant feedback and again in the API before anything is
  written. The form cannot allow what the server would reject.

## 3. Repository layout

```
apps/
  api/                  NestJS REST API (the only database client)
    src/common/         auth, RBAC guards, generic CRUD, audit, storage, mail
    src/modules/        auth, content, media, leads, careers, seo, settings, rbac
    test/               integration tests (need a database)
  public-web/           Next.js public website
    e2e/                Playwright end-to-end suite
  admin-web/            Next.js administration panel

packages/
  config/               design tokens, environment schema, shared constants
  shared-types/         DTOs, enums, the permission and role catalogue
  validation/           Zod schemas, slug rules, HTML sanitisation
  seo/                  metadata, JSON-LD, sitemap, editorial audit
  api-client/           typed HTTP client used by both front ends
  ui/                   public website components and design system
  admin-ui/             admin shell, tables, forms, panels
  email-templates/      transactional email bodies

prisma/
  schema.prisma         66 models, 24 enums
  migrations/           SQL migrations
  seed.ts, seed/        idempotent development sample content

docker/                 one Dockerfile per application
scripts/check-secrets.mjs   the secret scanner `pnpm verify` runs first
```

## 4. Technology choices

| Area        | Choice                      | Why                                                                     |
| ----------- | --------------------------- | ----------------------------------------------------------------------- |
| Monorepo    | pnpm workspaces             | Shared types and validation without publishing packages                 |
| API         | NestJS 10 on Fastify        | Dependency injection for testability; Fastify for throughput            |
| Database    | PostgreSQL 16 + Prisma 5    | Relational content with real foreign keys and typed access              |
| Websites    | Next.js 14 App Router       | Server components, incremental regeneration, per-tag cache invalidation |
| Validation  | Zod                         | One schema, both sides of the wire                                      |
| Admin state | TanStack Query v5           | Cache invalidation that matches how editors actually work               |
| Styling     | CSS modules + design tokens | Tokens are TypeScript, emitted as CSS variables at render time          |
| Sessions    | Opaque server-side tokens   | Revocable, unlike a JWT; only a hash is stored                          |
| Tests       | Vitest, Jest, Playwright    | Unit, integration against a real database, end to end in a real browser |

## 5. Requirements

- **Node.js 20 or newer**
- **pnpm 9 or newer** (`corepack enable` is enough)
- **PostgreSQL 16** — locally, in Docker, or managed
- **Docker** (optional) — for the containerised stack in section 9

## 6. Environment variables

Copy the example and fill it in. **Every value in `.env.example` is empty on
purpose.**

```bash
cp .env.example .env
```

`.env` is git-ignored, as are `.env.local`, `.env.development`,
`.env.production` and `.env.*.local`. Never commit any of them.

### Database

| Variable              | Example                                   | Notes                                               |
| --------------------- | ----------------------------------------- | --------------------------------------------------- |
| `DATABASE_NAME`       | `key-tech-solutions-portfolio-management` |                                                     |
| `DATABASE_HOST`       | `localhost`                               |                                                     |
| `DATABASE_PORT`       | `5432`                                    |                                                     |
| `DATABASE_USER`       | `postgres`                                | Use a dedicated application user in production      |
| `DATABASE_PASSWORD`   | _(you set this)_                          | Never in source, never in a `NEXT_PUBLIC_` variable |
| `DATABASE_URL`        | _(you set this)_                          | Full connection string used by Prisma and the API   |
| `DATABASE_DIRECT_URL` | _(you set this)_                          | Unpooled connection, used for migrations            |

If your password contains `@`, `:`, `/`, `#` or `?`, percent-encode it inside
the URL. `buildDatabaseUrl()` in `@kts/config` does this correctly if you
prefer to assemble the URL from the parts.

### Secrets

| Variable            | How to generate                                                            |
| ------------------- | -------------------------------------------------------------------------- |
| `SESSION_SECRET`    | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `REVALIDATE_SECRET` | same, 16 bytes is enough                                                   |
| `PREVIEW_SECRET`    | same                                                                       |

Generate these yourself. Do not reuse a value between environments, and
rotate anything that has ever been pasted into a chat, a ticket or a log.

### Everything else

`.env.example` documents each remaining variable in place, grouped by
concern: API host and port, CORS origins, session lifetime, login lockout,
rate limits, storage driver and limits, mail driver and SMTP, the seed
administrator, and the `NEXT_PUBLIC_*` values the browsers need.

**`NEXT_PUBLIC_` is compiled into the browser bundle.** Never put a database
credential, a session secret or a storage key behind that prefix. The secret
scanner fails the build if you do.

## 7. Database setup

Create the database and a user for it:

```sql
CREATE DATABASE "key-tech-solutions-portfolio-management";
CREATE USER kts_app WITH PASSWORD 'choose-your-own';
GRANT ALL PRIVILEGES ON DATABASE "key-tech-solutions-portfolio-management" TO kts_app;
```

Then apply the schema:

```bash
pnpm prisma:generate
pnpm prisma:migrate:deploy
```

Seed the development sample content:

```bash
pnpm db:seed
```

The seed is idempotent — run it as often as you like. It creates the
permission catalogue, the ten roles, the navigation, the site settings and
the sample content. If `SEED_ADMIN_PASSWORD` is not set it generates a random
password and prints it **once**; copy it then, because it is not stored
anywhere in plain text and cannot be recovered.

## 8. First run

Three terminals, or `pnpm dev` for all three at once:

```bash
pnpm install
pnpm prisma:generate
pnpm dev
```

- Website — <http://localhost:3000>
- Admin panel — <http://localhost:3001>
- API — <http://localhost:4000/health>

Sign in at `/login` with the seed administrator. The account is flagged to
change its password on first use.

## 9. Running with Docker

```bash
cp .env.example .env     # fill it in first
pnpm docker:up
```

This starts PostgreSQL, the API and both websites. PostgreSQL is bound to
`127.0.0.1` so it is not reachable from the network, and uses `scram-sha-256`
authentication. Every value comes from `.env`; the compose file contains no
credentials and refuses to start if a required one is missing.

**Migrations are never run automatically by a container.** Applying a
migration is a decision, not a side effect of a deploy:

```bash
pnpm prisma:migrate:deploy
pnpm db:seed          # first time only
```

Just the database, if you would rather run the applications on the host:

```bash
pnpm docker:up:db
```

## 10. Everyday commands

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `pnpm dev`              | All three applications in watch mode                      |
| `pnpm build`            | Build every package and application                       |
| `pnpm verify`           | Secret scan, Prisma validate, lint, typecheck, unit tests |
| `pnpm lint`             | ESLint across the workspace, warnings treated as errors   |
| `pnpm typecheck`        | TypeScript across the workspace, including test code      |
| `pnpm test`             | Unit tests (no database needed)                           |
| `pnpm test:integration` | API integration tests (needs a database)                  |
| `pnpm test:e2e`         | Playwright end-to-end suite (needs a running stack)       |
| `pnpm secrets:scan`     | The secret scanner on its own                             |
| `pnpm db:seed`          | Re-run the idempotent seed                                |
| `pnpm prisma:studio`    | Browse the database                                       |
| `pnpm format`           | Prettier                                                  |

## 11. The public website

67 routes, all server-rendered, all driven by the database:

- Home, About, Process, Technology
- Services, Solutions, Industries, Products — listings and detail pages
- Portfolio and Case studies
- Insights (blog) with categories and tags
- Careers with an application form
- Contact, Request a quote
- Privacy, Terms, Cookie policy
- `robots.txt`, `sitemap.xml`, and a `preview/` route for unpublished content

Pages are statically generated and revalidated on a timer, and immediately on
publish through cache tags. A URL with nothing published behind it returns a
real **404**, not a page that says "not found" with a 200 — the middleware
asks the API before Next's cache can answer.

## 12. The administration panel

Every screen is behind a session and a permission. The panel sends
`X-Robots-Tag: noindex` and `Cache-Control: no-store` on every response.

| Area           | Screens                                                             |
| -------------- | ------------------------------------------------------------------- |
| Overview       | Dashboard, content health, SEO health                               |
| Content        | A list and an editor for every content type, plus the media library |
| Website        | Navigation, footer, announcements                                   |
| SEO            | Redirects, sitemap preview                                          |
| Growth         | Leads and quote requests, job applications                          |
| Administration | Users, roles, settings, branding, audit log                         |

The editor is generated from a resource registry, so a new content type is a
registry entry rather than a new screen. It warns before you navigate away
from unsaved work, shows live length feedback against SEO limits rather than
truncating silently, and keeps publishing as a separate, deliberate action
from saving.

## 13. Content model

66 models. The ones you will meet first:

- **Content**: `Page`, `PageSection`, `ContentBlock`, `Service`, `Solution`,
  `Industry`, `Product`, `PortfolioProject`, `CaseStudy`, `BlogPost`,
  `Career`
- **Company**: `TeamMember`, `CompanyValue`, `CompanyMilestone`, `Statistic`,
  `ProcessPhase`, `Technology`, `Client`, `Partner`, `Testimonial`
- **Site**: `SiteSetting`, `BrandSetting`, `NavigationMenu`, `FooterGroup`,
  `Announcement`, `SocialLink`
- **SEO**: `SeoMetadata`, `RedirectRule`, `PageRevision`
- **People and security**: `AdminUser`, `AdminSession`, `Role`, `Permission`,
  `AuditLog`
- **Enquiries**: `Lead`, `ContactSubmission`, `QuoteRequest`,
  `JobApplication`, `NewsletterSubscriber`
- **Files**: `MediaAsset`, `DocumentAsset`, `MediaUsage`

Every model has a UUID primary key, `createdAt` and `updatedAt`. Content
models add `archivedAt`, so nothing is ever destroyed by an editor's click.

## 14. Publication workflow

```
DRAFT ──▶ REVIEW ──▶ PUBLISHED ──▶ ARCHIVED
  │          │           ▲
  └──────────┴──▶ SCHEDULED
```

Rules the API enforces, not just the interface:

- **Saving never changes the publication status.** An editor fixing a typo
  cannot take a live page off the website, whatever the form submits.
- Moving to `PUBLISHED` or `SCHEDULED` needs the `publish` permission for
  that content family. Without it, `Submit for review` is the way forward.
- `SCHEDULED` requires a date in the future.
- Every save writes a `PageRevision` with a snapshot, the editor and the
  change summary. Any revision can be restored, and a restore comes back as
  a draft — republishing is a separate decision.
- Archiving removes content from the website and keeps the row.

## 15. Roles and permissions

102 permissions across 26 families, named `family:action` — for example
`services:publish`, `leads:export`, `media:delete`. Ten roles are seeded:

`super-administrator`, `content-administrator`, `seo-manager`,
`marketing-editor`, `product-manager`, `portfolio-manager`, `lead-manager`,
`career-manager`, `media-manager`, `auditor`.

Roles are rows, not code: an administrator can create a role and choose its
permissions. Permissions are checked by a guard on the route **and** in the
service layer, so an endpoint reached another way is still refused. A refusal
names the permission that was missing, which is what an administrator needs
in order to grant it.

## 16. Media and documents

Public images and private documents are kept apart, and treated differently.

**Images** are validated three ways before anything is written: the
extension, the declared MIME type and the file's own magic bytes must all
agree. The file is then re-encoded with sharp, which strips EXIF (including
GPS) and neutralises anything hiding behind an image header. Stored under a
UUID filename, never the name the browser supplied. Responsive variants are
generated at upload time.

**Documents** — CVs, proposals, case-study PDFs — are never served from a
public URL. A request produces an HMAC-signed link, valid for five minutes,
for that one object, and the access is recorded in the audit log.

Storage is local by default (`uploads/`, git-ignored). Set
`STORAGE_DRIVER=s3` with the `S3_*` variables for S3-compatible object
storage.

## 17. SEO

Editable per page: title, description, canonical URL, Open Graph image,
robots directives, sitemap priority and change frequency. Sensible values are
derived from the content when a field is left blank, so nothing is ever
missing.

Structured data is generated per page type — `Organization`, `WebSite`,
`WebPage`, `Service`, `Product`, `Article`, `JobPosting`, `BreadcrumbList`,
`FAQPage`. The generators prune empty fields, so the output never contains a
fabricated rating, review, price, award or offer.

`sitemap.xml` is generated from the same visibility rule the pages use, so a
draft cannot appear in it. `robots.txt` excludes `/admin/`, `/api/` and
`/preview/`.

**The SEO health screen shows an internal editorial score, not a search
engine ranking score.** It measures whether your own fields are filled in and
within sensible lengths. It has no connection to how any search engine ranks
the site, and the screen says so.

## 18. Redirects

Editors manage redirect rules directly, and one is created automatically
whenever the slug of published content changes — a permanent 301 from the old
URL to the new one, so inbound links and indexed results keep working.

The website's middleware resolves rules before routing. `410 Gone` is
answered as 410, because "gone" and "not found" mean different things to a
crawler. Redirect chains and loops are rejected when the rule is saved, and
a rule that would shadow `/admin`, `/api` or `/_next` is refused.

## 19. Caching and revalidation

Website responses are cached with tags (`services`, `service:<slug>`,
`navigation`, …). Publishing anything calls the revalidation endpoint with
`REVALIDATE_SECRET`, which invalidates exactly the tags affected. An editor
who publishes a service sees it on the site immediately; nothing else is
re-rendered.

## 20. Leads, quotes and applications

The contact form, the quote request and the job application all create a
`Lead`, so an enquiry has one record whichever door it came through. Each
submission returns a reference (`KTS-C-000123`) rather than a database id.

Forms are rate limited per address, carry a honeypot field and a timing
check, and refuse to submit without explicit consent. A CV is stored as a
private document and is only ever opened through a signed link.

Leads move through `NEW → CONTACTED → QUALIFIED → PROPOSAL → WON / LOST`,
can be assigned to a user, and carry internal notes that are never exposed
publicly.

## 21. Email

`MAIL_DRIVER=console` (the default) prints messages to the log, which is what
you want in development. `MAIL_DRIVER=smtp` sends through the `SMTP_*`
settings. Templates live in `@kts/email-templates`.

A failed send never fails the request that triggered it: a visitor's enquiry
is saved whether or not the notification reaches you.

## 22. Audit logging

Every administrative action is recorded with the actor, the action, the
entity, a timestamp, the request id, and a before/after snapshot for changes.
Sign-ins, sign-outs, failed sign-ins, password changes, permission changes,
publication changes and private-document access are all included.

Snapshots are redacted: a password hash, a session token or a reset token
never reaches the audit table. The log is readable in the admin panel by
anyone with `audit:read`, filterable by actor, action, entity and date.

## 23. Security

**Sessions.** A 32-byte random token in an `HttpOnly`, `SameSite=Lax`,
`Secure`-in-production cookie. Only a SHA-256 hash of it is stored, so a
database leak does not hand over live sessions. Sliding idle expiry plus a
hard absolute expiry. Signing out revokes the session server-side, and an
administrator can revoke any session.

**Passwords.** bcrypt with a configurable cost. Never logged, never returned,
never included in an audit snapshot. A wrong password and an unknown account
produce the same response, so the form cannot be used to discover which
addresses have accounts. Repeated failures lock the account temporarily.

**Reset tokens.** Random, single-use, short-lived, stored as a hash. Never
logged and never included in any report.

**Input.** Zod on both sides. HTML from rich-text fields is sanitised with an
allow-list, and elements left empty by sanitisation are removed rather than
left as an empty shell.

**Output.** Errors carry a status, a message and a request id. Stack traces,
database errors, query text, file paths, connection strings and storage
credentials never reach a response. An integration test asserts this.

**Headers.** A strict Content-Security-Policy, `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS in
production, and no `X-Powered-By`. The API's CSP is `default-src 'none'`,
because it returns JSON and files and never a page.

**Rate limiting.** Global limits plus tighter ones on public forms and
sign-in. Loopback is exempt by default so a static build is never throttled;
`RATE_LIMIT_ALLOWLIST` adds trusted addresses.

**Secrets.** `pnpm verify` runs a scanner first. It fails the build on a
committed `.env`, a connection string with a password, a private key, a cloud
access key, a provider token, a credential-shaped literal assigned to a
secret-named variable, or a database value behind `NEXT_PUBLIC_`. It reports
the file, the line and the variable name — never the value, because a scanner
that echoed the secret would write it into the CI log.

## 24. Accessibility and performance

Semantic landmarks, one `h1` per page, a working skip link, visible focus,
44px touch targets, and a mobile menu that traps focus and restores it on
close. Colour contrast meets WCAG 2.1 AA. Animation respects
`prefers-reduced-motion`, and content is visible without it.

The site works with JavaScript disabled: pages are server-rendered, `<details>`
carries the FAQs, and the footer holds complete navigation. At phone widths
the scripted menu button hides itself when scripting is unavailable rather
than sitting there as a dead control.

The Playwright suite asserts no horizontal scrolling at 320, 360, 390, 414,
768, 1024, 1280 and 1440 pixels.

## 25. Testing

| Suite                  | Command                 | Needs                   | Count |
| ---------------------- | ----------------------- | ----------------------- | ----- |
| Unit — shared packages | `pnpm test`             | nothing                 | 194   |
| Unit — API             | `pnpm test`             | nothing                 | 38    |
| Integration — API      | `pnpm test:integration` | a migrated database     | 36    |
| End to end             | `pnpm test:e2e`         | the whole stack running | 106   |

**Integration tests** build the real application — same modules, guards and
filters — and drive it with Fastify's `inject`. Point `TEST_DATABASE_URL` at
a migrated, seeded database. Without one, every suite reports itself as
_skipped_ rather than failing or, worse, passing without asserting anything.
Each test creates its own fixtures and removes them afterwards.

**End-to-end tests** run against a stack you have already started, across
three projects: desktop Chromium, mobile Chromium (Pixel 5) and a
reduced-motion project.

```bash
E2E_BASE_URL=http://localhost:3000 \
E2E_ADMIN_URL=http://localhost:3001 \
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
pnpm test:e2e
```

The authenticated admin tests read their credentials from the environment and
skip themselves, with a message, when they are absent — so the suite is still
useful on a machine you have not handed a password to.

## 26. Code quality

ESLint with `--max-warnings 0`, TypeScript in strict mode over source _and_
test code, Prettier, and `prisma validate`. `pnpm verify` runs the lot, with
the secret scan first so a leak fails before anything slower has run.

## 27. Deploying to production

**Database**

- A dedicated application user with only the privileges it needs — not the
  superuser, and not the owner.
- A separate migration user that owns the schema. The application user should
  not be able to alter it.
- Strong generated credentials, different per environment, stored in a secret
  manager rather than a file.
- Restrict network access to the application hosts. Do not expose 5432 to the
  internet.
- Require SSL: `?sslmode=require` at minimum, `verify-full` where you can.
- Automated backups with point-in-time recovery, and a restore you have
  actually tested.

**Applications**

- `NODE_ENV=production`, `SESSION_COOKIE_SECURE=true`, HTTPS everywhere.
- Set `CORS_ORIGINS` to your real origins. Do not leave a wildcard.
- Fresh `SESSION_SECRET`, `REVALIDATE_SECRET` and `PREVIEW_SECRET`, generated
  for this environment and used nowhere else.
- Run `pnpm prisma:migrate:deploy` as a deliberate step, not as part of
  container start-up.
- Object storage rather than the local disk if you run more than one
  instance.
- The websites build to standalone output when `NEXT_OUTPUT_STANDALONE=1`,
  which the Dockerfiles set.
- Put a CDN in front of the website. The cache headers are already correct.

**After the first deploy**

- Change the seed administrator's password, or delete the account once a real
  one exists.
- Replace the sample content and the sample-content notices.
- Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and submit the sitemap.

## 28. Backups and recovery

Back up the database _and_ the uploads. A database restore without the files
leaves every image broken.

```bash
pg_dump --format=custom --file=backup.dump "$DATABASE_URL"
pg_restore --clean --if-exists --dbname="$DATABASE_URL" backup.dump
```

Enable point-in-time recovery with your provider, and test a restore into a
scratch database on a schedule. An untested backup is a hope, not a plan.

## 29. Troubleshooting

**`Environment validation failed`** — the message names the variables that
are missing or malformed, never their values. Compare `.env` against
`.env.example`.

**`Can't reach database server`** — check that PostgreSQL is listening on the
host and port in `DATABASE_URL`, and that the user may connect from your
address. On Windows, a native PostgreSQL install may already hold port 5432;
use a different port rather than fighting it.

**The admin panel says the API is unreachable** — check `NEXT_PUBLIC_ADMIN_API_URL`,
and that the admin origin is in `CORS_ORIGINS`.

**A published page still shows the old content** — revalidation runs on
publish; confirm `REVALIDATE_SECRET` matches on both sides, or restart the
website process.

**`429 Too Many Requests` during a build** — a static build makes many
requests quickly. Add the build host to `RATE_LIMIT_ALLOWLIST`, or raise
`RATE_LIMIT_MAX` for that environment.

**Integration tests all skip** — that is the correct behaviour without a
database. Set `TEST_DATABASE_URL` to a migrated, seeded one.

**An upload is rejected** — the extension, the declared type and the file's
magic bytes must agree. A `.png` that is really a PDF is refused on purpose.

## 30. Conventions

- Comments explain _why_, not _what_. A comment restating the code is noise.
- Content types are added to the resource registry, not to a new screen.
- Anything a visitor can see is editable in the admin panel.
- Nothing is invented. Where a real figure is unavailable, the section is
  omitted rather than filled with a plausible number.
- No credential is ever written to source, a log, a response, a screenshot or
  a report.
