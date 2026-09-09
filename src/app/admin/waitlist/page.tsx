'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, Clock, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Mail, Phone, RefreshCw, Loader2, Send, Hourglass } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Profile {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    postcode?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    medical_info?: string;
    is_child?: boolean;
}

interface WaitlistEntry {
    id: string;
    user_id: string;
    location_id: string;
    membership_type_id: string | null;
    position: number;
    status: 'waiting' | 'offered';
    offered_at: string | null;
    offer_expires_at: string | null;
    reminder_sent_at: string | null;
    joined_at: string | null;
    created_at: string;
    times_expired: number;
    profile?: Profile;
}

interface Location { id: string; name: string }
interface MembershipType { id: string; name: string; location_id: string; price: number }
interface CapacityConfig { location_id: string; membership_type_id: string; capacity: number | null; is_available: boolean | null }

interface Group {
    locationId: string;
    locationName: string;
    typeId: string | null;
    typeName: string;
    freePlaces: number | null; // null = unlimited
    entries: WaitlistEntry[];
}

const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtExpiry = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function AdminWaitlistPage() {
    const supabase = getSupabaseClient();
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [types, setTypes] = useState<MembershipType[]>([]);
    const [configs, setConfigs] = useState<CapacityConfig[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [sweeping, setSweeping] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        (async () => {
            await runSweep(true);
            await fetchData();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const runSweep = async (silent = false) => {
        setSweeping(true);
        try {
            const res = await fetch('/api/admin/waitlist/sweep', { method: 'POST' });
            const data = await res.json();
            if (!silent) {
                if (data.success) {
                    setSuccess(data.expired || data.reminded
                        ? `Expiry check done — ${data.expired} offer${data.expired === 1 ? '' : 's'} expired, ${data.reminded} reminder${data.reminded === 1 ? '' : 's'} sent.`
                        : 'Expiry check done — nothing to do.');
                } else {
                    setError(data.error || 'Expiry check failed');
                }
            }
        } catch {
            if (!silent) setError('Expiry check failed');
        } finally {
            setSweeping(false);
        }
    };

    const fetchData = async () => {
        try {
            const [wl, locs, mt, profs, cfg, mem] = await Promise.all([
                supabase.from('waitlist').select('*').order('position'),
                supabase.from('locations').select('id, name').order('name'),
                supabase.from('membership_types').select('id, name, location_id, price'),
                supabase.from('profiles').select('user_id, first_name, last_name, email, phone, date_of_birth, address, city, postcode, emergency_contact_name, emergency_contact_phone, medical_info, is_child'),
                supabase.from('location_membership_configs').select('location_id, membership_type_id, capacity, is_available'),
                supabase.from('memberships').select('location_id, membership_type_id').in('status', ['active', 'pending']),
            ]);
            const profileMap = new Map((profs.data || []).map((p: Profile) => [p.user_id, p]));
            setWaitlist((wl.data || []).map((e: WaitlistEntry) => ({ ...e, profile: profileMap.get(e.user_id) })));
            setLocations(locs.data || []);
            setTypes(mt.data || []);
            setConfigs(cfg.data || []);
            const c: Record<string, number> = {};
            (mem.data || []).forEach((m: { location_id: string; membership_type_id: string }) => {
                const k = `${m.location_id}_${m.membership_type_id}`;
                c[k] = (c[k] || 0) + 1;
            });
            setCounts(c);
        } catch (err) {
            console.error('Error loading waitlist:', err);
            setError('Failed to load waitlist');
        } finally {
            setLoading(false);
        }
    };

    const freePlaces = (locationId: string, typeId: string | null): number | null => {
        if (!typeId) return null;
        const cfg = configs.find(c => c.location_id === locationId && c.membership_type_id === typeId);
        if (!cfg || cfg.capacity === null) return null;
        if (cfg.is_available === false) return 0;
        return Math.max(0, cfg.capacity - (counts[`${locationId}_${typeId}`] || 0));
    };

    const offerPlace = async (entry: WaitlistEntry) => {
        const name = `${entry.profile?.first_name || ''} ${entry.profile?.last_name || ''}`.trim() || 'this person';
        const free = freePlaces(entry.location_id, entry.membership_type_id);
        const rank = groups.find(g => g.entries.some(e => e.id === entry.id))?.entries.findIndex(e => e.id === entry.id);
        const skipNote = rank && rank > 0 ? `\n\n⚠️ They are #${rank + 1} — this skips ${rank} ${rank === 1 ? 'person' : 'people'} ahead of them.` : '';
        if (!confirm(`Offer a place to ${name}?\n\nA place will be held for them and they'll get 72 hours to pay. If they don't, it's released and they move to the back of the queue.${free === 0 ? '\n\n⚠️ This type currently shows no free places — the offer will be refused unless capacity has been raised.' : ''}${skipNote}`)) return;

        setProcessingId(entry.id);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/admin/waitlist/offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ waitlistId: entry.id }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(data.mode === 'activated'
                    ? `${name} has been activated (free / offline-payment membership) and emailed.`
                    : `Place offered to ${name} — email sent${data.recipient ? ` to ${data.recipient}` : ''}, expires ${fmtExpiry(data.expiresAt)}.`);
            } else {
                setError(data.error || 'Failed to offer place');
            }
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to offer place');
        } finally {
            setProcessingId(null);
        }
    };

    const removeEntry = async (entry: WaitlistEntry) => {
        const name = `${entry.profile?.first_name || ''} ${entry.profile?.last_name || ''}`.trim() || 'this person';
        if (!confirm(`Remove ${name} from the waitlist?${entry.status === 'offered' ? ' Their held place will be released.' : ''}`)) return;
        setProcessingId(entry.id);
        setError('');
        try {
            const { error: delError } = await supabase.from('waitlist').delete().eq('id', entry.id);
            if (delError) throw delError;
            setSuccess(`${name} removed from the waitlist.`);
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to remove');
        } finally {
            setProcessingId(null);
        }
    };

    // Group by location → membership type, ordered by queue position
    const groups: Group[] = (() => {
        const map = new Map<string, Group>();
        waitlist
            .filter(e => selectedLocation === 'all' || e.location_id === selectedLocation)
            .forEach(e => {
                const key = `${e.location_id}_${e.membership_type_id || 'none'}`;
                if (!map.has(key)) {
                    map.set(key, {
                        locationId: e.location_id,
                        locationName: locations.find(l => l.id === e.location_id)?.name || 'Unknown location',
                        typeId: e.membership_type_id,
                        typeName: types.find(t => t.id === e.membership_type_id)?.name || 'No membership type',
                        freePlaces: freePlaces(e.location_id, e.membership_type_id),
                        entries: [],
                    });
                }
                map.get(key)!.entries.push(e);
            });
        return [...map.values()]
            .map(g => ({ ...g, entries: g.entries.sort((a, b) => a.position - b.position) }))
            .sort((a, b) => a.locationName.localeCompare(b.locationName) || a.typeName.localeCompare(b.typeName));
    })();

    const offeredCount = waitlist.filter(e => e.status === 'offered').length;

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
                    <h1 className="dashboard-title">Waitlist</h1>
                    <p className="dashboard-subtitle">
                        {waitlist.length} waiting · {offeredCount} with an open offer · queue order is by join date
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => runSweep(false)} disabled={sweeping}>
                    <RefreshCw size={18} className={sweeping ? 'animate-spin' : undefined} />
                    {sweeping ? 'Checking…' : 'Run expiry check'}
                </button>
            </div>

            {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}><AlertCircle size={18} />{error}</div>}
            {success && <div className="alert alert-success" role="status" style={{ marginBottom: 'var(--space-4)' }}><CheckCircle size={18} />{success}</div>}

            {/* Location filter */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                <button className={`btn btn-sm ${selectedLocation === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedLocation('all')}>
                    All locations ({waitlist.length})
                </button>
                {locations.map(loc => {
                    const n = waitlist.filter(w => w.location_id === loc.id).length;
                    if (n === 0) return null;
                    return (
                        <button key={loc.id} className={`btn btn-sm ${selectedLocation === loc.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedLocation(loc.id)}>
                            <MapPin size={14} />{loc.name} ({n})
                        </button>
                    );
                })}
            </div>

            {groups.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Users size={44} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>Nobody waiting</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All membership types have space, or the waitlist is empty.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {groups.map(group => (
                        <div key={`${group.locationId}_${group.typeId}`} className="card">
                            {/* Group header: where, which type, how many free places */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{group.typeName}</p>
                                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={12} />{group.locationName} · {group.entries.length} in queue
                                    </p>
                                </div>
                                <span className={`badge ${group.freePlaces === null ? 'badge-gray' : group.freePlaces > 0 ? 'badge-green' : 'badge-gold'}`}>
                                    {group.freePlaces === null ? 'Unlimited capacity' : group.freePlaces > 0 ? `${group.freePlaces} free place${group.freePlaces === 1 ? '' : 's'}` : 'Full — no free places'}
                                </span>
                            </div>

                            <div className="card-body" style={{ padding: 0 }}>
                                {group.entries.map((entry, idx) => {
                                    const name = `${entry.profile?.first_name || ''} ${entry.profile?.last_name || ''}`.trim() || 'Unknown';
                                    const offered = entry.status === 'offered';
                                    const isOpen = expandedId === entry.id;
                                    return (
                                        <div key={entry.id} style={{ borderBottom: idx < group.entries.length - 1 ? '1px solid var(--border-light)' : 'none', background: offered ? 'rgba(197, 164, 86, 0.06)' : undefined }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
                                                {/* Queue position */}
                                                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: offered ? 'var(--color-gold-gradient)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, color: offered ? 'var(--color-black)' : 'var(--text-primary)' }}>
                                                    #{idx + 1}
                                                </div>

                                                <div style={{ flex: 1, minWidth: '220px' }}>
                                                    <p style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                                        {name}
                                                        {entry.profile?.is_child && <span className="badge badge-gold">Child</span>}
                                                        {entry.times_expired > 0 && (
                                                            <span className="badge badge-gray" title="Previous offers that lapsed">Expired ×{entry.times_expired}</span>
                                                        )}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                        Joined {fmtDate(entry.joined_at || entry.created_at)}
                                                        {offered && entry.offer_expires_at && (
                                                            <span style={{ color: 'var(--color-gold-dark)', fontWeight: 600 }}>
                                                                {' '}· <Hourglass size={12} style={{ verticalAlign: '-2px' }} /> Offered — pay by {fmtExpiry(entry.offer_expires_at)}
                                                                {entry.reminder_sent_at ? ' · reminder sent' : ''}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                                    {offered ? (
                                                        <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={12} /> Awaiting payment
                                                        </span>
                                                    ) : (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => offerPlace(entry)}
                                                            disabled={processingId === entry.id}
                                                            title={group.freePlaces === 0 ? 'No free place — the offer will be refused until capacity is raised or someone leaves' : 'Hold a place and email them a 72-hour link to pay'}
                                                            style={group.freePlaces === 0 ? { opacity: 0.55 } : undefined}
                                                        >
                                                            {processingId === entry.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                            Offer place
                                                        </button>
                                                    )}
                                                    <button className="btn btn-ghost btn-sm" onClick={() => removeEntry(entry)} disabled={processingId === entry.id} style={{ color: 'var(--color-red)' }} title="Remove from waitlist">
                                                        <XCircle size={16} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(isOpen ? null : entry.id)} aria-expanded={isOpen} aria-label="Details">
                                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {isOpen && entry.profile && (
                                                <div style={{ padding: '0 var(--space-4) var(--space-4) calc(40px + var(--space-4) + var(--space-3))', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-2) var(--space-4)' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /><a href={`mailto:${entry.profile.email}`} style={{ color: 'var(--color-gold-dark)' }}>{entry.profile.email}</a></span>
                                                    {entry.profile.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /><a href={`tel:${entry.profile.phone}`} style={{ color: 'var(--color-gold-dark)' }}>{entry.profile.phone}</a></span>}
                                                    {entry.profile.date_of_birth && <span>DOB: {fmtDate(entry.profile.date_of_birth)}</span>}
                                                    {(entry.profile.address || entry.profile.city) && <span>{[entry.profile.address, entry.profile.city, entry.profile.postcode].filter(Boolean).join(', ')}</span>}
                                                    {entry.profile.emergency_contact_name && <span>Emergency: {entry.profile.emergency_contact_name} {entry.profile.emergency_contact_phone && `(${entry.profile.emergency_contact_phone})`}</span>}
                                                    {entry.profile.medical_info && <span style={{ color: 'var(--color-red)' }}>⚕ {entry.profile.medical_info}</span>}
                                                    {offered && entry.offered_at && <span>Offered {fmtExpiry(entry.offered_at)}</span>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
