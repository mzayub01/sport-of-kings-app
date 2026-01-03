'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Event {
    id: string;
    title: string;
    description: string;
    event_type: string;
    location_id: string | null;
    start_date: string;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    max_capacity: number;
    current_rsvps: number;
    price: number;
    is_members_only: boolean;
    rsvp_deadline: string | null;
    location?: {
        name: string;
    };
}

interface RSVP {
    event_id: string;
    status: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    class: 'Class',
    seminar: 'Seminar',
    retreat: 'Retreat',
    gathering: 'Gathering',
    competition: 'Competition',
    other: 'Event',
};

export default function MemberEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [myRsvps, setMyRsvps] = useState<RSVP[]>([]);
    const [loading, setLoading] = useState(true);
    const [rsvpingTo, setRsvpingTo] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [userFullName, setUserFullName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');

    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }
            setUserId(user.id);
            setUserEmail(user.email || '');

            // Fetch user's profile for full name
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setUserFullName(`${profile.first_name} ${profile.last_name}`.trim());
            }

            // Fetch upcoming events
            const { data: eventsData } = await supabase
                .from('events')
                .select('*, location:locations(name)')
                .gte('start_date', today)
                .order('start_date', { ascending: true });

            // Fetch user's RSVPs
            const { data: rsvpsData } = await supabase
                .from('event_rsvps')
                .select('event_id, status')
                .eq('user_id', user.id);

            // Count RSVPs for each event
            const eventsWithCounts = await Promise.all((eventsData || []).map(async (event: Event & { id: string }) => {
                const { count } = await supabase
                    .from('event_rsvps')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id)
                    .in('status', ['confirmed', 'pending']);

                return { ...event, current_rsvps: count || 0 };
            }));

            setEvents(eventsWithCounts);
            setMyRsvps(rsvpsData || []);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleRsvp = async (eventId: string) => {
        if (!userId) return;

        setRsvpingTo(eventId);
        setError('');
        setSuccess('');

        try {
            // Check if already RSVP'd
            const existingRsvp = myRsvps.find(r => r.event_id === eventId);

            if (existingRsvp) {
                // Cancel RSVP
                const { error: deleteError } = await supabase
                    .from('event_rsvps')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('Delete RSVP error:', deleteError);
                    throw new Error('Failed to cancel RSVP: ' + deleteError.message);
                }

                // Update local state immediately
                setMyRsvps(prev => prev.filter(r => r.event_id !== eventId));
                setSuccess('RSVP cancelled');

                // Refresh data to ensure sync
                await fetchData();
            } else {
                // Create RSVP
                const event = events.find(e => e.id === eventId);
                if (!event) throw new Error('Event not found');

                const status = event.current_rsvps >= event.max_capacity ? 'waitlist' : 'confirmed';

                // If event has a price, redirect to Stripe checkout
                if (event.price > 0) {
                    const response = await fetch('/api/stripe/event-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId: event.id,
                            eventTitle: event.title,
                            price: event.price, // Already in pence
                            userEmail: userEmail,
                            userName: userFullName,
                            userPhone: '', // Phone not collected in dashboard
                            userId: userId,
                        }),
                    });

                    const data = await response.json();

                    if (data.error) {
                        throw new Error(data.error);
                    }

                    if (data.url) {
                        // Redirect to Stripe checkout
                        window.location.href = data.url;
                        return; // Don't set success or stop loading - we're redirecting
                    } else {
                        throw new Error('Unable to create checkout session');
                    }
                }

                // Free event - direct RSVP
                const { error: insertError } = await supabase
                    .from('event_rsvps')
                    .insert({
                        event_id: eventId,
                        user_id: userId,
                        full_name: userFullName || 'Unknown',
                        email: userEmail,
                        status: status,
                    });

                if (insertError) throw insertError;

                setMyRsvps(prev => [...prev, { event_id: eventId, status }]);
                setSuccess(status === 'waitlist'
                    ? "You've been added to the waitlist!"
                    : "You're confirmed for this event!");
            }

            // Refresh event data
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to process RSVP');
        } finally {
            setRsvpingTo(null);
        }
    };

    const getRsvpStatus = (eventId: string) => {
        return myRsvps.find(r => r.event_id === eventId)?.status;
    };

    const formatPrice = (price: number) => {
        if (price === 0) return 'Free';
        return `£${(price / 100).toFixed(2)}`;
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
            <div className="dashboard-header">
                <h1 className="dashboard-title">Events</h1>
                <p className="dashboard-subtitle">
                    View upcoming events and RSVP to join
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
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {events.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Calendar size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Upcoming Events</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        Check back later for retreats, seminars, and special gatherings!
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                    gap: 'var(--space-6)',
                }}>
                    {events.map((event) => {
                        const rsvpStatus = getRsvpStatus(event.id);
                        const isRsvpd = !!rsvpStatus;
                        const isFull = event.current_rsvps >= event.max_capacity;
                        const spotsLeft = event.max_capacity - event.current_rsvps;
                        const isProcessing = rsvpingTo === event.id;
                        const deadlinePassed = event.rsvp_deadline && event.rsvp_deadline < today;

                        return (
                            <div
                                key={event.id}
                                className="card"
                                style={{
                                    border: isRsvpd ? '2px solid var(--color-green)' : undefined,
                                }}
                            >
                                <div className="card-body">
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                            <span className={`badge ${event.event_type === 'retreat' ? 'badge-gold' : event.event_type === 'competition' ? 'badge-green' : 'badge-gray'}`}>
                                                {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                                            </span>
                                            {event.is_members_only && (
                                                <span className="badge badge-gold">Members Only</span>
                                            )}
                                            {isRsvpd && (
                                                <span className={`badge ${rsvpStatus === 'waitlist' ? 'badge-gray' : 'badge-green'}`}>
                                                    <CheckCircle size={12} style={{ marginRight: '4px' }} />
                                                    {rsvpStatus === 'waitlist' ? 'Waitlisted' : 'Confirmed'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title & Description */}
                                    <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-xl)' }}>
                                        {event.title}
                                    </h3>
                                    {event.description && (
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: 'var(--text-sm)',
                                            marginBottom: 'var(--space-4)',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {event.description}
                                        </p>
                                    )}

                                    {/* Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                            <Calendar size={16} />
                                            {new Date(event.start_date).toLocaleDateString('en-GB', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                            {event.end_date && event.end_date !== event.start_date && (
                                                <> - {new Date(event.end_date).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}</>
                                            )}
                                        </div>
                                        {event.start_time && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                <Clock size={16} />
                                                {event.start_time}{event.end_time && ` - ${event.end_time}`}
                                            </div>
                                        )}
                                        {event.location && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                <MapPin size={16} />
                                                {event.location.name}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                            <Users size={16} />
                                            {isFull ? (
                                                <span style={{ color: 'var(--color-red)' }}>Full (waitlist available)</span>
                                            ) : (
                                                <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price & RSVP */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 'var(--space-3)',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <CreditCard size={18} color="var(--color-gold)" />
                                            <span style={{ fontWeight: '700', color: 'var(--color-gold)' }}>
                                                {formatPrice(event.price)}
                                            </span>
                                        </div>

                                        {deadlinePassed ? (
                                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                                                RSVP closed
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleRsvp(event.id)}
                                                disabled={isProcessing}
                                                className={`btn ${isRsvpd ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                                            >
                                                {isProcessing ? (
                                                    <Loader size={16} className="animate-spin" />
                                                ) : isRsvpd ? (
                                                    'Cancel RSVP'
                                                ) : isFull ? (
                                                    'Join Waitlist'
                                                ) : (
                                                    'RSVP'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
