# DojoHub - Whitelabel SaaS Transformation Plan

> **Reference Document** - Created: 2026-01-28  
> Resume work with this plan when continuing the SaaS transformation.

---

## Project Overview

Transform **Sport of Kings** (BJJ gym management app) into **DojoHub** - a multi-tenant SaaS platform where martial arts gyms can sign up and get their own branded instance.

---

## Current State (What Exists)

| Category | Features |
|----------|----------|
| **Tech Stack** | Next.js 16 + Supabase + Stripe + Tailwind |
| **Database** | 14 tables with RLS policies |
| **Admin Portal** | 18 modules (Members, Classes, Finance, Events, Videos, etc.) |
| **Member Dashboard** | Profile, Belt Progress, Classes, Attendance, Check-in |
| **Billing** | Stripe subscriptions, event payments, promo codes |
| **Multi-location** | Per-location configs (already supports multiple gyms!) |
| **Family Accounts** | Parent/child registration, profile switching |

---

## Multi-Tenancy Strategy

**Approach**: Column-based with `tenant_id` on every table (vs schema-per-tenant)

### New `tenants` Table

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,      -- subdomain: "ironmonger" → ironmonger.dojohub.com
  custom_domain TEXT UNIQUE,       -- optional custom domain
  logo_url TEXT,
  primary_color TEXT DEFAULT '#C5A456',
  secondary_color TEXT DEFAULT '#1A1A1A',
  owner_user_id UUID REFERENCES auth.users(id),
  stripe_account_id TEXT,          -- Stripe Connect for payouts
  subscription_tier TEXT DEFAULT 'free',  -- free, pro, enterprise
  subscription_status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tables Requiring `tenant_id`

All 14 existing tables need migration:
- `profiles`, `locations`, `membership_types`, `memberships`
- `waitlist`, `instructors`, `classes`, `attendance`
- `belt_progression`, `videos`, `events`, `event_rsvps`
- `announcements`, `naseeha`

---

## Implementation Phases

### Phase 1: Multi-Tenancy Foundation
- [ ] Create `tenants` table
- [ ] Add `tenant_id` to all tables
- [ ] Rewrite RLS policies with tenant filtering
- [ ] Implement middleware tenant resolution
- [ ] Update all Supabase queries

### Phase 2: Theming & Branding
- [ ] Create tenant settings table
- [ ] Build dynamic CSS variable system
- [ ] Logo/branding upload
- [ ] Custom domain support

### Phase 3: SaaS Onboarding
- [ ] Gym owner signup flow
- [ ] Tenant provisioning system
- [ ] Stripe Connect integration
- [ ] Subscription tier gating

### Phase 4: Super Admin Dashboard
- [ ] Platform admin interface
- [ ] Tenant management
- [ ] Platform-wide analytics

### Phase 5: Polish & Launch
- [ ] Marketing landing page
- [ ] Documentation
- [ ] Demo tenant

---

## Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/add_tenants.sql` | NEW | Tenant table + migrations |
| `src/lib/tenant.ts` | NEW | Tenant resolution utilities |
| `src/middleware.ts` | MODIFY | Add tenant resolution |
| `src/components/TenantProvider.tsx` | NEW | React context for tenant |
| `src/lib/supabase/server.ts` | MODIFY | Add tenant context to queries |
| `src/app/superadmin/` | NEW | Platform admin dashboard |

---

## Open Decisions

1. **Subdomain strategy**: `gym.dojohub.com` vs `dojohub.com/gym`
2. **Existing data**: Sport of Kings becomes Tenant #1?
3. **Feature flexibility**: Abstract belt ranks to configurable "levels"?
4. **Pricing tiers**: What features gate behind Pro/Enterprise?

---

## Quick Resume Commands

```bash
# Start development
cd c:\Users\user\dev\soknew
npm run dev

# View current schema
cat supabase/schema.sql

# Check Supabase migrations
ls supabase/migrations/
```
