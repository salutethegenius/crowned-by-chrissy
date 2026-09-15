# Crowned by Chrissy

Hairstyling website, appointment requests, and owner dashboard for **Crowned by Chrissy** in Freeport, Grand Bahama.

Requests are never instant bookings. Chrissy approves first. Deposits (when enabled) hold the time and are credited toward the service.

## Quick start (demo)

```bash
# PostgreSQL 16+ with btree_gist
createdb crowned
cp .env.example .env
# Set DATABASE_URL, SESSION_SECRET, DEMO_MODE=true

npm install
npx prisma migrate deploy
npm run images
npm run db:seed
npm run db:seed:demo
npm run dev
```

Demo owner: `DEMO_OWNER_EMAIL` / `DEMO_OWNER_PASSWORD` (see `.env.example`).

Demo mode uses labelled sample appointments and a simulated checkout. It never charges real money or messages real customers.

## Production

Keep `DEMO_MODE=false`. Do not run `db:seed:demo`. Complete the checklist in `docs/LAUNCH_CHECKLIST.md`.

Set `APP_URL` to the public HTTPS origin so search engines, Open Graph cards, and email links all point at the live site. Public routes are listed in `/sitemap.xml`; `/robots.txt` allows those pages and keeps `/owner`, `/appointments`, `/api`, `/pay`, and `/demo` out of the index.

Email uses Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`). See [Notifications](docs/NOTIFICATIONS.md).

The public site is tagged **Developed by KemisDigital.com**.

## Docs

- [Setup](docs/SETUP.md)
- [Cash N’ Go](docs/CNG.md)
- [Notifications](docs/NOTIFICATIONS.md)
- [Owner guide](docs/OWNER_GUIDE.md)
- [Launch checklist](docs/LAUNCH_CHECKLIST.md)

## Tests

```bash
npm test
npx playwright install
npm run test:e2e
```
