# Cash N’ Go (Paylanes) integration

Source of truth: supplied *CNG - Payment API v1.0* (6 August 2026).

## Status

Live payments are **disabled** until merchant registration, sandbox tests, and `CNG_LIVE_ENABLED=true`.

Do not reuse sample `AUTH_ID` or `API_KEY` values from the PDF.

## Endpoints

| | Sandbox | Production |
| --- | --- | --- |
| Hosted payment | `https://paylanes-qa.sprocket.solutions/merchant/web-payment/auth` | `https://paylanes.sprocket.solutions/merchant/web-payment/auth` |
| Transaction info | `.../merchant/web-payment/transaction-info` | same path on production host |

The all-transactions URL in the PDF is inconsistent (table vs example). This app does **not** depend on it. Reconciliation uses individual `ORDER_NUMBER` lookup.

There is **no documented webhook**. The app:

1. Sends the client to a hosted page
2. Treats success/cancel redirects as hints only
3. Verifies with `transaction-info` using `AUTH_ID` + `API_KEY` (header)
4. Re-checks pending orders on the job runner

A cancel redirect does **not** prove that no payment occurred.

## Create payment page

GET parameters: `AUTH_ID`, `AMOUNT` (two decimals, greater than `1.00`), `URL_SUCCESS`, `URL_CANCEL`, `ORDER_NUMBER`. Optional: `PASSPHRASE`. `API_KEY` is not required for page creation.

`PAYMENT_OPTIONS` and `PAYMENT_METHOD` are mutually exclusive. Only set methods your merchant actually has enabled.

Success redirect query parameters are **never** trusted as proof of payment.

## Verification rules

A payment confirms an appointment only when all of the following hold:

- Provider `success` and `processed`
- Matching merchant id
- Matching order reference
- Gross `amount` equals the attempt (not the merchant net `total` after fees)
- Transaction id has not been used
- The booking is still `AWAITING_DEPOSIT` with a live hold

Otherwise the money is recorded and flagged for owner resolution. The calendar is not auto-confirmed.

## Environment

```
CNG_ENV=sandbox
CNG_AUTH_ID=
CNG_API_KEY=
CNG_LIVE_ENABLED=false
CNG_CURRENCY_CONFIRMED=false
CNG_PAYMENT_OPTIONS=
CNG_PAYMENT_METHOD=
```

Confirm settlement currency with Cash N’ Go before production. The public site displays BSD as **B$**. The request format does not send a currency code.

## Demo

When `DEMO_MODE=true`, checkout uses `/demo/pay/[orderNumber]` and never calls Paylanes.
