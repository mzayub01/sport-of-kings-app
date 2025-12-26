import { createClient } from '@/lib/supabase/server';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface InstructorClass {
    id: string;
    name: string;
    description: string | null;
    start_time: string;
    end_time: string;
    day_of_week: number;
    max_capacity: number;
    location?: { name: string };
}

export const metadata = {
    title: 'My Classes | Instructor - Sport of Kings',
    description: 'View your assigned class schedule',
};

export default async function InstructorClassesPage() {
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
        .order('day_of_week') as { data: InstructorClass[] | null };

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();

    // Group by day
    const classesByDay: Record<number, InstructorClass[]> = {};
    classes?.forEach((cls: InstructorClass) => {
        if (!classesByDay[cls.day_of_week]) {
            classesByDay[cls.day_of_week] = [];
        }
        classesByDay[cls.day_of_week]!.push(cls);
    });

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Classes</h1>
                <p className="dashboard-subtitle">
                    Your weekly class schedule ({classes?.length || 0} classes)
                </p>
            </div>

            {classes?.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Calendar size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Classes Assigned</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        You don't have any classes assigned yet. Contact an admin to get assigned to classes.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {DAYS.map((day, dayIndex) => {
                        const dayClasses = classesByDay[dayIndex];
                        if (!dayClasses || dayClasses.length === 0) return null;

                        const isToday = dayIndex === today;

                        return (
                            <div key={day}>
                                <h3 style={{
                                    fontSize: 'var(--text-lg)',
                                    color: isToday ? 'var(--color-gold)' : 'var(--text-primary)',
                                    marginBottom: 'var(--space-4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                }}>
                                    <Calendar size={20} />
                                    {day}
                                    {isToday && <span className="badge badge-gold">Today</span>}
                                </h3>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: 'var(--space-4)',
                                }}>
                                    {dayClasses.map((cls) => (
                                        <div
                                            key={cls.id}
                                            className="card"
                                            style={{
                                                border: isToday ? '2px solid var(--color-gold)' : undefined,
                                            }}
                                        >
                                            <div className="card-body">
                                                <h4 style={{ margin: '0 0 var(--space-2)' }}>{cls.name}</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                        <Clock size={14} />
                                                        {cls.start_time} - {cls.end_time}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                        <MapPin size={14} />
                                                        {cls.location?.name}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                        <Users size={14} />
                                                        Max capacity: {cls.max_capacity}
                                                    </div>
                                                </div>
                                                {cls.description && (
                                                    <p style={{
                                                        marginTop: 'var(--space-3)',
                                                        fontSize: 'var(--text-sm)',
                                                        color: 'var(--text-tertiary)',
                                                        fontStyle: 'italic',
                                                    }}>
                                                        {cls.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
