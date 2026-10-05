'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Upload, Loader2, AlertCircle, ShieldCheck, Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import { RETREAT, PASSPORT_PURGE_LABEL } from '@/lib/retreat';

interface Attendee {
    index: number;
    name: string;
    category: string;
    received: boolean;
}

interface Booking {
    registrationId: string;
    leadName: string;
    attendees: Attendee[];
}

type SlotState = { status: 'idle' | 'working' | 'done' | 'error'; message?: string };

// Request bodies over 4.5 MB are rejected by the host, so photos are shrunk
// in the browser first (this also makes uploads quick on mobile data).
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

async function prepareFile(file: File): Promise<File> {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
        if (file.size > MAX_UPLOAD_BYTES) {
            throw new Error('That PDF is too large. Please upload a photo of the passport page instead.');
        }
        return file;
    }

    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
        const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('no canvas');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        for (const quality of [0.85, 0.7, 0.55]) {
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (blob && blob.size <= MAX_UPLOAD_BYTES) {
                return new File([blob], 'passport.jpg', { type: 'image/jpeg' });
            }
        }
        throw new Error('still too large');
    } catch {
        if (file.size <= MAX_UPLOAD_BYTES && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return file;
        }
        throw new Error('We couldn’t read that image. Please try taking a new photo of the passport page.');
    }
}

export default function RetreatPassportsPage() {
    const [step, setStep] = useState<'lookup' | 'booking' | 'unmatched' | 'unmatched-done'>('lookup');
    const [email, setEmail] = useState('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [slots, setSlots] = useState<Record<string, SlotState>>({});
    const [looking, setLooking] = useState(false);
    const [error, setError] = useState('');

    const [unmatchedName, setUnmatchedName] = useState('');
    const [unmatchedContact, setUnmatchedContact] = useState('');
    const [unmatchedFile, setUnmatchedFile] = useState<File | null>(null);
    const [unmatchedBusy, setUnmatchedBusy] = useState(false);

    const slotKey = (registrationId: string, index: number) => `${registrationId}:${index}`;

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLooking(true);
        try {
            const response = await fetch('/api/retreat/passports/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Something went wrong. Please try again.');
                return;
            }
            setBookings(data.bookings);
            setSlots({});
            setStep('booking');
        } catch {
            setError('Something went wrong. Please check your connection and try again.');
        } finally {
            setLooking(false);
        }
    };

    const handleFile = async (booking: Booking, attendee: Attendee, file: File | undefined) => {
        if (!file) return;
        const key = slotKey(booking.registrationId, attendee.index);
        setSlots(prev => ({ ...prev, [key]: { status: 'working' } }));
        try {
            const prepared = await prepareFile(file);
            const form = new FormData();
            form.append('mode', 'booking');
            form.append('email', email);
            form.append('registrationId', booking.registrationId);
            form.append('attendeeIndex', String(attendee.index));
            form.append('file', prepared);

            const response = await fetch('/api/retreat/passports/upload', { method: 'POST', body: form });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Upload failed. Please try again.');

            setSlots(prev => ({ ...prev, [key]: { status: 'done' } }));
            setBookings(prev => prev.map(b => b.registrationId !== booking.registrationId ? b : {
                ...b,
                attendees: b.attendees.map(a => a.index === attendee.index ? { ...a, received: true } : a),
            }));
        } catch (err) {
            setSlots(prev => ({ ...prev, [key]: { status: 'error', message: err instanceof Error ? err.message : 'Upload failed. Please try again.' } }));
        }
    };

    const handleUnmatched = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unmatchedFile) {
            setError('Please choose a photo or PDF of the passport.');
            return;
        }
        setError('');
        setUnmatchedBusy(true);
        try {
            const prepared = await prepareFile(unmatchedFile);
            const form = new FormData();
            form.append('mode', 'unmatched');
            form.append('name', unmatchedName);
            form.append('contact', unmatchedContact);
            form.append('file', prepared);

            const response = await fetch('/api/retreat/passports/upload', { method: 'POST', body: form });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Upload failed. Please try again.');
            setStep('unmatched-done');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        } finally {
            setUnmatchedBusy(false);
        }
    };

    const allAttendees = bookings.flatMap(b => b.attendees);
    const receivedCount = allAttendees.filter(a => a.received).length;
    const allDone = allAttendees.length > 0 && receivedCount === allAttendees.length;

    return (
        <div style={{
            minHeight: '100vh',
            padding: 'var(--space-6) var(--space-4) var(--space-12)',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        }}>
            <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <Link href="/retreat-2026">
                        <Image src="/logo-full.png" alt="Sport of Kings" width={140} height={70} priority style={{ height: '64px', width: 'auto', margin: '0 auto' }} />
                    </Link>
                    <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--color-gold-dark)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 'var(--text-xs)' }}>
                        {RETREAT.name}
                    </p>
                    <h1 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-1) 0 var(--space-2)' }}>Passport copies for the hotel</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        The hotel needs a copy of every guest&apos;s passport before we arrive, so check-in is quick for the whole group.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* ---------- Step 1: find the booking ---------- */}
                {step === 'lookup' && (
                    <form onSubmit={handleLookup} className="card">
                        <div className="card-body">
                            <h2 style={{ fontSize: 'var(--text-lg)', margin: '0 0 var(--space-1)' }}>Find your booking</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)' }}>
                                Enter the email address used when the retreat was booked.
                            </p>
                            <div className="form-group">
                                <label className="form-label" htmlFor="pp-email">Email address</label>
                                <input id="pp-email" type="email" className="form-input" required autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={looking} style={{ width: '100%' }}>
                                {looking ? <Loader2 size={18} className="spinner" /> : null}
                                {looking ? 'Finding your booking…' : 'Continue'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setError(''); setStep('unmatched'); }}
                                style={{ display: 'block', margin: 'var(--space-4) auto 0', background: 'none', border: 'none', color: 'var(--color-gold-dark)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--text-sm)', textDecoration: 'underline' }}
                            >
                                I can&apos;t find my booking
                            </button>
                        </div>
                    </form>
                )}

                {/* ---------- Step 2: one upload slot per guest ---------- */}
                {step === 'booking' && (
                    <>
                        <div className="card" style={{ marginBottom: 'var(--space-4)', border: allDone ? '2px solid var(--color-green)' : undefined }}>
                            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                {allDone ? <CheckCircle size={28} color="var(--color-green)" /> : <Camera size={28} color="var(--color-gold-dark)" />}
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700 }}>
                                        {allDone ? 'All passports received — JazakAllah khair!' : `${receivedCount} of ${allAttendees.length} received`}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        {allDone
                                            ? 'Nothing more to do. You can close this page.'
                                            : 'Photograph the photo page of each passport — all four corners visible, no glare.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {bookings.map(booking => (
                            <div key={booking.registrationId} className="card" style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="card-body" style={{ padding: 0 }}>
                                    {booking.attendees.map((attendee, i) => {
                                        const key = slotKey(booking.registrationId, attendee.index);
                                        const slot = slots[key] || { status: 'idle' };
                                        const inputId = `pp-file-${key}`;
                                        return (
                                            <div key={key} style={{ padding: 'var(--space-4)', borderBottom: i < booking.attendees.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ margin: 0, fontWeight: 600 }}>{attendee.name}</p>
                                                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: attendee.received ? 'var(--color-green)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {attendee.received ? <><CheckCircle size={14} /> Received</> : `${attendee.category} · passport needed`}
                                                        </p>
                                                    </div>
                                                    <input
                                                        id={inputId}
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        hidden
                                                        onChange={e => { handleFile(booking, attendee, e.target.files?.[0]); e.target.value = ''; }}
                                                    />
                                                    <label
                                                        htmlFor={inputId}
                                                        className={`btn ${attendee.received ? 'btn-ghost' : 'btn-primary'}`}
                                                        style={{ cursor: slot.status === 'working' ? 'wait' : 'pointer', pointerEvents: slot.status === 'working' ? 'none' : undefined, minHeight: '44px' }}
                                                    >
                                                        {slot.status === 'working'
                                                            ? <><Loader2 size={18} className="spinner" /> Uploading…</>
                                                            : attendee.received
                                                                ? <><RefreshCw size={16} /> Replace</>
                                                                : <><Upload size={18} /> Add passport</>}
                                                    </label>
                                                </div>
                                                {slot.status === 'error' && (
                                                    <p role="alert" style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-red)', fontSize: 'var(--text-sm)' }}>{slot.message}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => { setStep('lookup'); setBookings([]); setError(''); }}
                            className="btn btn-ghost"
                            style={{ margin: '0 auto', display: 'flex' }}
                        >
                            <ArrowLeft size={16} /> Use a different email address
                        </button>
                    </>
                )}

                {/* ---------- Fallback: no booking found ---------- */}
                {step === 'unmatched' && (
                    <form onSubmit={handleUnmatched} className="card">
                        <div className="card-body">
                            <h2 style={{ fontSize: 'var(--text-lg)', margin: '0 0 var(--space-1)' }}>Upload without a booking lookup</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)' }}>
                                No problem — tell us whose passport this is and the organisers will match it to the right booking. Submit once per guest.
                            </p>
                            <div className="form-group">
                                <label className="form-label" htmlFor="pp-un-name">Full name (as shown on the passport)</label>
                                <input id="pp-un-name" type="text" className="form-input" required minLength={3} maxLength={80} value={unmatchedName} onChange={e => setUnmatchedName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="pp-un-contact">Your phone or email (so we can check with you if needed)</label>
                                <input id="pp-un-contact" type="text" className="form-input" maxLength={120} value={unmatchedContact} onChange={e => setUnmatchedContact(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="pp-un-file">Passport photo page</label>
                                <input id="pp-un-file" type="file" className="form-input" accept="image/*,application/pdf" required onChange={e => setUnmatchedFile(e.target.files?.[0] || null)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={unmatchedBusy} style={{ width: '100%' }}>
                                {unmatchedBusy ? <Loader2 size={18} className="spinner" /> : <Upload size={18} />}
                                {unmatchedBusy ? 'Uploading…' : 'Submit passport'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setError(''); setStep('lookup'); }}
                                className="btn btn-ghost"
                                style={{ margin: 'var(--space-3) auto 0', display: 'flex' }}
                            >
                                <ArrowLeft size={16} /> Back to booking lookup
                            </button>
                        </div>
                    </form>
                )}

                {step === 'unmatched-done' && (
                    <div className="card" style={{ border: '2px solid var(--color-green)' }}>
                        <div className="card-body" style={{ textAlign: 'center' }}>
                            <CheckCircle size={40} color="var(--color-green)" style={{ margin: '0 auto var(--space-3)' }} />
                            <h2 style={{ fontSize: 'var(--text-lg)', margin: '0 0 var(--space-2)' }}>Received — JazakAllah khair!</h2>
                            <p style={{ color: 'var(--text-secondary)', margin: '0 0 var(--space-4)' }}>
                                {unmatchedName}&apos;s passport has been submitted. The organisers will match it to your booking.
                            </p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => { setUnmatchedName(''); setUnmatchedFile(null); setStep('unmatched'); }}
                            >
                                <Upload size={18} /> Add another guest
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------- Privacy notice ---------- */}
                <details style={{ marginTop: 'var(--space-6)', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <ShieldCheck size={18} color="var(--color-green)" />
                        How your passport copy is protected
                    </summary>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7, marginTop: 'var(--space-3)' }}>
                        <p style={{ margin: '0 0 var(--space-2)' }}>
                            <strong>Why we need it:</strong> the hotel must register each guest&apos;s passport. Sending copies ahead avoids a long queue at reception.
                        </p>
                        <p style={{ margin: '0 0 var(--space-2)' }}>
                            <strong>Who sees it:</strong> only the Sport of Kings retreat organisers and the hotel&apos;s reception team, through a passcode-protected link that expires. The hotel is in Morocco, so your copy will be viewed outside the UK. It is not shown to other guests, and once uploaded it cannot be viewed from this page.
                        </p>
                        <p style={{ margin: '0 0 var(--space-2)' }}>
                            <strong>How long we keep it:</strong> every passport copy is permanently deleted from our systems by {PASSPORT_PURGE_LABEL}.
                        </p>
                        <p style={{ margin: 0 }}>
                            <strong>Questions:</strong> <a href="mailto:sportofkings786@gmail.com" style={{ color: 'var(--color-gold-dark)' }}>sportofkings786@gmail.com</a>
                        </p>
                    </div>
                </details>
            </div>
        </div>
    );
}
