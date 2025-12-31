'use client';

interface BJJBeltProps {
    belt: 'white' | 'blue' | 'purple' | 'brown' | 'black' | string;
    stripes: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    isChild?: boolean;
}

const BELT_COLORS: Record<string, { main: string; bar: string }> = {
    white: { main: '#F5F5F5', bar: '#1A1A1A' },
    blue: { main: '#1E40AF', bar: '#1A1A1A' },
    purple: { main: '#6B21A8', bar: '#1A1A1A' },
    brown: { main: '#78350F', bar: '#1A1A1A' },
    black: { main: '#1A1A1A', bar: '#DC2626' },
    // Kids belt colors
    grey: { main: '#6B7280', bar: '#1A1A1A' },
    'grey-white': { main: '#9CA3AF', bar: '#1A1A1A' },
    'grey-black': { main: '#4B5563', bar: '#1A1A1A' },
    yellow: { main: '#EAB308', bar: '#1A1A1A' },
    'yellow-white': { main: '#FDE047', bar: '#1A1A1A' },
    'yellow-black': { main: '#A16207', bar: '#1A1A1A' },
    orange: { main: '#EA580C', bar: '#1A1A1A' },
    'orange-white': { main: '#FB923C', bar: '#1A1A1A' },
    'orange-black': { main: '#C2410C', bar: '#1A1A1A' },
    green: { main: '#16A34A', bar: '#1A1A1A' },
    'green-white': { main: '#4ADE80', bar: '#1A1A1A' },
    'green-black': { main: '#15803D', bar: '#1A1A1A' },
};

const SIZES = {
    sm: { width: 80, height: 16, stripeWidth: 3 },
    md: { width: 120, height: 24, stripeWidth: 4 },
    lg: { width: 160, height: 32, stripeWidth: 5 },
};

// Get stripe color for kids belts based on position
// 1-4: white, 5-8: red, 9-12: grey
function getKidsStripeColor(stripeIndex: number): string {
    if (stripeIndex < 4) return '#FFFFFF'; // White
    if (stripeIndex < 8) return '#DC2626'; // Red
    return '#6B7280'; // Grey
}

export default function BJJBelt({ belt, stripes, size = 'md', showLabel = false, isChild = false }: BJJBeltProps) {
    const colors = BELT_COLORS[belt] || BELT_COLORS.white;
    const dims = SIZES[size];
    const barWidth = dims.width * 0.15;

    // Limit stripes to max display
    const maxStripes = isChild ? 12 : 4;
    const displayStripes = Math.min(stripes, maxStripes);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
            <svg width={dims.width} height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`}>
                {/* Belt body */}
                <rect
                    x={0}
                    y={0}
                    width={dims.width}
                    height={dims.height}
                    rx={dims.height / 6}
                    fill={colors.main}
                    stroke={belt === 'white' || belt.includes('-white') ? '#D1D5DB' : 'none'}
                    strokeWidth={1}
                />

                {/* Black bar (or red for black belt) */}
                <rect
                    x={dims.width - barWidth - 4}
                    y={2}
                    width={barWidth}
                    height={dims.height - 4}
                    rx={2}
                    fill={colors.bar}
                />

                {/* Stripes */}
                {Array.from({ length: displayStripes }).map((_, i) => (
                    <rect
                        key={i}
                        x={dims.width - barWidth - 8 - (i * (dims.stripeWidth + 2))}
                        y={dims.height * 0.25}
                        width={dims.stripeWidth}
                        height={dims.height * 0.5}
                        fill={isChild ? getKidsStripeColor(i) : 'white'}
                        rx={1}
                    />
                ))}
            </svg>

            {showLabel && (
                <span style={{
                    fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize',
                }}>
                    {belt.replace('-', '/')} Belt {stripes > 0 && `• ${stripes} stripe${stripes > 1 ? 's' : ''}`}
                </span>
            )}
        </div>
    );
}
