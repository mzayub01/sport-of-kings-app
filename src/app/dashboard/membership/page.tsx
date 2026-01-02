'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, MapPin, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
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

        // Fetch profile for selected profile (could be parent or child)
        const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, stripe_customer_id')
            .eq('id', selectedProfileId)
            .single();

        if (profileData) {
            setProfile(profileData);
        }

        // Fetch memberships for selected profile
        // Note: memberships are linked to user_id, but for child profiles we need to look up by profile id
        // First get the user_id for this profile
        const { data: profileWithUserId } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', selectedProfileId)
            .single();

        if (profileWithUserId?.user_id) {
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
                .eq('user_id', profileWithUserId.user_id)
                .order('created_at', { ascending: false });

            if (membershipData) {
                setMemberships(membershipData as Membership[]);
            }
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
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <CreditCard size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Active Membership</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        You don&apos;t have any memberships yet.
                    </p>
                    <a href="/register" className="btn btn-primary">
                        Join Now
                    </a>
                </div>
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
