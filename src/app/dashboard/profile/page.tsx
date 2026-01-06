'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, AlertCircle, Save, Shield, Heart, Award } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import AvatarUpload from '@/components/AvatarUpload';
import { useDashboard } from '@/components/dashboard/DashboardProvider';

interface Profile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    medical_info: string;
    belt_rank: string;
    stripes: number;
    is_child: boolean;
    profile_image_url?: string;
    created_at: string;
}

const BELT_COLORS: Record<string, string> = {
    white: '#FFFFFF',
    blue: '#1E40AF',
    purple: '#6B21A8',
    brown: '#78350F',
    black: '#1A1A1A',
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Profile>>({});

    const supabase = getSupabaseClient();
    const { selectedProfileId } = useDashboard();

    useEffect(() => {
        fetchProfile();
    }, [selectedProfileId]);

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch profile based on selectedProfileId (user_id)
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', selectedProfileId)
                .single();

            if (fetchError) throw fetchError;

            setProfile(data);
            setFormData(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    postcode: formData.postcode,
                    emergency_contact_name: formData.emergency_contact_name,
                    emergency_contact_phone: formData.emergency_contact_phone,
                    medical_info: formData.medical_info,
                    belt_rank: formData.belt_rank,
                    stripes: formData.stripes,
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, ...formData } as Profile);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof Profile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="alert alert-error">
                <AlertCircle size={20} />
                {error || 'Profile not found'}
            </div>
        );
    }

    const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Profile</h1>
                <p className="dashboard-subtitle">
                    Manage your personal information and settings
                </p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <Shield size={18} />
                    {success}
                </div>
            )}

            {/* Profile Header Card */}
            <div className="glass-card" style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                    {/* Avatar Upload */}
                    <AvatarUpload
                        currentUrl={profile.profile_image_url}
                        userId={profile.user_id}
                        firstName={profile.first_name}
                        lastName={profile.last_name}
                        onUploadComplete={async (url) => {
                            // Update profile with new image URL
                            await supabase
                                .from('profiles')
                                .update({ profile_image_url: url })
                                .eq('id', profile.id);
                            setProfile({ ...profile, profile_image_url: url });
                            setSuccess('Profile picture updated!');
                        }}
                        size="xl"
                    />

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
                            {profile.first_name} {profile.last_name}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                            {profile.email}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                            <span className={`badge badge-belt-${profile.belt_rank || 'white'}`} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                            }}>
                                <Award size={14} />
                                {(profile.belt_rank || 'White').charAt(0).toUpperCase() + (profile.belt_rank || 'white').slice(1)} Belt
                            </span>
                            <span className="badge badge-gray">
                                Member since {memberSince}
                            </span>
                            {profile.is_child && (
                                <span className="badge badge-gold">
                                    <Heart size={12} /> Child Member
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Edit Button */}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`btn ${isEditing ? 'btn-ghost' : 'btn-primary'}`}
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
                {/* Personal Information */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <User size={20} color="var(--color-gold)" />
                            Personal Information
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.first_name || ''}
                                            onChange={(e) => updateField('first_name', e.target.value)}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontWeight: '500' }}>{profile.first_name}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.last_name || ''}
                                            onChange={(e) => updateField('last_name', e.target.value)}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontWeight: '500' }}>{profile.last_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <p style={{ margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <Calendar size={16} color="var(--text-secondary)" />
                                    {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-GB') : 'Not set'}
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <p style={{ margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <Mail size={16} color="var(--text-secondary)" />
                                    {profile.email}
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone || ''}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <Phone size={16} color="var(--text-secondary)" />
                                        {profile.phone || 'Not set'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BJJ Progress */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Award size={20} color="var(--color-gold)" />
                            BJJ Progress
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Belt Rank</label>
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                        {(profile.is_child
                                            ? ['white', 'grey-white', 'grey', 'grey-black', 'yellow-white', 'yellow', 'yellow-black', 'orange-white', 'orange', 'orange-black', 'green-white', 'green', 'green-black']
                                            : ['white', 'blue', 'purple', 'brown', 'black']
                                        ).map((belt) => (
                                            <button
                                                key={belt}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, belt_rank: belt }))}
                                                style={{
                                                    padding: 'var(--space-2) var(--space-3)',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: formData.belt_rank === belt ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                                    background: formData.belt_rank === belt ? 'rgba(197, 164, 86, 0.15)' : 'var(--bg-primary)',
                                                    cursor: 'pointer',
                                                    textTransform: 'capitalize',
                                                    fontWeight: formData.belt_rank === belt ? '600' : '400',
                                                    fontSize: 'var(--text-sm)',
                                                }}
                                            >
                                                {belt.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontWeight: '500', textTransform: 'capitalize' }}>
                                        {(profile.belt_rank || 'white').replace('-', ' ')} Belt
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stripes {profile.is_child ? '(0-12)' : '(0-4)'}</label>
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                        {(profile.is_child
                                            ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                            : [0, 1, 2, 3, 4]
                                        ).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, stripes: s }))}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: formData.stripes === s ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                                    background: formData.stripes === s ? 'rgba(197, 164, 86, 0.15)' : 'var(--bg-primary)',
                                                    cursor: 'pointer',
                                                    fontWeight: formData.stripes === s ? '600' : '400',
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontWeight: '500' }}>
                                        {profile.stripes || 0} stripe{(profile.stripes || 0) !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <MapPin size={20} color="var(--color-gold)" />
                            Address
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Street Address</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.address || ''}
                                        onChange={(e) => updateField('address', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ margin: 0, fontWeight: '500' }}>{profile.address || 'Not set'}</p>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.city || ''}
                                            onChange={(e) => updateField('city', e.target.value)}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontWeight: '500' }}>{profile.city || 'Not set'}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Postcode</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.postcode || ''}
                                            onChange={(e) => updateField('postcode', e.target.value)}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontWeight: '500' }}>{profile.postcode || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <AlertCircle size={20} color="var(--color-red)" />
                            Emergency Contact
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Contact Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.emergency_contact_name || ''}
                                        onChange={(e) => updateField('emergency_contact_name', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ margin: 0, fontWeight: '500' }}>{profile.emergency_contact_name || 'Not set'}</p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Contact Phone</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.emergency_contact_phone || ''}
                                        onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
                                    />
                                ) : (
                                    <p style={{ margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <Phone size={16} color="var(--text-secondary)" />
                                        {profile.emergency_contact_phone || 'Not set'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical Info */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Heart size={20} color="var(--color-gold)" />
                            Medical Information
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Medical/Allergy Information</label>
                            {isEditing ? (
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    placeholder="Any medical conditions, allergies, or health information..."
                                    value={formData.medical_info || ''}
                                    onChange={(e) => updateField('medical_info', e.target.value)}
                                />
                            ) : (
                                <p style={{ margin: 0, color: profile.medical_info ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {profile.medical_info || 'No medical information provided'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            {isEditing && (
                <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                    <button
                        onClick={() => {
                            setFormData(profile);
                            setIsEditing(false);
                        }}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        {saving ? (
                            <>
                                <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
