import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import {
    Users,
    MapPin,
    Calendar,
    CheckCircle,
    TrendingUp,
    PoundSterling,
    UserPlus,
    AlertCircle,
    ChevronRight,
    Video,
    Bell
} from 'lucide-react';

export const metadata = {
    title: 'Admin Dashboard | Sport of Kings',
    description: 'Admin dashboard for Sport of Kings',
};

export default async function AdminDashboard() {
    const supabase = await createAdminClient();

    // Fetch stats
    const [
        { count: totalMembers },
        { count: activeMembers },
        { count: totalLocations },
        { count: totalClasses },
        { count: waitlistCount },
        { count: todayAttendance },
        { data: recentMembers },
        result, // Capture the full result to access the 8th item (index 7) for revenue calculation
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('waitlist').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true })
            .gte('class_date', new Date().toISOString().split('T')[0]),
        supabase.from('memberships')
            .select('id, user_id, profile:profiles(id, first_name, last_name, belt_rank), location:locations(name), membership_type:membership_types(name)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5) as Promise<{ data: { id: string; user_id: string; profile: { id: string; first_name: string; last_name: string; belt_rank: string } | null; location: { name: string } | null; membership_type: { name: string } | null }[] | null }>,
        // Fetch all active memberships to calculate total monthly revenue
        supabase.from('memberships')
            .select(`
                membership_type:membership_types(price)
            `)
            .eq('status', 'active'),
    ]);

    // Calculate total monthly revenue
    // Prices are stored as pounds (not pence), so we just sum them up
    // @ts-ignore - Supabase types might be imperfect here
    const allActiveMemberships = result[7]?.data || [];
    const totalMonthlyRevenue = allActiveMemberships.reduce((sum: number, m: any) => {
        const price = m.membership_type?.price || 0;
        return sum + price;
    }, 0);

    const stats = [
        {
            label: 'Total Members',
            value: totalMembers || 0,
            icon: Users,
            color: 'var(--color-gold)',
            change: '+12% this month',
            positive: true,
        },
        {
            label: 'Active Memberships',
            value: activeMembers || 0,
            icon: CheckCircle,
            color: 'var(--color-green)',
            change: '',
            positive: true,
        },
        {
            label: 'Locations',
            value: totalLocations || 0,
            icon: MapPin,
            color: 'var(--color-gold)',
            change: '',
            positive: true,
        },
        {
            label: 'Active Classes',
            value: totalClasses || 0,
            icon: Calendar,
            color: 'var(--color-green)',
            change: '',
            positive: true,
        },
    ];

    const quickActions = [
        { href: '/admin/members', label: 'Manage Members', icon: UserPlus, color: 'var(--color-gold)' },
        { href: '/admin/locations', label: 'Manage Locations', icon: MapPin, color: 'var(--color-green)' },
        { href: '/admin/classes', label: 'Manage Classes', icon: Calendar, color: 'var(--color-gold)' },
        { href: '/admin/videos', label: 'Manage Videos', icon: Video, color: 'var(--color-green)' },
        { href: '/admin/announcements', label: 'Announcements', icon: Bell, color: 'var(--color-gold)' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">Admin Dashboard</h1>
                <p className="dashboard-subtitle">
                    Overview of Sport of Kings operations
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p className="stat-label">{stat.label}</p>
                                <p className="stat-value">{stat.value}</p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-lg)',
                                background: stat.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <stat.icon size={24} color="var(--color-black)" />
                            </div>
                        </div>
                        {stat.change && (
                            <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                <TrendingUp size={14} />
                                <span>{stat.change}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Alerts */}
            {(waitlistCount ?? 0) > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                    <AlertCircle size={20} />
                    <div>
                        <strong>{waitlistCount} people</strong> are on the waitlist for locations at capacity.
                        <Link href="/admin/waitlist" style={{ marginLeft: 'var(--space-2)', color: 'inherit', textDecoration: 'underline' }}>
                            View waitlist
                        </Link>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
                Quick Actions
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-5)',
                            textDecoration: 'none',
                            textAlign: 'center',
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
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Recent Members & Today's Attendance */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 'var(--space-6)',
            }}>
                {/* Recent Members */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Recent Members</h3>
                        <Link href="/admin/members" className="btn btn-ghost btn-sm">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {recentMembers && recentMembers.length > 0 ? (
                            <div>
                                {recentMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--space-4)',
                                            borderBottom: '1px solid var(--border-light)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div className="avatar avatar-md">
                                                {member.profile?.first_name?.[0]}{member.profile?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '600', margin: 0 }}>
                                                    {member.profile?.first_name} {member.profile?.last_name}
                                                </p>
                                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                                    {member.location?.name || 'No location'} • {member.membership_type?.name || 'No type'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`badge badge-belt-${member.profile?.belt_rank || 'white'}`}>
                                            {member.profile?.belt_rank || 'White'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <Users size={32} color="var(--text-tertiary)" />
                                <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-2) 0 0' }}>
                                    No members yet
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Stats */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Today&apos;s Overview</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-4)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <CheckCircle size={24} color="var(--color-green)" />
                                    <span>Attendance Today</span>
                                </div>
                                <span style={{ fontWeight: '700', fontSize: 'var(--text-xl)' }}>
                                    {todayAttendance || 0}
                                </span>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-4)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <AlertCircle size={24} color="var(--color-warning)" />
                                    <span>Waitlist</span>
                                </div>
                                <span style={{ fontWeight: '700', fontSize: 'var(--text-xl)' }}>
                                    {waitlistCount || 0}
                                </span>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-4)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <PoundSterling size={24} color="var(--color-gold)" />
                                    <span>Revenue This Month</span>
                                </div>
                                <span style={{ fontWeight: '700', fontSize: 'var(--text-xl)' }}>
                                    £{totalMonthlyRevenue.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
