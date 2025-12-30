'use client';

import { useState, useEffect } from 'react';
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
    MapPin,
    Loader2
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import { getSupabaseClient } from '@/lib/supabase/client';
import BJJBelt from '@/components/BJJBelt';
import Avatar from '@/components/Avatar';
import TodayClassCard from '@/components/dashboard/TodayClassCard';

interface ProfileData {
    first_name: string;
    last_name: string;
    belt_rank: string;
    stripes: number;
    profile_image_url?: string;
    created_at: string;
}

interface MembershipData {
    status: string;
    location: { id: string; name: string } | null;
    membership_type: { id: string; name: string; price: number } | null;
}

export default function DashboardContent() {
    const { selectedProfileId, parentProfile, children, hasParentMembership } = useDashboard();
    const supabase = getSupabaseClient();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [membership, setMembership] = useState<MembershipData | null>(null);
    const [announcements, setAnnouncements] = useState<{ id: string; title: string; message: string; created_at: string }[]>([]);

    // Determine if we're viewing the parent or a child
    const isViewingParent = selectedProfileId === parentProfile?.user_id;
    const selectedChild = children.find(c => c.user_id === selectedProfileId);
    const displayName = isViewingParent
        ? parentProfile?.first_name
        : selectedChild?.first_name || 'Member';

    useEffect(() => {
        fetchDashboardData();
    }, [selectedProfileId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch profile for selected user
            const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name, belt_rank, stripes, profile_image_url, created_at')
                .eq('user_id', selectedProfileId)
                .single();
            setProfile(profileData);

            // Fetch attendance count for selected user
            const { count } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', selectedProfileId);
            setAttendanceCount(count || 0);

            // Fetch membership for selected user
            const { data: membershipData } = await supabase
                .from('memberships')
                .select('status, membership_type:membership_types(id, name, price), location:locations(id, name)')
                .eq('user_id', selectedProfileId)
                .eq('status', 'active')
                .single();
            setMembership(membershipData as MembershipData | null);

            // Fetch announcements (same for all)
            const { data: announcementsData } = await supabase
                .from('announcements')
                .select('id, title, message, created_at')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(3);
            setAnnouncements(announcementsData || []);

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { href: '/dashboard/classes', label: 'View Classes', icon: Calendar, color: 'var(--color-gold)' },
        { href: '/dashboard/attendance', label: 'Check In', icon: CheckCircle, color: 'var(--color-green)' },
        { href: '/dashboard/videos', label: 'Watch Videos', icon: PlayCircle, color: 'var(--color-gold)' },
        { href: '/dashboard/progress', label: 'Belt Progress', icon: Award, color: 'var(--color-green)' },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-3)' }}>
                <Loader2 size={24} className="animate-spin" />
                <span>Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">
                    Assalamu Alaikum, {displayName}! 👋
                </h1>
                <p className="dashboard-subtitle">
                    {isViewingParent ? "Here's your training overview." : `Viewing ${displayName}'s training progress.`}
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
                                        {' '}• {profile?.stripes} stripe{(profile?.stripes || 0) > 1 ? 's' : ''}
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
                                    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                                    : 'N/A'}
                            </p>
                        </div>
                        <Calendar size={32} color="var(--color-gold)" />
                    </div>
                </div>

                {membership && (
                    <div className="stat-card glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p className="stat-label">Membership</p>
                                <p className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>
                                    {membership.membership_type?.name || 'Active'}
                                </p>
                                {membership.location && (
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                                        <MapPin size={12} />
                                        {membership.location.name}
                                    </p>
                                )}
                            </div>
                            <CreditCard size={32} color="var(--color-gold)" />
                        </div>
                    </div>
                )}
            </div>

            {/* Today's Class Quick Check-in */}
            <h2 style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
                Today&apos;s Class
            </h2>
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <TodayClassCard selectedUserId={selectedProfileId} />
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
            <h2 style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Bell size={20} />
                Recent Announcements
            </h2>
            {announcements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {announcements.map((announcement) => (
                        <div key={announcement.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontWeight: '600', marginBottom: 'var(--space-1)' }}>{announcement.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                            {announcement.message.substring(0, 120)}...
                                        </p>
                                    </div>
                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                                        {new Date(announcement.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <Bell size={40} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-3)' }} />
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        No announcements at the moment. Check back later!
                    </p>
                </div>
            )}
        </div>
    );
}
