'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Location {
    id: string;
    name: string;
    address: string;
    city: string;
    postcode: string;
    description: string | null;
    max_capacity: number;
    current_members: number;
    settings: { allow_waitlist?: boolean } | null;
}

export default function JoinPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setLocations(data || []);
        } catch (err) {
            console.error('Error fetching locations:', err);
            setError('Failed to load locations');
        } finally {
            setLoading(false);
        }
    };

    const getCapacityStatus = (location: Location) => {
        const spotsRemaining = location.max_capacity - location.current_members;
        const hasCapacity = spotsRemaining > 0;
        const allowWaitlist = location.settings?.allow_waitlist !== false;

        if (hasCapacity) {
            return {
                status: 'open',
                label: 'Open for Registration',
                badgeClass: 'badge-green',
                spotsText: `${spotsRemaining} spots available`,
            };
        } else if (allowWaitlist) {
            return {
                status: 'waitlist',
                label: 'Waitlist Open',
                badgeClass: 'badge-gold',
                spotsText: 'Join the waitlist',
            };
        } else {
            return {
                status: 'closed',
                label: 'Closed',
                badgeClass: 'badge-gray',
                spotsText: 'Currently not accepting registrations',
            };
        }
    };

    const handleSelectLocation = (locationId: string, status: string) => {
        if (status === 'closed') return;
        router.push(`/register?location=${locationId}`);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
            }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            padding: 'var(--space-6)',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                    <Link href="/">
                        <Image
                            src="/logo-full.png"
                            alt="Sport of Kings"
                            width={140}
                            height={70}
                            priority
                            style={{ height: '60px', width: 'auto', margin: '0 auto' }}
                        />
                    </Link>
                    <h1 style={{
                        fontSize: 'var(--text-2xl)',
                        marginTop: 'var(--space-4)',
                    }}>
                        Choose Your Location
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        Select the training location you want to join. Each location has its own membership options.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Location Cards */}
                <div style={{
                    display: 'grid',
                    gap: 'var(--space-4)',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                }}>
                    {locations.map((location) => {
                        const capacity = getCapacityStatus(location);
                        const isClickable = capacity.status !== 'closed';

                        return (
                            <div
                                key={location.id}
                                onClick={() => handleSelectLocation(location.id, capacity.status)}
                                className="glass-card"
                                style={{
                                    padding: 'var(--space-6)',
                                    cursor: isClickable ? 'pointer' : 'not-allowed',
                                    opacity: capacity.status === 'closed' ? 0.6 : 1,
                                    transition: 'all 0.2s ease',
                                    border: '2px solid transparent',
                                }}
                                onMouseEnter={(e) => {
                                    if (isClickable) {
                                        e.currentTarget.style.borderColor = 'var(--color-gold)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: 'var(--space-3)',
                                }}>
                                    <h3 style={{
                                        fontSize: 'var(--text-lg)',
                                        fontWeight: '600',
                                        margin: 0,
                                    }}>
                                        {location.name}
                                    </h3>
                                    <span className={`badge ${capacity.badgeClass}`} style={{ flexShrink: 0 }}>
                                        {capacity.label}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--text-sm)',
                                    marginBottom: 'var(--space-2)',
                                }}>
                                    <MapPin size={14} />
                                    {location.address}, {location.city}
                                </div>

                                {location.description && (
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: 'var(--text-sm)',
                                        marginBottom: 'var(--space-4)',
                                        lineHeight: 1.5,
                                    }}>
                                        {location.description}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: 'var(--space-3)',
                                    borderTop: '1px solid var(--border-light)',
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        color: capacity.status === 'open' ? 'var(--color-green)' : 'var(--color-gold)',
                                        fontSize: 'var(--text-sm)',
                                    }}>
                                        <Users size={14} />
                                        {capacity.spotsText}
                                    </div>

                                    {isClickable && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-1)',
                                            color: 'var(--color-gold)',
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: '600',
                                        }}>
                                            Register
                                            <ChevronRight size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {locations.length === 0 && !loading && (
                    <div className="glass-card" style={{
                        textAlign: 'center',
                        padding: 'var(--space-12)',
                    }}>
                        <MapPin size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                        <h3 style={{ marginBottom: 'var(--space-2)' }}>No Locations Available</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Please check back later for available training locations.
                        </p>
                    </div>
                )}

                {/* Back to Home */}
                <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
                    <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        ← Back to Home
                    </Link>
                    <span style={{ margin: '0 var(--space-4)', color: 'var(--text-tertiary)' }}>|</span>
                    <Link href="/login" style={{ color: 'var(--color-gold)', fontSize: 'var(--text-sm)' }}>
                        Already a member? Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
