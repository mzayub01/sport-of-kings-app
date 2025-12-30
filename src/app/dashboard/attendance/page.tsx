'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Award, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useDashboard } from '@/components/dashboard/DashboardProvider';

interface AttendanceRecord {
    id: string;
    class_date: string;
    check_in_time: string;
    class: {
        name: string;
        class_type: string;
        location: {
            name: string;
        };
    };
}

interface MonthData {
    label: string;
    records: AttendanceRecord[];
}

export default function MemberAttendancePage() {
    const supabase = getSupabaseClient();
    const { selectedProfileId } = useDashboard();

    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedProfileId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch attendance history for selected profile
            const { data: rawAttendance } = await supabase
                .from('attendance')
                .select('*, class:classes(name, class_type, location:locations(name))')
                .eq('user_id', selectedProfileId)
                .order('class_date', { ascending: false })
                .limit(50);

            setAttendance((rawAttendance || []) as AttendanceRecord[]);
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthAttendance = attendance.filter(a => {
        const date = new Date(a.class_date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    // Group by month
    const attendanceByMonth: Record<string, MonthData> = {};
    attendance.forEach(record => {
        const date = new Date(record.class_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        if (!attendanceByMonth[key]) {
            attendanceByMonth[key] = { label, records: [] };
        }
        attendanceByMonth[key].records.push(record);
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-12)', gap: 'var(--space-3)' }}>
                <Loader2 size={24} className="animate-spin" />
                <span>Loading attendance...</span>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Attendance</h1>
                <p className="dashboard-subtitle">Track your class attendance history</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Total Sessions</p>
                            <p className="stat-value">{attendance.length}</p>
                        </div>
                        <CheckCircle size={32} color="var(--color-gold)" />
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">This Month</p>
                            <p className="stat-value">{thisMonthAttendance}</p>
                        </div>
                        <Calendar size={32} color="var(--color-green)" />
                    </div>
                    <div className="stat-change positive">
                        <TrendingUp size={14} />
                        <span>Keep it up!</span>
                    </div>
                </div>
            </div>

            {/* Attendance History */}
            {attendance.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Award size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Attendance Yet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Start attending classes to build your training history!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {Object.entries(attendanceByMonth).map(([key, monthData]) => (
                        <div key={key}>
                            <h3 style={{
                                fontSize: 'var(--text-lg)',
                                color: 'var(--color-gold)',
                                marginBottom: 'var(--space-4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                            }}>
                                <Calendar size={20} />
                                {monthData.label}
                                <span className="badge badge-gray">{monthData.records.length} sessions</span>
                            </h3>

                            <div className="card">
                                <div className="card-body" style={{ padding: 0 }}>
                                    {monthData.records.map((record, index) => (
                                        <div
                                            key={record.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 'var(--space-4)',
                                                borderBottom: index < monthData.records.length - 1 ? '1px solid var(--border-light)' : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: 'var(--radius-lg)',
                                                    background: 'var(--color-gold-gradient)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <CheckCircle size={20} color="var(--color-black)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600', margin: 0 }}>
                                                        {record.class?.name}
                                                    </p>
                                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                                        {record.class?.location?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: '500', margin: 0, fontSize: 'var(--text-sm)' }}>
                                                    {new Date(record.class_date).toLocaleDateString('en-GB', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}
                                                </p>
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                                                    <Clock size={12} />
                                                    {new Date(record.check_in_time).toLocaleTimeString('en-GB', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
