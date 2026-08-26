# SnappPay Installments for Rafiei Pay

Port the SnappPay installment gateway (already live in Rafiei Academy) into the separate Rafiei Pay project, keeping the same proxy-based architecture that satisfies SnappPay's static-IP whitelist.

## Why a proxy is required

SnappPay only accepts API traffic from the whitelisted IP `45.139.11.73`. Supabase Edge Functions have dynamic egress IPs, so they can never call `api.snapppay.ir` directly. All traffic goes:

```text
Rafiei Pay UI  ->  Edge Function (snapppay-request / snapppay-callback)
                ->  PHP proxy at rafeie.com/snappay/index.php  (fixed IP)
                ->  https://api.snapppay.ir
```

The same proxy instance can serve both projects; requests are authenticated with a shared bearer secret.

## What gets built in Rafiei Pay

1. **Shared client** `supabase/functions/_shared/snapppay.ts`
   - `proxyCall(route, method, payload)` -> proxy with `Authorization: Bearer SNAPPPAY_PROXY_SECRET`.
   - Routes: `eligibility`, `create`, `verify`, `settle`, `cancel`, `status`.
   - Helpers: `tomanToRial` (x10), `normalizeMobile` (must yield `+989XXXXXXXXX`, reject non-Iranian), `generateTransactionId` (digits only — non-numeric IDs fail with SnappPay error 1005).

2. **`snapppay-request` edge function**
   - Reads the order/product from the Rafiei Pay database and computes the amount server-side; client may only lower the price, never raise it.
   - Blocks when the gateway is disabled globally, disabled for that product, or the amount exceeds the max (default 50,000,000 تومان).
   - Supports `checkOnly: true` so the checkout UI can probe eligibility before showing the option.
   - Creates a pending local order, calls `eligibility` then `create`, stores `paymentToken` + `transactionId`, returns the redirect URL.

3. **`snapppay-callback` edge function**
   - Called on return; runs `verify` then `settle`, and only marks the order paid when settle succeeds. `cancel` on failure.
   - Idempotent: re-running for an already-settled token must not double-activate.

4. **Return-URL handling**
   - SnappPay validates the return domain, so `returnURL` points at the whitelisted domain (`rafeie.com/snappay/?route=callback`), and the proxy 302-redirects to the Rafiei Pay success page with the query string intact.

5. **Checkout UI**
   - SnappPay option shown only when eligible (enabled + under cap + Iranian mobile); auto-switch to another gateway if a discount/price change makes it ineligible.
   - Pay button must include `snapppay` in its visibility condition (label: «پرداخت اقساطی»).

6. **Admin settings**
   - Global on/off toggle + configurable max amount (Toman).
   - Per-product `snapppay_enabled` flag.

## Database changes (Rafiei Pay)

- `admin_settings`: `snapppay_enabled boolean default false`, `snapppay_max_amount_toman integer default 50000000`.
- Products/courses table: `snapppay_enabled boolean default true`.
- Orders table: `snapppay_payment_token text`, `snapppay_transaction_id text`, plus `payment_method = 'snapppay'` support.
- Grants + RLS follow the project's existing pattern for these tables.

## Secrets

Edge Functions:
- `SNAPPPAY_PROXY_URL` (defaults to `https://rafeie.com/snappay/`)
- `SNAPPPAY_PROXY_SECRET`

Proxy server only (never in Supabase):
- `SNAPPPAY_CLIENT_ID`, `SNAPPPAY_CLIENT_SECRET`, `SNAPPPAY_USERNAME`, `SNAPPPAY_PASSWORD`

Proxy config also needs the Rafiei Pay success URL added to its callback redirect map.

## Config

`supabase/config.toml`: `verify_jwt = false` for `snapppay-request` and `snapppay-callback` (guest checkout + external return).

## Known pitfalls carried over from Academy

- `cartId` / `transactionId` must be numeric strings; optional fields like `commissionType` break deserialization (error 1005).
- `returnURL` on a non-whitelisted domain -> error 1051.
- `declare(strict_types=1)` in the PHP proxy must be the very first statement — it is omitted entirely to survive BOM/whitespace on upload.
- Amounts to SnappPay are in Rial (Toman x10).

## Verification

- `checkOnly` probe returns `eligible: true` for a small test amount.
- Full sandbox purchase: request -> SnappPay page -> return -> verify + settle -> order marked paid exactly once.
- Amount above the cap and a product with the flag off both hide the option.
