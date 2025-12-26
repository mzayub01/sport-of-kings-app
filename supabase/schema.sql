-- ===============================================
-- Sport of Kings - Database Schema
-- Run this in your Supabase SQL Editor
-- ===============================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ===============================================
-- ENUMS
-- ===============================================

create type user_role as enum ('member', 'instructor', 'admin');
create type belt_rank as enum ('white', 'blue', 'purple', 'brown', 'black');
create type membership_status as enum ('active', 'inactive', 'pending', 'cancelled', 'waitlist');
create type class_type as enum ('bjj', 'kendo', 'strength', 'archery', 'other');
create type event_type as enum ('class', 'seminar', 'retreat', 'gathering', 'competition', 'other');
create type rsvp_status as enum ('pending', 'confirmed', 'declined', 'waitlist');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- ===============================================
-- PROFILES TABLE
-- ===============================================

create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  email text not null,
  role user_role default 'member' not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  address text,
  city text,
  postcode text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_info text,
  is_child boolean default false,
  parent_guardian_id uuid references public.profiles(id) on delete set null,
  child_address text,
  belt_rank belt_rank default 'white',
  stripe_customer_id text unique,
  profile_image_url text,
  best_practice_accepted boolean default false,
  best_practice_accepted_at timestamptz,
  waiver_accepted boolean default false,
  waiver_accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Admin can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- ===============================================
-- LOCATIONS TABLE
-- ===============================================

create table public.locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  city text not null,
  postcode text not null,
  description text,
  max_capacity integer not null default 100,
  current_members integer default 0,
  is_active boolean default true,
  contact_email text,
  contact_phone text,
  settings jsonb default '{"allow_waitlist": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.locations enable row level security;

create policy "Anyone can view active locations"
  on public.locations for select
  using (is_active = true);

create policy "Admin can manage locations"
  on public.locations for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- MEMBERSHIP TYPES TABLE
-- ===============================================

create table public.membership_types (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete cascade not null,
  name text not null,
  description text,
  price integer not null default 0, -- in pence (0 for free)
  duration_days integer not null default 365,
  age_min integer,
  age_max integer,
  is_active boolean default true,
  stripe_price_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.membership_types enable row level security;

create policy "Anyone can view active membership types"
  on public.membership_types for select
  using (is_active = true);

create policy "Admin can manage membership types"
  on public.membership_types for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- MEMBERSHIPS TABLE
-- ===============================================

create table public.memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  location_id uuid references public.locations(id) on delete cascade not null,
  membership_type_id uuid references public.membership_types(id) on delete set null,
  status membership_status default 'pending' not null,
  start_date date default current_date,
  end_date date,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, location_id)
);

alter table public.memberships enable row level security;

create policy "Users can view own memberships"
  on public.memberships for select
  using (auth.uid() = user_id);

create policy "Admin can manage all memberships"
  on public.memberships for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- WAITLIST TABLE
-- ===============================================

create table public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  location_id uuid references public.locations(id) on delete cascade not null,
  position integer not null,
  created_at timestamptz default now(),
  unique(user_id, location_id)
);

alter table public.waitlist enable row level security;

create policy "Users can view own waitlist entries"
  on public.waitlist for select
  using (auth.uid() = user_id);

create policy "Admin can manage waitlist"
  on public.waitlist for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- INSTRUCTORS TABLE
-- ===============================================

create table public.instructors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  bio text,
  specializations text[],
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.instructors enable row level security;

create policy "Anyone can view active instructors"
  on public.instructors for select
  using (is_active = true);

create policy "Instructors can update own profile"
  on public.instructors for update
  using (auth.uid() = user_id);

create policy "Admin can manage instructors"
  on public.instructors for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- CLASSES TABLE
-- ===============================================

create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete cascade not null,
  instructor_id uuid references public.instructors(id) on delete set null,
  name text not null,
  description text,
  class_type class_type not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  max_capacity integer,
  is_recurring boolean default true,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.classes enable row level security;

create policy "Anyone can view active classes"
  on public.classes for select
  using (is_active = true);

create policy "Instructors can view their classes"
  on public.classes for select
  using (
    exists (
      select 1 from public.instructors i
      where i.id = instructor_id and i.user_id = auth.uid()
    )
  );

create policy "Admin can manage classes"
  on public.classes for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- ATTENDANCE TABLE
-- ===============================================

create table public.attendance (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  class_date date not null default current_date,
  check_in_time timestamptz default now(),
  checked_in_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  unique(class_id, user_id, class_date)
);

alter table public.attendance enable row level security;

create policy "Users can view own attendance"
  on public.attendance for select
  using (auth.uid() = user_id);

create policy "Users can check in themselves"
  on public.attendance for insert
  with check (auth.uid() = user_id);

create policy "Instructors can view class attendance"
  on public.attendance for select
  using (
    exists (
      select 1 from public.classes c
      join public.instructors i on i.id = c.instructor_id
      where c.id = class_id and i.user_id = auth.uid()
    )
  );

create policy "Admin and instructors can manage attendance"
  on public.attendance for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role in ('admin', 'instructor')
    )
  );

-- ===============================================
-- BELT PROGRESSION TABLE
-- ===============================================

create table public.belt_progression (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  belt_rank belt_rank not null,
  stripes integer default 0 check (stripes >= 0 and stripes <= 4),
  awarded_date date default current_date,
  awarded_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

alter table public.belt_progression enable row level security;

create policy "Users can view own belt progression"
  on public.belt_progression for select
  using (auth.uid() = user_id);

create policy "Admin can manage belt progression"
  on public.belt_progression for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- VIDEOS TABLE
-- ===============================================

create table public.videos (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  url text not null,
  thumbnail_url text,
  category text not null,
  belt_level belt_rank,
  duration_seconds integer,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.videos enable row level security;

create policy "Members can view active videos"
  on public.videos for select
  using (
    is_active = true and
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  );

create policy "Admin can manage videos"
  on public.videos for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- EVENTS TABLE
-- ===============================================

create table public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  event_type event_type not null,
  location_id uuid references public.locations(id) on delete set null,
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  max_capacity integer,
  price integer default 0, -- in pence
  is_members_only boolean default false,
  rsvp_deadline date,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Anyone can view active public events"
  on public.events for select
  using (is_active = true and is_members_only = false);

create policy "Members can view active member events"
  on public.events for select
  using (
    is_active = true and
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.status = 'active'
    )
  );

create policy "Admin can manage events"
  on public.events for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- EVENT RSVPS TABLE
-- ===============================================

create table public.event_rsvps (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status rsvp_status default 'pending' not null,
  payment_status payment_status,
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.event_rsvps enable row level security;

create policy "Users can view own RSVPs"
  on public.event_rsvps for select
  using (auth.uid() = user_id);

create policy "Users can create own RSVPs"
  on public.event_rsvps for insert
  with check (auth.uid() = user_id);

create policy "Users can update own RSVPs"
  on public.event_rsvps for update
  using (auth.uid() = user_id);

create policy "Admin can manage RSVPs"
  on public.event_rsvps for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- ANNOUNCEMENTS TABLE
-- ===============================================

create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text not null,
  location_id uuid references public.locations(id) on delete cascade,
  target_audience text default 'all' check (target_audience in ('all', 'members', 'instructors')),
  is_active boolean default true,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.announcements enable row level security;

create policy "Anyone can view active announcements"
  on public.announcements for select
  using (
    is_active = true and
    (expires_at is null or expires_at > now())
  );

create policy "Admin can manage announcements"
  on public.announcements for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- NASEEHA TABLE
-- ===============================================

create table public.naseeha (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  week_number integer not null check (week_number >= 1 and week_number <= 53),
  year integer not null,
  author_id uuid references auth.users(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(week_number, year)
);

alter table public.naseeha enable row level security;

create policy "Anyone can view active naseeha"
  on public.naseeha for select
  using (is_active = true);

create policy "Admin can manage naseeha"
  on public.naseeha for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ===============================================
-- FUNCTIONS AND TRIGGERS
-- ===============================================

-- Function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all relevant tables
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger update_locations_updated_at
  before update on locations
  for each row execute function update_updated_at();

create trigger update_membership_types_updated_at
  before update on membership_types
  for each row execute function update_updated_at();

create trigger update_memberships_updated_at
  before update on memberships
  for each row execute function update_updated_at();

create trigger update_instructors_updated_at
  before update on instructors
  for each row execute function update_updated_at();

create trigger update_classes_updated_at
  before update on classes
  for each row execute function update_updated_at();

create trigger update_videos_updated_at
  before update on videos
  for each row execute function update_updated_at();

create trigger update_events_updated_at
  before update on events
  for each row execute function update_updated_at();

create trigger update_event_rsvps_updated_at
  before update on event_rsvps
  for each row execute function update_updated_at();

create trigger update_announcements_updated_at
  before update on announcements
  for each row execute function update_updated_at();

create trigger update_naseeha_updated_at
  before update on naseeha
  for each row execute function update_updated_at();

-- Function to update location member count
create or replace function update_location_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'active' then
    update locations
    set current_members = current_members + 1
    where id = NEW.location_id;
  elsif TG_OP = 'DELETE' and OLD.status = 'active' then
    update locations
    set current_members = current_members - 1
    where id = OLD.location_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.status = 'active' and NEW.status != 'active' then
      update locations
      set current_members = current_members - 1
      where id = NEW.location_id;
    elsif OLD.status != 'active' and NEW.status = 'active' then
      update locations
      set current_members = current_members + 1
      where id = NEW.location_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger update_member_count
  after insert or update or delete on memberships
  for each row execute function update_location_member_count();

-- Function to handle profile creation on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, first_name, last_name, date_of_birth)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'date_of_birth')::date, current_date)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ===============================================
-- INDEXES
-- ===============================================

create index idx_profiles_user_id on profiles(user_id);
create index idx_profiles_role on profiles(role);
create index idx_memberships_user_id on memberships(user_id);
create index idx_memberships_location_id on memberships(location_id);
create index idx_memberships_status on memberships(status);
create index idx_attendance_user_id on attendance(user_id);
create index idx_attendance_class_id on attendance(class_id);
create index idx_attendance_class_date on attendance(class_date);
create index idx_classes_location_id on classes(location_id);
create index idx_classes_instructor_id on classes(instructor_id);
create index idx_events_start_date on events(start_date);
create index idx_announcements_expires_at on announcements(expires_at);
create index idx_naseeha_year_week on naseeha(year, week_number);
