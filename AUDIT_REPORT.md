# Om Design & Classes — Security, Performance & Scalability Audit

**Date:** 2026-09-04  
**Scope:** Code and migrations in this repository as read on disk. Live Supabase dashboard settings (Auth password policy, Advisors, plan tier) were **not** accessible from this environment and are called out explicitly where needed.  
**Method:** Evidence tied to specific files/lines. This is an audit-only pass — **no code was modified**.

**README cross-check:** `README.md` still documents phone/OTP login (lines 36–39, 167–170) and an unfinished “Buy Now” stub (judgment call #9). The codebase has since moved to email/password auth (`src/lib/auth.js`, `src/pages/Login.jsx`) and live Razorpay Edge Functions. Treat README as partially stale relative to current auth/checkout.

**Parallel step (dashboard):** In the Supabase project dashboard, run **Security Advisor** and **Performance Advisor**. They catch live-DB issues (missing RLS, function `EXECUTE` grants, missing indexes, `search_path`) that complement this repo review. This audit cannot replace that.

---

## 1. Security audit

### RLS inventory (from migrations)

Every app table created under `supabase/migrations/` has `ENABLE ROW LEVEL SECURITY`. End-state policies:

| Table | RLS | Policies (source) | Concrete client query implication |
|-------|-----|-------------------|-----------------------------------|
| `profiles` | on | own select/update (`001:69-70`); admin read/update via `is_admin()` (`003:26-30`) | User A: `select * from profiles where id = '<B>'` → empty (unless admin). |
| `designs` | on | public select `is_active = true` (`001:72`); admin write (`001:73-75`) | Inactive designs not readable by anon/customer. |
| `categories` | on | public select all (`001:77`); admin write (`001:78-80`) | OK for catalog. |
| `wishlists` | on | `auth.uid() = user_id` for all (`001:82`) | User cannot read/write another user’s rows. |
| `orders` | on | own select (`005:13-14`); admin all (`005:16-17`) | No client insert policy — inserts must be service-role (Edge Functions). Matches README judgment #18 intent. |
| `offers` | on | admin all only (`007:32-33`); comment says no public select (`007:28-30`) | Customers cannot list offers from PostgREST; validation goes through Edge Function. |
| `wallet_transactions` | on | own select (`008:26-27`); admin select (`008:29-30`); **no insert/update/delete policies** (`008:32-33`) | Clients cannot forge ledger rows via RLS. |
| `subcategories` | on | public select (`009:21-22`); admin write (`009:24-25`) | OK. |
| `carousel_slides` | on | public select `is_active` (`011:18-19`); admin all (`011:21-22`) | OK. |
| `design_types` | on | public select **`using (true)`** (`013:16-17`); admin write (`013:20-21`) | Inactive types still publicly readable (see Low finding). |
| `admissions` | on | **admin all only** (`014:47-49`) | No public insert. Admin form uses authenticated admin client (`src/lib/admin.js` `createAdmission`). |
| `admission_fee_installments` | on | admin all (`014:51-53`) | Same. |

`is_admin()` (`003_admin_profiles_access.sql:14-24`): `security definer`, `search_path = public`, checks `profiles.role = 'admin'` for `auth.uid()`.

**Storage buckets** (`004`, `014`, `015`):

| Bucket | Public? | Policies |
|--------|---------|----------|
| `product-images` | yes | public select; admin insert/update/delete |
| `design-files` | no | admin all only — no buyer read policy (signed URL via Edge Function) |
| `admission-photos` | no | admin select (`014:70-72`); admin insert/update (`015:3-9`); **no delete policy in migrations** |

Signed URLs for admission assets: `getAdmissionAssetSignedUrl` in `src/lib/admin.js` (~450+) uses `createSignedUrl` on `admission-photos`. Design downloads: `request-order-download-url` Edge Function.

---

### [Severity: Critical] `adjust_wallet_balance` is security definer with no `REVOKE` / caller guard in migrations

**File:** `supabase/migrations/008_wallet.sql`, lines 1–5 (intent), 69–111 (function)

**What I found:** Comment states the helper is “called only from service-role Edge Functions.” The function is `security definer` and updates any `p_user_id` balance after `FOR UPDATE`, with **no** check that `auth.uid()` is an admin or that the caller is the service role. Unlike `lookup_email_by_phone` (`017:55-56`), this migration never `REVOKE`s `EXECUTE` from `PUBLIC`/`anon`/`authenticated`.

**Why it matters:** On default Supabase grants, authenticated clients can often call `rpc('adjust_wallet_balance', { p_user_id: self, p_amount: 99999, p_type: 'admin_credit' })` and credit themselves. RLS on `wallet_transactions` does not block a security-definer insert. **This must be verified on the live DB** (Security Advisor / `has_function_privilege`); absence of revoke in migrations is already a concrete defect relative to the stated intent.

**Suggested fix (not applied):**  
`REVOKE ALL ON FUNCTION public.adjust_wallet_balance(...) FROM PUBLIC, anon, authenticated;`  
Grant execute only to `service_role` (or wrap with an explicit `auth.uid()` / role check inside the function). Same review for `increment_offer_usage` / `consume_order_offer_usage` in `007_offers.sql`.

---

### [Severity: Critical] Users can likely self-promote via `profiles.role` update

**File:** `supabase/migrations/001_initial_schema.sql`, line 70  
**Also:** `src/lib/auth.js`, lines 189–198 (`updateProfile` strips only `wallet_balance`, not `role`)

**What I found:** Policy `"update own profile"` is `for update using (auth.uid() = id)` with no column restriction. Wallet is protected by trigger `protect_wallet_balance` (`008:48-67`). **There is no equivalent trigger/policy blocking `role` changes.** A crafted client call:

```js
supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
```

is not prevented by anything read in migrations. UI (`Account.jsx:45-48`) only sends name/email/phone, but security must not rely on UI honesty. Admin UI role changes go through `updateUserRole` (`admin.js:542-545`) which also relies on RLS `is_admin()` — after self-promotion, that gate opens.

**Why it matters:** Full admin panel + wallet credit + admissions access.

**Suggested fix (not applied):** Trigger (like wallet) that reverts `NEW.role := OLD.role` unless `is_admin()` or a privileged GUC; or split `role` into a table only admins can write; strip `role` in a `BEFORE UPDATE` always for non-admin.

---

### [Severity: High] `lookup_email_by_phone` is callable by `anon` and returns emails

**File:** `supabase/migrations/017_auth_email_password.sql`, lines 23–56  
**Used by:** `src/lib/auth.js`, lines 37–49 (`resolveLoginEmail`)

**What I found:** Security-definer RPC returns `profiles.email` for a phone match and is granted to `anon, authenticated` (`017:55-56`).

**Why it matters:** Anyone can probe phones → emails (`select lookup_email_by_phone('+9198...')`). Helps targeted phishing / account correlation. Login still needs password, but enumeration is real.

**Suggested fix (not applied):** Remove public RPC; resolve phone→email only inside a hardened Edge Function with rate limits; or return boolean existence without email (still leaks existence) / require password attempt without email disclosure.

---

### [Severity: High] Signup error leaks registered email

**File:** `src/lib/auth.js`, lines 84–88

**What I found:** On `signUp` error, if message includes `"already registered"`, client shows: “An account with this email already exists. Try signing in.”

**Why it matters:** Account enumeration (contrast with login’s generic error at lines 7, 135–136 and forgot-password messaging in `Login.jsx:153-155`).

**Suggested fix (not applied):** Always return a generic “If this email can be used, we sent a confirmation / try signing in” style message; rely on Supabase’s silent duplicate behavior where possible.

---

### [Severity: Medium] `next_admission_form_number` granted to all `authenticated`

**File:** `supabase/migrations/015_admission_admin_upload.sql`, line 11

**What I found:** `grant execute on function public.next_admission_form_number() to authenticated;`

**Why it matters:** Any logged-in customer can burn sequence numbers (`rpc('next_admission_form_number')`), creating gaps / DoS on form numbering. Admin create path needs it; customers do not.

**Suggested fix (not applied):** Revoke from `authenticated`; grant only to `service_role`, or check `is_admin()` inside the function.

---

### [Severity: Medium] Dead public `submit-admission` Edge Function (`verify_jwt = false`)

**File:** `supabase/functions/submit-admission/config.toml` (`verify_jwt = false`); `index.ts` lines 61–91 (rate limit + honeypot), 77–80 (service role)

**What I found:** Function is public intake with in-memory IP rate limit (5/min) and honeypot. **No app caller** — admissions are created via `createAdmission` in `src/lib/admin.js` (~496+) under admin RLS. If this function is still deployed, it is an unused but live write surface (service role inserts + storage uploads).

**Why it matters:** Diverges from README’s implied “Edge Function with abuse protection” public path; admin path is actually safer (admin-only RLS) but the orphan function is risk if left deployed.

**Suggested fix (not applied):** Undeploy/disable `submit-admission`, or wire the public form to it exclusively and remove direct client inserts.

---

### [Severity: Medium] In-memory rate limit on Edge Functions is per-isolate only

**File:** `supabase/functions/submit-admission/index.ts`, lines 7–9, 35–45

**What I found:** `ipHits = new Map()` in the isolate. Cold starts / multiple instances reset or shard the map.

**Why it matters:** Not a durable abuse control under real load (even if function stays deployed).

**Suggested fix (not applied):** Supabase / Cloudflare rate limits, Redis/Upstash, or DB-backed counters.

---

### [Severity: Medium] `validate-offer` trusts client `order_amount` and has no auth

**File:** `supabase/functions/validate-offer/index.ts` (no JWT; uses service role); shared note in `_shared/offers.ts` that charge-time revalidation is required

**What I found:** Preview endpoint accepts client amount. Charge paths **do** revalidate: `create-razorpay-order/index.ts:59-85`, `purchase-with-wallet` similarly.

**Why it matters:** UI can be lied to; money path is OK **if** all checkouts stay on those two functions. No rate limit on validate-offer → offer probing / load.

**Suggested fix (not applied):** Pass `design_id` only and compute amount server-side; add rate limiting.

---

### [Severity: Medium] npm audit: production deps are moderate-only; full tree reported 1 high in an earlier run

**Commands run:** `npm audit` (full tree) and later `npm audit --omit=dev` (2026-09-04).

**What I found:**

- Full audit summary (earlier run): `33 vulnerabilities (32 moderate, 1 high)`.
- Production-only (`--omit=dev`): `31 moderate severity vulnerabilities` — **no high/critical** in that run (exit code 1 only because vulns exist).
- Listed production-relevant packages: `@tiptap/core` ≤3.30.3 (GHSA-cp6q-959q-f8rh); `react-router` / `react-router-dom` (GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg).
- `esbuild` via `vite` (GHSA-67mh-4wv8-2f99) is a **dev-server** concern, not the shipped customer bundle.

**Suggested fix (not applied):** `npm audit fix` for non-breaking bumps; upgrade `@tiptap/*` and React Router; treat Vite/esbuild as a local-dev hardening item.

---

### [Severity: Medium] Password complexity is client-only in app code; dashboard policy unverified

**File:** `src/lib/password.js`, lines 1–18 (min 8, letter + number)  
**Also:** `src/lib/auth.js` signup/updatePassword call `validatePassword` before `supabase.auth.signUp` / `updateUser`

**What I found:** Enforcement in the SPA. **Cannot confirm** Supabase Auth → Providers → Email → minimum password length / complexity from this environment.

**Why it matters:** API clients can call Auth signup with weak passwords if dashboard policy is default/weak.

**Suggested fix (not applied):** Set Auth password requirements in dashboard to at least match `password.js`; document the setting.

---

### [Severity: Low] `design_types` public read includes inactive rows

**File:** `supabase/migrations/013_design_types.sql`, lines 16–17 — `using (true)`

**Why it matters:** Minor info disclosure of inactive type names vs carousel/designs which filter `is_active`.

**Suggested fix (not applied):** `using (is_active = true)` for public select; admin policy already covers all.

---

### [Severity: Low] Leftover phone OTP stub still in tree

**File:** `src/lib/mockAuth.js` (entire file — `sendOtp`/`verifyOtp`)  
**Checked:** `src/lib/auth.js` no longer exports OTP; `Login.jsx` uses email/password only. Grep shows `sendOtp`/`verifyOtp` only in `mockAuth.js`.

**Why it matters:** Not reachable from current UI, but dead auth-shaped code can confuse future wiring. Not currently exploitable via routes read.

**Suggested fix (not applied):** Delete or clearly quarantine `mockAuth.js`; update README auth section.

---

### [Severity: Low] Admission storage: no delete policy

**File:** Policies in `014`/`015` — select/insert/update only for `admission-photos`

**Why it matters:** Admin cleanup of orphaned uploads (`removeAdmissionAssets` in `admin.js`) may fail under RLS for authenticated admin unless Storage allows delete. **Uncertain without live policy test** — `remove()` might error silently.

**Suggested fix (not applied):** Add admin delete policy mirroring product-images.

---

### Checked, no issue found (Security)

- **XSS on product description:** `DesignDetail.jsx:391` uses `dangerouslySetInnerHTML` with `sanitizeHtml()` from `src/lib/html.js:14-19` (DOMPurify `USE_PROFILES.html`). Sanitization is applied at render time, not merely planned.
- **Admission text fields:** Admin detail/print render student fields as React text nodes (`AdmissionDetail.jsx` `FieldRow`, `AdmissionPrintDocument.jsx` field lines) — no `dangerouslySetInnerHTML` found for admission content.
- **Frontend secrets:** Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID` (`.env.example`). Appropriate to be public. Razorpay secret / service role only in Edge `Deno.env` (e.g. `create-razorpay-order/index.ts:52-55`, `razorpay-webhook/index.ts:31-33`).
- **Login error enumeration:** `GENERIC_LOGIN_ERROR` always on failure (`auth.js:135-136`).
- **Forgot password UX:** `Login.jsx:153-155` always shows “If an account exists…” after successful API return.
- **Razorpay money paths:** JWT `getUser` + DB price + offer revalidation at charge (`create-razorpay-order/index.ts:40-85`). Webhook HMAC on raw body (`razorpay-webhook/index.ts:39-49`). Payment signature verify in `verify-razorpay-payment`.
- **Admin Edge Function role check:** `admin-credit-wallet/index.ts:56-67` explicitly requires `profiles.role === 'admin'` because service role bypasses RLS.
- **Admin UI gate:** `AdminRoute.jsx:18-23` requires session + `profile.role === 'admin'`.
- **Orders/wishlist cross-user reads:** Policies constrain to `auth.uid()`; no client insert on orders.
- **Private buckets:** `design-files` / `admission-photos` have no public read policies in migrations.
- **MSG91:** No MSG91 Edge Function or hook exists in this repo (README SMS notes are generic). Nothing to verify for MSG91 signatures.

---

## 2. Performance audit

### Bundle size (`npm run build`, 2026-09-04)

Notable chunks (actual output):

| Chunk | Size | gzip |
|-------|------|------|
| `index-*.js` (main) | 584.88 kB | 177.29 kB |
| `AdmissionDetail-*.js` | 616.27 kB | 183.80 kB |
| `Products-*.js` | 433.48 kB | 137.89 kB |
| `index.es-*.js` | 151.02 kB | 51.70 kB |
| Most route chunks | 1–17 kB | — |

Vite warned chunks > 500 kB. Lazy routes in `App.jsx` **do** produce separate chunks (Login, ResetPassword, admin pages, etc. appear as distinct assets).

### [Severity: High] Admission PDF deps inflate AdmissionDetail chunk (~616 kB)

**File:** `src/pages/admin/AdmissionDetail.jsx` imports PDF export stack; `package.json` has `html2canvas`, `jspdf`

**Why it matters:** Opening any admission detail downloads ~600 kB+ even if user never exports PDF.

**Suggested fix (not applied):** Dynamic `import()` of PDF modules only inside the download handler / modal open.

### [Severity: Medium] Products admin chunk ~433 kB (TipTap)

**File:** `src/pages/admin/Products.jsx` + TipTap dependencies

**Why it matters:** Expected for rich text, but largest non-PDF admin cost; only load editor when modal opens.

### [Severity: Medium] Unbounded list queries (no `.limit()`)

**Files / evidence:**

- `src/lib/catalog.js:60-97` — `fetchDesigns` selects `*` with filters, **no pagination**.
- `src/lib/admin.js:379-386` — `fetchAllAdmissions` `select('*')` ordered, no limit.
- `src/lib/admin.js:321-328` — `fetchAllDesigns` unbounded.
- `src/lib/admin.js:140-165` — `fetchOrdersAdmin` unbounded.
- `src/lib/admin.js:114-121` — dashboard pulls all order `amount, status, created_at` into the client to aggregate.

**Why it matters:** Real growth turns catalog/admin into multi‑MB responses and slow mobiles.

**Suggested fix (not applied):** Cursor/offset pagination; SQL aggregates for dashboard counts/revenue.

### [Severity: Medium] Missing indexes on common FK filters

**What I found in migrations:** Explicit indexes include `admissions_status_idx`, `admissions_submitted_at_idx`, `designs_design_type_id_idx`, `designs_design_id_idx`, orders razorpay unique. **No** `CREATE INDEX` on:

- `designs.category_id`
- `designs.subcategory_id`
- `orders.user_id`
- `wallet_transactions.user_id`

(`wishlists` PK `(user_id, design_id)` already supports user_id lookups.)

**Suggested fix (not applied):** Add btree indexes; confirm with Performance Advisor.

### [Severity: Low] Product images not resized on upload

**File:** `src/lib/admin.js:353-359` `uploadProductImage` — uploads file as-is to `product-images`, returns `getPublicUrl`.

**Why it matters:** Full-resolution uploads served to catalog cards (`Card.jsx` uses `loading="lazy"` but still full URL).

**Suggested fix (not applied):** Image transform pipeline / Supabase Image Transformation / client compress before upload; separate thumbnail URLs.

### [Severity: Low] Render-blocking Google Fonts

**File:** `index.html`, lines 13–18 — stylesheet link to Google Fonts (Fraunces + Manrope) with `preconnect`, but CSS still blocks first paint.

**Suggested fix (not applied):** `font-display: swap` already in URL (`display=swap`); consider self-hosting / subsetting / optional delay.

### Checked, no issue found (Performance)

- **`loading="lazy"`:** Present on `Card.jsx:29`, `CategoryCard.jsx:19`, `OwnersGrid.jsx:35`, Contact map iframe (`Contact.jsx:203`). Matches README Phase 6 claim for catalog cards.
- **Route-level code splitting:** Confirmed by separate built chunks for lazy routes in `App.jsx`.
- **N+1 in catalog list:** Single query with embeds (`categories(...)`), not per-row fetches in `fetchDesigns`.
- **Re-renders:** Spot-check only — no clear proven hot-path churn documented without React Profiler; not inventing memoization recommendations. **Uncertain** for Products modal without a profiled session.

---

## 3. Load & scalability audit

### Rate limiting coverage

| Endpoint / path | Rate limit in code? | Notes |
|-----------------|---------------------|-------|
| `submit-admission` | Yes, in-memory Map | Unused by app; weak under multi-isolate |
| Login / signup / reset | Relies on Supabase Auth | Not implemented in app |
| `validate-offer` | No | Public-ish with service role |
| `create-razorpay-order` / wallet purchase | No app-level | Auth required |
| Admin `createAdmission` | No | Admin-only RLS |

### [Severity: High] Concurrent wallet debit locking — intent matches code

**File:** `supabase/migrations/008_wallet.sql:85-96`

**What I found:** `PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE` **before** balance check and update. Offer usage: `007_offers.sql` `increment_offer_usage` / `consume_order_offer_usage` use `FOR UPDATE` on offer/order rows before increment.

**Checked, no issue found** on lock ordering **inside those functions** — assuming they are not callable by untrusted roles (see Critical grant finding).

### [Severity: Medium] Admission / Razorpay payloads and timeouts

**What I found:** Admin admission uploads photo + signature + up to 2 Aadhaar data-URLs then storage uploads sequentially (`admin.js` createAdmission). Large images (2 MB × N) as base64 inflate request memory. Edge `submit-admission` same pattern if used. Razorpay create order does external HTTP (`create-razorpay-order/index.ts:97+`).

**Why it matters:** Edge Function wall-clock limits / browser hangs under slow networks. **Uncertain without production latency data.**

**Suggested fix (not applied):** Direct-to-storage upload with signed upload URLs; keep Edge payloads small.

### [Severity: Medium] Supabase plan limits — not determinable from repo

**What I found:** No plan tier in source. `.temp` CLI cache is local only.

**Suggested fix (not applied):** Check dashboard billing: Auth rate limits, Edge invocations, DB connections, storage egress. Free tier will bite first on Edge cold starts + Auth email.

### Checked, no issue found (Load)

- Offer consumption uses row locks before increment (migration code).
- Order inserts go through service role Edge Functions, not open client inserts.

---

## Priority order (recommended)

1. **Verify live grants** for `adjust_wallet_balance` / offer RPCs; revoke from anon/authenticated if present (Critical).  
2. **Block `profiles.role` self-update** (Critical).  
3. **Tighten `lookup_email_by_phone` + signup enumeration** (High).  
4. **Lazy-load PDF / TipTap** and add pagination (High/Medium performance).  
5. **Add missing FK indexes**; run Performance Advisor.  
6. **Disable unused `submit-admission`** or adopt it as the only public path.  
7. **`npm audit fix`** / dependency upgrades.  
8. Confirm Auth password policy in dashboard.  
9. Image resize pipeline; font hosting polish.

---

## Appendix — Commands run

```text
npm audit
→ full tree earlier: 33 vulnerabilities (32 moderate, 1 high)
→ --omit=dev: 31 moderate (no high/critical); exit code 1 = vulns present
→ listed: @tiptap/core tree, react-router(-dom); esbuild/vite is primarily a dev concern

npm run build
→ AdmissionDetail ~616 kB, index ~585 kB, Products ~433 kB
→ route-level chunks present for lazy pages
```

## Appendix — README vs code drift (informational)

| README claim | Current code |
|--------------|--------------|
| Phone OTP login | Email/password + reset (`auth.js`, `Login.jsx`) |
| Buy Now stub | Razorpay + wallet Edge Functions exist |
| MSG91 / SMS provider | Not present in `supabase/functions/` |
| Public admission via Edge + honeypot | Function exists but admin direct insert is what the UI uses |
