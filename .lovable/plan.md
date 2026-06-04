## Add "Rafiei Pay" as a new payment gateway

Adds Rafiei Pay (pay.rafiei.co) alongside Zarinpal and Zibal, toggleable from `/enroll/admin` settings.

### 1. Database (migration)
- `admin_settings`: add `rafieipay_enabled boolean default false`.

### 2. Secret
- Add `RAFIEIPAY_SECRET` (the API Secret `d90b5…9740`) via the secrets tool. The API Key is non-secret and will live in the edge function as a constant (or `RAFIEIPAY_API_KEY` secret if preferred).

### 3. Edge functions (new)
- `supabase/functions/_shared/rafieipay.ts` — HMAC-SHA256 signer (`X-API-Key`, `X-Timestamp`, `X-Signature` over `${ts}.${rawBody}`), `POST` helper to `https://pay.rafiei.co${path}`.
- `supabase/functions/rafieipay-request/index.ts` — mirrors `zibal-request`: creates enrollment / test_enrollment with `payment_method='rafieipay'`, calls `/functions/v1/payments-request` with `amount_toman`, `order_id` = enrollment id, `description`, `callback_url` (success page with `gateway=rafieipay`), `customer`. Stores returned reference (e.g., `r.order_id` / token) in the existing `zarinpal_authority` column for tracking. Returns `paymentUrl` from `r.payment_url`.
- `supabase/functions/rafieipay-verify/index.ts` — called from success page. Verifies via Rafiei Pay verify endpoint (`/functions/v1/payments-verify` with `order_id` / token), updates enrollment `payment_status` to `completed` + ref id on success; mirrors existing `zibal-verify`.
- `supabase/functions/invoice-rafieipay-payment/index.ts` and `invoice-rafieipay-verify/index.ts` — parallel to `invoice-zibal-*` for invoice flow (only if user wants invoices supported too — see Open question).
- `config.toml`: register new functions with `verify_jwt = false` like the Zibal ones.

### 4. Frontend
- `src/components/Admin/AdminSettingsPanel.tsx`: add Rafiei Pay toggle bound to `rafieipay_enabled`; extend the gateway selector update logic to a 3-way switch.
- `src/pages/Enroll.tsx`:
  - Extend `paymentMethod` type to include `'rafieipay'`.
  - Show Rafiei Pay option when `rafieipay_enabled`.
  - In submit handler choose function name: `rafieipay` → `rafieipay-request`.
- Success page: handle `gateway=rafieipay` → call `rafieipay-verify`.
- `InvoiceView.tsx` + `ManualPaymentSection.tsx`: read `rafieipay_enabled` and render the option (only if invoice support included).

### Technical details
- Signing exactly as documented: HMAC-SHA256 of `` `${ts}.${rawBody}` `` with `RAFIEIPAY_SECRET`, hex-encoded, sent in `X-Signature`. Timestamp in seconds.
- Amount sent as **Toman** (per Rafiei Pay docs `amount_toman`), unlike Zibal where we multiply by 10.
- Callback URL: `https://academy.rafiei.co/enroll/success?course=…&enrollment=…&gateway=rafieipay`.
- Rafiei Pay will POST/GET back to callback with its own params; verify call confirms final status before marking enrollment complete.

### Open questions
1. Do you want Rafiei Pay also available for **invoice** payments (InvoiceView), or only for enroll/checkout?
2. What is the exact **verify endpoint path & request body** on Rafiei Pay (`/functions/v1/payments-verify`?), and which field returns the final `ref_id` / status? The doc you pasted only shows request. I'll mirror Zibal's pattern but need the verify shape — or I can call `payments-verify` with `{ order_id }` and treat `status === 'paid'` (or similar) as success; please confirm.
3. Confirm the callback query params Rafiei Pay appends (e.g., `order_id`, `status`, `ref_id`) so the success page knows what to forward to the verify function.
