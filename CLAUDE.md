# Sport of Kings — developer notes

UK martial-arts club platform (BJJ, "Seerat Un Nabi"). Next.js 16 App Router + React 19,
Supabase (RLS), Stripe, Resend. Styling: CSS variables + inline styles from
`src/styles/globals.css` (gold `#C5A456` / dark-green `#1B4332` brand); no component library.

## Deploy & database workflow

- Pushing to `master` auto-deploys to production via Vercel. Commit only when asked.
- **Migrations are applied MANUALLY** by the admin in the Supabase SQL editor. There is no
  migration runner. When adding a file under `supabase/migrations/`, always tell the user to
  run it and say what breaks until they do.
- Local `.env.local` has Supabase + Resend keys but **no Stripe keys** — checkout locally
  always reports "payment not available". That is expected; Stripe works only in production.

## Conventions that prevent real bugs

- **Dates**: never derive a `YYYY-MM-DD` via `toISOString()` (UTC shift breaks BST).
  Use `src/lib/dates.ts`: `toLocalDateString()` client-side, `ukDateString()` /
  `ukDayOfWeek()` / `ukMinutesOfDay()` in API routes (servers run UTC; club runs Europe/London).
- **Money**: units are inconsistent — `membership_types.price` is **pounds** (the schema
  comment claiming pence is wrong); `events.price` and everything in `src/lib/retreat.ts`
  are **pence**. Check before formatting or multiplying by 100.
- **IDs**: `selectedProfileId` / `profileId` in dashboard code hold `profiles.user_id`
  (auth id), NOT `profiles.id`. `parent_guardian_id` references `profiles.id`. Easy to cross-wire.
- **Children**: child profiles have their own `user_id`; emails for children go to the
  parent (`parent_guardian_id` → parent profile's email).
- **Class model**: no per-session table — classes are weekly templates
  (`day_of_week` + times); attendance keys on `(class_id, user_id, class_date)`.
  Each location trains on exactly ONE day of the week.
- **Class↔tier access**: `class_membership_types` junction; a class with no rows is open
  to every tier at its location.
- **Admin API routes**: authenticate with the session client (`createClient`), check
  `profiles.role === 'admin'`, then use `createAdminClient()` (service role) for data.
  Never ship an unauthenticated route that can mutate Stripe or member data.
- **Emails**: React-email templates in `src/lib/email-templates/` (export component +
  `render...` fn, re-export in `index.ts`), sent via `sendEmail()` (Resend), reply-to
  `sportofkings786@gmail.com` (the club's support address everywhere).
- **Membership status**: enum `active|inactive|pending|cancelled|waitlist|payment_failed`.
  Setting `cancelled` on a membership with `stripe_subscription_id` MUST go through
  `/api/stripe/cancel` (cancels Stripe first) — the admin UI does this; keep it that way.

## Feature map (beyond the obvious pages)

- **QR check-in**: `/checkin/[locationId]` (family multi-check-in); printable posters from
  Admin → Locations. Check-in window: 1h before class → class end, enforced server-side in
  `/api/attendance/checkin`.
- **Attendance Overview**: `/admin/attendance-overview` — last-6-sessions grid per class,
  trends vs 4-week average, absent regulars, CSV. Cells deep-link to Class Roster
  (`?classId=&date=`).
- **Retreat 2026**: `/retreat-2026` public campaign page + party checkout
  (`/api/retreat/register`, prices/dates in `src/lib/retreat.ts`), capacity in
  `retreat_settings` (people not bookings; pending checkouts hold places 30 min),
  admin at `/admin/retreat`. Public availability API hides counts unless ≤12 remain.
- **Getting Started email**: Admin → Members envelope icon → `/api/admin/send-getting-started`;
  sends class times + Gi order form + etiquette; logged in `member_email_log` with a
  sent badge and repeat-send warning.
- **Stripe reconciliation**: Admin → Memberships → "Check Stripe sync"
  (`/api/admin/stripe-reconcile`) flags subscriptions still billing without an active membership.
- **Stripe webhook** (`/api/stripe/webhook`): memberships (subscription lifecycle incl.
  `payment_failed` after 3 attempts + recovery to active), event payments, retreat payments
  (`metadata.type` discriminates).

## Operational gotchas

- New location setup: every membership tier needs `stripe_price_id` (monthly recurring,
  live mode) or the dashboard "Complete Payment" flow blocks — registration/add-child fall
  back to inline price_data, so failures look tier-specific when they're flow-specific.
- Old members with no active membership see a "Complete Your Membership" banner on the
  dashboard; the webhook activates memberships on successful checkout.
- `retreatpromo/` is a gitignored local video workspace (ffmpeg promo builds) — never commit it.
- Design context for UI work: `PRODUCT.md` (root); attendance UX critique history in
  `.impeccable/critique/`.
