'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Clock, MapPin, Loader2, Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toLocalDateString, timeToMinutes } from '@/lib/dates';

const CHECK_IN_OPENS_BEFORE_MINS = 60;

interface ClassInfo {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    tierIds: string[];
}

interface FamilyMember {
    profileId: string;
    userId: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    membershipTypeId: string | null;
    hasMembership: boolean;
    eligibleClass: ClassInfo | null;
    checkedIn: boolean;
    checkingIn: boolean;
    monthCount: number | null;
    error: string;
}

export default function QrCheckinPage() {
    const params = useParams<{ locationId: string }>();
    const locationId = params.locationId;
    const supabase = getSupabaseClient();

    const [loading, setLoading] = useState(true);
    const [locationName, setLocationName] = useState('');
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [pageState, setPageState] = useState<'ok' | 'bad-location' | 'no-classes' | 'not-open' | 'no-membership'>('ok');
    const [nextOpenTime, setNextOpenTime] = useState('');

    const fetchMonthCount = useCallback(async (userId: string) => {
        const now = new Date();
        const monthStart = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
        const { count } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('class_date', monthStart);
        return count || 0;
    }, [supabase]);

    useEffect(() => {
        const load = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // middleware redirects; belt and braces

                // Location must exist and be active
                const { data: location } = await supabase
                    .from('locations')
                    .select('id, name, is_active')
                    .eq('id', locationId)
                    .maybeSingle();

                if (!location || !location.is_active) {
                    setPageState('bad-location');
                    return;
                }
                setLocationName(location.name);

                // The signed-in member plus any linked children
                const { data: myProfile } = await supabase
                    .from('profiles')
                    .select('id, user_id, first_name, last_name, profile_image_url')
                    .eq('user_id', user.id)
                    .single();

                if (!myProfile) {
                    setPageState('bad-location');
                    return;
                }

                const { data: childProfiles } = await supabase
                    .from('profiles')
                    .select('id, user_id, first_name, last_name, profile_image_url')
                    .eq('parent_guardian_id', myProfile.id);

                const family = [myProfile, ...(childProfiles || [])];
                const familyUserIds = family.map(p => p.user_id);

                // Active memberships at this location, per family member
                const { data: memberships } = await supabase
                    .from('memberships')
                    .select('user_id, membership_type_id')
                    .in('user_id', familyUserIds)
                    .eq('location_id', locationId)
                    .eq('status', 'active');

                const membershipByUser = new Map<string, string | null>(
                    (memberships || []).map((m: { user_id: string; membership_type_id: string | null }) =>
                        [m.user_id, m.membership_type_id]
                    )
                );

                if (membershipByUser.size === 0) {
                    setPageState('no-membership');
                    return;
                }

                // Today's classes at this location
                const today = new Date();
                const { data: classes } = await supabase
                    .from('classes')
                    .select('id, name, start_time, end_time, class_membership_types(membership_type_id)')
                    .eq('location_id', locationId)
                    .eq('day_of_week', today.getDay())
                    .eq('is_active', true)
                    .order('start_time');

                if (!classes || classes.length === 0) {
                    setPageState('no-classes');
                    return;
                }

                const classInfos: ClassInfo[] = classes.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    start_time: c.start_time,
                    end_time: c.end_time,
                    tierIds: (c.class_membership_types || []).map(
                        (t: { membership_type_id: string }) => t.membership_type_id
                    ),
                }));

                const nowMins = today.getHours() * 60 + today.getMinutes();

                // A class is open for check-in from 1h before start until it ends
                const openClasses = classInfos.filter(c =>
                    nowMins >= timeToMinutes(c.start_time) - CHECK_IN_OPENS_BEFORE_MINS &&
                    nowMins <= timeToMinutes(c.end_time)
                );

                if (openClasses.length === 0) {
                    const upcoming = classInfos.find(c => nowMins < timeToMinutes(c.start_time));
                    if (upcoming) {
                        const opensAt = timeToMinutes(upcoming.start_time) - CHECK_IN_OPENS_BEFORE_MINS;
                        const h = Math.floor(opensAt / 60);
                        const m = opensAt % 60;
                        setNextOpenTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                        setPageState('not-open');
                    } else {
                        setPageState('no-classes');
                    }
                    return;
                }

                // Match each family member to the first open class their tier can attend
                const eligibleFor = (tierId: string | null): ClassInfo | null =>
                    openClasses.find(c => c.tierIds.length === 0 || (tierId !== null && c.tierIds.includes(tierId))) || null;

                // Existing check-ins today for any open class
                const todayDate = toLocalDateString(today);
                const { data: attendance } = await supabase
                    .from('attendance')
                    .select('user_id, class_id')
                    .in('user_id', familyUserIds)
                    .in('class_id', openClasses.map(c => c.id))
                    .eq('class_date', todayDate);

                const checkedInUsers = new Set((attendance || []).map((a: { user_id: string }) => a.user_id));

                const initialMembers: FamilyMember[] = family.map(p => {
                    const hasMembership = membershipByUser.has(p.user_id);
                    return {
                        profileId: p.id,
                        userId: p.user_id,
                        firstName: p.first_name,
                        lastName: p.last_name,
                        profileImageUrl: p.profile_image_url || undefined,
                        membershipTypeId: membershipByUser.get(p.user_id) ?? null,
                        hasMembership,
                        eligibleClass: hasMembership ? eligibleFor(membershipByUser.get(p.user_id) ?? null) : null,
                        checkedIn: checkedInUsers.has(p.user_id),
                        checkingIn: false,
                        monthCount: null,
                        error: '',
                    };
                });

                setMembers(initialMembers);

                // Show this-month counts for anyone already checked in
                initialMembers.filter(m => m.checkedIn).forEach(async (m) => {
                    const count = await fetchMonthCount(m.userId);
                    setMembers(prev => prev.map(x => x.userId === m.userId ? { ...x, monthCount: count } : x));
                });
            } catch (err) {
                console.error('Error loading check-in page:', err);
                setPageState('bad-location');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [locationId, supabase, fetchMonthCount]);

    const handleCheckIn = async (member: FamilyMember) => {
        if (!member.eligibleClass || member.checkedIn || member.checkingIn) return;

        setMembers(prev => prev.map(m =>
            m.userId === member.userId ? { ...m, checkingIn: true, error: '' } : m
        ));

        try {
            const response = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId: member.eligibleClass.id,
                    profileId: member.userId,
                }),
            });
            const data = await response.json();

            if (data.success) {
                setMembers(prev => prev.map(m =>
                    m.userId === member.userId ? { ...m, checkedIn: true, checkingIn: false } : m
                ));
                const count = await fetchMonthCount(member.userId);
                setMembers(prev => prev.map(m =>
                    m.userId === member.userId ? { ...m, monthCount: count } : m
                ));
            } else {
                setMembers(prev => prev.map(m =>
                    m.userId === member.userId
                        ? { ...m, checkingIn: false, error: data.error || 'Check-in failed. Please try again.' }
                        : m
                ));
            }
        } catch {
            setMembers(prev => prev.map(m =>
                m.userId === member.userId
                    ? { ...m, checkingIn: false, error: 'Check-in failed. Please try again.' }
                    : m
            ));
        }
    };

    const eligibleMembers = members.filter(m => m.hasMembership && m.eligibleClass);
    const allDone = eligibleMembers.length > 0 && eligibleMembers.every(m => m.checkedIn);

    const shell = (content: React.ReactNode) => (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-6) var(--space-4)',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <Link href="/dashboard">
                        <Image
                            src="/logo-full.png"
                            alt="Sport of Kings"
                            width={140}
                            height={70}
                            priority
                            style={{ height: '56px', width: 'auto', margin: '0 auto' }}
                        />
                    </Link>
                </div>
                {content}
            </div>
        </div>
    );

    if (loading) {
        return shell(
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <Loader2 size={32} className="spinner" style={{ margin: '0 auto var(--space-3)' }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Finding your class...</p>
            </div>
        );
    }

    if (pageState === 'bad-location') {
        return shell(
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <AlertCircle size={44} color="var(--color-red)" style={{ margin: '0 auto var(--space-4)' }} />
                <h2 style={{ marginBottom: 'var(--space-2)' }}>Check-in unavailable</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                    This check-in link isn&apos;t valid. Please ask your coach for help, or check in from your dashboard.
                </p>
                <Link href="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                    <ChevronRight size={18} />
                </Link>
            </div>
        );
    }

    if (pageState === 'no-membership') {
        return shell(
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <MapPin size={44} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                <h2 style={{ marginBottom: 'var(--space-2)' }}>No membership at {locationName}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                    Nobody on your account has an active membership at this location.
                    If that doesn&apos;t sound right, please speak to your coach.
                </p>
                <Link href="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                    <ChevronRight size={18} />
                </Link>
            </div>
        );
    }

    if (pageState === 'no-classes') {
        return shell(
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <Calendar size={44} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                <h2 style={{ marginBottom: 'var(--space-2)' }}>No classes right now</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                    There are no more classes at {locationName} today. See you next session!
                </p>
                <Link href="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                    <ChevronRight size={18} />
                </Link>
            </div>
        );
    }

    if (pageState === 'not-open') {
        return shell(
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <Clock size={44} color="var(--color-gold)" style={{ margin: '0 auto var(--space-4)' }} />
                <h2 style={{ marginBottom: 'var(--space-2)' }}>A bit early!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                    Check-in for the next class at {locationName} opens at <strong>{nextOpenTime}</strong> —
                    scan again then.
                </p>
            </div>
        );
    }

    return shell(
        <>
            {/* Location + status header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                <p style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    margin: 0,
                }}>
                    <MapPin size={14} />
                    {locationName}
                </p>
                <h1 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-1) 0 0' }}>
                    {allDone ? 'All checked in! 🎉' : 'Who’s training today?'}
                </h1>
            </div>

            {/* One tappable card per family member */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {members.map(member => {
                    const cls = member.eligibleClass;
                    const disabled = !member.hasMembership || !cls;

                    return (
                        <div key={member.userId}>
                            <button
                                onClick={() => handleCheckIn(member)}
                                disabled={disabled || member.checkedIn || member.checkingIn}
                                className="glass-card"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    padding: 'var(--space-4)',
                                    minHeight: '76px',
                                    textAlign: 'left',
                                    cursor: disabled || member.checkedIn ? 'default' : 'pointer',
                                    border: member.checkedIn
                                        ? '2px solid var(--color-green)'
                                        : disabled
                                            ? '2px solid transparent'
                                            : '2px solid var(--color-gold)',
                                    background: member.checkedIn
                                        ? 'linear-gradient(135deg, rgba(45, 125, 70, 0.10), rgba(255, 255, 255, 0.9))'
                                        : undefined,
                                    opacity: disabled ? 0.6 : 1,
                                    transition: 'border-color 0.2s ease, background 0.2s ease',
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-full)',
                                    background: member.checkedIn ? 'var(--color-green)' : 'var(--color-gold-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: member.checkedIn ? 'white' : 'var(--color-black)',
                                    fontWeight: 700,
                                    fontSize: 'var(--text-lg)',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                }}>
                                    {member.checkedIn ? (
                                        <CheckCircle size={26} />
                                    ) : member.profileImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={member.profileImageUrl}
                                            alt=""
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        `${member.firstName[0] || ''}${member.lastName[0] || ''}`
                                    )}
                                </div>

                                {/* Name + class / status */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, margin: 0, fontSize: 'var(--text-base)' }}>
                                        {member.firstName} {member.lastName}
                                    </p>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 'var(--text-sm)',
                                        color: member.checkedIn ? 'var(--color-green)' : 'var(--text-secondary)',
                                    }}>
                                        {member.checkedIn ? (
                                            member.monthCount !== null
                                                ? `Checked in · ${member.monthCount} ${member.monthCount === 1 ? 'session' : 'sessions'} this month 💪`
                                                : 'Checked in'
                                        ) : !member.hasMembership ? (
                                            'No membership at this location'
                                        ) : !cls ? (
                                            'No class open for this membership right now'
                                        ) : (
                                            `${cls.name} · ${cls.start_time.slice(0, 5)}–${cls.end_time.slice(0, 5)}`
                                        )}
                                    </p>
                                </div>

                                {/* Action hint */}
                                {!member.checkedIn && !disabled && (
                                    <span style={{
                                        flexShrink: 0,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-1)',
                                        color: 'var(--color-gold-dark)',
                                        fontWeight: 600,
                                        fontSize: 'var(--text-sm)',
                                    }}>
                                        {member.checkingIn ? (
                                            <Loader2 size={20} className="spinner" />
                                        ) : (
                                            <>
                                                Check in
                                                <ChevronRight size={16} />
                                            </>
                                        )}
                                    </span>
                                )}
                            </button>

                            {member.error && (
                                <p role="alert" style={{
                                    color: 'var(--color-red)',
                                    fontSize: 'var(--text-sm)',
                                    margin: 'var(--space-2) 0 0 var(--space-2)',
                                }}>
                                    {member.error}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <p style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                marginTop: 'var(--space-6)',
            }}>
                {allDone ? 'Have a great session!' : 'Tap a name to check in.'}
            </p>
        </>
    );
}
