import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
    Calendar,
    Award,
    CheckCircle,
    TrendingUp,
    PlayCircle,
    Bell,
    ChevronRight,
    Clock,
    CreditCard,
    MapPin
} from 'lucide-react';
import NextClassWidget from '@/components/dashboard/NextClassWidget';
import TodayClassCard from '@/components/dashboard/TodayClassCard';
import BJJBelt from '@/components/BJJBelt';

export const metadata = {
    title: 'Dashboard | Sport of Kings',
    description: 'Your personal dashboard at Sport of Kings',
};

export default async function MemberDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

    // Fetch attendance count
    const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

    // Fetch recent announcements
    const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3) as { data: { id: string; title: string; message: string; created_at: string }[] | null };

    // Fetch user's membership with type and location
    const { data: membership } = await supabase
        .from('memberships')
        .select('*, membership_type:membership_types(id, name, price), location:locations(id, name)')
        .eq('user_id', user?.id)
        .single() as {
            data: {
                status: string;
                location_id: string;
                membership_type_id: string | null;
                membership_type: { id: string; name: string; price: number } | null;
                location: { id: string; name: string } | null
            } | null
        };

    // Helper to get today's day of week (0 = Sunday, 6 = Saturday)
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const currentTime = today.toTimeString().slice(0, 5); // HH:MM format

    // Fetch upcoming classes for member's location and membership type
    let nextClass: { id: string; name: string; day_of_week: number; start_time: string; end_time: string; location: { name: string } | null } | null = null;

    if (membership?.location?.id) {
        // Get classes that are either for all members (null) or for this specific membership type
        const { data: classes } = await supabase
            .from('classes')
            .select('id, name, day_of_week, start_time, end_time, location:locations(name), membership_type_id')
            .eq('location_id', membership.location.id)
            .eq('is_active', true)
            .order('day_of_week')
            .order('start_time');

        // Filter classes to those accessible by this member
        const accessibleClasses = (classes || []).filter(c =>
            c.membership_type_id === null || c.membership_type_id === membership.membership_type_id
        );

        // Find the next upcoming class
        for (const cls of accessibleClasses) {
            // Check if class is later today or on a future day this week
            if (cls.day_of_week > currentDayOfWeek ||
                (cls.day_of_week === currentDayOfWeek && cls.start_time > currentTime)) {
                nextClass = cls;
                break;
            }
        }
        // If no class found this week, get the first class of next week
        if (!nextClass && accessibleClasses.length > 0) {
            nextClass = accessibleClasses[0];
        }
    }

    const beltColors: Record<string, string> = {
        white: '#FFFFFF',
        blue: '#1E40AF',
        purple: '#6B21A8',
        brown: '#78350F',
        black: '#1A1A1A',
    };

    const quickActions = [
        { href: '/dashboard/classes', label: 'View Classes', icon: Calendar, color: 'var(--color-gold)' },
        { href: '/dashboard/attendance', label: 'Check In', icon: CheckCircle, color: 'var(--color-green)' },
        { href: '/dashboard/videos', label: 'Watch Videos', icon: PlayCircle, color: 'var(--color-gold)' },
        { href: '/dashboard/progress', label: 'Belt Progress', icon: Award, color: 'var(--color-green)' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">
                    Assalamu Alaikum, {profile?.first_name || 'Member'}! 👋
                </h1>
                <p className="dashboard-subtitle">
                    Welcome back to Sport of Kings. Here&apos;s your training overview.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Current Belt</p>
                            <p className="stat-value" style={{ textTransform: 'capitalize' }}>
                                {profile?.belt_rank || 'White'}
                                {(profile?.stripes || 0) > 0 && (
                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                        {' '}• {profile.stripes} stripe{profile.stripes > 1 ? 's' : ''}
                                    </span>
                                )}
                            </p>
                        </div>
                        <BJJBelt
                            belt={(profile?.belt_rank as 'white' | 'blue' | 'purple' | 'brown' | 'black') || 'white'}
                            stripes={profile?.stripes || 0}
                            size="sm"
                        />
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Total Sessions</p>
                            <p className="stat-value">{attendanceCount || 0}</p>
                        </div>
                        <CheckCircle size={32} color="var(--color-green)" />
                    </div>
                    <div className="stat-change positive">
                        <TrendingUp size={14} />
                        <span>Keep up the great work!</span>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Member Since</p>
                            <p className="stat-value">
                                {profile?.created_at
                                    ? new Date(profile.created_at).toLocaleDateString('en-GB', {
                                        month: 'short',
                                        year: 'numeric'
                                    })
                                    : 'Today'
                                }
                            </p>
                        </div>
                        <Clock size={32} color="var(--color-gold)" />
                    </div>
                </div>
                {/* Premium Membership Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #B8860B 0%, #FFD700 50%, #DAA520 100%)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-4)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(184, 134, 11, 0.25)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                        <div>
                            <p style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                color: 'rgba(0,0,0,0.5)',
                                margin: 0,
                            }}>
                                Sport of Kings
                            </p>
                            <p style={{
                                fontSize: 'var(--text-base)',
                                fontWeight: '700',
                                color: 'var(--color-black)',
                                margin: 0,
                            }}>
                                {membership?.membership_type?.name || 'Member'}
                            </p>
                        </div>
                        <CreditCard size={24} color="rgba(0,0,0,0.6)" />
                    </div>

                    <p style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--color-black)',
                        margin: '0 0 var(--space-2) 0',
                    }}>
                        {profile?.first_name} {profile?.last_name}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <span style={{
                            background: membership?.status === 'active' ? 'var(--color-green)' : 'rgba(0,0,0,0.2)',
                            color: membership?.status === 'active' ? 'white' : 'var(--color-black)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                        }}>
                            {membership?.status || 'None'}
                        </span>
                        {membership?.location?.name && (
                            <span style={{
                                fontSize: '10px',
                                color: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                            }}>
                                <MapPin size={10} />
                                {membership.location.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Next Class Widget */}
            {nextClass && (
                <NextClassWidget nextClass={nextClass} />
            )}

            {/* Today's Class Quick Check-in */}
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
                Today&apos;s Class
            </h2>
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <TodayClassCard />
            </div>

            {/* Quick Actions */}
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
                Quick Actions
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-8)',
            }}>
                {quickActions.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="glass-card"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-4)',
                            padding: 'var(--space-4)',
                            textDecoration: 'none',
                        }}
                    >
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-lg)',
                            background: action.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <action.icon size={22} color="var(--color-black)" />
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {action.label}
                        </span>
                        <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
                    </Link>
                ))}
            </div>

            {/* Announcements */}
            {announcements && announcements.length > 0 && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>
                            Recent Announcements
                        </h2>
                        <Link href="/dashboard/announcements" className="btn btn-ghost btn-sm">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="card">
                                <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                                        <Bell size={20} color="var(--color-gold)" style={{ marginTop: '2px' }} />
                                        <div>
                                            <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>
                                                {announcement.title}
                                            </h4>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                                                {announcement.message.substring(0, 150)}
                                                {announcement.message.length > 150 ? '...' : ''}
                                            </p>
                                            <p style={{
                                                color: 'var(--text-tertiary)',
                                                fontSize: 'var(--text-xs)',
                                                marginTop: 'var(--space-2)',
                                                margin: 0,
                                            }}>
                                                {new Date(announcement.created_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Empty State */}
            {(!announcements || announcements.length === 0) && (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Bell size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Announcements</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        You&apos;re all caught up! Check back later for updates.
                    </p>
                </div>
            )}
        </div>
    );
}
