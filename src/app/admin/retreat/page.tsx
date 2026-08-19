'use client';

import { useState, useEffect } from 'react';
import { Users, PoundSterling, Clock, Download, ChevronDown, ChevronUp, Mail, Phone, Mountain } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { RETREAT, CATEGORY_LABELS, formatPence, type RetreatAttendee } from '@/lib/retreat';

interface Registration {
    id: string;
    created_at: string;
    lead_name: string;
    lead_email: string;
    lead_phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    adults: number;
    children_10_15: number;
    children_under_10: number;
    attendees: RetreatAttendee[];
    notes: string | null;
    total_amount: number;
    status: string;
}

export default function AdminRetreatPage() {
    const supabase = getSupabaseClient();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [capacity, setCapacity] = useState<number | null>(null);
    const [capacityInput, setCapacityInput] = useState('');
    const [savingCapacity, setSavingCapacity] = useState(false);
    const [capacityMessage, setCapacityMessage] = useState('');

    useEffect(() => {
        const load = async () => {
            const [{ data, error: fetchError }, { data: settings }] = await Promise.all([
                supabase
                    .from('retreat_registrations')
                    .select('*')
                    .eq('retreat_year', RETREAT.year)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('retreat_settings')
                    .select('capacity')
                    .eq('retreat_year', RETREAT.year)
                    .maybeSingle(),
            ]);

            if (fetchError) {
                console.error('Error loading retreat registrations:', fetchError);
                setError('Failed to load registrations.');
            } else {
                setRegistrations(data || []);
            }
            setCapacity(settings?.capacity ?? null);
            setCapacityInput(settings?.capacity != null ? String(settings.capacity) : '');
            setLoading(false);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveCapacity = async () => {
        setSavingCapacity(true);
        setCapacityMessage('');
        const parsed = capacityInput.trim() === '' ? null : parseInt(capacityInput, 10);
        if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
            setCapacityMessage('Enter a whole number, or leave blank for unlimited.');
            setSavingCapacity(false);
            return;
        }
        const { error: saveError } = await supabase
            .from('retreat_settings')
            .upsert({ retreat_year: RETREAT.year, capacity: parsed, updated_at: new Date().toISOString() });
        if (saveError) {
            console.error('Error saving capacity:', saveError);
            setCapacityMessage('Failed to save — try again.');
        } else {
            setCapacity(parsed);
            setCapacityMessage(parsed === null ? 'Capacity removed — unlimited places.' : `Capacity set to ${parsed} places.`);
            setTimeout(() => setCapacityMessage(''), 3000);
        }
        setSavingCapacity(false);
    };

    const paid = registrations.filter(r => r.status === 'paid');
    const pendingCount = registrations.filter(r => r.status === 'pending').length;
    const totalAttendees = paid.reduce((s, r) => s + r.adults + r.children_10_15 + r.children_under_10, 0);
    const totalRevenue = paid.reduce((s, r) => s + r.total_amount, 0);

    const partySummary = (r: Registration) => {
        const parts: string[] = [];
        if (r.adults) parts.push(`${r.adults}A`);
        if (r.children_10_15) parts.push(`${r.children_10_15}C`);
        if (r.children_under_10) parts.push(`${r.children_under_10}u10`);
        return parts.join(' + ');
    };

    const exportCsv = () => {
        const esc = (v: string | number | undefined | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows: string[] = [
            'Status,Booked,Lead Name,Lead Email,Lead Phone,Emergency Contact,Emergency Phone,Attendee,Category,Age,Medical/Dietary,Booking Total,Notes',
        ];
        registrations.forEach(r => {
            (r.attendees || []).forEach(a => {
                rows.push([
                    r.status,
                    new Date(r.created_at).toLocaleDateString('en-GB'),
                    esc(r.lead_name),
                    esc(r.lead_email),
                    esc(r.lead_phone),
                    esc(r.emergency_contact_name),
                    esc(r.emergency_contact_phone),
                    esc(a.name),
                    esc(CATEGORY_LABELS[a.category] || a.category),
                    a.age ?? '',
                    esc(a.medical),
                    (r.total_amount / 100).toFixed(2),
                    esc(r.notes),
                ].join(','));
            });
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `retreat_${RETREAT.year}_registrations.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="skeleton" style={{ height: '90px' }} />
                <div className="skeleton" style={{ height: '320px' }} />
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                    <h1 className="dashboard-title">Retreat 2026</h1>
                    <p className="dashboard-subtitle">{RETREAT.location} · {RETREAT.dates}</p>
                </div>
                <button className="btn btn-secondary" onClick={exportCsv} disabled={registrations.length === 0}>
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Confirmed attendees</p>
                            <p className="stat-value">
                                {totalAttendees}
                                {capacity !== null && (
                                    <span style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}> / {capacity}</span>
                                )}
                            </p>
                        </div>
                        <Users size={32} color="var(--color-gold)" />
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Paid bookings</p>
                            <p className="stat-value">{paid.length}</p>
                        </div>
                        <Mountain size={32} color="var(--color-green)" />
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Revenue</p>
                            <p className="stat-value">{formatPence(totalRevenue)}</p>
                        </div>
                        <PoundSterling size={32} color="var(--color-gold)" />
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Pending (unpaid)</p>
                            <p className="stat-value">{pendingCount}</p>
                        </div>
                        <Clock size={32} color="var(--text-tertiary)" />
                    </div>
                </div>
            </div>

            {/* Capacity */}
            <div className="glass-card" style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
                padding: 'var(--space-5)',
                marginBottom: 'var(--space-6)',
            }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="retreat-capacity">
                        Capacity (total places)
                    </label>
                    <input
                        id="retreat-capacity"
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="Unlimited"
                        value={capacityInput}
                        onChange={e => setCapacityInput(e.target.value)}
                        style={{ maxWidth: '180px' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={saveCapacity} disabled={savingCapacity}>
                    {savingCapacity ? 'Saving…' : 'Save capacity'}
                </button>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', flexBasis: '100%' }}>
                    {capacityMessage || (capacity === null
                        ? 'No capacity set — registrations are unlimited. Leave blank for unlimited.'
                        : `The public page blocks registrations beyond ${capacity} people and shows "places left" when 12 or fewer remain. Pending checkouts hold their places for 30 minutes.`)}
                </p>
            </div>

            {/* Registrations */}
            {registrations.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Mountain size={44} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No registrations yet</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Bookings will appear here as soon as people register on the Retreat 2026 page.
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body" style={{ padding: 0 }}>
                        {registrations.map((r, i) => (
                            <div key={r.id} style={{ borderBottom: i < registrations.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                <button
                                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 'var(--space-3)',
                                        flexWrap: 'wrap',
                                        padding: 'var(--space-4)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        font: 'inherit',
                                        color: 'inherit',
                                    }}
                                    aria-expanded={expanded === r.id}
                                >
                                    <div style={{ minWidth: '200px' }}>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{r.lead_name}</p>
                                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                            {partySummary(r)} · booked {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <span style={{ fontWeight: 700 }}>{formatPence(r.total_amount)}</span>
                                        <span className={`badge ${r.status === 'paid' ? 'badge-green' : r.status === 'pending' ? 'badge-gold' : 'badge-gray'}`}>
                                            {r.status}
                                        </span>
                                        {expanded === r.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </button>

                                {expanded === r.id && (
                                    <div style={{ padding: '0 var(--space-4) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                                        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>
                                            <a href={`mailto:${r.lead_email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold-dark)' }}>
                                                <Mail size={14} /> {r.lead_email}
                                            </a>
                                            <a href={`tel:${r.lead_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold-dark)' }}>
                                                <Phone size={14} /> {r.lead_phone}
                                            </a>
                                            <span>Emergency: {r.emergency_contact_name} ({r.emergency_contact_phone})</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-2)' }}>
                                            {(r.attendees || []).map((a, idx) => (
                                                <div key={idx} style={{
                                                    padding: 'var(--space-3)',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: 'var(--radius-md)',
                                                }}>
                                                    <p style={{ fontWeight: 600, margin: 0 }}>
                                                        {a.name}
                                                        <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>
                                                            {' '}· {CATEGORY_LABELS[a.category] || a.category}{a.age ? `, ${a.age}` : ''}
                                                        </span>
                                                    </p>
                                                    {a.medical && (
                                                        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-red)' }}>
                                                            ⚕ {a.medical}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {r.notes && (
                                            <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--text-secondary)' }}>
                                                <strong>Notes:</strong> {r.notes}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
