'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, MapPin, CheckCircle, AlertCircle, Clock, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useDashboard } from '@/components/dashboard/DashboardProvider';

interface Membership {
    id: string;
    status: string;
    start_date: string | null;
    stripe_subscription_id: string | null;
    created_at: string;
    location: {
        id: string;
        name: string;
    } | null;
    membership_type: {
        id: string;
        name: string;
        price: number;
        description: string | null;
    } | null;
}

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    stripe_customer_id: string | null;
}

interface LocationWithTiers {
    id: string;
    name: string;
    tiers: {
        id: string;
        name: string;
        price: number;
        description: string | null;
        stripe_price_id: string | null;
    }[];
}

// Complete Payment Flow Component for users without membership
function CompletePaymentFlow({ profile }: { profile: Profile | null }) {
    const [locations, setLocations] = useState<LocationWithTiers[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedTier, setSelectedTier] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState('');
    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchLocationsAndTiers();
    }, []);

    const fetchLocationsAndTiers = async () => {
        try {
            // Fetch active locations
            const { data: locationsData } = await supabase
                .from('locations')
                .select('id, name')
                .eq('is_active', true)
                .order('name');

            // Fetch membership types (non-multisite tiers)
            const { data: tiersData } = await supabase
                .from('membership_types')
                .select('id, name, price, description, stripe_price_id, location_id')
                .eq('is_active', true)
                .or('is_multisite.is.null,is_multisite.eq.false');

            if (locationsData && tiersData) {
                // Group tiers by location
                const locationsWithTiers = locationsData.map((loc: { id: string; name: string }) => ({
                    ...loc,
                    tiers: tiersData.filter((t: any) => t.location_id === loc.id || !t.location_id),
                }));
                setLocations(locationsWithTiers);

                // Auto-select first location if only one
                if (locationsWithTiers.length === 1) {
                    setSelectedLocation(locationsWithTiers[0].id);
                }
            }
        } catch (err) {
            console.error('Error fetching locations:', err);
            setError('Failed to load membership options');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!selectedLocation || !selectedTier || !profile) {
            setError('Please select a location and membership tier');
            return;
        }

        setCheckoutLoading(true);
        setError('');

        try {
            const selectedTierData = locations
                .find(l => l.id === selectedLocation)?.tiers
                .find(t => t.id === selectedTier);

            if (!selectedTierData?.stripe_price_id) {
                setError('This membership tier is not configured for online payment. Please contact support.');
                setCheckoutLoading(false);
                return;
            }

            // Call checkout API
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId: selectedLocation,
                    membershipTypeId: selectedTier,
                    priceId: selectedTierData.stripe_price_id,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Failed to create checkout session');
            }
        } catch (err: any) {
            setError(err.message || 'Checkout failed');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const selectedLocationData = locations.find(l => l.id === selectedLocation);
    const selectedTierData = selectedLocationData?.tiers.find(t => t.id === selectedTier);

    if (loading) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} />
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-4)' }}>Loading membership options...</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ border: '2px solid var(--color-gold)' }}>
            <div className="card-body">
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-gold-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-4)',
                    }}>
                        <CreditCard size={32} color="var(--color-black)" />
                    </div>
                    <h2 style={{ marginBottom: 'var(--space-2)' }}>Complete Your Membership</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Select your preferred location and membership tier to complete payment.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Location Selection */}
                <div className="form-group">
                    <label className="form-label">
                        <MapPin size={16} style={{ marginRight: 'var(--space-1)' }} />
                        Select Location
                    </label>
                    <select
                        className="form-input"
                        value={selectedLocation}
                        onChange={(e) => {
                            setSelectedLocation(e.target.value);
                            setSelectedTier(''); // Reset tier when location changes
                        }}
                    >
                        <option value="">Choose a location...</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>

                {/* Tier Selection */}
                {selectedLocation && selectedLocationData && (
                    <div className="form-group">
                        <label className="form-label">
                            <CreditCard size={16} style={{ marginRight: 'var(--space-1)' }} />
                            Select Membership Tier
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {selectedLocationData.tiers.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                    No membership tiers available for this location.
                                </p>
                            ) : (
                                selectedLocationData.tiers.map(tier => (
                                    <label
                                        key={tier.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 'var(--space-3)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: selectedTier === tier.id ? '2px solid var(--color-gold)' : '1px solid var(--border-default)',
                                            background: selectedTier === tier.id ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-secondary)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="tier"
                                            value={tier.id}
                                            checked={selectedTier === tier.id}
                                            onChange={(e) => setSelectedTier(e.target.value)}
                                            style={{ marginRight: 'var(--space-3)' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: '600' }}>{tier.name}</span>
                                            {tier.description && (
                                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                                    {tier.description}
                                                </p>
                                            )}
                                        </div>
                                        <span style={{
                                            background: tier.price === 0 ? 'var(--color-green)' : 'var(--color-gold-gradient)',
                                            color: tier.price === 0 ? 'white' : 'var(--color-black)',
                                            padding: 'var(--space-1) var(--space-3)',
                                            borderRadius: 'var(--radius-full)',
                                            fontWeight: '700',
                                            fontSize: 'var(--text-sm)',
                                        }}>
                                            {tier.price === 0 ? 'FREE' : `£${tier.price}/mo`}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Checkout Button */}
                <button
                    onClick={handleCheckout}
                    disabled={!selectedLocation || !selectedTier || checkoutLoading}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 'var(--space-4)' }}
                >
                    {checkoutLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" style={{ marginRight: 'var(--space-2)' }} />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard size={18} style={{ marginRight: 'var(--space-2)' }} />
                            {selectedTierData ? `Pay £${selectedTierData.price}/month` : 'Complete Payment'}
                        </>
                    )}
                </button>

                <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-4)', marginBottom: 0 }}>
                    Secure payment powered by Stripe
                </p>
            </div>
        </div>
    );
}

export default function MembershipPage() {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabaseClient();
    const { selectedProfileId } = useDashboard();

    useEffect(() => {
        if (selectedProfileId) {
            fetchData();
        }
    }, [selectedProfileId]);

    const fetchData = async () => {
        if (!selectedProfileId) return;

        setLoading(true);

        // selectedProfileId is actually the user_id from DashboardProvider
        // Fetch profile for selected user
        const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, stripe_customer_id')
            .eq('user_id', selectedProfileId)
            .single();

        if (profileData) {
            setProfile(profileData);
        }

        // Fetch memberships - memberships are linked directly to user_id
        const { data: membershipData } = await supabase
            .from('memberships')
            .select(`
                id,
                status,
                start_date,
                stripe_subscription_id,
                created_at,
                location:locations(id, name),
                membership_type:membership_types(id, name, price, description)
            `)
            .eq('user_id', selectedProfileId)
            .order('created_at', { ascending: false });

        if (membershipData) {
            setMemberships(membershipData as Membership[]);
        } else {
            setMemberships([]);
        }

        setLoading(false);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatPrice = (price: number) => {
        if (price === 0) return 'FREE';
        return `£${price.toFixed(2)}/month`;
    };

    const getStatusBadge = (status: string, hasStripe: boolean) => {
        if (status === 'active' && hasStripe) {
            return (
                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} />
                    Active
                </span>
            );
        }
        if (status === 'active') {
            return (
                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} />
                    Active (Free)
                </span>
            );
        }
        if (status === 'pending') {
            return (
                <span className="badge" style={{ background: '#F59E0B', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    Pending
                </span>
            );
        }
        if (status === 'cancelled') {
            return (
                <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    Cancelled
                </span>
            );
        }
        return <span className="badge badge-gray">{status}</span>;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Membership</h1>
                <p className="dashboard-subtitle">View and manage your membership subscriptions</p>
            </div>

            {memberships.length === 0 ? (
                <CompletePaymentFlow profile={profile} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {memberships.map((membership) => {
                        const type = membership.membership_type;
                        const location = membership.location;
                        const hasStripe = !!membership.stripe_subscription_id;
                        const isActive = membership.status === 'active';
                        const isFree = type?.price === 0;

                        return (
                            <div
                                key={membership.id}
                                className="card"
                                style={{
                                    borderLeft: `4px solid ${isActive ? 'var(--color-green)' : membership.status === 'pending' ? '#F59E0B' : 'var(--border-default)'}`,
                                }}
                            >
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                                        <div>
                                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                {type?.name || 'Membership'}
                                                {getStatusBadge(membership.status, hasStripe)}
                                            </h3>
                                            {type?.description && (
                                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 'var(--space-1) 0 0 0' }}>
                                                    {type.description}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{
                                            background: isFree ? 'var(--color-green)' : 'var(--color-gold-gradient)',
                                            color: isFree ? 'white' : 'var(--color-black)',
                                            padding: 'var(--space-2) var(--space-4)',
                                            borderRadius: 'var(--radius-full)',
                                            fontWeight: '700',
                                        }}>
                                            {formatPrice(type?.price || 0)}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: 'var(--space-4)',
                                        marginTop: 'var(--space-4)',
                                        padding: 'var(--space-4)',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <MapPin size={18} color="var(--color-gold)" />
                                            <div>
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Location</p>
                                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: '500', margin: 0 }}>{location?.name || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <Calendar size={18} color="var(--color-gold)" />
                                            <div>
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Start Date</p>
                                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: '500', margin: 0 }}>{formatDate(membership.start_date)}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <CreditCard size={18} color="var(--color-gold)" />
                                            <div>
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Payment</p>
                                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: '500', margin: 0 }}>
                                                    {isFree ? 'N/A (Free)' : hasStripe ? 'Stripe Subscription' : 'Manual Payment'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stripe Subscription Details */}
                                    {hasStripe && isActive && (
                                        <div style={{
                                            marginTop: 'var(--space-4)',
                                            padding: 'var(--space-3)',
                                            background: 'rgba(45, 125, 70, 0.1)',
                                            borderRadius: 'var(--radius-lg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: 'var(--space-3)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <CheckCircle size={16} color="var(--color-green)" />
                                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-green)' }}>
                                                    Your subscription renews automatically each month
                                                </span>
                                            </div>
                                            {/* Future: Add manage subscription button when Stripe Customer Portal is set up */}
                                        </div>
                                    )}

                                    {/* Pending Payment Notice */}
                                    {membership.status === 'pending' && (
                                        <div style={{
                                            marginTop: 'var(--space-4)',
                                            padding: 'var(--space-3)',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            borderRadius: 'var(--radius-lg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                        }}>
                                            <AlertCircle size={16} color="#F59E0B" />
                                            <span style={{ fontSize: 'var(--text-sm)', color: '#F59E0B' }}>
                                                Your membership is pending payment. Please contact support if you need help.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Multisite Membership Button */}
            {memberships.some(m => m.status === 'active') && memberships.length < 3 && (
                <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-gold-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Plus size={24} color="var(--color-black)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0 }}>Add multisite membership</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Train at additional locations with discounted multisite pricing
                            </p>
                        </div>
                        <a href="/dashboard/membership/add-site" className="btn btn-primary">
                            <Plus size={18} />
                            Add Location
                        </a>
                    </div>
                </div>
            )}

            {/* Account Info */}
            {profile && (
                <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                    <div className="card-header">
                        <h3 style={{ margin: 0 }}>Account Information</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                            <div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Name</p>
                                <p style={{ fontWeight: '500', margin: '4px 0 0 0' }}>{profile.first_name} {profile.last_name}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Email</p>
                                <p style={{ fontWeight: '500', margin: '4px 0 0 0' }}>{profile.email}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Payment Account</p>
                                <p style={{ fontWeight: '500', margin: '4px 0 0 0' }}>
                                    {profile.stripe_customer_id ? (
                                        <span style={{ color: 'var(--color-green)' }}>Connected</span>
                                    ) : (
                                        <span style={{ color: 'var(--text-tertiary)' }}>Not set up</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Section */}
            <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '500', margin: 0 }}>Need help with your membership?</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                            Contact us if you have any questions about payments, cancellations, or upgrades.
                        </p>
                    </div>
                    <a href="mailto:support@sportofkings.co.uk" className="btn btn-ghost">
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
