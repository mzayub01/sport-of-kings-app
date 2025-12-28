// ===============================================
// Sport of Kings - Type Definitions
// ===============================================

// User Roles
export type UserRole = 'member' | 'instructor' | 'professor' | 'admin';

// Adult Belt Ranks
export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

// Kids Belt Ranks (for under 16)
export type KidsBeltRank =
  | 'white' | 'grey' | 'grey-white'
  | 'yellow' | 'yellow-white'
  | 'orange' | 'orange-white'
  | 'green' | 'green-white';

// Membership Status
export type MembershipStatus = 'active' | 'inactive' | 'pending' | 'cancelled' | 'waitlist';

// Class Types (currently only BJJ)
export type ClassType = 'bjj' | 'other';

// Event Types
export type EventType = 'class' | 'seminar' | 'retreat' | 'gathering' | 'competition' | 'other';

// RSVP Status
export type RSVPStatus = 'pending' | 'confirmed' | 'declined' | 'waitlist';

// Payment Status
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// ===============================================
// Database Models
// ===============================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_info?: string;
  is_child: boolean;
  parent_guardian_id?: string;
  child_address?: string;
  belt_rank: BeltRank;
  stripe_customer_id?: string;
  profile_image_url?: string;
  best_practice_accepted: boolean;
  best_practice_accepted_at?: string;
  waiver_accepted: boolean;
  waiver_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  description?: string;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
  settings?: LocationSettings;
  created_at: string;
  updated_at: string;
}

export interface LocationSettings {
  allow_waitlist: boolean;
  contact_email?: string;
  contact_phone?: string;
}

export interface MembershipType {
  id: string;
  location_id: string;
  name: string;
  description?: string;
  price: number; // in pence/cents
  duration_days: number;
  age_min?: number;
  age_max?: number;
  is_active: boolean;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  location_id: string;
  membership_type_id: string;
  status: MembershipStatus;
  start_date: string;
  end_date?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  location?: Location;
  membership_type?: MembershipType;
  profile?: Profile;
}

export interface LocationMembershipConfig {
  id: string;
  location_id: string;
  membership_type_id: string;
  capacity: number | null; // null = unlimited
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  location?: Location;
  membership_type?: MembershipType;
}

export interface WaitlistEntry {
  id: string;
  user_id: string;
  location_id: string;
  membership_type_id?: string;
  position: number;
  created_at: string;
  // Joined data
  profile?: Profile;
  location?: Location;
  membership_type?: MembershipType;
}

export interface Instructor {
  id: string;
  user_id: string;
  bio?: string;
  specializations?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: Profile;
}

export interface Class {
  id: string;
  location_id: string;
  instructor_id?: string;
  membership_type_id?: string;
  name: string;
  description?: string;
  class_type: ClassType;
  day_of_week: number; // 0-6, Sunday-Saturday
  start_time: string; // HH:MM format
  end_time: string;
  max_capacity?: number;
  is_recurring: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  location?: Location;
  instructor?: Instructor;
}

export interface Attendance {
  id: string;
  class_id: string;
  user_id: string;
  check_in_time: string;
  checked_in_by?: string; // user_id of admin/instructor if checked in on behalf
  notes?: string;
  created_at: string;
  // Joined data
  class?: Class;
  profile?: Profile;
  checked_in_by_profile?: Profile;
}

export interface BeltProgression {
  id: string;
  user_id: string;
  belt_rank: BeltRank;
  stripes: number;
  awarded_date: string;
  awarded_by?: string; // instructor/admin user_id
  notes?: string;
  created_at: string;
  // Joined data
  profile?: Profile;
  awarded_by_profile?: Profile;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  category: string;
  belt_level?: BeltRank;
  duration_seconds?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  location_id?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  max_capacity?: number;
  price?: number; // in pence/cents, null for free events
  is_members_only: boolean;
  rsvp_deadline?: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  location?: Location;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id?: string;
  full_name: string;
  email: string;
  status: RSVPStatus;
  payment_status?: PaymentStatus;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  event?: Event;
  profile?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  location_id?: string; // null for all locations
  target_audience: 'all' | 'members' | 'instructors';
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined data
  location?: Location;
}

export interface Naseeha {
  id: string;
  title: string;
  content: string;
  week_number: number;
  year: number;
  author_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: Profile;
}

// ===============================================
// Form Types
// ===============================================

export interface RegistrationFormData {
  // Personal Info
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;

  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_phone: string;

  // Medical
  medical_info?: string;

  // Child Registration
  is_child: boolean;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_email?: string;
  parent_phone?: string;
  parent_address?: string;
  parent_city?: string;
  parent_postcode?: string;
  child_address_different?: boolean;

  // Membership
  location_id: string;
  membership_type_id: string;

  // Agreements
  best_practice_accepted: boolean;
  waiver_accepted: boolean;

  // Auth
  password: string;
  confirm_password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// ===============================================
// API Response Types
// ===============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===============================================
// Dashboard Stats
// ===============================================

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalLocations: number;
  totalClasses: number;
  totalAttendanceThisMonth: number;
  revenueThisMonth: number;
  waitlistCount: number;
  upcomingEvents: number;
}

export interface MemberStats {
  totalAttendance: number;
  attendanceThisMonth: number;
  currentStreak: number;
  beltRank: BeltRank;
  memberSince: string;
  upcomingClasses: Class[];
}

export interface InstructorStats {
  classesThisWeek: number;
  totalStudents: number;
  attendanceRate: number;
  upcomingClasses: Class[];
}
