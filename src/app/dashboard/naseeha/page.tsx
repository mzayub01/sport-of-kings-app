import { createClient } from '@/lib/supabase/server';
import { BookOpen, Calendar, Heart } from 'lucide-react';

export const metadata = {
    title: 'Naseeha | Sport of Kings',
    description: 'Weekly Islamic advice and spiritual guidance',
};

interface NaseehaItem {
    id: string;
    title: string;
    content: string;
    week_number: number;
    year: number;
}

export default async function DashboardNaseehaPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all active naseeha
    const { data: rawNaseehaList } = await supabase
        .from('naseeha')
        .select('*')
        .eq('is_active', true)
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });

    const naseehaList = (rawNaseehaList || []) as NaseehaItem[];

    const currentYear = new Date().getFullYear();
    const currentWeek = Math.ceil((new Date().getTime() - new Date(currentYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Group by year
    const groupedNaseeha: Record<number, NaseehaItem[]> = {};
    naseehaList.forEach(item => {
        const year = item.year;
        if (!groupedNaseeha[year]) {
            groupedNaseeha[year] = [];
        }
        groupedNaseeha[year].push(item);
    });

    return (
        <div style={{ paddingBottom: '120px', overflowY: 'auto' }}>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Naseeha</h1>
                <p className="dashboard-subtitle">
                    Weekly Islamic advice and spiritual guidance from our classes
                </p>
            </div>

            {naseehaList.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Heart size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>Coming Soon</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        Weekly naseeha will be shared here soon. Check back after your next class!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                    {Object.entries(groupedNaseeha).sort((a, b) => Number(b[0]) - Number(a[0])).map(([year, items]) => (
                        <div key={year}>
                            <h3 style={{
                                fontSize: 'var(--text-lg)',
                                color: 'var(--color-gold)',
                                marginBottom: 'var(--space-4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                            }}>
                                <Calendar size={20} />
                                {year}
                                <span className="badge badge-gray">{items.length} entries</span>
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                {items.map((naseeha) => (
                                    <div key={naseeha.id} className="glass-card">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-3)',
                                            marginBottom: 'var(--space-3)',
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: 'var(--radius-lg)',
                                                background: 'var(--color-gold-gradient)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <BookOpen size={20} color="var(--color-black)" />
                                            </div>
                                            <div>
                                                <span className="badge badge-gold">Week {naseeha.week_number}</span>
                                                {naseeha.week_number === currentWeek && naseeha.year === currentYear && (
                                                    <span className="badge badge-green" style={{ marginLeft: 'var(--space-2)' }}>This Week</span>
                                                )}
                                            </div>
                                        </div>

                                        <h4 style={{
                                            fontSize: 'var(--text-lg)',
                                            marginBottom: 'var(--space-3)',
                                            fontWeight: '600',
                                        }}>
                                            {naseeha.title}
                                        </h4>

                                        <div style={{
                                            color: 'var(--text-secondary)',
                                            lineHeight: '1.8',
                                            whiteSpace: 'pre-wrap',
                                        }}>
                                            {naseeha.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
