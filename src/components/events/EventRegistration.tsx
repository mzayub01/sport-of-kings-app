'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface EventRegistrationProps {
    event: {
        id: string;
        title: string;
        description?: string;
        start_date: string;
        start_time?: string;
        end_time?: string;
        location?: { name: string } | null;
        custom_location?: string | null;
        max_capacity: number;
        price: number; // in pence
        rsvp_deadline?: string;
    };
    user: {
        id: string;
        email: string;
        full_name?: string;
    } | null;
}

export default function EventRegistration({ event, user }: EventRegistrationProps) {
    const supabase = getSupabaseClient();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: '',
    });

    const isPastDeadline = event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date();
    const eventDate = new Date(event.start_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check capacity
            const { count } = await supabase
                .from('event_rsvps')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id);

            if (count !== null && count >= event.max_capacity) {
                throw new Error('Event is full');
            }

            // Check if already RSVP'd (by email or user_id)
            if (user) {
                const { data: existing } = await supabase
                    .from('event_rsvps')
                    .select('id')
                    .eq('event_id', event.id)
                    .eq('user_id', user.id)
                    .single();

                if (existing) throw new Error('You have already registered for this event');
            } else {
                const { data: existing } = await supabase
                    .from('event_rsvps')
                    .select('id')
                    .eq('event_id', event.id)
                    .eq('email', formData.email)
                    .single();

                if (existing) throw new Error('This email is already registered for this event');
            }

            // If event has a price, redirect to Stripe checkout
            if (event.price > 0) {
                const response = await fetch('/api/stripe/event-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: event.id,
                        eventTitle: event.title,
                        price: event.price, // Already in pence
                        userEmail: user?.email || formData.email,
                        userName: user?.full_name || formData.full_name,
                        userPhone: formData.phone,
                        userId: user?.id || null,
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

            // Free event - direct RSVP (upsert to prevent duplicates)
            const { error: insertError } = await supabase
                .from('event_rsvps')
                .upsert({
                    event_id: event.id,
                    user_id: user?.id || null,
                    full_name: user?.full_name || formData.full_name,
                    email: user?.email || formData.email,
                    phone: formData.phone || null,
                    status: 'confirmed',
                }, { onConflict: 'event_id,email' });

            if (insertError) throw insertError;

            // Send confirmation email for free event RSVP
            const emailAddress = user?.email || formData.email;
            const firstName = (user?.full_name || formData.full_name)?.split(' ')[0] || 'Guest';

            fetch('/api/email/event-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailAddress,
                    firstName,
                    eventTitle: event.title,
                    eventDate: event.start_date,
                    eventTime: event.start_time || '',
                    eventLocation: event.location?.name || event.custom_location || 'TBC',
                }),
            }).catch(err => console.error('Event confirmation email error:', err));

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="glass-card animate-slide-up" style={{ padding: 'var(--space-8)', textAlign: 'center', borderTop: '4px solid var(--color-green)' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(45, 125, 70, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                }}>
                    <CheckCircle size={32} color="var(--color-green)" />
                </div>
                <h3 style={{ marginBottom: 'var(--space-2)' }}>Registration Confirmed!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                    You are confirmed for <strong>{event.title}</strong> on {eventDate}.
                </p>
                <button
                    className="btn btn-outline"
                    onClick={() => setSuccess(false)} // Reset to show details again? Or just hide.
                >
                    Back to Event Details
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card animate-slide-up" style={{ padding: 'var(--space-6)', borderTop: '4px solid var(--color-gold)' }}>
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--color-gold)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    marginBottom: 'var(--space-2)',
                }}>
                    Upcoming Event
                </div>
                <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-2xl)' }}>{event.title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: '1.6' }}>
                    {event.description}
                </p>

                <div style={{ display: 'grid', gap: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Calendar size={18} color="var(--color-gold)" />
                        <span>{eventDate}</span>
                    </div>
                    {event.start_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <Clock size={18} color="var(--color-gold)" />
                            <span>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</span>
                        </div>
                    )}
                    {(event.location || event.custom_location) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <MapPin size={18} color="var(--color-gold)" />
                            <span>{event.location?.name || event.custom_location}</span>
                        </div>
                    )}
                    <div style={{ marginTop: 'var(--space-2)', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Price: {event.price === 0 ? 'Free' : `£${(event.price / 100).toFixed(2)}`}
                    </div>
                </div>
            </div>

            <hr style={{ borderColor: 'var(--border-light)', margin: 'var(--space-6) 0' }} />

            {isPastDeadline ? (
                <div className="alert alert-warning">
                    <AlertCircle size={18} />
                    RSVP Deadline has passed.
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Register for Event</h4>

                    {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}

                    {!user && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                        </>
                    )}

                    {user && (
                        <div style={{
                            padding: 'var(--space-3)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)'
                        }}>
                            Registering as <strong>{user.full_name || user.email}</strong>
                        </div>
                    )}

                    {/* Phone number for all registrants */}
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            placeholder="Enter your phone number"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Attendance'}
                    </button>

                    {!user && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
                            Already a member? <Link href="/login" style={{ color: 'var(--color-gold)' }}>Sign in</Link> for quicker registration.
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}
