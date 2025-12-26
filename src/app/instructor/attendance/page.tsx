'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Clock, Search, UserPlus, AlertCircle, Users } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Class {
    id: string;
    name: string;
    start_time: string;
    day_of_week: number;
    location?: {
        name: string;
    };
}

interface Member {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    belt_rank: string;
}

interface AttendanceRecord {
    user_id: string;
    profile?: {
        first_name: string;
        last_name: string;
        belt_rank: string;
    };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function InstructorAttendancePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [members, setMembers] = useState<Member[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState<string | null>(null);
    const [success, setSuccess] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchInstructorClasses();
    }, []);

    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchAttendance();
        }
    }, [selectedClass, selectedDate]);

    const fetchInstructorClasses = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: instructor } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!instructor) {
                setLoading(false);
                return;
            }

            const { data: classesData } = await supabase
                .from('classes')
                .select('*, location:locations(name)')
                .eq('instructor_id', instructor.id)
                .eq('is_active', true)
                .order('day_of_week');

            setClasses(classesData || []);

            // Auto-select today's class if available
            const today = new Date().getDay();
            const todayClass = classesData?.find((c: Class) => c.day_of_week === today);
            if (todayClass) {
                setSelectedClass(todayClass.id);
            } else if (classesData && classesData.length > 0) {
                setSelectedClass(classesData[0].id);
            }

            // Fetch all members for the attendance list
            const { data: membersData } = await supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name, belt_rank')
                .order('first_name');

            setMembers(membersData || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        const { data } = await supabase
            .from('attendance')
            .select('user_id, profile:profiles(first_name, last_name, belt_rank)')
            .eq('class_id', selectedClass)
            .eq('class_date', selectedDate);

        setAttendance(data || []);
    };

    const markAttendance = async (userId: string) => {
        setMarking(userId);
        try {
            const isPresent = attendance.some(a => a.user_id === userId);

            if (isPresent) {
                // Remove attendance
                await supabase
                    .from('attendance')
                    .delete()
                    .eq('class_id', selectedClass)
                    .eq('class_date', selectedDate)
                    .eq('user_id', userId);
            } else {
                // Add attendance
                await supabase
                    .from('attendance')
                    .insert({
                        class_id: selectedClass,
                        user_id: userId,
                        class_date: selectedDate,
                        check_in_time: new Date().toISOString(),
                    });
            }

            await fetchAttendance();
            setSuccess(isPresent ? 'Attendance removed' : 'Attendance marked');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            console.error('Error marking attendance:', err);
        } finally {
            setMarking(null);
        }
    };

    const filteredMembers = members.filter(m =>
        searchQuery === '' ||
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentClass = classes.find(c => c.id === selectedClass);

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
                <h1 className="dashboard-title">Take Attendance</h1>
                <p className="dashboard-subtitle">
                    Record attendance for your classes
                </p>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {classes.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Calendar size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Classes Assigned</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        You need to be assigned to classes before you can take attendance.
                    </p>
                </div>
            ) : (
                <>
                    {/* Class & Date Selection */}
                    <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: '1', minWidth: '200px', margin: 0 }}>
                            <label className="form-label">Class</label>
                            <select
                                className="form-input"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} ({DAYS[cls.day_of_week]} {cls.start_time})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ minWidth: '180px', margin: 0 }}>
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="glass-card" style={{ marginBottom: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{currentClass?.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    {currentClass?.location?.name} • {DAYS[currentClass?.day_of_week || 0]} {currentClass?.start_time}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Users size={24} color="var(--color-gold)" />
                                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-gold)' }}>
                                    {attendance.length}
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>checked in</span>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>

                    {/* Member List */}
                    <div className="card">
                        <div className="card-body" style={{ padding: 0 }}>
                            {filteredMembers.map((member, index) => {
                                const isPresent = attendance.some(a => a.user_id === member.user_id);
                                const isMarking = marking === member.user_id;

                                return (
                                    <div
                                        key={member.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--space-3) var(--space-4)',
                                            borderBottom: index < filteredMembers.length - 1 ? '1px solid var(--border-light)' : 'none',
                                            background: isPresent ? 'rgba(34, 197, 94, 0.05)' : undefined,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: 'var(--radius-full)',
                                                background: isPresent ? 'var(--color-green)' : 'var(--bg-tertiary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: isPresent ? 'white' : 'var(--text-secondary)',
                                                fontWeight: '600',
                                                fontSize: 'var(--text-sm)',
                                            }}>
                                                {isPresent ? <CheckCircle size={18} /> : `${member.first_name[0]}${member.last_name[0]}`}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '500', margin: 0 }}>
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <span className={`badge badge-${member.belt_rank || 'gray'}`} style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>
                                                    {member.belt_rank || 'white'} belt
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => markAttendance(member.user_id)}
                                            disabled={isMarking}
                                            className={`btn ${isPresent ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                                        >
                                            {isMarking ? '...' : isPresent ? 'Remove' : 'Check In'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
