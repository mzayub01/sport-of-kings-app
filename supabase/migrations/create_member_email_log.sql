-- Log of manually triggered member emails (getting started, payment reminders)
-- so admins can see what has already been sent and by whom.
create table public.member_email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email_type text not null, -- getting_started | payment_reminder
  sent_to text not null,
  sent_by uuid references auth.users(id) on delete set null,
  sent_by_name text,
  sent_at timestamptz not null default now()
);

alter table public.member_email_log enable row level security;

create policy "Admins can manage member email log"
  on public.member_email_log for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create index idx_member_email_log_user_type on member_email_log(user_id, email_type, sent_at desc);
