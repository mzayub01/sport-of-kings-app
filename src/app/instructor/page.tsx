import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar, Users, CheckCircle, BookOpen, ChevronRight, Clock, Award } from 'lucide-react';

interface DashboardClass {
    id: string;
    name: string;
    start_time: string;
    day_of_week: number;
    location?: { name: string };
}

interface RecentStudent {
    user_id: string;
    class_date: string;
    profiles?: { first_name: string; last_name: string };
}

export const metadata = {
    title: 'Instructor Dashboard | Sport of Kings',
    description: 'Instructor dashboard for managing classes and students',
};

export default async function InstructorDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Not authenticated</div>;
    }

    // Get instructor record
    const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user.id)
        .single();

    // Get instructor's classes
    const { data: classes } = await supabase
        .from('classes')
        .select('*, location:locations(name)')
        .eq('instructor_id', instructor?.id)
        .eq('is_active', true)
        .order('day_of_week') as { data: DashboardClass[] | null };

    // Get today's day of week (0 = Sunday)
    const today = new Date().getDay();
    const todayClasses = classes?.filter((c: DashboardClass) => c.day_of_week === today) || [];
    const todayDate = new Date().toISOString().split('T')[0];

    // Get today's attendance for instructor's classes
    const classIds = classes?.map((c: DashboardClass) => c.id) || [];
    const { count: todayAttendance } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)
        .eq('class_date', todayDate);

    // Get this week's attendance
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { count: weekAttendance } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)
        .gte('class_date', weekStart.toISOString().split('T')[0]);

    // Get unique students from recent attendance
    const { data: recentStudents } = await supabase
        .from('attendance')
        .select('user_id, class_date, profiles(first_name, last_name)')
        .in('class_id', classIds)
        .order('class_date', { ascending: false })
        .limit(10) as { data: RecentStudent[] | null };

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Instructor Dashboard</h1>
                <p className="dashboard-subtitle">
                    Manage your classes and track student progress
                </p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">My Classes</p>
                            <p className="stat-value">{classes?.length || 0}</p>
                        </div>
                        <Calendar size={32} color="var(--color-gold)" />
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Today's Attendance</p>
                            <p className="stat-value">{todayAttendance || 0}</p>
                        </div>
                        <CheckCircle size={32} color="var(--color-green)" />
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">This Week</p>
                            <p className="stat-value">{weekAttendance || 0}</p>
                        </div>
                        <Users size={32} color="var(--color-gold)" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
                {/* Today's Classes */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Calendar size={20} color="var(--color-gold)" />
                            Today's Classes
                        </h3>
                        <span className="badge badge-gold">{DAYS[today]}</span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {todayClasses.length === 0 ? (
                            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No classes scheduled for today
                            </div>
                        ) : (
                            todayClasses.map((cls, index) => (
                                <Link
                                    key={cls.id}
                                    href="/instructor/attendance"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-4)',
                                        borderBottom: index < todayClasses.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight: '600', margin: 0 }}>{cls.name}</p>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                            {cls.location?.name}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                            <Clock size={14} />
                                            {cls.start_time}
                                        </span>
                                        <ChevronRight size={18} color="var(--text-tertiary)" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Award size={20} color="var(--color-gold)" />
                            Quick Actions
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <Link
                            href="/instructor/attendance"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-4)',
                                borderBottom: '1px solid var(--border-light)',
                                textDecoration: 'none',
                                color: 'inherit',
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
                                    <p style={{ fontWeight: '600', margin: 0 }}>Take Attendance</p>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                        Record today's attendance
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={18} color="var(--text-tertiary)" />
                        </Link>
                        <Link
                            href="/instructor/classes"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-4)',
                                borderBottom: '1px solid var(--border-light)',
                                textDecoration: 'none',
                                color: 'inherit',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Calendar size={20} color="var(--color-gold)" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: '600', margin: 0 }}>View Schedule</p>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                        See all your classes
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={18} color="var(--text-tertiary)" />
                        </Link>
                        <Link
                            href="/instructor/naseeha"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-4)',
                                textDecoration: 'none',
                                color: 'inherit',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <BookOpen size={20} color="var(--color-gold)" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: '600', margin: 0 }}>Weekly Naseeha</p>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                        Add this week's advice
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={18} color="var(--text-tertiary)" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Students */}
            {recentStudents && recentStudents.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Users size={20} color="var(--color-gold)" />
                            Recent Students
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {recentStudents.slice(0, 5).map((record: RecentStudent, index: number) => (
                            <div
                                key={`${record.user_id}-${index}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--space-3) var(--space-4)',
                                    borderBottom: index < 4 ? '1px solid var(--border-light)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--bg-tertiary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: '600',
                                    }}>
                                        {(record.profiles as any)?.first_name?.[0]}{(record.profiles as any)?.last_name?.[0]}
                                    </div>
                                    <span style={{ fontWeight: '500' }}>
                                        {(record.profiles as any)?.first_name} {(record.profiles as any)?.last_name}
                                    </span>
                                </div>
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                                    {new Date(record.class_date).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
