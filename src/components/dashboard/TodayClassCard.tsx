'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, MapPin, Loader2, Calendar, Zap } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface TodayClass {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    location_name: string;
    isHappeningNow: boolean;
    isUpcoming: boolean;
    startsIn?: string;
}

export default function TodayClassCard() {
    const [todayClass, setTodayClass] = useState<TodayClass | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);
    const [error, setError] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchTodayClass();
        // Refresh every minute to update "starts in X minutes"
        const interval = setInterval(fetchTodayClass, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchTodayClass = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Get user's membership
            const { data: membership } = await supabase
                .from('memberships')
                .select('location_id, membership_type_id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            if (!membership) {
                setLoading(false);
                return;
            }

            const today = new Date();
            const currentDayOfWeek = today.getDay();
            const currentTime = today.toTimeString().slice(0, 5);
            const todayDate = today.toISOString().split('T')[0];

            // Fetch today's classes for this location
            const { data: classes } = await supabase
                .from('classes')
                .select('id, name, start_time, end_time, membership_type_id, location:locations(name)')
                .eq('location_id', membership.location_id)
                .eq('day_of_week', currentDayOfWeek)
                .eq('is_active', true)
                .order('start_time');

            if (!classes || classes.length === 0) {
                setLoading(false);
                return;
            }

            // Filter by membership type
            const accessibleClasses = classes.filter(c =>
                c.membership_type_id === null || c.membership_type_id === membership.membership_type_id
            );

            if (accessibleClasses.length === 0) {
                setLoading(false);
                return;
            }

            // Check which class is happening now or upcoming
            let selectedClass: typeof accessibleClasses[0] | null = null;
            let isHappeningNow = false;
            let isUpcoming = false;
            let startsIn = '';

            for (const cls of accessibleClasses) {
                const startTime = cls.start_time.slice(0, 5);
                const endTime = cls.end_time.slice(0, 5);

                if (currentTime >= startTime && currentTime <= endTime) {
                    // Class is happening now!
                    selectedClass = cls;
                    isHappeningNow = true;
                    break;
                } else if (currentTime < startTime) {
                    // Class is upcoming
                    selectedClass = cls;
                    isUpcoming = true;

                    // Calculate "starts in X minutes"
                    const [startH, startM] = startTime.split(':').map(Number);
                    const [nowH, nowM] = currentTime.split(':').map(Number);
                    const diffMins = (startH * 60 + startM) - (nowH * 60 + nowM);

                    if (diffMins <= 60) {
                        startsIn = `Starts in ${diffMins} min`;
                    } else {
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        startsIn = mins > 0 ? `Starts in ${hours}h ${mins}m` : `Starts in ${hours}h`;
                    }
                    break;
                }
            }

            if (!selectedClass) {
                setLoading(false);
                return;
            }

            // Check if already checked in today
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('id')
                .eq('user_id', user.id)
                .eq('class_id', selectedClass.id)
                .eq('class_date', todayDate)
                .single();

            if (existingAttendance) {
                setCheckedIn(true);
            }

            setTodayClass({
                id: selectedClass.id,
                name: selectedClass.name,
                start_time: selectedClass.start_time,
                end_time: selectedClass.end_time,
                location_name: (selectedClass.location as { name: string })?.name || '',
                isHappeningNow,
                isUpcoming,
                startsIn,
            });
        } catch (err) {
            console.error('Error fetching today class:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!todayClass) return;

        setCheckingIn(true);
        setError('');

        try {
            const response = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId: todayClass.id }),
            });

            const data = await response.json();

            if (data.success) {
                setCheckedIn(true);
            } else {
                setError(data.error || 'Failed to check in');
            }
        } catch {
            setError('Failed to check in');
        } finally {
            setCheckingIn(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-card" style={{
                padding: 'var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '120px',
            }}>
                <Loader2 size={24} className="spinner" />
            </div>
        );
    }

    if (!todayClass) {
        return (
            <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Calendar size={24} color="var(--text-tertiary)" />
                    </div>
                    <div>
                        <p style={{ fontWeight: '600', marginBottom: '2px' }}>No Classes Today</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                            Enjoy your rest day! 🧘
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="glass-card"
            style={{
                padding: 'var(--space-5)',
                borderLeft: todayClass.isHappeningNow ? '4px solid var(--color-green)' : '4px solid var(--color-gold)',
                background: todayClass.isHappeningNow
                    ? 'linear-gradient(135deg, rgba(45, 125, 70, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)'
                    : undefined,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {todayClass.isHappeningNow ? (
                    <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} />
                        LIVE NOW
                    </span>
                ) : (
                    <span className="badge badge-gold">{todayClass.startsIn || 'Today'}</span>
                )}
            </div>

            {/* Class Info */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-lg)' }}>
                    {todayClass.name}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {todayClass.start_time.slice(0, 5)} - {todayClass.end_time.slice(0, 5)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} />
                        {todayClass.location_name}
                    </span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p style={{ color: 'var(--color-red)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                    {error}
                </p>
            )}

            {/* Check-in Button */}
            {checkedIn ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'rgba(45, 125, 70, 0.1)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--color-green)',
                    fontWeight: '600',
                }}>
                    <CheckCircle size={20} />
                    You're checked in! 🎉
                </div>
            ) : (
                <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: 'var(--space-3) var(--space-4)',
                        fontSize: 'var(--text-base)',
                        fontWeight: '600',
                    }}
                >
                    {checkingIn ? (
                        <>
                            <Loader2 size={20} className="spinner" />
                            Checking In...
                        </>
                    ) : (
                        <>
                            <CheckCircle size={20} />
                            Check In Now
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
