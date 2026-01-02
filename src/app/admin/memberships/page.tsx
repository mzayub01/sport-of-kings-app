'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, Search, CheckCircle, XCircle, AlertCircle, Filter, Calendar, UserPlus, CreditCard, Ban, Receipt, RefreshCw } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Membership {
    id: string;
    user_id: string;
    location_id: string;
    membership_type_id: string | null;
    status: string;
    start_date: string;
    end_date: string | null;
    created_at: string;
    stripe_subscription_id: string | null;
    profile?: {
        first_name: string;
        last_name: string;
        email: string;
        is_child?: boolean;
        parent_guardian_id?: string;
        stripe_customer_id?: string;
    };
    guardian_email?: string; // Parent's email for child profiles
    location?: {
        name: string;
    };
    membership_type?: {
        name: string;
    };
}

interface Location {
    id: string;
    name: string;
}

interface Member {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

const STATUS_OPTIONS = ['active', 'inactive', 'pending', 'cancelled'];

export default function AdminMembershipsPage() {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLocation, setFilterLocation] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        user_id: '',
        location_id: '',
        status: 'active',
    });

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [membershipsRes, locationsRes, membersRes] = await Promise.all([
                supabase
                    .from('memberships')
                    .select('*, stripe_subscription_id, profile:profiles(id, first_name, last_name, email, is_child, parent_guardian_id, stripe_customer_id), location:locations(name), membership_type:membership_types(name)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('locations')
                    .select('id, name')
                    .eq('is_active', true),
                supabase
                    .from('profiles')
                    .select('id, user_id, first_name, last_name, email')
                    .order('first_name'),
            ]);

            const membershipsData = membershipsRes.data || [];
            const profilesData = membersRes.data || [];

            // Create a map of profile IDs to emails for guardian lookup
            const profileIdToEmail: Record<string, string> = {};
            profilesData.forEach((p: any) => {
                profileIdToEmail[p.id] = p.email;
            });

            // Add guardian email to memberships with child profiles
            const membershipsWithGuardian = membershipsData.map((m: any) => ({
                ...m,
                guardian_email: m.profile?.is_child && m.profile?.parent_guardian_id
                    ? profileIdToEmail[m.profile.parent_guardian_id]
                    : undefined,
            }));

            setMemberships(membershipsWithGuardian);
            setLocations(locationsRes.data || []);
            setMembers(profilesData);
        } catch (err) {
            console.error('Error fetching memberships:', err);
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const activeCount = memberships.filter(m => m.status === 'active').length;
    const pendingCount = memberships.filter(m => m.status === 'pending').length;

    // Filter memberships
    const filteredMemberships = memberships.filter(m => {
        const matchesSearch = searchQuery === '' ||
            `${m.profile?.first_name} ${m.profile?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = filterLocation === 'all' || m.location_id === filterLocation;
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
        return matchesSearch && matchesLocation && matchesStatus;
    });

    const openModal = (membership?: Membership) => {
        if (membership) {
            setEditingMembership(membership);
            setFormData({
                user_id: membership.user_id,
                location_id: membership.location_id,
                status: membership.status,
            });
        } else {
            setEditingMembership(null);
            setFormData({
                user_id: '',
                location_id: locations[0]?.id || '',
                status: 'active',
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.user_id || !formData.location_id) {
            setError('Please select a member and location');
            return;
        }

        try {
            if (editingMembership) {
                const { error } = await supabase
                    .from('memberships')
                    .update({
                        location_id: formData.location_id,
                        status: formData.status,
                    })
                    .eq('id', editingMembership.id);

                if (error) throw error;
                setSuccess('Membership updated successfully!');
            } else {
                // Check if membership already exists
                const { data: existing } = await supabase
                    .from('memberships')
                    .select('id')
                    .eq('user_id', formData.user_id)
                    .eq('location_id', formData.location_id)
                    .single();

                if (existing) {
                    setError('This member already has a membership at this location');
                    return;
                }

                const { error } = await supabase
                    .from('memberships')
                    .insert({
                        user_id: formData.user_id,
                        location_id: formData.location_id,
                        status: formData.status,
                        start_date: new Date().toISOString().split('T')[0],
                    });

                if (error) throw error;
                setSuccess('Membership created successfully!');
            }

            setShowModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to save membership');
        }
    };

    const updateStatus = async (membershipId: string, newStatus: string) => {
        try {
            await supabase
                .from('memberships')
                .update({ status: newStatus })
                .eq('id', membershipId);
            fetchData();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const cancelSubscription = async (membership: Membership) => {
        if (!membership.stripe_subscription_id) {
            setError('This membership does not have a Stripe subscription.');
            return;
        }

        if (!confirm(`Are you sure you want to cancel the subscription for ${membership.profile?.first_name} ${membership.profile?.last_name}? This will stop their recurring payments.`)) {
            return;
        }

        try {
            setSuccess('');
            setError('');

            const response = await fetch('/api/stripe/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: membership.stripe_subscription_id,
                    membershipId: membership.id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Subscription cancelled successfully!');
                fetchData();
            } else {
                setError(data.error || 'Failed to cancel subscription');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to cancel subscription');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                    <h1 className="dashboard-title">Memberships</h1>
                    <p className="dashboard-subtitle">
                        Manage member enrollments at locations
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <UserPlus size={18} />
                    Add Membership
                </button>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="stat-card glass-card">
                    <p className="stat-label">Total Memberships</p>
                    <p className="stat-value">{memberships.length}</p>
                </div>
                <div className="stat-card glass-card">
                    <p className="stat-label">Active</p>
                    <p className="stat-value" style={{ color: 'var(--color-green)' }}>{activeCount}</p>
                </div>
                <div className="stat-card glass-card">
                    <p className="stat-label">Pending</p>
                    <p className="stat-value" style={{ color: 'var(--color-gold)' }}>{pendingCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
                <select
                    className="form-input"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    style={{ width: 'auto', minWidth: '150px' }}
                >
                    <option value="all">All Locations</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
                <select
                    className="form-input"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: 'auto', minWidth: '120px' }}
                >
                    <option value="all">All Status</option>
                    {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Member</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Location</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Plan</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Status</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Start Date</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMemberships.map((membership) => (
                                <tr key={membership.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', margin: 0 }}>
                                                {membership.profile?.first_name} {membership.profile?.last_name}
                                                {membership.profile?.is_child && (
                                                    <span className="badge badge-gold" style={{ marginLeft: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>Child</span>
                                                )}
                                            </p>
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                                {membership.profile?.is_child && membership.guardian_email ? (
                                                    <span>
                                                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Guardian: </span>
                                                        {membership.guardian_email}
                                                    </span>
                                                ) : (
                                                    membership.profile?.email
                                                )}
                                            </p>
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <MapPin size={14} color="var(--text-tertiary)" />
                                            {membership.location?.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        {membership.membership_type?.name ? (
                                            <span className="badge badge-gold" style={{ fontSize: 'var(--text-xs)' }}>
                                                {membership.membership_type.name}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        <select
                                            className="form-input"
                                            value={membership.status}
                                            onChange={(e) => updateStatus(membership.id, e.target.value)}
                                            style={{
                                                width: 'auto',
                                                padding: 'var(--space-1) var(--space-2)',
                                                fontSize: 'var(--text-sm)',
                                                background: membership.status === 'active' ? 'rgba(34, 197, 94, 0.1)' :
                                                    membership.status === 'pending' ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-secondary)',
                                            }}
                                        >
                                            {STATUS_OPTIONS.map(status => (
                                                <option key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        {membership.start_date ? new Date(membership.start_date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        }) : '-'}
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <button onClick={() => openModal(membership)} className="btn btn-ghost btn-sm">
                                                Edit
                                            </button>
                                            {membership.profile?.stripe_customer_id && (
                                                <a
                                                    href={`https://dashboard.stripe.com/customers/${membership.profile.stripe_customer_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--color-gold)' }}
                                                    title="View payments in Stripe"
                                                >
                                                    <Receipt size={14} />
                                                    Payments
                                                </a>
                                            )}
                                            {membership.stripe_subscription_id && membership.status === 'active' && (
                                                <button
                                                    onClick={() => cancelSubscription(membership)}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--color-red)' }}
                                                    title="Cancel Stripe subscription"
                                                >
                                                    <Ban size={14} />
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredMemberships.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No memberships found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingMembership ? 'Edit Membership' : 'Add Membership'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {!editingMembership && (
                                    <div className="form-group">
                                        <label className="form-label">Member*</label>
                                        <select
                                            className="form-input"
                                            value={formData.user_id}
                                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select member...</option>
                                            {members.map(member => (
                                                <option key={member.id} value={member.user_id}>
                                                    {member.first_name} {member.last_name} ({member.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Location*</label>
                                    <select
                                        className="form-input"
                                        value={formData.location_id}
                                        onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select location...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingMembership ? 'Save Changes' : 'Create Membership'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
