import { createClient } from '@/lib/supabase/server';
import { Users, Award, CheckCircle, TrendingUp, Calendar } from 'lucide-react';

export const metadata = {
    title: 'My Students | Instructor - Sport of Kings',
    description: 'View students who attend your classes',
};

interface StudentAttendanceRecord {
    user_id: string;
    class_date: string;
    profiles?: { first_name: string; last_name: string; email: string; belt_rank: string };
}

const BELT_COLORS: Record<string, string> = {
    white: '#FFFFFF',
    blue: '#1E40AF',
    purple: '#6B21A8',
    brown: '#78350F',
    black: '#1A1A1A',
};

export default async function InstructorStudentsPage() {
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

    // Get instructor's class IDs
    const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('instructor_id', instructor?.id)
        .eq('is_active', true);

    const classIds = classes?.map((c: { id: string }) => c.id) || [];

    // Get unique students who attended these classes
    const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('user_id, class_date, profiles(first_name, last_name, email, belt_rank)')
        .in('class_id', classIds)
        .order('class_date', { ascending: false }) as { data: StudentAttendanceRecord[] | null };

    // Aggregate student data
    const studentMap = new Map<string, {
        user_id: string;
        first_name: string;
        last_name: string;
        email: string;
        belt_rank: string;
        attendance_count: number;
        last_attendance: string;
    }>();

    attendanceRecords?.forEach((record: StudentAttendanceRecord) => {
        const profile = record.profiles;
        if (!profile) return;

        if (studentMap.has(record.user_id)) {
            const existing = studentMap.get(record.user_id)!;
            existing.attendance_count++;
            if (record.class_date > existing.last_attendance) {
                existing.last_attendance = record.class_date;
            }
        } else {
            studentMap.set(record.user_id, {
                user_id: record.user_id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                belt_rank: profile.belt_rank || 'white',
                attendance_count: 1,
                last_attendance: record.class_date,
            });
        }
    });

    const students = Array.from(studentMap.values()).sort((a, b) =>
        b.attendance_count - a.attendance_count
    );

    // Stats
    const totalStudents = students.length;
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const activeThisMonth = students.filter(s => {
        const lastDate = new Date(s.last_attendance);
        return lastDate.getMonth() === thisMonth && lastDate.getFullYear() === thisYear;
    }).length;

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Students</h1>
                <p className="dashboard-subtitle">
                    Students who attend your classes
                </p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Total Students</p>
                            <p className="stat-value">{totalStudents}</p>
                        </div>
                        <Users size={32} color="var(--color-gold)" />
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Active This Month</p>
                            <p className="stat-value">{activeThisMonth}</p>
                        </div>
                        <TrendingUp size={32} color="var(--color-green)" />
                    </div>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Users size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Students Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        Students who attend your classes will appear here.
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Student</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Belt</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Attendance</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Last Seen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => (
                                    <tr key={student.user_id} style={{ borderBottom: index < students.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
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
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600', margin: 0 }}>{student.first_name} {student.last_name}</p>
                                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: BELT_COLORS[student.belt_rank],
                                                    border: student.belt_rank === 'white' ? '1px solid var(--border-medium)' : 'none',
                                                }} />
                                                <span style={{ textTransform: 'capitalize', fontSize: 'var(--text-sm)' }}>
                                                    {student.belt_rank}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}>
                                                <CheckCircle size={14} color="var(--color-green)" />
                                                <span style={{ fontWeight: '600' }}>{student.attendance_count}</span>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>sessions</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                <Calendar size={14} />
                                                {new Date(student.last_attendance).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
