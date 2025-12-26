-- Drop table first to ensure clean state (force schema update)
drop table if exists public.event_rsvps cascade;

-- Create event_rsvps table
create table public.event_rsvps (
    id uuid not null default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    full_name text not null,
    email text not null,
    status text not null default 'confirmed',
    created_at timestamptz not null default now(),
    primary key (id)
);

-- Enable RLS
alter table public.event_rsvps enable row level security;

-- Policies
-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Admins can view all rsvps" on public.event_rsvps;
drop policy if exists "Users can view their own rsvps" on public.event_rsvps;
drop policy if exists "Anyone can insert rsvp" on public.event_rsvps;

-- Admins can view all
create policy "Admins can view all rsvps"
    on public.event_rsvps
    for select
    using (
        exists (
            select 1 from public.profiles
            where user_id = auth.uid()
            and role = 'admin'
        )
    );

-- Users can view their own
create policy "Users can view their own rsvps"
    on public.event_rsvps
    for select
    using ( auth.uid() = user_id );

-- Anyone can insert (public events)
create policy "Anyone can insert rsvp"
    on public.event_rsvps
    for insert
    with check ( true );
