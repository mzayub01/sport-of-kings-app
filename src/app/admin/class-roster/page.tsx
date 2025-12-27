'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Search,
    Calendar,
    Clock,
    User,
    UserCheck,
    AlertCircle,
    AlertTriangle,
    MapPin,
    Users,
    Loader2
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface ClassInfo {
    id: string;
    name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    location?: { id: string; name: string };
    membership_type_id?: string;
}

interface MemberStatus {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    belt_rank: string;
    is_child: boolean;
    checked_in: boolean;
    check_in_time?: string;
    attendance_id?: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ClassRosterPage() {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [roster, setRoster] = useState<MemberStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchRoster();
        }
    }, [selectedClass, selectedDate]);

    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name, day_of_week, start_time, end_time, location:locations(id, name), membership_type_id')
            .eq('is_active', true)
            .order('day_of_week');

        if (error) {
            console.error('Error fetching classes:', error);
            setError('Failed to load classes');
        } else {
            setClasses(data || []);
        }
        setLoading(false);
    };

    const fetchRoster = async () => {
        setRosterLoading(true);
        setError('');

        const classInfo = classes.find(c => c.id === selectedClass);
        if (!classInfo || !classInfo.location) {
            setRosterLoading(false);
            return;
        }

        // Fetch members with active memberships at this location
        const { data: memberships, error: membershipError } = await supabase
            .from('memberships')
            .select('user_id, profile:profiles(user_id, first_name, last_name, email, belt_rank, is_child)')
            .eq('location_id', (classInfo.location as { id: string }).id)
            .eq('status', 'active');

        if (membershipError) {
            console.error('Error fetching memberships:', membershipError);
            setError('Failed to load class roster');
            setRosterLoading(false);
            return;
        }

        // Fetch attendance for this class and date
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('id, user_id, check_in_time')
            .eq('class_id', selectedClass)
            .eq('class_date', selectedDate);

        if (attendanceError) {
            console.error('Error fetching attendance:', attendanceError);
        }

        // Create attendance lookup
        const attendanceLookup = new Map<string, { id: string; check_in_time: string }>();
        (attendance || []).forEach((a: { id: string; user_id: string; check_in_time: string }) => {
            attendanceLookup.set(a.user_id, { id: a.id, check_in_time: a.check_in_time });
        });

        // Build roster with check-in status
        const rosterData: MemberStatus[] = (memberships || [])
            .filter((m: { profile: unknown }) => m.profile)
            .map((m: { user_id: string; profile: { user_id: string; first_name: string; last_name: string; email: string; belt_rank: string; is_child: boolean } }) => {
                const profile = m.profile;
                const att = attendanceLookup.get(profile.user_id);
                return {
                    user_id: profile.user_id,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    email: profile.email,
                    belt_rank: profile.belt_rank || 'white',
                    is_child: profile.is_child,
                    checked_in: !!att,
                    check_in_time: att?.check_in_time,
                    attendance_id: att?.id,
                };
            })
            .sort((a: MemberStatus, b: MemberStatus) => {
                // Sort: checked in first, then by name
                if (a.checked_in !== b.checked_in) return a.checked_in ? -1 : 1;
                return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
            });

        setRoster(rosterData);
        setRosterLoading(false);
    };

    const toggleCheckIn = async (member: MemberStatus) => {
        setError('');
        setSuccess('');

        if (member.checked_in && member.attendance_id) {
            // Remove check-in
            const { error } = await supabase
                .from('attendance')
                .delete()
                .eq('id', member.attendance_id);

            if (error) {
                setError('Failed to remove check-in');
            } else {
                setSuccess(`${member.first_name} checked out`);
                fetchRoster();
            }
        } else {
            // Add check-in
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('attendance')
                .insert({
                    class_id: selectedClass,
                    user_id: member.user_id,
                    class_date: selectedDate,
                    check_in_time: new Date().toISOString(),
                    checked_in_by: user?.id,
                });

            if (error) {
                if (error.code === '23505') {
                    setError('Already checked in');
                } else {
                    setError(error.message);
                }
            } else {
                setSuccess(`${member.first_name} checked in!`);
                fetchRoster();
            }
        }

        setTimeout(() => {
            setSuccess('');
        }, 3000);
    };

    const filteredRoster = roster.filter(m => {
        const query = searchQuery.toLowerCase();
        return (
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query)
        );
    });

    const checkedInCount = roster.filter(m => m.checked_in).length;
    const selectedClassInfo = classes.find(c => c.id === selectedClass);

    // Check if selected date matches class day of week
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const selectedDayOfWeek = selectedDateObj.getDay();
    const isWrongDay = selectedClassInfo && selectedDayOfWeek !== selectedClassInfo.day_of_week;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Class Roster</h1>
                <p className="dashboard-subtitle">View enrolled members and check-in status for each class</p>
            </div>

            {/* Alerts */}
            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Calendar size={16} />
                            Select Class
                        </label>
                        <select
                            className="form-input"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Choose a class...</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} - {DAYS_OF_WEEK[cls.day_of_week]} ({(cls.location as { name: string })?.name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Clock size={16} />
                            Date
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Search size={16} />
                            Search
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Class Info & Stats - Only show on correct day */}
            {selectedClass && selectedClassInfo && !isWrongDay && (
                <div className="glass-card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>{selectedClassInfo.name}</h2>
                            <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <MapPin size={14} />
                                {(selectedClassInfo.location as { name: string })?.name}
                                <span style={{ margin: '0 var(--space-2)' }}>•</span>
                                <Clock size={14} />
                                {selectedClassInfo.start_time} - {selectedClassInfo.end_time}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-gold)' }}>
                                    {checkedInCount}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Checked In</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>
                                    {roster.length}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Enrolled</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 'var(--text-2xl)',
                                    fontWeight: '700',
                                    color: roster.length > 0 ? (checkedInCount / roster.length >= 0.7 ? 'var(--color-green)' : 'var(--text-primary)') : 'var(--text-tertiary)'
                                }}>
                                    {roster.length > 0 ? Math.round((checkedInCount / roster.length) * 100) : 0}%
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Attendance</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Roster List - Only show if date matches class day */}
            {selectedClass && isWrongDay ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <AlertTriangle size={48} style={{ color: '#EAB308', marginBottom: 'var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Class on This Day</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', maxWidth: '400px', margin: '0 auto' }}>
                        <strong>{selectedClassInfo?.name}</strong> runs on <strong>{DAYS_OF_WEEK[selectedClassInfo?.day_of_week || 0]}s</strong>,
                        but you&apos;ve selected a <strong>{DAYS_OF_WEEK[selectedDayOfWeek]}</strong>.
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)' }}>
                        Please select a {DAYS_OF_WEEK[selectedClassInfo?.day_of_week || 0]} to view the roster and check in members.
                    </p>
                </div>
            ) : selectedClass ? (
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Users size={20} />
                            Class Roster ({filteredRoster.length} members)
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {rosterLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', gap: 'var(--space-3)' }}>
                                <Loader2 size={24} className="animate-spin" />
                                <span>Loading roster...</span>
                            </div>
                        ) : filteredRoster.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                                <Users size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
                                <p>{searchQuery ? 'No members match your search' : 'No enrolled members at this location'}</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {filteredRoster.map((member) => (
                                    <div
                                        key={member.user_id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-3)',
                                            padding: 'var(--space-3) var(--space-4)',
                                            borderBottom: '1px solid var(--border-light)',
                                            background: member.checked_in ? 'rgba(45, 125, 70, 0.05)' : 'transparent',
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: 'var(--radius-full)',
                                            background: member.checked_in ? 'var(--color-green)' : 'var(--color-gold-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600',
                                            color: member.checked_in ? 'white' : 'var(--color-black)',
                                            flexShrink: 0,
                                        }}>
                                            {member.checked_in ? <UserCheck size={20} /> : `${member.first_name[0]}${member.last_name[0]}`}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: '600' }}>
                                                    {member.first_name} {member.last_name}
                                                </span>
                                                <span className={`badge badge-belt-${member.belt_rank}`}>
                                                    {member.belt_rank.charAt(0).toUpperCase() + member.belt_rank.slice(1)}
                                                </span>
                                                {member.is_child && (
                                                    <span className="badge badge-gold">Child</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                {member.email}
                                            </div>
                                        </div>

                                        {/* Status & Check-in Time */}
                                        <div style={{ textAlign: 'right', marginRight: 'var(--space-2)' }}>
                                            {member.checked_in && member.check_in_time && (
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                                    Checked in {new Date(member.check_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Toggle Button */}
                                        <button
                                            onClick={() => toggleCheckIn(member)}
                                            className={`btn ${member.checked_in ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                                            disabled={isWrongDay && !member.checked_in}
                                            style={{
                                                minWidth: '100px',
                                                color: member.checked_in ? 'var(--color-red)' : undefined,
                                                opacity: isWrongDay && !member.checked_in ? 0.5 : 1,
                                            }}
                                        >
                                            {member.checked_in ? (
                                                <>
                                                    <XCircle size={16} />
                                                    Undo
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Check In
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Calendar size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>Select a Class</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        Choose a class above to view enrolled members and their check-in status
                    </p>
                </div>
            )
            }
        </div >
    );
}
