'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Clock, TrendingUp, Award, MapPin } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AttendanceRecord {
    id: string;
    class_date: string;
    check_in_time: string;
    class?: {
        name: string;
        location?: {
            name: string;
        };
    };
}

interface MemberAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: {
        user_id: string;
        first_name: string;
        last_name: string;
        belt_rank?: string;
    } | null;
}

export default function MemberAttendanceModal({ isOpen, onClose, member }: MemberAttendanceModalProps) {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClasses: 0,
        thisMonth: 0,
        lastMonth: 0,
        streak: 0,
    });

    const supabase = getSupabaseClient();

    useEffect(() => {
        if (isOpen && member) {
            fetchAttendance();
        }
    }, [isOpen, member]);

    const fetchAttendance = async () => {
        if (!member) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('attendance')
            .select('*, class:classes(name, location:locations(name))')
            .eq('user_id', member.user_id)
            .order('class_date', { ascending: false });

        if (error) {
            console.error('Error fetching attendance:', error);
            setLoading(false);
            return;
        }

        setAttendance(data || []);
        calculateStats(data || []);
        setLoading(false);
    };

    const calculateStats = (records: AttendanceRecord[]) => {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonthCount = records.filter(r => new Date(r.class_date) >= thisMonthStart).length;
        const lastMonthCount = records.filter(r => {
            const date = new Date(r.class_date);
            return date >= lastMonthStart && date <= lastMonthEnd;
        }).length;

        // Calculate current streak
        let streak = 0;
        const sortedDates = [...new Set(records.map(r => r.class_date))].sort().reverse();

        if (sortedDates.length > 0) {
            // Simple streak: count consecutive weeks with attendance
            const weeks = new Set<string>();
            sortedDates.forEach(date => {
                const d = new Date(date);
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                weeks.add(weekStart.toISOString().split('T')[0]);
            });
            streak = weeks.size;
        }

        setStats({
            totalClasses: records.length,
            thisMonth: thisMonthCount,
            lastMonth: lastMonthCount,
            streak,
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (timeStr: string) => {
        return new Date(timeStr).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen || !member) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                style={{ maxWidth: '700px', maxHeight: '85vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">
                            {member.first_name} {member.last_name}
                        </h3>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                            Attendance History
                        </p>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-4)',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-light)',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 'var(--text-2xl)',
                                fontWeight: '700',
                                color: 'var(--color-gold)',
                            }}>
                                {stats.totalClasses}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                Total Classes
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 'var(--text-2xl)',
                                fontWeight: '700',
                                color: 'var(--color-green)',
                            }}>
                                {stats.thisMonth}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                This Month
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 'var(--text-2xl)',
                                fontWeight: '700',
                                color: 'var(--text-primary)',
                            }}>
                                {stats.lastMonth}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                Last Month
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 'var(--text-2xl)',
                                fontWeight: '700',
                                color: 'var(--color-gold)',
                            }}>
                                {stats.streak}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                Week Streak
                            </div>
                        </div>
                    </div>

                    {/* Attendance List */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: 'var(--space-4)' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                <div className="spinner" style={{ margin: '0 auto' }} />
                            </div>
                        ) : attendance.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                                <Calendar size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
                                <p>No attendance records found</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {attendance.map((record) => (
                                    <div
                                        key={record.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-3)',
                                            padding: 'var(--space-3)',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--border-light)',
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'rgba(45, 125, 70, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-green)',
                                        }}>
                                            <CheckCircle size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)' }}>
                                                {record.class?.name || 'Unknown Class'}
                                            </div>
                                            <div style={{
                                                fontSize: 'var(--text-xs)',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-2)',
                                            }}>
                                                <MapPin size={12} />
                                                {record.class?.location?.name || 'Unknown Location'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '500', fontSize: 'var(--text-sm)' }}>
                                                {formatDate(record.class_date)}
                                            </div>
                                            <div style={{
                                                fontSize: 'var(--text-xs)',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-1)',
                                                justifyContent: 'flex-end',
                                            }}>
                                                <Clock size={12} />
                                                {formatTime(record.check_in_time)}
                                            </div>
                                        </div>
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
