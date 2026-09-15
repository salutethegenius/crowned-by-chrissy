# Launch checklist

Do not enable production traffic until these are confirmed.

## Still required from Chrissy / vendors

- [ ] Exact address and whether it should be public
- [ ] Confirmed working days
- [ ] Service durations and cleanup buffers (demo values are demo-only)
- [ ] Default deposit amount or percent (must be greater than B$1.00 for CNG)
- [ ] Default payment / hold deadline
- [ ] Approved biography
- [x] Identified portrait (Chrissy, used on Meet Chrissy and the homepage)
- [ ] Notification credentials (Resend API key + verified From address; optional Twilio)
- [ ] Live Cash N’ Go merchant id + API key, sandbox test, then `CNG_LIVE_ENABLED=true`
- [ ] Settlement currency confirmation
- [ ] Final policy review
- [ ] Optional: ~10 videos with posters and captions
- [ ] Business licence (pending)

## Before going live

- [ ] `APP_URL` is the live HTTPS origin
- [ ] `DEMO_MODE=false`
- [ ] Do not run `db:seed:demo` on production
- [ ] Change owner password
- [ ] `SESSION_SECRET` and `CRON_SECRET` are unique
- [ ] Working days + durations set, then enable online requests
- [ ] Deposit defaults set if deposits stay on
- [ ] Sandbox CNG payment verified with a tiny amount, then live flag
- [ ] Resend domain verified; send one test email from Owner → Notifications
- [ ] Confirm `/sitemap.xml` and `/robots.txt` on the live domain
- [ ] Review public copy so no invented testimonials or years-in-business claims remain
