'use client';

import { useState, useEffect } from 'react';
import { MapPin, Users, ChevronRight, AlertCircle, CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import Link from 'next/link';

interface MultisiteTier {
    id: string;
    location_id: string;
    name: string;
    description: string | null;
    price: number;
    stripe_price_id: string | null;
}

interface Location {
    id: string;
    name: string;
    city: string;
    hasCapacity: boolean;
    spotsRemaining: number;
    tiers: MultisiteTier[];
}

interface CurrentSite {
    id: string;
    name: string;
}

interface AvailableLocationsResponse {
    availableLocations: Location[];
    currentSiteCount: number;
    currentSites: CurrentSite[];
    memberAge: number;
    canAddMore: boolean;
}

export default function AddMultisitePage() {
    const [data, setData] = useState<AvailableLocationsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedTier, setSelectedTier] = useState<MultisiteTier | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const { selectedProfileId } = useDashboard();

    useEffect(() => {
        if (selectedProfileId) {
            fetchAvailableLocations();
        }
    }, [selectedProfileId]);

    const fetchAvailableLocations = async () => {
        try {
            const res = await fetch(`/api/multisite/available-locations?userId=${selectedProfileId}`);
            const json = await res.json();

            if (!res.ok) {
                setError(json.error || 'Failed to fetch locations');
                return;
            }

            setData(json);
        } catch (err) {
            setError('Failed to load available locations');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLocation = (location: Location) => {
        if (!location.hasCapacity) return;
        setSelectedLocation(location);
        setSelectedTier(null); // Reset tier selection when location changes
    };

    const handleSelectTier = (tier: MultisiteTier) => {
        setSelectedTier(tier);
    };

    const handleCheckout = async () => {
        if (!selectedLocation || !selectedTier || !selectedProfileId) return;

        if (!selectedTier.stripe_price_id) {
            setError('This tier is not configured for payment. Please contact an administrator.');
            return;
        }

        setCheckoutLoading(true);
        setError('');
        try {
            const res = await fetch('/api/multisite/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedProfileId,
                    locationId: selectedLocation.id,
                    tierId: selectedTier.id,
                }),
            });

            const json = await res.json();

            if (json.url) {
                window.location.href = json.url;
            } else {
                setError(json.error || 'Failed to create checkout session');
            }
        } catch (err) {
            setError('Failed to proceed to checkout');
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <AlertCircle size={48} color="var(--color-red)" style={{ margin: '0 auto var(--space-4)' }} />
                <h3>Error</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <Link href="/dashboard/membership" className="btn btn-ghost" style={{ marginTop: 'var(--space-4)' }}>
                    <ArrowLeft size={16} /> Back to Membership
                </Link>
            </div>
        );
    }

    if (!data?.canAddMore) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <CheckCircle size={48} color="var(--color-gold)" style={{ margin: '0 auto var(--space-4)' }} />
                <h3>Maximum Sites Reached</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                    You already have memberships at 3 locations, which is the maximum allowed.
                </p>
                <Link href="/dashboard/membership" className="btn btn-ghost" style={{ marginTop: 'var(--space-4)' }}>
                    <ArrowLeft size={16} /> Back to Membership
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <Link href="/dashboard/membership" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                    <ArrowLeft size={16} /> Back to Membership
                </Link>
                <h1 className="dashboard-title">Add Multisite Membership</h1>
                <p className="dashboard-subtitle">
                    Select an additional location and membership tier
                </p>
            </div>

            {/* Current Status */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>Current Sites</p>
                        <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', margin: 0 }}>
                            {data.currentSiteCount} {data.currentSiteCount === 1 ? 'site' : 'sites'}
                        </p>
                        {data.currentSites.length > 0 && (
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0 0' }}>
                                {data.currentSites.map(s => s.name).join(', ')}
                            </p>
                        )}
                    </div>
                    <div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>Your Age</p>
                        <span className="badge badge-gold" style={{ fontSize: 'var(--text-sm)' }}>
                            {data.memberAge} years
                        </span>
                    </div>
                    <div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>Available to Add</p>
                        <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', margin: 0, color: 'var(--color-green)' }}>
                            {3 - data.currentSiteCount} more
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Step 1: Available Locations */}
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="badge" style={{ background: 'var(--color-gold)', color: 'var(--color-black)' }}>1</span>
                Select Location
            </h2>

            {data.availableLocations.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <MapPin size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                        No additional locations available for multisite membership at this time.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                    {data.availableLocations.map((location) => (
                        <div
                            key={location.id}
                            onClick={() => handleSelectLocation(location)}
                            className="card"
                            style={{
                                cursor: location.hasCapacity ? 'pointer' : 'not-allowed',
                                opacity: location.hasCapacity ? 1 : 0.6,
                                borderColor: selectedLocation?.id === location.id ? 'var(--color-gold)' : undefined,
                                borderWidth: selectedLocation?.id === location.id ? '2px' : undefined,
                                background: selectedLocation?.id === location.id ? 'rgba(212, 175, 55, 0.05)' : undefined,
                            }}
                        >
                            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-lg)',
                                        background: selectedLocation?.id === location.id ? 'var(--color-gold-gradient)' : 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <MapPin size={24} color={selectedLocation?.id === location.id ? 'var(--color-black)' : 'var(--text-secondary)'} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{location.name}</h3>
                                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                            {location.city} • {location.tiers.length} tier{location.tiers.length !== 1 ? 's' : ''} available
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                                            <Users size={14} />
                                            <span style={{ color: location.hasCapacity ? 'var(--color-green)' : 'var(--color-red)' }}>
                                                {location.hasCapacity ? `${location.spotsRemaining} spots left` : 'Full'}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedLocation?.id === location.id ? (
                                        <CheckCircle size={24} color="var(--color-gold)" />
                                    ) : location.hasCapacity ? (
                                        <ChevronRight size={20} color="var(--text-tertiary)" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Step 2: Select Tier (shown only when location is selected) */}
            {selectedLocation && (
                <>
                    <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className="badge" style={{ background: 'var(--color-gold)', color: 'var(--color-black)' }}>2</span>
                        Select Membership Tier at {selectedLocation.name}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                        {selectedLocation.tiers.map((tier) => (
                            <div
                                key={tier.id}
                                onClick={() => handleSelectTier(tier)}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    borderColor: selectedTier?.id === tier.id ? 'var(--color-gold)' : undefined,
                                    borderWidth: selectedTier?.id === tier.id ? '2px' : undefined,
                                    background: selectedTier?.id === tier.id ? 'rgba(212, 175, 55, 0.05)' : undefined,
                                }}
                            >
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{tier.name}</h3>
                                            {!tier.stripe_price_id && (
                                                <span className="badge badge-gray" style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                                                    Not configured
                                                </span>
                                            )}
                                        </div>
                                        <span style={{
                                            background: 'var(--color-gold-gradient)',
                                            color: 'var(--color-black)',
                                            padding: 'var(--space-1) var(--space-3)',
                                            borderRadius: 'var(--radius-full)',
                                            fontWeight: '700',
                                            fontSize: 'var(--text-sm)',
                                        }}>
                                            £{tier.price}/mo
                                        </span>
                                    </div>
                                    {tier.description && (
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                            {tier.description}
                                        </p>
                                    )}
                                    {selectedTier?.id === tier.id && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', color: 'var(--color-gold)' }}>
                                            <CheckCircle size={18} />
                                            <span style={{ fontWeight: '600', fontSize: 'var(--text-sm)' }}>Selected</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Step 3: Checkout (shown only when tier is selected) */}
            {selectedLocation && selectedTier && (
                <div className="card" style={{ borderColor: 'var(--color-gold)', borderWidth: '2px' }}>
                    <div className="card-body">
                        <h3 style={{ margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <CreditCard size={20} color="var(--color-gold)" />
                            Checkout Summary
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                            <span style={{ fontWeight: '600' }}>{selectedLocation.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Tier:</span>
                            <span style={{ fontWeight: '600' }}>{selectedTier.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>New Total Sites:</span>
                            <span style={{ fontWeight: '600' }}>{data.currentSiteCount + 1}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: 'var(--space-3)',
                            borderTop: '1px solid var(--border-light)',
                            marginTop: 'var(--space-3)',
                        }}>
                            <span style={{ fontWeight: '600' }}>Monthly Cost:</span>
                            <span style={{ fontSize: 'var(--text-xl)', fontWeight: '700', color: 'var(--color-gold)' }}>
                                £{selectedTier.price}/mo
                            </span>
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 'var(--space-2) 0 0 0' }}>
                            This will be billed as a separate subscription for this location.
                        </p>
                        <button
                            onClick={handleCheckout}
                            disabled={checkoutLoading || !selectedTier.stripe_price_id}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 'var(--space-4)' }}
                        >
                            {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                        </button>
                        {!selectedTier.stripe_price_id && (
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-red)', margin: 'var(--space-2) 0 0 0', textAlign: 'center' }}>
                                This tier is not configured for payment yet.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
