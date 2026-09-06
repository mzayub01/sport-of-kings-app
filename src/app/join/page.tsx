'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Location {
    id: string;
    name: string;
    address: string;
    city: string;
    postcode: string;
    description: string | null;
    settings: { allow_waitlist?: boolean } | null;
}

interface TypeAvailability {
    name: string;
    state: 'spots' | 'unlimited' | 'full' | 'closed';
    spots: number | null;
}

interface CapacityInfo {
    totalCapacity: number | null; // null means unlimited
    spotsRemaining: number;       // sum of spare places across membership types
    types: TypeAvailability[];
}

export default function JoinPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [capacityMap, setCapacityMap] = useState<Record<string, CapacityInfo>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            // Fetch active locations
            const { data: locData, error: locError } = await supabase
                .from('locations')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (locError) throw locError;
            setLocations(locData || []);

            // Fetch capacity configs for all locations
            const locationIds = (locData || []).map(l => l.id);
            if (locationIds.length === 0) {
                setLoading(false);
                return;
            }

            // Get all membership configs with their capacities
            const { data: configsData } = await supabase
                .from('location_membership_configs')
                .select('location_id, membership_type_id, capacity, is_available')
                .in('location_id', locationIds);

            // Get active membership types for each location
            const { data: typesData } = await supabase
                .from('membership_types')
                .select('id, location_id, name, price')
                .in('location_id', locationIds)
                .eq('is_active', true)
                .or('is_multisite.is.null,is_multisite.eq.false')
                .order('price');

            // Get current member counts per location (active/pending memberships)
            const { data: membershipData } = await supabase
                .from('memberships')
                .select('location_id, membership_type_id')
                .in('location_id', locationIds)
                .in('status', ['active', 'pending']);

            // Calculate capacity info per location
            const capacityInfo: Record<string, CapacityInfo> = {};

            for (const loc of locData || []) {
                const locConfigs = (configsData || []).filter(c => c.location_id === loc.id);
                const locTypes = (typesData || []).filter(t => t.location_id === loc.id);
                const locMemberships = (membershipData || []).filter(m => m.location_id === loc.id);

                // Spare places are worked out PER TYPE and then summed. Counting
                // every membership at the location against the summed capacity
                // let a closed or over-full type swallow the other types' places.
                let totalCapacity = 0;
                let spotsRemaining = 0;
                let hasUnlimited = false;
                const types: TypeAvailability[] = [];

                for (const type of locTypes) {
                    const config = locConfigs.find(c => c.membership_type_id === type.id);
                    if (!config || config.capacity === null) {
                        // No config or null capacity = unlimited for this type
                        hasUnlimited = true;
                        types.push({ name: type.name, state: 'unlimited', spots: null });
                        continue;
                    }
                    if (config.is_available === false || config.capacity === 0) {
                        // Closed type: contributes nothing either way
                        types.push({ name: type.name, state: 'closed', spots: 0 });
                        continue;
                    }
                    const typeCount = locMemberships.filter(m => m.membership_type_id === type.id).length;
                    const typeSpots = Math.max(0, config.capacity - typeCount);
                    totalCapacity += config.capacity;
                    spotsRemaining += typeSpots;
                    types.push({ name: type.name, state: typeSpots > 0 ? 'spots' : 'full', spots: typeSpots });
                }

                // If any type has unlimited capacity, the location is unlimited
                capacityInfo[loc.id] = hasUnlimited
                    ? { totalCapacity: null, spotsRemaining: Infinity, types }
                    : { totalCapacity, spotsRemaining, types };
            }

            setCapacityMap(capacityInfo);
        } catch (err) {
            console.error('Error fetching locations:', err);
            setError('Failed to load locations');
        } finally {
            setLoading(false);
        }
    };

    const getCapacityStatus = (location: Location) => {
        const info = capacityMap[location.id];
        const allowWaitlist = location.settings?.allow_waitlist !== false;

        // If no capacity info or unlimited capacity
        if (!info || info.totalCapacity === null) {
            return {
                status: 'open',
                label: 'Open for Registration',
                badgeClass: 'badge-green',
                spotsText: 'Spaces available',
            };
        }

        const spotsRemaining = Math.max(0, info.spotsRemaining);

        if (spotsRemaining > 0) {
            return {
                status: 'open',
                label: 'Open for Registration',
                badgeClass: 'badge-green',
                spotsText: `${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} available`,
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

                                {/* Availability by membership type */}
                                {(capacityMap[location.id]?.types?.length ?? 0) > 0 && (
                                    <div style={{
                                        borderTop: '1px solid var(--border-light)',
                                        marginBottom: 'var(--space-3)',
                                    }}>
                                        {capacityMap[location.id].types.map(t => {
                                            const open = t.state === 'spots' || t.state === 'unlimited';
                                            const color = open
                                                ? 'var(--color-green)'
                                                : t.state === 'full' ? 'var(--color-gold-dark)' : 'var(--text-tertiary)';
                                            const text = t.state === 'spots'
                                                ? `${t.spots} ${t.spots === 1 ? 'spot' : 'spots'} left`
                                                : t.state === 'unlimited'
                                                    ? 'Spaces available'
                                                    : t.state === 'full' ? 'Full — waitlist' : 'Closed';
                                            return (
                                                <div
                                                    key={t.name}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        gap: 'var(--space-3)',
                                                        padding: '7px 0',
                                                        borderBottom: '1px solid var(--border-light)',
                                                        fontSize: 'var(--text-sm)',
                                                    }}
                                                >
                                                    <span style={{ color: open ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
                                                        {t.name}
                                                    </span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        <span
                                                            aria-hidden="true"
                                                            style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                background: color,
                                                                boxShadow: open ? '0 0 0 3px rgba(45, 125, 70, 0.15)' : 'none',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        {text}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: 'var(--space-3)',
                                    borderTop: (capacityMap[location.id]?.types?.length ?? 0) > 0 ? 'none' : '1px solid var(--border-light)',
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
                                            {capacity.status === 'waitlist' ? 'Join waitlist' : 'Register'}
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
