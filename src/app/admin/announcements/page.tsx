'use client';

import { useState, useEffect } from 'react';
import { Plus, Bell, Edit, Trash2, Calendar, MapPin, Users, AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Location {
    id: string;
    name: string;
}

interface Announcement {
    id: string;
    title: string;
    message: string;
    location_id: string | null;
    target_audience: string;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
    location?: {
        name: string;
    };
}

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        location_id: '',
        target_audience: 'all',
        expires_at: '',
        sendEmailNotifications: false,
    });

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [announcementsRes, locationsRes] = await Promise.all([
                supabase
                    .from('announcements')
                    .select(`*, location:locations(name)`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('locations')
                    .select('id, name')
                    .eq('is_active', true)
                    .order('name'),
            ]);

            setAnnouncements(announcementsRes.data || []);
            setLocations(locationsRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                message: announcement.message,
                location_id: announcement.location_id || '',
                target_audience: announcement.target_audience || 'all',
                expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
                sendEmailNotifications: false, // Don't send emails when editing
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                message: '',
                location_id: '',
                target_audience: 'all',
                expires_at: '',
                sendEmailNotifications: false,
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const payload = {
            title: formData.title,
            message: formData.message,
            location_id: formData.location_id || null,
            target_audience: formData.target_audience,
            expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            is_active: true,
        };

        try {
            if (editingAnnouncement) {
                const { error } = await supabase
                    .from('announcements')
                    .update(payload)
                    .eq('id', editingAnnouncement.id);
                if (error) throw error;
                setSuccess('Announcement updated successfully!');
            } else {
                const { error } = await supabase
                    .from('announcements')
                    .insert(payload);
                if (error) throw error;

                // Send email notifications if checkbox was checked
                if (formData.sendEmailNotifications) {
                    setSendingEmail(true);
                    try {
                        const emailResponse = await fetch('/api/email/announcement', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                announcementTitle: formData.title,
                                announcementMessage: formData.message,
                                locationId: formData.location_id || null,
                                targetAudience: formData.target_audience,
                            }),
                        });

                        const emailData = await emailResponse.json();

                        if (emailResponse.ok && emailData.sent > 0) {
                            setSuccess(`Announcement created! ${emailData.sent} email(s) sent successfully.`);
                        } else if (emailData.sent === 0) {
                            setSuccess('Announcement created! No matching recipients for email.');
                        } else {
                            setSuccess(`Announcement created! Email sending partially failed: ${emailData.sent} sent, ${emailData.failed} failed.`);
                        }
                    } catch (emailErr) {
                        console.error('Email sending error:', emailErr);
                        setSuccess('Announcement created! But email notifications failed to send.');
                    } finally {
                        setSendingEmail(false);
                    }
                } else {
                    setSuccess('Announcement created successfully!');
                }
            }
            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save announcement';
            setError(errorMessage);
        }
    };

    const toggleAnnouncementStatus = async (announcement: Announcement) => {
        try {
            await supabase
                .from('announcements')
                .update({ is_active: !announcement.is_active })
                .eq('id', announcement.id);
            fetchData();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const deleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
            fetchData();
            setSuccess('Announcement deleted successfully!');
        } catch (err) {
            console.error('Error deleting announcement:', err);
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
                    <h1 className="dashboard-title">Announcements</h1>
                    <p className="dashboard-subtitle">
                        Create and manage announcements for members
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <Plus size={18} />
                    New Announcement
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

            {announcements.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Bell size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Announcements</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                        Create your first announcement to notify members.
                    </p>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <Plus size={18} />
                        Create Announcement
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="card"
                            style={{ opacity: announcement.is_active ? 1 : 0.6 }}
                        >
                            <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: announcement.is_active ? 'var(--color-gold)' : 'var(--bg-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Bell size={22} color={announcement.is_active ? 'var(--color-black)' : 'var(--text-tertiary)'} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
                                        <h4 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{announcement.title}</h4>
                                        <span className={`badge ${announcement.is_active ? 'badge-green' : 'badge-gray'}`}>
                                            {announcement.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        {announcement.location && (
                                            <span className="badge badge-gray">
                                                <MapPin size={12} /> {announcement.location.name}
                                            </span>
                                        )}
                                        <span className="badge badge-gold">
                                            <Users size={12} /> {announcement.target_audience}
                                        </span>
                                    </div>

                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', whiteSpace: 'pre-wrap' }}>
                                        {announcement.message.length > 200
                                            ? announcement.message.substring(0, 200) + '...'
                                            : announcement.message}
                                    </p>

                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', display: 'flex', gap: 'var(--space-4)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                            <Calendar size={14} />
                                            {new Date(announcement.created_at).toLocaleDateString('en-GB')}
                                        </span>
                                        {announcement.expires_at && (
                                            <span>
                                                Expires: {new Date(announcement.expires_at).toLocaleDateString('en-GB')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <button
                                        onClick={() => toggleAnnouncementStatus(announcement)}
                                        className="btn btn-ghost btn-sm"
                                        title={announcement.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => openModal(announcement)}
                                        className="btn btn-ghost btn-sm"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteAnnouncement(announcement.id)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--color-red)' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="Announcement title..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Message*</label>
                                    <textarea
                                        className="form-input"
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        placeholder="Write your announcement message..."
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Target Audience</label>
                                        <select
                                            className="form-input"
                                            value={formData.target_audience}
                                            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                                        >
                                            <option value="all">All</option>
                                            <option value="members">Members Only</option>
                                            <option value="instructors">Instructors Only</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Location (Optional)</label>
                                        <select
                                            className="form-input"
                                            value={formData.location_id}
                                            onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                        >
                                            <option value="">All Locations</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Expires On (Optional)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    />
                                </div>

                                {/* Email Notifications - Only show for new announcements */}
                                {!editingAnnouncement && (
                                    <div
                                        className="form-group"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--space-4)',
                                            marginTop: 'var(--space-4)',
                                        }}
                                    >
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.sendEmailNotifications}
                                                onChange={(e) => setFormData({ ...formData, sendEmailNotifications: e.target.checked })}
                                                style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)' }}
                                            />
                                            <Mail size={18} color="var(--color-gold)" />
                                            <span style={{ fontWeight: 500 }}>Notify members via email</span>
                                        </label>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', marginLeft: '42px' }}>
                                            Send an email notification to all members matching the target audience and location.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" disabled={sendingEmail}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={sendingEmail}>
                                    {sendingEmail ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Sending emails...
                                        </>
                                    ) : (
                                        editingAnnouncement ? 'Save Changes' : 'Create Announcement'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
