# DojoHub SaaS Platform - Setup Guide

> Complete guide to set up a new DojoHub instance with Supabase, Stripe, and Vercel.

---

## 📁 Project Structure

```
c:\Users\user\dev\
├── soknew/              ← Sport of Kings (production gym)
└── dojohub/             ← DojoHub SaaS platform (NEW)
```

---

## 1️⃣ Supabase Setup

### Create New Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose organization and enter:
   - **Name**: `dojohub-saas`
   - **Database Password**: (generate and save securely)
   - **Region**: Choose closest to your users

### Configure Database Schema

Run the existing migrations in order:

```bash
# From the dojohub folder
cd c:\Users\user\dev\dojohub

# Connect to Supabase CLI (if not already)
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or manually run `supabase/schema.sql` in the SQL Editor.

### Get Credentials

From **Project Settings → API**:

| Variable | Location |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (keep secret!) |

---

## 2️⃣ Stripe Setup

### Create New Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create a new account specifically for DojoHub platform billing
3. Complete business verification

### Enable Stripe Connect (for multi-tenant)

This allows each gym (tenant) to receive their own payments:

1. Go to **Settings → Connect Settings**
2. Enable **Standard** or **Express** accounts
3. Configure your platform branding
4. Set your platform fee percentage (e.g., 5%)

### Create Products & Prices

For DojoHub platform subscriptions (what gym owners pay):

| Plan | Monthly Price | Features |
|------|--------------|----------|
| **Free** | £0 | Basic features, limited members |
| **Pro** | £49/month | Unlimited members, analytics |
| **Enterprise** | £149/month | Multi-location, API access |

Create these in **Products** section and note the `price_id` values.

### Get Credentials

From **Developers → API Keys**:

| Variable | Key Type |
|----------|----------|
| `STRIPE_SECRET_KEY` | Secret key (sk_live_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (pk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | From webhook endpoint (whsec_...) |

### Set Up Webhook

1. Go to **Developers → Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `account.updated` (for Connect)

---

## 3️⃣ Vercel Deployment

### Create New Project

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import the `dojohub` Git repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`

### Add Environment Variables

Add all variables in **Settings → Environment Variables**:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://dojohub.com
```

### Configure Domain

1. Go to **Settings → Domains**
2. Add your domain: `dojohub.com`
3. For wildcard subdomains (tenant routing): `*.dojohub.com`

---

## 4️⃣ Environment Variables Template

Create `.env.local` in the dojohub folder:

```env
# ===========================================
# DOJOHUB SAAS PLATFORM - ENVIRONMENT CONFIG
# ===========================================

# Supabase (NEW project for DojoHub)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (NEW account for platform billing)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email Service
RESEND_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 5️⃣ Local Development

```bash
# Navigate to dojohub
cd c:\Users\user\dev\dojohub

# Install dependencies
npm install

# Copy environment template
copy .env.example .env.local
# Then fill in the values

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## 6️⃣ Push to GitHub

```bash
cd c:\Users\user\dev\dojohub

# Create new GitHub repository first, then:
git remote add origin https://github.com/YOUR_USERNAME/dojohub.git
git branch -M main
git push -u origin main
```

---

## ✅ Setup Checklist

- [ ] Created new Supabase project
- [ ] Ran database migrations
- [ ] Created new Stripe account
- [ ] Enabled Stripe Connect
- [ ] Created platform subscription products
- [ ] Set up Stripe webhook
- [ ] Created Vercel project
- [ ] Added all environment variables
- [ ] Configured domain/subdomain routing
- [ ] Pushed to GitHub
- [ ] First successful deployment

---

## 🔗 Quick Links

| Service | Dashboard |
|---------|-----------|
| Supabase | [app.supabase.com](https://app.supabase.com) |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) |
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Resend | [resend.com](https://resend.com) |
