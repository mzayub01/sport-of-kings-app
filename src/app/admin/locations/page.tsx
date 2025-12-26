'use client';

import { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Settings, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Location } from '@/lib/types';

export default function AdminLocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editLocation, setEditLocation] = useState<Location | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const supabase = getSupabaseClient();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        postcode: '',
        description: '',
        contact_email: '',
        contact_phone: '',
    });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching locations:', error);
        } else {
            setLocations(data || []);
        }
        setLoading(false);
    };

    const openModal = (location?: Location) => {
        if (location) {
            setEditLocation(location);
            setFormData({
                name: location.name,
                address: location.address,
                city: location.city,
                postcode: location.postcode,
                description: location.description || '',
                contact_email: location.contact_email || '',
                contact_phone: location.contact_phone || '',
            });
        } else {
            setEditLocation(null);
            setFormData({
                name: '',
                address: '',
                city: '',
                postcode: '',
                description: '',
                contact_email: '',
                contact_phone: '',
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.name || !formData.address || !formData.city || !formData.postcode) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            if (editLocation) {
                const { error } = await supabase
                    .from('locations')
                    .update({
                        name: formData.name,
                        address: formData.address,
                        city: formData.city,
                        postcode: formData.postcode,
                        description: formData.description || null,
                        contact_email: formData.contact_email || null,
                        contact_phone: formData.contact_phone || null,
                    })
                    .eq('id', editLocation.id);

                if (error) throw error;
                setSuccess('Location updated successfully');
            } else {
                const { error } = await supabase
                    .from('locations')
                    .insert({
                        name: formData.name,
                        address: formData.address,
                        city: formData.city,
                        postcode: formData.postcode,
                        description: formData.description || null,
                        contact_email: formData.contact_email || null,
                        contact_phone: formData.contact_phone || null,
                    });

                if (error) throw error;
                setSuccess('Location created successfully');
            }

            setShowModal(false);
            fetchLocations();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        }
    };

    const toggleLocationStatus = async (location: Location) => {
        const { error } = await supabase
            .from('locations')
            .update({ is_active: !location.is_active })
            .eq('id', location.id);

        if (!error) {
            fetchLocations();
        }
    };

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="dashboard-title">Locations</h1>
                    <p className="dashboard-subtitle">Manage training locations and capacity</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Add Location
                </button>
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
            ) : locations.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <MapPin size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Locations Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        Add your first training location to get started.
                    </p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add Location
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 'var(--space-6)',
                }}>
                    {locations.map((location) => (
                        <div key={location.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{location.name}</h3>
                                        <span className={`badge ${location.is_active ? 'badge-green' : 'badge-gray'}`}>
                                            {location.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <button className="btn btn-ghost btn-icon" onClick={() => openModal(location)}>
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            onClick={() => toggleLocationStatus(location)}
                                        >
                                            {location.is_active ? <Trash2 size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>
                                    <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <span style={{ fontSize: 'var(--text-sm)' }}>
                                        {location.address}, {location.city}, {location.postcode}
                                    </span>
                                </div>

                                {location.description && (
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                                        {location.description}
                                    </p>
                                )}
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
                                {editLocation ? 'Edit Location' : 'Add New Location'}
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
                                    <label className="form-label">Location Name*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Manchester Central"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Street address"
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">City*</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Postcode*</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.postcode}
                                            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the location..."
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Contact Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.contact_email}
                                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Phone</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.contact_phone}
                                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editLocation ? 'Save Changes' : 'Create Location'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
