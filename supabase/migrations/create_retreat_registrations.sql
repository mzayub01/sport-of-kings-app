-- Registrations for the Suhba Retreat 2026 (Marrakech).
-- Rows are inserted by the server (service role) via /api/retreat/register;
-- the Stripe webhook marks them paid. Admins read them in /admin/retreat.
create table public.retreat_registrations (
  id uuid primary key default gen_random_uuid(),
  retreat_year int not null default 2026,
  lead_name text not null,
  lead_email text not null,
  lead_phone text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  adults int not null default 0,
  children_10_15 int not null default 0,
  children_under_10 int not null default 0,
  -- [{ name, category: 'adult'|'child_10_15'|'child_under_10', age, medical }]
  attendees jsonb not null default '[]',
  notes text,
  total_amount int not null, -- in pence
  status text not null default 'pending', -- pending | paid | cancelled
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.retreat_registrations enable row level security;

-- Admins can view and manage registrations from the admin area
create policy "Admins can manage retreat registrations"
  on public.retreat_registrations for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create index idx_retreat_registrations_status on retreat_registrations(status);
create index idx_retreat_registrations_email on retreat_registrations(lead_email);

create trigger update_retreat_registrations_updated_at
  before update on retreat_registrations
  for each row execute function update_updated_at();
