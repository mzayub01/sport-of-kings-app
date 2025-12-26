'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Search, Calendar, Clock, User, UserPlus, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Class, Profile, Attendance } from '@/lib/types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminAttendancePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [members, setMembers] = useState<Profile[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchAttendance();
        }
    }, [selectedClass, selectedDate]);

    const fetchData = async () => {
        const [classesRes, membersRes] = await Promise.all([
            supabase.from('classes').select('*, location:locations(name)').eq('is_active', true).order('day_of_week'),
            supabase.from('profiles').select('*').order('first_name'),
        ]);

        setClasses(classesRes.data || []);
        setMembers(membersRes.data || []);
        setLoading(false);
    };

    const fetchAttendance = async () => {
        console.log('Fetching attendance for class:', selectedClass, 'date:', selectedDate);

        const { data, error } = await supabase
            .from('attendance')
            .select('*, profile:profiles(*)')
            .eq('class_id', selectedClass)
            .eq('class_date', selectedDate);

        console.log('Fetch attendance result:', { data, error });

        setAttendance(data || []);
    };

    const checkInMember = async (memberId: string) => {
        setError('');
        setSuccess('');

        if (!selectedClass) {
            setError('Please select a class first');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        const insertData = {
            class_id: selectedClass,
            user_id: memberId,
            class_date: selectedDate,
            check_in_time: new Date().toISOString(),
            checked_in_by: user?.id,
        };

        console.log('Inserting attendance:', insertData);

        const { data, error } = await supabase.from('attendance').insert(insertData).select();

        console.log('Insert result:', { data, error });

        if (error) {
            if (error.code === '23505') {
                setError('This member is already checked in for this class');
            } else {
                console.error('Attendance insert error:', error);
                setError(error.message);
            }
        } else {
            setSuccess('Member checked in successfully');
            await fetchAttendance();
        }
    };

    const removeCheckIn = async (attendanceId: string) => {
        await supabase.from('attendance').delete().eq('id', attendanceId);
        fetchAttendance();
    };

    const filteredMembers = members.filter(member => {
        const query = searchQuery.toLowerCase();
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        const email = member.email.toLowerCase();
        return fullName.includes(query) || email.includes(query);
    });

    const checkedInIds = new Set(attendance.map(a => a.user_id));

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Attendance Management</h1>
                <p className="dashboard-subtitle">Check in members to classes on their behalf</p>
            </div>

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
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                {/* Member Search */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <UserPlus size={20} />
                            Check In Member
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '42px' }}
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                                    <div className="spinner" />
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No members found</p>
                            ) : (
                                filteredMembers.slice(0, 20).map((member) => {
                                    const isCheckedIn = checkedInIds.has(member.user_id);
                                    return (
                                        <div
                                            key={member.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 'var(--space-3)',
                                                borderBottom: '1px solid var(--border-light)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <div className="avatar avatar-sm">
                                                    {member.first_name?.[0]}{member.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '500', margin: 0, fontSize: 'var(--text-sm)' }}>
                                                        {member.first_name} {member.last_name}
                                                    </p>
                                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                            {isCheckedIn ? (
                                                <span className="badge badge-green">
                                                    <CheckCircle size={12} style={{ marginRight: '4px' }} />
                                                    Checked In
                                                </span>
                                            ) : (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => checkInMember(member.user_id)}
                                                    disabled={!selectedClass}
                                                >
                                                    Check In
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Today's Attendance */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <CheckCircle size={20} />
                            Checked In ({attendance.length})
                        </h3>
                    </div>
                    <div className="card-body">
                        {attendance.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                                {selectedClass ? 'No check-ins yet for this class' : 'Select a class to view attendance'}
                            </div>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {attendance.map((record) => (
                                    <div
                                        key={record.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--space-3)',
                                            borderBottom: '1px solid var(--border-light)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div className="avatar avatar-sm">
                                                {(record.profile as Profile)?.first_name?.[0]}{(record.profile as Profile)?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '500', margin: 0, fontSize: 'var(--text-sm)' }}>
                                                    {(record.profile as Profile)?.first_name} {(record.profile as Profile)?.last_name}
                                                </p>
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                                    {new Date(record.check_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                    {record.checked_in_by && ' • By admin'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => removeCheckIn(record.id)}
                                            style={{ color: 'var(--color-error)' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
