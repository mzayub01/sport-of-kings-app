'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Calendar, Phone, MapPin, Heart, AlertCircle,
    ChevronLeft, Check, Loader2
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Location {
    id: string;
    name: string;
}

interface MembershipType {
    id: string;
    name: string;
    price: number;
    location_id: string;
}

export default function AddChildPage() {
    const router = useRouter();
    const supabase = getSupabaseClient();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);
    const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
    const [parentMembership, setParentMembership] = useState<{ location_id: string } | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        address: '',
        city: '',
        postcode: '',
        emergencyName: '',
        emergencyPhone: '',
        medicalInfo: '',
        locationId: '',
        membershipTypeId: '',
        beltRank: 'white',
        stripes: 0,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Get parent's membership to find their location
            const { data: membership } = await supabase
                .from('memberships')
                .select('location_id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            setParentMembership(membership);

            // Get locations
            const { data: locs } = await supabase
                .from('locations')
                .select('id, name')
                .eq('is_active', true);
            setLocations(locs || []);

            // Get membership types for kids
            const { data: types } = await supabase
                .from('membership_types')
                .select('id, name, price, location_id')
                .eq('is_active', true);
            setMembershipTypes(types || []);

            // Pre-select parent's location if they have one
            if (membership?.location_id) {
                setFormData(prev => ({ ...prev, locationId: membership.location_id }));
            }

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setPageLoading(false);
        }
    };

    const updateField = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        if (!formData.locationId || !formData.membershipTypeId) {
            setError('Please select a location and membership type');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/parent/add-child', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Show detailed error if available
                const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                throw new Error(errorMsg || 'Failed to add child');
            }

            setSuccess(true);
            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/dashboard');
                router.refresh();
            }, 2000);

        } catch (err) {
            console.error('Error adding child:', err);
            setError(err instanceof Error ? err.message : 'Failed to add child');
        } finally {
            setLoading(false);
        }
    };

    // Filter membership types for selected location
    const filteredMembershipTypes = membershipTypes.filter(
        mt => mt.location_id === formData.locationId
    );

    if (pageLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (success) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-12)',
                textAlign: 'center',
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                }}>
                    <Check size={40} color="white" />
                </div>
                <h2 style={{ marginBottom: 'var(--space-2)' }}>Child Added Successfully!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Redirecting to dashboard...
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <button
                    onClick={() => router.back()}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--space-4)' }}
                >
                    <ChevronLeft size={18} />
                    Back
                </button>
                <h1 className="dashboard-title">Add a Child</h1>
                <p className="dashboard-subtitle">
                    Register your child for classes at Sport of Kings
                </p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <div className="card-body">
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Child's Details */}
                        <h3 style={{
                            fontSize: 'var(--text-lg)',
                            marginBottom: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}>
                            <Heart size={20} color="var(--color-gold)" />
                            Child&apos;s Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">First Name*</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name*</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={(e) => updateField('lastName', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="form-label">Date of Birth*</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.dateOfBirth}
                                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="form-label">Gender*</label>
                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-3)',
                                    background: formData.gender === 'male' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                    border: formData.gender === 'male' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    flex: 1,
                                }}>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={formData.gender === 'male'}
                                        onChange={(e) => updateField('gender', e.target.value)}
                                    />
                                    Male
                                </label>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-3)',
                                    background: formData.gender === 'female' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                    border: formData.gender === 'female' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    flex: 1,
                                }}>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={formData.gender === 'female'}
                                        onChange={(e) => updateField('gender', e.target.value)}
                                    />
                                    Female
                                </label>
                            </div>
                        </div>

                        {/* Belt Selection (Optional - for existing practitioners) */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--space-4)',
                        }}>
                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                <label className="form-label" style={{ marginBottom: 'var(--space-1)' }}>
                                    Current Belt Rank <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Optional)</span>
                                </label>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--text-sm)',
                                    margin: 0,
                                }}>
                                    Already training in BJJ? Select their current belt. New to BJJ? Leave as White Belt.
                                </p>
                            </div>

                            {/* Belt Color Selection - Kids Belt Scheme */}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                                {['white', 'grey-white', 'grey', 'grey-black', 'orange-white', 'orange', 'orange-black', 'yellow-white', 'yellow', 'yellow-black', 'green-white', 'green', 'green-black'].map((belt) => (
                                    <button
                                        key={belt}
                                        type="button"
                                        onClick={() => updateField('beltRank', belt)}
                                        style={{
                                            padding: 'var(--space-2) var(--space-3)',
                                            borderRadius: 'var(--radius-md)',
                                            border: formData.beltRank === belt ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                            background: formData.beltRank === belt ? 'rgba(197, 164, 86, 0.15)' : 'var(--bg-primary)',
                                            cursor: 'pointer',
                                            textTransform: 'capitalize',
                                            fontWeight: formData.beltRank === belt ? '600' : '400',
                                            fontSize: 'var(--text-sm)',
                                        }}
                                    >
                                        {belt.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>

                            {/* Stripes Selection */}
                            {formData.beltRank !== 'white' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        Stripes (White 1-4, Red 5-8, Grey 9-12)
                                    </label>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => {
                                            // Color code for kids: 1-4 white, 5-8 red, 9-12 grey
                                            let stripeColor = 'inherit';
                                            if (s > 0) {
                                                if (s <= 4) stripeColor = 'var(--text-primary)';
                                                else if (s <= 8) stripeColor = '#DC2626';
                                                else stripeColor = '#6B7280';
                                            }
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => updateField('stripes', s)}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: formData.stripes === s ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                                        background: formData.stripes === s ? 'rgba(197, 164, 86, 0.15)' : 'var(--bg-primary)',
                                                        cursor: 'pointer',
                                                        fontWeight: formData.stripes === s ? '600' : '400',
                                                        color: formData.stripes !== s ? stripeColor : undefined,
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Location & Membership */}
                        <h3 style={{
                            fontSize: 'var(--text-lg)',
                            marginTop: 'var(--space-6)',
                            marginBottom: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}>
                            <MapPin size={20} color="var(--color-gold)" />
                            Location & Membership
                        </h3>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="form-label">Location*</label>
                            <select
                                className="form-input"
                                value={formData.locationId}
                                onChange={(e) => {
                                    updateField('locationId', e.target.value);
                                    updateField('membershipTypeId', ''); // Reset membership type
                                }}
                                required
                            >
                                <option value="">Select a location</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        {formData.locationId && (
                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">Membership Type*</label>
                                <select
                                    className="form-input"
                                    value={formData.membershipTypeId}
                                    onChange={(e) => updateField('membershipTypeId', e.target.value)}
                                    required
                                >
                                    <option value="">Select membership type</option>
                                    {filteredMembershipTypes.map(mt => (
                                        <option key={mt.id} value={mt.id}>
                                            {mt.name} {mt.price > 0 ? `- £${mt.price}` : '(Free)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Emergency Contact */}
                        <h3 style={{
                            fontSize: 'var(--text-lg)',
                            marginTop: 'var(--space-6)',
                            marginBottom: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}>
                            <AlertCircle size={20} color="var(--color-red)" />
                            Emergency Contact
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Contact Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.emergencyName}
                                    onChange={(e) => updateField('emergencyName', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.emergencyPhone}
                                    onChange={(e) => updateField('emergencyPhone', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Medical Info */}
                        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                            <label className="form-label">Medical Information (optional)</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="Any allergies, conditions, or medical information..."
                                value={formData.medicalInfo}
                                onChange={(e) => updateField('medicalInfo', e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spinner" />
                                    Adding Child...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Add Child
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
