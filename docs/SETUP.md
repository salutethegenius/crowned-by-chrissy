# Setup

## Requirements

- Node.js 20+
- PostgreSQL 16+ (`btree_gist` is used for calendar overlap protection)
- A long `SESSION_SECRET`

## Database

```bash
sudo -u postgres createuser crowned
sudo -u postgres createdb -O crowned crowned
psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS btree_gist;'
npx prisma migrate deploy
```

## Images

Original salon photos live in `content/originals/`. Web derivatives are generated with:

```bash
npm run images
```

Source files for this repo were processed from the supplied assets.

## Environment

Copy `.env.example` to `.env`. Never put secrets in `NEXT_PUBLIC_*` variables.

| Variable | Purpose |
| --- | --- |
| `DEMO_MODE` | Isolated demo with simulated payments |
| `DATABASE_URL` | PostgreSQL |
| `SESSION_SECRET` | Owner session signing |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | Created by seed when not in demo |
| `CRON_SECRET` | Authorizes `/api/cron/tick` |
| `CNG_*` | Cash N’ Go (see `docs/CNG.md`) |
| `RESEND_*` / `TWILIO_*` / `VAPID_*` | Notification providers |

## Jobs

Holds expire, pending payments are reconciled, and the notification outbox is processed:

- On server start via `instrumentation.ts`
- Every minute on Vercel via `vercel.json` → `POST /api/cron/tick` with `Authorization: Bearer $CRON_SECRET`
- Manually: `npm run jobs`

Expiry also runs during availability checks and booking operations. Do not rely on a browser countdown.

## Owner PWA

The dashboard is installable (`/owner/manifest.webmanifest`). The service worker caches only static assets, never customer records.
