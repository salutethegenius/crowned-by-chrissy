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
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Disabled until set |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Disabled until set |
| Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Owner PWA only; permission is requested after tapping **Enable push alerts** |
| In-app | always | Owner and booking pages |

WhatsApp is a **manual** fallback (`Open WhatsApp with message`). It is not automated messaging.

Owner controls: reminder lead times live in Settings (`notificationPrefs.reminderHours`, default 24h). Failed rows can be retried from Notifications.

Do not add marketing subscriptions by default.
