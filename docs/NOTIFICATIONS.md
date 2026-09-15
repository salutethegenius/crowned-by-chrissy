# Notifications

No provider is live until you add credentials. Unconfigured channels stay disabled. The app never claims a message was sent unless a provider accepted it (except demo mode, which stores a clearly labelled demo log).

## Events

- New request to Chrissy
- Request acknowledgement to the client
- Approval / deposit request
- Revised appointment proposal
- Payment confirmation
- Upcoming appointment reminder
- Hold expiry
- Cancellation or reschedule update

Messages go through a durable outbox (`NotificationMessage`) with unique idempotency keys. Obsolete reminders are cancelled when an appointment changes.

## Providers

| Channel | Env | Notes |
| --- | --- | --- |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional `RESEND_REPLY_TO` | Disabled until set. Uses the Resend SDK with branded HTML + plain text. |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Disabled until set |
| Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Owner PWA only; permission is requested after tapping **Enable push alerts** |
| In-app | always | Owner and booking pages |

WhatsApp is a **manual** fallback (`Open WhatsApp with message`). It is not automated messaging.

Owner controls: reminder lead times live in Settings (`notificationPrefs.reminderHours`, default 24h). Failed rows can be retried from Notifications. Send a **test email** from Notifications after Resend is configured.

Do not add marketing subscriptions by default.

## Resend (production)

1. Create a Resend account and verify the salon’s sending domain (DNS: SPF, DKIM, and optionally DMARC).
2. Create an API key and store it as `RESEND_API_KEY` (Vercel Production + Preview as needed).
3. Set `RESEND_FROM_EMAIL` to a verified address, e.g. `Crowned by Chrissy <bookings@your-domain.com>`.
4. Optional: `RESEND_REPLY_TO` so replies land in Chrissy’s inbox.
5. Set `APP_URL` to the public HTTPS origin so booking links in emails (and the sitemap) are correct.
6. Keep `DEMO_MODE=false` in production. Demo mode logs messages instead of delivering them.
7. Open **Owner → Notifications** and send a test email to yourself before taking live requests.

Emails include a text part and a branded HTML part. They are transactional appointment updates, not a mailing list.
