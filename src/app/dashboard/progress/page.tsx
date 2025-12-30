import { createClient } from '@/lib/supabase/server';
import { Award, Star, Trophy, Target, Calendar } from 'lucide-react';
import BJJBelt from '@/components/BJJBelt';

const ADULT_BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];
const KIDS_BELT_ORDER = [
    'white',
    'grey-white', 'grey', 'grey-black',
    'orange-white', 'orange', 'orange-black',
    'yellow-white', 'yellow', 'yellow-black',
    'green-white', 'green', 'green-black'
];

const BELT_COLORS: Record<string, string> = {
    white: '#FFFFFF',
    blue: '#1E40AF',
    purple: '#6B21A8',
    brown: '#78350F',
    black: '#1A1A1A',
    // Kids belt colors
    grey: '#6B7280',
    'grey-white': '#9CA3AF',
    'grey-black': '#4B5563',
    orange: '#EA580C',
    'orange-white': '#FB923C',
    'orange-black': '#C2410C',
    yellow: '#EAB308',
    'yellow-white': '#FDE047',
    'yellow-black': '#A16207',
    green: '#16A34A',
    'green-white': '#4ADE80',
    'green-black': '#15803D',
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
        .select('belt_rank, stripes, is_child')
        .eq('user_id', user?.id)
        .single();

    // Get promotion history from the new promotions table
    const { data: promotions } = await supabase
        .from('promotions')
        .select('*, promoted_by_profile:profiles!promotions_promoted_by_fkey(first_name, last_name)')
        .eq('user_id', user?.id)
        .order('promotion_date', { ascending: false });

    // Determine which belt order to use based on whether this is a child
    const isChild = profile?.is_child || false;
    const BELT_ORDER = isChild ? KIDS_BELT_ORDER : ADULT_BELT_ORDER;

    const currentBelt = profile?.belt_rank || 'white';
    const currentBeltIndex = BELT_ORDER.indexOf(currentBelt);
    const currentStripes = profile?.stripes || 0;

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Belt Progress</h1>
                <p className="dashboard-subtitle">Track your martial arts journey</p>
            </div>

            {/* Current Belt Display */}
            <div className="glass-card" style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-6)',
                textAlign: 'center',
            }}>
                <h3 style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: 'var(--space-2)',
                }}>
                    Current Rank
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                    <BJJBelt
                        belt={(currentBelt as 'white' | 'blue' | 'purple' | 'brown' | 'black')}
                        stripes={currentStripes}
                        size="lg"
                    />
                </div>
                <h2 style={{ textTransform: 'capitalize', marginBottom: 'var(--space-1)' }}>
                    {currentBelt} Belt
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    {currentStripes} stripe{currentStripes !== 1 ? 's' : ''}
                </p>
            </div>

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

            {/* Promotion History */}
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

            {!promotions || promotions.length === 0 ? (
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
                        {promotions.map((record: {
                            id: string;
                            previous_belt: string;
                            previous_stripes: number;
                            new_belt: string;
                            new_stripes: number;
                            comments: string | null;
                            promotion_date: string;
                            promoted_by_profile?: { first_name: string; last_name: string } | null;
                        }, index: number) => (
                            <div
                                key={record.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    padding: 'var(--space-4)',
                                    borderBottom: index < promotions.length - 1 ? '1px solid var(--border-light)' : 'none',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {/* Belt display */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: BELT_COLORS[record.previous_belt] || '#ccc',
                                        border: record.previous_belt === 'white' ? '1px solid var(--border-medium)' : 'none',
                                    }} />
                                    <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                                    <div style={{
                                        width: '48px',
                                        height: '16px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: BELT_COLORS[record.new_belt] || '#ccc',
                                        border: record.new_belt === 'white' ? '1px solid var(--border-medium)' : 'none',
                                    }} />
                                </div>

                                {/* Promotion details */}
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <p style={{ fontWeight: '600', margin: 0, textTransform: 'capitalize' }}>
                                        {record.new_belt} Belt
                                        {record.new_stripes > 0 && ` • ${record.new_stripes} stripe${record.new_stripes !== 1 ? 's' : ''}`}
                                    </p>
                                    {record.comments && (
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                                            &ldquo;{record.comments}&rdquo;
                                        </p>
                                    )}
                                </div>

                                {/* Date and professor */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
                                        <Calendar size={12} />
                                        {new Date(record.promotion_date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </div>
                                    {record.promoted_by_profile && (
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                            By {record.promoted_by_profile.first_name} {record.promoted_by_profile.last_name}
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
