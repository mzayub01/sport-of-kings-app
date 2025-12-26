import { createClient } from '@/lib/supabase/server';
import { Award, Star, Trophy, Target } from 'lucide-react';
import MemberBeltEditor from '@/components/dashboard/MemberBeltEditor';

const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];
const BELT_COLORS: Record<string, string> = {
    white: '#FFFFFF',
    blue: '#1E40AF',
    purple: '#6B21A8',
    brown: '#78350F',
    black: '#1A1A1A',
};

export const metadata = {
    title: 'Belt Progress | Sport of Kings',
    description: 'View your belt progression and grading history',
};

export default async function MemberProgressPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get profile with current belt and stripes
    const { data: profile } = await supabase
        .from('profiles')
        .select('belt_rank, stripes')
        .eq('user_id', user?.id)
        .single();

    // Get belt history
    const { data: beltHistory } = await supabase
        .from('belt_progression')
        .select('*, awarded_by_profile:profiles!belt_progression_awarded_by_fkey(first_name, last_name)')
        .eq('user_id', user?.id)
        .order('awarded_date', { ascending: false }) as { data: { id: string; belt_rank: string; stripes: number; notes: string | null; awarded_date: string; awarded_by_profile?: { first_name: string; last_name: string } }[] | null };

    const currentBelt = profile?.belt_rank || 'white';
    const currentBeltIndex = BELT_ORDER.indexOf(currentBelt);

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Belt Progress</h1>
                <p className="dashboard-subtitle">Track your martial arts journey</p>
            </div>

            {/* Current Belt Display with Editor */}
            <MemberBeltEditor
                initialBelt={(currentBelt as 'white' | 'blue' | 'purple' | 'brown' | 'black')}
                initialStripes={profile?.stripes || 0}
            />

            {/* Belt Journey */}
            <h3 style={{
                fontSize: 'var(--text-lg)',
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
            }}>
                <Target size={20} color="var(--color-gold)" />
                Your Journey
            </h3>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-8)',
                padding: 'var(--space-4)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                position: 'relative',
            }}>
                {/* Progress Line */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 'var(--space-6)',
                    right: 'var(--space-6)',
                    height: '4px',
                    background: 'var(--border-light)',
                    transform: 'translateY(-50%)',
                    zIndex: 0,
                }}>
                    <div style={{
                        width: `${(currentBeltIndex / (BELT_ORDER.length - 1)) * 100}%`,
                        height: '100%',
                        background: 'var(--color-gold-gradient)',
                        borderRadius: 'var(--radius-full)',
                    }} />
                </div>

                {BELT_ORDER.map((belt, index) => {
                    const isAchieved = index <= currentBeltIndex;
                    const isCurrent = belt === currentBelt;

                    return (
                        <div
                            key={belt}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            <div style={{
                                width: isCurrent ? '48px' : '36px',
                                height: isCurrent ? '48px' : '36px',
                                borderRadius: 'var(--radius-full)',
                                background: isAchieved ? BELT_COLORS[belt] : 'var(--bg-primary)',
                                border: belt === 'white' && isAchieved ? '2px solid var(--border-medium)' : isAchieved ? 'none' : '2px dashed var(--border-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isCurrent ? 'var(--shadow-gold)' : isAchieved ? 'var(--shadow-sm)' : 'none',
                            }}>
                                {isAchieved && (
                                    <Star
                                        size={isCurrent ? 20 : 16}
                                        color={belt === 'white' ? 'var(--color-gold)' : 'white'}
                                        fill={belt === 'white' ? 'var(--color-gold)' : 'white'}
                                    />
                                )}
                            </div>
                            <span style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: isCurrent ? '700' : '500',
                                textTransform: 'capitalize',
                                color: isCurrent ? 'var(--color-gold)' : isAchieved ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            }}>
                                {belt}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Belt History */}
            <h3 style={{
                fontSize: 'var(--text-lg)',
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
            }}>
                <Trophy size={20} color="var(--color-gold)" />
                Promotion History
            </h3>

            {!beltHistory || beltHistory.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        <Award size={32} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-2)' }} />
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            Your promotion history will appear here as you progress.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body" style={{ padding: 0 }}>
                        {beltHistory.map((record, index) => (
                            <div
                                key={record.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    padding: 'var(--space-4)',
                                    borderBottom: index < beltHistory.length - 1 ? '1px solid var(--border-light)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '16px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: BELT_COLORS[record.belt_rank],
                                    border: record.belt_rank === 'white' ? '1px solid var(--border-medium)' : 'none',
                                    flexShrink: 0,
                                }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '600', margin: 0, textTransform: 'capitalize' }}>
                                        {record.belt_rank} Belt
                                        {record.stripes > 0 && ` (${record.stripes} ${record.stripes === 1 ? 'stripe' : 'stripes'})`}
                                    </p>
                                    {record.notes && (
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                            {record.notes}
                                        </p>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: '500', margin: 0, fontSize: 'var(--text-sm)' }}>
                                        {new Date(record.awarded_date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    {record.awarded_by_profile && (
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                            By {(record.awarded_by_profile as { first_name: string; last_name: string }).first_name} {(record.awarded_by_profile as { first_name: string; last_name: string }).last_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
