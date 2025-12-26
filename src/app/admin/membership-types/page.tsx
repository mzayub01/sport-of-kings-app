'use client';

import { useState, useEffect } from 'react';
import { Plus, CreditCard, Edit, Trash2, CheckCircle, AlertCircle, MapPin, Tag } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Location {
    id: string;
    name: string;
}

interface MembershipType {
    id: string;
    location_id: string;
    name: string;
    description: string | null;
    price: number;
    duration_days: number;
    age_min: number | null;
    age_max: number | null;
    is_active: boolean;
    location?: Location;
}

interface LocationMembershipConfig {
    id: string;
    location_id: string;
    membership_type_id: string;
    capacity: number | null;
    is_available: boolean;
}

export default function AdminMembershipTypesPage() {
    const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [configs, setConfigs] = useState<LocationMembershipConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<MembershipType | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterLocation, setFilterLocation] = useState<string>('all');

    const supabase = getSupabaseClient();

    const [formData, setFormData] = useState({
        location_id: '',
        name: '',
        description: '',
        price: 0,
        duration_days: 365,
        age_min: '',
        age_max: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Fetch locations
        const { data: locationsData } = await supabase
            .from('locations')
            .select('id, name')
            .eq('is_active', true)
            .order('name');

        if (locationsData) {
            setLocations(locationsData);
        }

        // Fetch membership types with location info
        const { data, error } = await supabase
            .from('membership_types')
            .select('*, location:locations(id, name)')
            .order('location_id')
            .order('price');

        if (error) {
            console.error('Error fetching membership types:', error);
        } else {
            setMembershipTypes(data || []);
        }

        // Fetch capacity configs
        const { data: configsData } = await supabase
            .from('location_membership_configs')
            .select('*');

        setConfigs(configsData || []);
        setLoading(false);
    };

    // Get config for a membership type
    const getConfig = (membershipTypeId: string, locationId: string) => {
        return configs.find(c => c.membership_type_id === membershipTypeId && c.location_id === locationId);
    };

    // Update capacity for a membership type
    const updateCapacity = async (membershipTypeId: string, locationId: string, newCapacity: number | null) => {
        const existingConfig = getConfig(membershipTypeId, locationId);

        try {
            if (existingConfig) {
                await supabase
                    .from('location_membership_configs')
                    .update({ capacity: newCapacity })
                    .eq('id', existingConfig.id);
            } else {
                await supabase
                    .from('location_membership_configs')
                    .insert({
                        location_id: locationId,
                        membership_type_id: membershipTypeId,
                        capacity: newCapacity,
                        is_available: true,
                    });
            }
            setSuccess('Capacity updated');
            fetchData();
        } catch (err) {
            console.error('Error updating capacity:', err);
        }
    };

    const openModal = (item?: MembershipType) => {
        if (item) {
            setEditItem(item);
            setFormData({
                location_id: item.location_id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                duration_days: item.duration_days,
                age_min: item.age_min?.toString() || '',
                age_max: item.age_max?.toString() || '',
            });
        } else {
            setEditItem(null);
            setFormData({
                location_id: locations[0]?.id || '',
                name: '',
                description: '',
                price: 0,
                duration_days: 365,
                age_min: '',
                age_max: '',
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.location_id || !formData.name) {
            setError('Please select a location and enter a name');
            return;
        }

        const payload = {
            location_id: formData.location_id,
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            duration_days: formData.duration_days,
            age_min: formData.age_min ? parseInt(formData.age_min) : null,
            age_max: formData.age_max ? parseInt(formData.age_max) : null,
        };

        try {
            if (editItem) {
                const { error } = await supabase
                    .from('membership_types')
                    .update(payload)
                    .eq('id', editItem.id);

                if (error) throw error;
                setSuccess('Membership type updated successfully');
            } else {
                const { error } = await supabase
                    .from('membership_types')
                    .insert(payload);

                if (error) throw error;
                setSuccess('Membership type created successfully');
            }

            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        }
    };

    const toggleStatus = async (item: MembershipType) => {
        const { error } = await supabase
            .from('membership_types')
            .update({ is_active: !item.is_active })
            .eq('id', item.id);

        if (!error) {
            fetchData();
        }
    };

    const deleteItem = async (item: MembershipType) => {
        if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

        const { error } = await supabase
            .from('membership_types')
            .delete()
            .eq('id', item.id);

        if (!error) {
            fetchData();
            setSuccess('Membership type deleted');
        }
    };

    const formatPrice = (price: number) => {
        if (price === 0) return 'FREE';
        return `£${price}/month`;
    };

    const filteredTypes = filterLocation === 'all'
        ? membershipTypes
        : membershipTypes.filter(t => t.location_id === filterLocation);

    // Group by location
    const groupedByLocation = filteredTypes.reduce((acc, type) => {
        const locationName = type.location?.name || 'Unknown';
        if (!acc[locationName]) acc[locationName] = [];
        acc[locationName].push(type);
        return acc;
    }, {} as Record<string, MembershipType[]>);

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                    <h1 className="dashboard-title">Membership Types</h1>
                    <p className="dashboard-subtitle">Manage pricing tiers for each location</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <select
                        className="form-input"
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        style={{ minWidth: '180px' }}
                    >
                        <option value="all">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add Type
                    </button>
                </div>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                    <div className="spinner spinner-lg" />
                </div>
            ) : membershipTypes.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <CreditCard size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Membership Types Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        Create membership tiers for your locations (e.g., Kids, Teen, Adult).
                    </p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add First Type
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                    {Object.entries(groupedByLocation).map(([locationName, types]) => (
                        <div key={locationName}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                marginBottom: 'var(--space-4)',
                                paddingBottom: 'var(--space-2)',
                                borderBottom: '1px solid var(--border-light)',
                            }}>
                                <MapPin size={18} color="var(--color-gold)" />
                                <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{locationName}</h2>
                                <span className="badge badge-gray">{types.length} types</span>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 'var(--space-4)',
                            }}>
                                {types.map((type) => (
                                    <div key={type.id} className="card" style={{
                                        opacity: type.is_active ? 1 : 0.6,
                                        borderLeft: `4px solid ${type.price === 0 ? 'var(--color-green)' : 'var(--color-gold)'}`,
                                    }}>
                                        <div className="card-body">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{type.name}</h3>
                                                    <span className={`badge ${type.is_active ? 'badge-green' : 'badge-gray'}`} style={{ marginTop: 'var(--space-1)' }}>
                                                        {type.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    background: type.price === 0 ? 'var(--color-green)' : 'var(--color-gold-gradient)',
                                                    color: 'var(--color-black)',
                                                    padding: 'var(--space-1) var(--space-3)',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontWeight: '700',
                                                    fontSize: 'var(--text-sm)',
                                                }}>
                                                    {formatPrice(type.price)}
                                                </span>
                                            </div>

                                            {type.description && (
                                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                                    {type.description}
                                                </p>
                                            )}

                                            {(type.age_min || type.age_max) && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-2)',
                                                    fontSize: 'var(--text-sm)',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: 'var(--space-3)',
                                                }}>
                                                    <Tag size={14} />
                                                    Ages: {type.age_min || '0'} - {type.age_max || '∞'}
                                                </div>
                                            )}

                                            {/* Capacity Input */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-2)',
                                                fontSize: 'var(--text-sm)',
                                                marginBottom: 'var(--space-3)',
                                                padding: 'var(--space-2)',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                            }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Capacity:</span>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ width: '80px', padding: 'var(--space-1) var(--space-2)' }}
                                                    placeholder="∞"
                                                    defaultValue={getConfig(type.id, type.location_id)?.capacity ?? ''}
                                                    min="0"
                                                    onBlur={(e) => {
                                                        const val = e.target.value;
                                                        updateCapacity(type.id, type.location_id, val ? parseInt(val) : null);
                                                    }}
                                                />
                                                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                                                    (blank = unlimited)
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-light)' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openModal(type)}>
                                                    <Edit size={16} />
                                                    Edit
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(type)}>
                                                    {type.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-red)' }} onClick={() => deleteItem(type)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editItem ? 'Edit Membership Type' : 'Add Membership Type'}
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                                        <AlertCircle size={18} />
                                        {error}
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
                                        <option value="">Select a location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Name*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. U11 Kids Membership"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. For children under 11 years old"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Price (£/month)*</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                            min="0"
                                            required
                                        />
                                        <p className="form-hint">Enter 0 for free</p>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Duration (days)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.duration_days}
                                            onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 365 })}
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Min Age</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.age_min}
                                            onChange={(e) => setFormData({ ...formData, age_min: e.target.value })}
                                            min="0"
                                            placeholder="e.g. 0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Age</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.age_max}
                                            onChange={(e) => setFormData({ ...formData, age_max: e.target.value })}
                                            min="0"
                                            placeholder="e.g. 11"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editItem ? 'Save Changes' : 'Create Type'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
