-- Admin-settable capacity for the retreat. Capacity counts PEOPLE (attendees),
-- not bookings. NULL capacity = unlimited. Read via service-role API only;
-- admins edit it from /admin/retreat.
create table public.retreat_settings (
  retreat_year int primary key,
  capacity int, -- null = unlimited
  updated_at timestamptz not null default now()
);

alter table public.retreat_settings enable row level security;

create policy "Admins can manage retreat settings"
  on public.retreat_settings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

insert into public.retreat_settings (retreat_year, capacity)
values (2026, null)
on conflict (retreat_year) do nothing;
