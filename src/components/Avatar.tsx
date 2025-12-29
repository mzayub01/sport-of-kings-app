'use client';

import Image from 'next/image';

interface AvatarProps {
    src?: string | null;
    firstName?: string;
    lastName?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const SIZES = {
    xs: { width: 24, height: 24, fontSize: '10px' },
    sm: { width: 32, height: 32, fontSize: '12px' },
    md: { width: 40, height: 40, fontSize: '14px' },
    lg: { width: 56, height: 56, fontSize: '18px' },
    xl: { width: 80, height: 80, fontSize: '24px' },
};

export default function Avatar({ src, firstName = '', lastName = '', size = 'md', className = '' }: AvatarProps) {
    const { width, height, fontSize } = SIZES[size];
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    if (src) {
        return (
            <div
                className={className}
                style={{
                    width,
                    height,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                <Image
                    src={src}
                    alt={`${firstName} ${lastName}`}
                    width={width}
                    height={height}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
            </div>
        );
    }

    // Fallback to initials
    return (
        <div
            className={className}
            style={{
                width,
                height,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-gold) 0%, #c9a227 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize,
                flexShrink: 0,
            }}
        >
            {initials || '?'}
        </div>
    );
}
