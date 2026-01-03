'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Clock, Users, Edit, Trash2, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Event, Location } from '@/lib/types';

const EVENT_TYPES = [
    { value: 'class', label: 'Class' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'retreat', label: 'Retreat' },
    { value: 'gathering', label: 'Gathering' },
    { value: 'competition', label: 'Competition' },
    { value: 'other', label: 'Other' },
];

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editEvent, setEditEvent] = useState<Event | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

    const supabase = getSupabaseClient();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'gathering',
        location_id: '',
        custom_location: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        max_capacity: 50,
        price: 0,
        is_members_only: false,
        rsvp_deadline: '',
    });

    const [attendees, setAttendees] = useState<any[]>([]);
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [attendeesLoading, setAttendeesLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [eventsRes, locationsRes] = await Promise.all([
            supabase.from('events').select('*, location:locations(name)').order('start_date', { ascending: false }),
            supabase.from('locations').select('*').eq('is_active', true),
        ]);

        setEvents(eventsRes.data || []);
        setLocations(locationsRes.data || []);
        setLoading(false);
    };

    const filteredEvents = events.filter(event => {
        const today = new Date().toISOString().split('T')[0];
        if (filter === 'upcoming') return event.start_date >= today;
        if (filter === 'past') return event.start_date < today;
        return true;
    });

    const viewAttendees = async (event: Event) => {
        setCurrentEvent(event);
        setAttendeesLoading(true);
        setShowAttendeesModal(true);

        const { data, error } = await supabase
            .from('event_rsvps')
            .select('*')
            .eq('event_id', event.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching attendees:', error);
        }

        setAttendees(data || []);
        setAttendeesLoading(false);
    };

    const openModal = (event?: Event) => {
        if (event) {
            setEditEvent(event);
            setFormData({
                title: event.title,
                description: event.description || '',
                event_type: event.event_type,
                location_id: event.location_id || '',
                custom_location: (event as any).custom_location || '',
                start_date: event.start_date,
                end_date: event.end_date || '',
                start_time: event.start_time || '',
                end_time: event.end_time || '',
                max_capacity: event.max_capacity || 50,
                price: (event.price || 0) / 100,
                is_members_only: event.is_members_only,
                rsvp_deadline: event.rsvp_deadline || '',
            });
        } else {
            setEditEvent(null);
            setFormData({
                title: '',
                description: '',
                event_type: 'gathering',
                location_id: '',
                custom_location: '',
                start_date: '',
                end_date: '',
                start_time: '',
                end_time: '',
                max_capacity: 50,
                price: 0,
                is_members_only: false,
                rsvp_deadline: '',
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.title || !formData.start_date) {
            setError('Please fill in required fields');
            return;
        }

        try {
            const payload = {
                title: formData.title,
                description: formData.description || null,
                event_type: formData.event_type,
                location_id: formData.location_id || null,
                custom_location: formData.custom_location || null,
                start_date: formData.start_date,
                end_date: formData.end_date || null,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
                max_capacity: formData.max_capacity,
                price: Math.round(formData.price * 100), // Convert to pence
                is_members_only: formData.is_members_only,
                rsvp_deadline: formData.rsvp_deadline || null,
            };

            if (editEvent) {
                const { error } = await supabase.from('events').update(payload).eq('id', editEvent.id);
                if (error) throw error;
                setSuccess('Event updated successfully');
            } else {
                const { error } = await supabase.from('events').insert(payload);
                if (error) throw error;
                setSuccess('Event created successfully');
            }

            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        await supabase.from('events').delete().eq('id', eventId);
        fetchData();
    };

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="dashboard-title">Events</h1>
                    <p className="dashboard-subtitle">Manage retreats, gatherings, and special events</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Add Event
                </button>
            </div>

            {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}><CheckCircle size={18} />{success}</div>}

            {/* Filter */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                <Filter size={18} color="var(--text-tertiary)" />
                {(['upcoming', 'past', 'all'] as const).map((f) => (
                    <button
                        key={f}
                        className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        onClick={() => setFilter(f)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>
            ) : filteredEvents.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Calendar size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No {filter !== 'all' ? filter : ''} Events</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Create events for retreats, gatherings, and more.</p>
                    <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> Add Event</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
                    {filteredEvents.map((event) => (
                        <div key={event.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <span className={`badge badge-${event.event_type === 'retreat' ? 'gold' : event.event_type === 'competition' ? 'green' : 'gray'}`}>{EVENT_TYPES.find(t => t.value === event.event_type)?.label}</span>
                                        {event.is_members_only && <span className="badge badge-gold" style={{ marginLeft: 'var(--space-2)' }}>Members Only</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(event)}><Edit size={16} /></button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => deleteEvent(event.id)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-lg)' }}>{event.title}</h3>
                                {event.description && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{event.description.substring(0, 100)}{event.description.length > 100 ? '...' : ''}</p>}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Calendar size={14} />{new Date(event.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    {event.start_time && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Clock size={14} />{event.start_time} - {event.end_time || 'TBD'}</div>}
                                    {event.location ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><MapPin size={14} />{(event.location as { name: string }).name}</div>
                                    ) : (event as any).custom_location ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><MapPin size={14} />{(event as any).custom_location}</div>
                                    ) : null}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Users size={14} />Max: {event.max_capacity}</div>
                                </div>
                                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontWeight: '600', display: 'block' }}>Price</span>
                                        <span style={{ fontWeight: '700', color: 'var(--color-gold)' }}>{event.price === 0 ? 'Free' : `£${((event.price || 0) / 100).toFixed(2)}`}</span>
                                    </div>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => viewAttendees(event)}
                                    >
                                        <Users size={14} />
                                        Attendees
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
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editEvent ? 'Edit Event' : 'Add New Event'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}><AlertCircle size={18} />{error}</div>}

                                <div className="form-group"><label className="form-label">Event Title*</label><input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group"><label className="form-label">Event Type*</label><select className="form-input" value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}>{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                                    <div className="form-group"><label className="form-label">Training Location</label><select className="form-input" value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value, custom_location: e.target.value ? '' : formData.custom_location })}><option value="">-- Or use custom below --</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                                </div>

                                {!formData.location_id && (
                                    <div className="form-group">
                                        <label className="form-label">Custom Location</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Manchester Sports Arena, 123 High Street"
                                            value={formData.custom_location}
                                            onChange={(e) => setFormData({ ...formData, custom_location: e.target.value })}
                                        />
                                        <p className="form-hint">Enter a custom venue for events not at a training location</p>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group"><label className="form-label">Start Date*</label><input type="date" className="form-input" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required /></div>
                                    <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group"><label className="form-label">Start Time</label><input type="time" className="form-input" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">End Time</label><input type="time" className="form-input" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group"><label className="form-label">Max Capacity</label><input type="number" className="form-input" value={formData.max_capacity} onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })} min="1" /></div>
                                    <div className="form-group"><label className="form-label">Price (£)</label><input type="number" className="form-input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} min="0" step="0.01" /><p className="form-hint">Enter 0 for free events</p></div>
                                </div>

                                <div className="form-group"><label className="form-label">RSVP Deadline</label><input type="date" className="form-input" value={formData.rsvp_deadline} onChange={(e) => setFormData({ ...formData, rsvp_deadline: e.target.value })} /></div>

                                <div className="form-group"><label className="form-checkbox"><input type="checkbox" checked={formData.is_members_only} onChange={(e) => setFormData({ ...formData, is_members_only: e.target.checked })} /><span>Members only event</span></label></div>

                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editEvent ? 'Save Changes' : 'Create Event'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendees Modal */}
            {showAttendeesModal && (
                <div className="modal-overlay" onClick={() => setShowAttendeesModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Attendees: {currentEvent?.title}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAttendeesModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {attendeesLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><div className="spinner" /></div>
                            ) : attendees.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                                    <Users size={32} style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }} />
                                    <p>No attendees yet.</p>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        <span>Total Registered: {attendees.length}</span>
                                        <span>Capacity: {currentEvent?.max_capacity}</span>
                                    </div>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendees.map((attendee) => (
                                                    <tr key={attendee.id}>
                                                        <td style={{ fontWeight: '500' }}>{attendee.full_name}</td>
                                                        <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{attendee.email}</td>
                                                        <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{attendee.phone || '-'}</td>
                                                        <td style={{ fontSize: 'var(--text-xs)' }}>{new Date(attendee.created_at).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                                                                {attendee.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowAttendeesModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
