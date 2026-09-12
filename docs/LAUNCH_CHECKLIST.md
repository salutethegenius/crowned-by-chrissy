# Launch checklist

Do not enable production traffic until these are confirmed.

## Still required from Chrissy / vendors

- [ ] Exact address and whether it should be public
- [ ] Confirmed working days
- [ ] Service durations and cleanup buffers (demo values are demo-only)
- [ ] Default deposit amount or percent (must be greater than B$1.00 for CNG)
- [ ] Default payment / hold deadline
- [ ] Approved biography
- [ ] Identified portrait (a branded portrait exists in assets but is unpublished until confirmed)
- [ ] Notification provider (Resend and/or Twilio)
- [ ] Live Cash N’ Go merchant id + API key, sandbox test, then `CNG_LIVE_ENABLED=true`
- [ ] Settlement currency confirmation
- [ ] Final policy review
- [ ] Optional: ~10 videos with posters and captions
- [ ] Business licence (pending)

## Before going live

- [ ] `DEMO_MODE=false`
- [ ] Do not run `db:seed:demo` on production
- [ ] Change owner password
- [ ] `SESSION_SECRET` and `CRON_SECRET` are unique
- [ ] Working days + durations set, then enable online requests
- [ ] Deposit defaults set if deposits stay on
- [ ] Sandbox CNG payment verified with a tiny amount, then live flag
- [ ] Send one test email/SMS to yourself
- [ ] Review public copy so no invented testimonials or years-in-business claims remain
