# Test results

## Unit / integration (`npm test`)

5 passed:

- Discovery and direct requests submit as `REQUESTED` (never auto-confirmed)
- Concurrent approvals cannot overlap (PostgreSQL exclusion constraint)
- Expired holds release the calendar slot
- Forged success URLs do not mark paid; repeated verification is idempotent
- Retained deposit credit cannot be allocated twice

## Playwright (`npx playwright test`)

8 passed (Pixel 7 + desktop Chrome):

- Mobile and desktop homepage + gallery
- Discovery path: category → look → options, Back preserves the gallery
- Direct service booking
- Owner login, Today, Requests, Calendar, pricing editor

No live Cash N’ Go charges were performed.

## Production build

`npm run build` succeeded on Next.js 16.3.5.
