'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Lock, AlertCircle, Flame } from 'lucide-react';
import {
    RETREAT_PRICES,
    CATEGORY_LABELS,
    formatPence,
    type AttendeeCategory,
} from '@/lib/retreat';

interface AttendeeDraft {
    key: number;
    category: AttendeeCategory;
    name: string;
    age: string;
    medical: string;
}

const CATEGORY_META: Record<AttendeeCategory, { hint: string }> = {
    adult: { hint: '16 and over' },
    child_10_15: { hint: 'Aged 10–15, sharing a room' },
    child_under_10: { hint: 'Under 10, with a parent' },
};

let nextKey = 1;
const makeAttendee = (category: AttendeeCategory): AttendeeDraft => ({
    key: nextKey++,
    category,
    name: '',
    age: '',
    medical: '',
});

export default function RegistrationForm({ remaining }: { remaining?: number | null }) {
    const [leadName, setLeadName] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [attendees, setAttendees] = useState<AttendeeDraft[]>(() => [makeAttendee('adult')]);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('payment') === 'cancelled') {
            setCancelled(true);
        }
    }, []);

    const countFor = (category: AttendeeCategory) =>
        attendees.filter(a => a.category === category).length;

    const atCapacity = typeof remaining === 'number' && attendees.length >= remaining;

    const addAttendee = (category: AttendeeCategory) => {
        if (countFor(category) >= 20 || atCapacity) return;
        setAttendees(prev => [...prev, makeAttendee(category)]);
    };

    const removeAttendee = (category: AttendeeCategory) => {
        setAttendees(prev => {
            // remove the last (preferably empty) attendee of this category
            const indices = prev
                .map((a, i) => ({ a, i }))
                .filter(({ a }) => a.category === category);
            if (indices.length === 0) return prev;
            const emptyOne = [...indices].reverse().find(({ a }) => !a.name.trim());
            const removeIdx = (emptyOne || indices[indices.length - 1]).i;
            return prev.filter((_, i) => i !== removeIdx);
        });
    };

    const updateAttendee = (key: number, patch: Partial<AttendeeDraft>) => {
        setAttendees(prev => prev.map(a => (a.key === key ? { ...a, ...patch } : a)));
    };

    const total = useMemo(
        () => attendees.reduce((sum, a) => sum + RETREAT_PRICES[a.category], 0),
        [attendees]
    );

    const breakdown = useMemo(() => {
        const parts: string[] = [];
        (Object.keys(RETREAT_PRICES) as AttendeeCategory[]).forEach(category => {
            const n = countFor(category);
            if (n > 0) parts.push(`${n} × ${CATEGORY_LABELS[category].toLowerCase()}`);
        });
        return parts.join(' + ');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendees]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (attendees.length === 0) {
            setError('Please add at least one attendee.');
            return;
        }
        if (countFor('adult') === 0) {
            setError('Every booking needs at least one adult — children must be accompanied.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/retreat/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadName,
                    leadEmail,
                    leadPhone,
                    emergencyContactName: emergencyName,
                    emergencyContactPhone: emergencyPhone,
                    attendees: attendees.map(a => ({
                        name: a.name,
                        category: a.category,
                        age: a.age ? parseInt(a.age, 10) : undefined,
                        medical: a.medical || undefined,
                    })),
                    notes,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
                setSubmitting(false);
            }
        } catch {
            setError('Something went wrong. Please check your connection and try again.');
            setSubmitting(false);
        }
    };

    return (
        <form className="rt26-form" onSubmit={handleSubmit}>
            {cancelled && (
                <div className="rt26-form-error" role="alert">
                    <strong>Payment was cancelled — your place is not yet secured.</strong>{' '}
                    Your details below may need re-entering; complete checkout to confirm your booking.
                </div>
            )}

            {/* Lead contact */}
            <div className="rt26-card">
                <h3>Your details</h3>
                <div className="rt26-grid-2">
                    <div className="rt26-field">
                        <label htmlFor="rt-lead-name">Full name *</label>
                        <input
                            id="rt-lead-name"
                            type="text"
                            required
                            autoComplete="name"
                            value={leadName}
                            onChange={e => setLeadName(e.target.value)}
                        />
                    </div>
                    <div className="rt26-field">
                        <label htmlFor="rt-lead-phone">Phone *</label>
                        <input
                            id="rt-lead-phone"
                            type="tel"
                            required
                            autoComplete="tel"
                            value={leadPhone}
                            onChange={e => setLeadPhone(e.target.value)}
                        />
                    </div>
                </div>
                <div className="rt26-field">
                    <label htmlFor="rt-lead-email">Email *</label>
                    <input
                        id="rt-lead-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={leadEmail}
                        onChange={e => setLeadEmail(e.target.value)}
                    />
                </div>
                <div className="rt26-grid-2">
                    <div className="rt26-field">
                        <label htmlFor="rt-em-name">Emergency contact (not travelling) *</label>
                        <input
                            id="rt-em-name"
                            type="text"
                            required
                            placeholder="Their full name"
                            value={emergencyName}
                            onChange={e => setEmergencyName(e.target.value)}
                        />
                    </div>
                    <div className="rt26-field">
                        <label htmlFor="rt-em-phone">Emergency contact phone *</label>
                        <input
                            id="rt-em-phone"
                            type="tel"
                            required
                            value={emergencyPhone}
                            onChange={e => setEmergencyPhone(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Party builder */}
            <div className="rt26-card">
                <h3>Who&apos;s coming?</h3>
                {(Object.keys(RETREAT_PRICES) as AttendeeCategory[]).map(category => (
                    <div className="rt26-stepper-row" key={category}>
                        <div className="rt26-stepper-label">
                            <strong>{CATEGORY_LABELS[category]} — {formatPence(RETREAT_PRICES[category])}</strong>
                            <span>{CATEGORY_META[category].hint}</span>
                        </div>
                        <div className="rt26-stepper">
                            <button
                                type="button"
                                onClick={() => removeAttendee(category)}
                                disabled={countFor(category) === 0}
                                aria-label={`Remove one ${CATEGORY_LABELS[category]}`}
                            >
                                −
                            </button>
                            <span className="rt26-stepper-count" aria-live="polite">{countFor(category)}</span>
                            <button
                                type="button"
                                onClick={() => addAttendee(category)}
                                disabled={atCapacity}
                                aria-label={`Add one ${CATEGORY_LABELS[category]}`}
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
                {atCapacity && (
                    <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--color-gold-dark)', fontSize: '0.9rem' }}>
                        Your party has reached the {remaining} remaining {remaining === 1 ? 'place' : 'places'} —
                        for larger groups, contact us first.
                    </p>
                )}

                {/* Per-attendee details */}
                {attendees.map((a) => (
                    <div className="rt26-attendee" key={a.key}>
                        <span className="rt26-attendee-tag">
                            {CATEGORY_LABELS[a.category]} {attendees.filter(x => x.category === a.category).indexOf(a) + 1}
                        </span>
                        <div className="rt26-grid-2">
                            <div className="rt26-field">
                                <label htmlFor={`rt-att-name-${a.key}`}>Full name *</label>
                                <input
                                    id={`rt-att-name-${a.key}`}
                                    type="text"
                                    required
                                    value={a.name}
                                    onChange={e => updateAttendee(a.key, { name: e.target.value })}
                                />
                            </div>
                            {a.category !== 'adult' && (
                                <div className="rt26-field">
                                    <label htmlFor={`rt-att-age-${a.key}`}>Age *</label>
                                    <input
                                        id={`rt-att-age-${a.key}`}
                                        type="number"
                                        required
                                        min={a.category === 'child_10_15' ? 10 : 1}
                                        max={a.category === 'child_10_15' ? 15 : 9}
                                        value={a.age}
                                        onChange={e => updateAttendee(a.key, { age: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="rt26-field" style={{ marginBottom: 0 }}>
                            <label htmlFor={`rt-att-medical-${a.key}`}>Medical or dietary notes (optional)</label>
                            <input
                                id={`rt-att-medical-${a.key}`}
                                type="text"
                                placeholder="Allergies, conditions, dietary needs…"
                                value={a.medical}
                                onChange={e => updateAttendee(a.key, { medical: e.target.value })}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Notes */}
            <div className="rt26-card">
                <h3>Anything else?</h3>
                <div className="rt26-field" style={{ marginBottom: 0 }}>
                    <label htmlFor="rt-notes">Notes for the organisers (optional)</label>
                    <textarea
                        id="rt-notes"
                        rows={3}
                        placeholder="Room-sharing requests, questions, anything we should know…"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="rt26-form-error" role="alert">
                    <AlertCircle size={18} style={{ verticalAlign: '-4px', marginRight: '8px' }} />
                    {error}
                </div>
            )}

            {/* Sticky total + submit */}
            <div className="rt26-total">
                <div>
                    <div className="rt26-total-amount">{formatPence(total)}</div>
                    <div className="rt26-total-breakdown">{breakdown || 'Add your party above'}</div>
                </div>
                <button
                    type="submit"
                    className="rt26-btn-gold rt26-submit"
                    disabled={submitting || attendees.length === 0}
                    style={{ width: 'auto' }}
                >
                    {submitting ? (
                        <>
                            <Loader2 size={18} className="spinner" />
                            Preparing checkout…
                        </>
                    ) : (
                        <>
                            <Flame size={18} />
                            Continue to payment
                        </>
                    )}
                </button>
            </div>
            <p className="rt26-secure-note">
                <Lock size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                Payment is taken securely by Stripe. Your place is confirmed once payment completes.
            </p>
        </form>
    );
}
