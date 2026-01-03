'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, Loader2, History, XCircle, TrendingUp, Lock } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useDashboard } from '@/components/dashboard/DashboardProvider';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ClassRecord {
    id: string;
    name: string;
    class_type: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    membership_type_id: string | null;
    location: {
        name: string;
    };
    instructor?: {
        profile: {
            first_name: string;
            last_name: string;
        };
    };
}

interface ClassInstance {
    classId: string;
    name: string;
    class_type: string;
    date: Date;
    dateString: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    location_name: string;
    instructor_name?: string;
    isToday: boolean;
    attended: boolean;
}

interface AttendanceStats {
    thisMonth: { attended: number; total: number };
    lastMonth: { attended: number; total: number };
}

export default function MemberClassesPage() {
    const [upcomingClasses, setUpcomingClasses] = useState<ClassInstance[]>([]);
    const [pastClasses, setPastClasses] = useState<ClassInstance[]>([]);
    const [stats, setStats] = useState<AttendanceStats>({
        thisMonth: { attended: 0, total: 0 },
        lastMonth: { attended: 0, total: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasActiveMembership, setHasActiveMembership] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const supabase = getSupabaseClient();
    const { selectedProfileId } = useDashboard();
    const todayDate = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchData();
    }, [selectedProfileId]);

    const fetchData = async () => {
        try {
            // Use the selected profile ID from dashboard context
            const userId = selectedProfileId;
            if (!userId) {
                setError('No profile selected');
                setLoading(false);
                return;
            }

            // Get user's active membership with type
            const { data: membership } = await supabase
                .from('memberships')
                .select('location_id, membership_type_id, start_date')
                .eq('user_id', userId)
                .eq('status', 'active')
                .single();

            if (!membership) {
                setHasActiveMembership(false);
                setLoading(false);
                return;
            }

            setHasActiveMembership(true);

            // Fetch classes for member's location, including tier associations
            const { data: classesData } = await supabase
                .from('classes')
                .select('*, location:locations(name), instructor:instructors(*, profile:profiles(first_name, last_name)), class_membership_types(membership_type_id)')
                .eq('is_active', true)
                .eq('location_id', membership.location_id)
                .order('day_of_week')
                .order('start_time');

            // Filter by membership type using junction table
            // If class has no tier associations, it's available to all members
            // If class has tier associations, member's tier must be in the list
            const accessibleClasses = (classesData || []).filter((c: any) => {
                const classTiers = c.class_membership_types || [];
                // No tier restrictions = available to all members at this location
                if (classTiers.length === 0) return true;
                // Has tier restrictions - check if member's tier is in the list
                return classTiers.some((t: { membership_type_id: string }) =>
                    t.membership_type_id === membership.membership_type_id
                );
            });

            // Fetch ALL past attendance for this user
            const { data: allAttendance } = await supabase
                .from('attendance')
                .select('class_id, class_date')
                .eq('user_id', userId);

            // Create a set for quick lookup: "classId-date"
            const attendanceSet = new Set(
                (allAttendance || []).map((a: { class_id: string; class_date: string }) => {
                    // Normalize date to YYYY-MM-DD format (handle potential timezone issues)
                    const normalizedDate = a.class_date.split('T')[0];
                    return `${a.class_id}-${normalizedDate}`;
                })
            );

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const membershipStart = new Date(membership.start_date || today);
            membershipStart.setHours(0, 0, 0, 0);

            // Generate upcoming class instances (next 4 weeks)
            const upcoming: ClassInstance[] = [];
            for (let i = 0; i < 28; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                const dayOfWeek = date.getDay();
                const dateString = date.toISOString().split('T')[0];

                accessibleClasses.forEach((cls: ClassRecord) => {
                    if (cls.day_of_week === dayOfWeek) {
                        const isToday = i === 0;
                        const key = `${cls.id}-${dateString}`;
                        upcoming.push({
                            classId: cls.id,
                            name: cls.name,
                            class_type: cls.class_type,
                            date: new Date(date),
                            dateString,
                            day_of_week: dayOfWeek,
                            start_time: cls.start_time,
                            end_time: cls.end_time,
                            location_name: cls.location?.name || '',
                            instructor_name: cls.instructor?.profile
                                ? `${cls.instructor.profile.first_name} ${cls.instructor.profile.last_name}`
                                : undefined,
                            isToday,
                            attended: attendanceSet.has(key),
                        });
                    }
                });
            }
            setUpcomingClasses(upcoming);

            // Generate past class instances (only since membership start date)
            const past: ClassInstance[] = [];

            for (let i = 1; i <= 28; i++) { // Go back 4 weeks
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                // Only include dates on or after membership start date
                if (date < membershipStart) {
                    continue;
                }

                const dayOfWeek = date.getDay();
                const dateString = date.toISOString().split('T')[0];

                accessibleClasses.forEach((cls: ClassRecord) => {
                    if (cls.day_of_week === dayOfWeek) {
                        const key = `${cls.id}-${dateString}`;
                        past.push({
                            classId: cls.id,
                            name: cls.name,
                            class_type: cls.class_type,
                            date: new Date(date),
                            dateString,
                            day_of_week: dayOfWeek,
                            start_time: cls.start_time,
                            end_time: cls.end_time,
                            location_name: cls.location?.name || '',
                            instructor_name: cls.instructor?.profile
                                ? `${cls.instructor.profile.first_name} ${cls.instructor.profile.last_name}`
                                : undefined,
                            isToday: false,
                            attended: attendanceSet.has(key),
                        });
                    }
                });
            }
            setPastClasses(past);

            // Calculate this month's stats
            const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const thisMonthClasses = past.filter(c => c.date >= thisMonthStart);
            const thisMonthAttended = thisMonthClasses.filter(c => c.attended).length;

            // Calculate last month's stats
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            const lastMonthClasses = past.filter(c => c.date >= lastMonthStart && c.date <= lastMonthEnd);
            const lastMonthAttended = lastMonthClasses.filter(c => c.attended).length;

            setStats({
                thisMonth: { attended: thisMonthAttended, total: thisMonthClasses.length },
                lastMonth: { attended: lastMonthAttended, total: lastMonthClasses.length },
            });

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (classId: string) => {
        setCheckingIn(classId);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId }),
            });

            const data = await response.json();

            if (data.success) {
                setUpcomingClasses(prev => prev.map(cls =>
                    cls.classId === classId && cls.isToday
                        ? { ...cls, attended: true }
                        : cls
                ));
                setSuccess(data.alreadyCheckedIn ? 'Already checked in!' : 'Successfully checked in!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to check in');
            }
        } catch {
            setError('Failed to check in. Please try again.');
        } finally {
            setCheckingIn(null);
        }
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.getTime() === today.getTime()) return 'Today';
        if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
        if (date.getTime() === yesterday.getTime()) return 'Yesterday';

        return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    // Check if class is within 1-hour check-in window
    const canCheckIn = (cls: ClassInstance): { allowed: boolean; message?: string } => {
        if (!cls.isToday) return { allowed: false };

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const [nowH, nowM] = currentTime.split(':').map(Number);
        const nowMins = nowH * 60 + nowM;

        const startTime = cls.start_time.slice(0, 5);
        const endTime = cls.end_time.slice(0, 5);
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        // Class is happening now
        if (nowMins >= startMins && nowMins <= endMins) {
            return { allowed: true };
        }

        // Class is upcoming - check if within 1 hour
        const diffMins = startMins - nowMins;
        if (diffMins > 0 && diffMins <= 60) {
            return { allowed: true };
        }

        // Class hasn't started and is more than 1 hour away
        if (diffMins > 60) {
            const checkInMins = diffMins - 60;
            if (checkInMins < 60) {
                return { allowed: false, message: `Check-in opens in ${checkInMins} min` };
            } else {
                const h = Math.floor(checkInMins / 60);
                const m = checkInMins % 60;
                return { allowed: false, message: m > 0 ? `Check-in opens in ${h}h ${m}m` : `Check-in opens in ${h}h` };
            }
        }

        return { allowed: false };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    const attendanceRate = stats.thisMonth.total > 0
        ? Math.round((stats.thisMonth.attended / stats.thisMonth.total) * 100)
        : 0;

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Classes</h1>
                <p className="dashboard-subtitle">Your upcoming classes and attendance history</p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {!hasActiveMembership ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Calendar size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Active Membership</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        You need an active membership to view classes.
                    </p>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="stat-card glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p className="stat-label">This Month</p>
                                    <p className="stat-value">{stats.thisMonth.attended} / {stats.thisMonth.total}</p>
                                </div>
                                <CheckCircle size={32} color="var(--color-gold)" />
                            </div>
                            <div style={{ marginTop: 'var(--space-2)' }}>
                                <div style={{
                                    height: '6px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-full)',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${attendanceRate}%`,
                                        background: attendanceRate >= 75 ? 'var(--color-green)' : attendanceRate >= 50 ? 'var(--color-gold)' : 'var(--color-red)',
                                        borderRadius: 'var(--radius-full)',
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                                    {attendanceRate}% attendance rate
                                </p>
                            </div>
                        </div>

                        <div className="stat-card glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p className="stat-label">Last Month</p>
                                    <p className="stat-value">{stats.lastMonth.attended} / {stats.lastMonth.total}</p>
                                </div>
                                <History size={32} color="var(--text-tertiary)" />
                            </div>
                            {stats.thisMonth.attended > stats.lastMonth.attended && (
                                <div className="stat-change positive" style={{ marginTop: 'var(--space-2)' }}>
                                    <TrendingUp size={14} />
                                    <span>Improved from last month!</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            <Calendar size={18} />
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`btn ${activeTab === 'past' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            <History size={18} />
                            Past
                        </button>
                    </div>

                    {activeTab === 'upcoming' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {upcomingClasses.length === 0 ? (
                                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>No upcoming classes scheduled.</p>
                                </div>
                            ) : (
                                upcomingClasses.map((cls) => (
                                    <div
                                        key={`${cls.classId}-${cls.dateString}`}
                                        className="glass-card"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 'var(--space-4)',
                                            flexWrap: 'wrap',
                                            borderLeft: cls.isToday ? '4px solid var(--color-gold)' : undefined,
                                            opacity: cls.attended ? 0.7 : 1,
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                                                <span style={{
                                                    fontWeight: '600',
                                                    color: cls.isToday ? 'var(--color-gold)' : 'var(--text-secondary)',
                                                    fontSize: 'var(--text-sm)',
                                                }}>
                                                    {formatDate(cls.date)}
                                                </span>
                                                {cls.isToday && <span className="badge badge-gold">Today</span>}
                                                {cls.attended && <span className="badge badge-green">✓ Checked In</span>}
                                            </div>
                                            <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)' }}>{cls.name}</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={14} />
                                                    {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={14} />
                                                    {cls.location_name}
                                                </span>
                                            </div>
                                        </div>

                                        {cls.isToday && !cls.attended && (() => {
                                            const checkStatus = canCheckIn(cls);
                                            if (checkStatus.allowed) {
                                                return (
                                                    <button
                                                        onClick={() => handleCheckIn(cls.classId)}
                                                        disabled={checkingIn === cls.classId}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        {checkingIn === cls.classId ? (
                                                            <>
                                                                <Loader2 size={16} className="spinner" />
                                                                Checking In...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle size={16} />
                                                                Check In
                                                            </>
                                                        )}
                                                    </button>
                                                );
                                            } else {
                                                return (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--space-1)',
                                                        padding: 'var(--space-2) var(--space-3)',
                                                        background: 'var(--bg-secondary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        color: 'var(--text-tertiary)',
                                                        fontSize: 'var(--text-xs)',
                                                    }}>
                                                        <Lock size={12} />
                                                        <span>{checkStatus.message || 'Check-in opens 1hr before'}</span>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'past' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {pastClasses.length === 0 ? (
                                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>No past classes yet.</p>
                                </div>
                            ) : (
                                pastClasses.map((cls) => (
                                    <div
                                        key={`${cls.classId}-${cls.dateString}`}
                                        className="glass-card"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 'var(--space-4)',
                                            flexWrap: 'wrap',
                                            borderLeft: cls.attended
                                                ? '4px solid var(--color-green)'
                                                : '4px solid var(--color-red)',
                                            opacity: cls.attended ? 1 : 0.75,
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                                                <span style={{
                                                    fontWeight: '600',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: 'var(--text-sm)',
                                                }}>
                                                    {formatDate(cls.date)}
                                                </span>
                                            </div>
                                            <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)' }}>{cls.name}</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={14} />
                                                    {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={14} />
                                                    {cls.location_name}
                                                </span>
                                            </div>
                                        </div>

                                        {cls.attended ? (
                                            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle size={14} />
                                                Attended
                                            </span>
                                        ) : (
                                            <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-red)' }}>
                                                <XCircle size={14} />
                                                Missed
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
