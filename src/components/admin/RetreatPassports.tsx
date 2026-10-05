'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, Trash2, Copy, Link2, Loader2, AlertCircle, ShieldCheck, KeyRound, Ban, FileWarning } from 'lucide-react';
import { PASSPORT_UPLOAD_PATH, PASSPORT_PURGE_LABEL, HOTEL_ACCESS_DEFAULT_EXPIRY } from '@/lib/retreat';

interface Attendee { index: number; name: string; category: string }
interface Registration { id: string; leadName: string; attendees: Attendee[] }
interface Passport {
    id: string;
    registrationId: string | null;
    attendeeIndex: number | null;
    name: string;
    note: string | null;
    mime: string;
    sizeBytes: number | null;
    uploadedAt: string;
}
interface HotelLink {
    id: string;
    label: string;
    expiresAt: string;
    revokedAt: string | null;
    createdByName: string | null;
    createdAt: string;
    opens: number;
    views: number;
    downloads: number;
    failedPasscodes: number;
    lastActivity: string | null;
}
interface LogEntry { id: string; link: string; action: string; passportName: string | null; ip: string | null; at: string }
interface PanelData {
    purgeAfter: string;
    closed: boolean;
    purgedNow: number;
    registrations: Registration[];
    passports: Passport[];
    hotelLinks: HotelLink[];
    log: LogEntry[];
}

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const ACTION_LABELS: Record<string, string> = {
    open: 'Opened the guest list',
    view: 'Viewed',
    download_all: 'Downloaded all (ZIP)',
    failed_passcode: 'Wrong passcode entered',
};

export default function RetreatPassports() {
    const [data, setData] = useState<PanelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [setupMessage, setSetupMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [assignTarget, setAssignTarget] = useState<Record<string, string>>({});

    const [linkLabel, setLinkLabel] = useState('Hotel reception');
    const [linkExpiry, setLinkExpiry] = useState(HOTEL_ACCESS_DEFAULT_EXPIRY);
    const [creatingLink, setCreatingLink] = useState(false);
    const [newLink, setNewLink] = useState<{ url: string; passcode: string; label: string } | null>(null);

    const load = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/retreat/passports');
            const json = await response.json();
            if (!response.ok) {
                if (json.setupRequired) setSetupMessage(json.error);
                else setError(json.error || 'Failed to load passports');
                return;
            }
            setSetupMessage('');
            setData(json);
            if (json.purgedNow > 0) {
                setSuccess(`Retention date passed — ${json.purgedNow} passport file${json.purgedNow === 1 ? '' : 's'} permanently deleted.`);
            }
        } catch {
            setError('Failed to load passports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const post = async (body: Record<string, unknown>) => {
        const response = await fetch('/api/admin/retreat/passports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error || 'Request failed');
        return json;
    };

    const copy = async (text: string, what: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setSuccess(`${what} copied.`);
            setError('');
        } catch {
            setError('Could not copy — select the text and copy it manually.');
        }
    };

    const viewPassport = async (passport: Passport) => {
        setError('');
        const tab = window.open('', '_blank'); // opened inside the click so it isn't blocked
        setBusyId(passport.id);
        try {
            const { url } = await post({ action: 'view', passportId: passport.id });
            if (tab) {
                tab.opener = null;
                tab.location.replace(url);
            } else {
                window.location.assign(url);
            }
        } catch (err) {
            tab?.close();
            setError(err instanceof Error ? err.message : 'Could not open that file');
        } finally {
            setBusyId(null);
        }
    };

    const deletePassport = async (passport: Passport) => {
        if (!confirm(`Permanently delete the passport on file for ${passport.name}? They can upload it again from the shared link.`)) return;
        setBusyId(passport.id);
        setError('');
        try {
            await post({ action: 'delete', passportId: passport.id });
            setSuccess(`Passport for ${passport.name} deleted.`);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setBusyId(null);
        }
    };

    const assignPassport = async (passport: Passport) => {
        const target = assignTarget[passport.id];
        if (!target) {
            setError('Choose which guest this passport belongs to first.');
            return;
        }
        const [registrationId, attendeeIndex] = target.split(':');
        setBusyId(passport.id);
        setError('');
        try {
            await post({ action: 'assign', passportId: passport.id, registrationId, attendeeIndex: Number(attendeeIndex) });
            setSuccess('Passport matched to the booking.');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not assign');
        } finally {
            setBusyId(null);
        }
    };

    const createHotelLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingLink(true);
        setError('');
        setSuccess('');
        try {
            const result = await post({ action: 'create_hotel_link', label: linkLabel, expiresOn: linkExpiry });
            setNewLink({
                url: `${window.location.origin}/retreat-2026/hotel/${result.token}`,
                passcode: result.passcode,
                label: result.label,
            });
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create the link');
        } finally {
            setCreatingLink(false);
        }
    };

    const revokeLink = async (link: HotelLink) => {
        if (!confirm(`Withdraw access for “${link.label}”? The link stops working immediately.`)) return;
        setBusyId(link.id);
        try {
            await post({ action: 'revoke_hotel_link', accessId: link.id });
            setSuccess(`Access for “${link.label}” withdrawn.`);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not revoke');
        } finally {
            setBusyId(null);
        }
    };

    const purgeAll = async () => {
        const typed = prompt('This permanently deletes EVERY passport file and withdraws all hotel access. It cannot be undone.\n\nType DELETE to confirm.');
        if (typed !== 'DELETE') return;
        setError('');
        try {
            const result = await post({ action: 'purge', confirm: 'DELETE' });
            setNewLink(null);
            setSuccess(`${result.removed} passport file${result.removed === 1 ? '' : 's'} permanently deleted.`);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Purge failed');
        }
    };

    if (loading) {
        return <div className="skeleton" style={{ height: '160px', marginBottom: 'var(--space-6)' }} />;
    }

    if (setupMessage) {
        return (
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                <FileWarning size={18} />
                <div><strong>Passports:</strong> {setupMessage}</div>
            </div>
        );
    }

    if (!data) {
        return error ? <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-6)' }}><AlertCircle size={18} />{error}</div> : null;
    }

    const bySlot = new Map(data.passports.filter(p => p.registrationId).map(p => [`${p.registrationId}:${p.attendeeIndex}`, p]));
    const unmatched = data.passports.filter(p => !p.registrationId);
    const totalGuests = data.registrations.reduce((sum, r) => sum + r.attendees.length, 0);
    const receivedCount = bySlot.size;
    const outstanding = data.registrations.flatMap(r =>
        r.attendees.filter(a => !bySlot.has(`${r.id}:${a.index}`)).map(a => ({ registration: r, attendee: a })));
    const percent = totalGuests > 0 ? Math.round((receivedCount / totalGuests) * 100) : 0;
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${PASSPORT_UPLOAD_PATH}` : PASSPORT_UPLOAD_PATH;

    const outstandingText = [
        `Passports still needed for the hotel (${outstanding.length}):`,
        ...outstanding.map(o => `• ${o.attendee.name}`),
        '',
        `Upload here: ${shareUrl}`,
    ].join('\n');

    const linkStatus = (link: HotelLink) =>
        link.revokedAt ? { text: 'Withdrawn', badge: 'badge-gray' }
            : new Date(link.expiresAt).getTime() < Date.now() ? { text: 'Expired', badge: 'badge-gray' }
                : { text: 'Active', badge: 'badge-green' };

    return (
        <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Passports for the hotel</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                Participants upload from one shared link. Files are private, and are permanently deleted after {PASSPORT_PURGE_LABEL}.
            </p>

            {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}><AlertCircle size={18} />{error}</div>}
            {success && <div className="alert alert-success" role="status" style={{ marginBottom: 'var(--space-4)' }}><CheckCircle size={18} />{success}</div>}

            {/* Progress + share link */}
            <div className="glass-card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                        {receivedCount} of {totalGuests} received
                        {unmatched.length > 0 && <span style={{ fontWeight: 400, fontSize: 'var(--text-sm)', color: 'var(--color-gold-dark)' }}> · {unmatched.length} to match</span>}
                    </p>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{outstanding.length} outstanding</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: 'var(--space-3) 0 var(--space-4)' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: percent === 100 ? 'var(--color-green)' : 'var(--color-gold)', borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <code style={{ flex: 1, minWidth: '220px', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', overflowWrap: 'anywhere' }}>
                        {shareUrl}
                    </code>
                    <button className="btn btn-primary btn-sm" onClick={() => copy(shareUrl, 'Upload link')}>
                        <Link2 size={16} /> Copy upload link
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => copy(outstandingText, 'Outstanding list')} disabled={outstanding.length === 0}>
                        <Copy size={16} /> Copy outstanding names
                    </button>
                </div>
            </div>

            {/* Unmatched uploads */}
            {unmatched.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-4)', border: '2px solid var(--color-gold)' }}>
                    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)', fontWeight: 700 }}>
                        Uploads to match ({unmatched.length})
                        <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}> — sent by people who couldn&apos;t find their booking</span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {unmatched.map((p, i) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', padding: 'var(--space-3) var(--space-4)', borderBottom: i < unmatched.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{p.name}</p>
                                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        {p.note ? `${p.note} · ` : ''}{fmtDateTime(p.uploadedAt)}
                                    </p>
                                </div>
                                <select
                                    className="form-input"
                                    aria-label={`Match ${p.name} to a guest`}
                                    value={assignTarget[p.id] || ''}
                                    onChange={e => setAssignTarget(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    style={{ width: 'auto', maxWidth: '260px', padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}
                                >
                                    <option value="">Match to guest…</option>
                                    {outstanding.map(o => (
                                        <option key={`${o.registration.id}:${o.attendee.index}`} value={`${o.registration.id}:${o.attendee.index}`}>
                                            {o.attendee.name} (booking: {o.registration.leadName})
                                        </option>
                                    ))}
                                </select>
                                <button className="btn btn-primary btn-sm" onClick={() => assignPassport(p)} disabled={busyId === p.id}>Match</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => viewPassport(p)} disabled={busyId === p.id} aria-label={`View passport uploaded as ${p.name}`}><Eye size={16} /></button>
                                <button className="btn btn-ghost btn-sm" onClick={() => deletePassport(p)} disabled={busyId === p.id} style={{ color: 'var(--color-red)' }} aria-label={`Delete passport uploaded as ${p.name}`}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Per-booking status */}
            <details className="card" style={{ marginBottom: 'var(--space-4)' }} open={outstanding.length > 0 && outstanding.length <= 12}>
                <summary style={{ padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', fontWeight: 700 }}>
                    Status by booking
                </summary>
                <div style={{ borderTop: '1px solid var(--border-light)' }}>
                    {data.registrations.length === 0 && (
                        <p style={{ padding: 'var(--space-4)', margin: 0, color: 'var(--text-secondary)' }}>No paid bookings yet.</p>
                    )}
                    {data.registrations.map((r, ri) => (
                        <div key={r.id} style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: ri < data.registrations.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                            <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Booking: <strong style={{ color: 'var(--text-primary)' }}>{r.leadName}</strong></p>
                            {r.attendees.map(a => {
                                const passport = bySlot.get(`${r.id}:${a.index}`);
                                return (
                                    <div key={a.index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '4px 0' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: passport ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                            {passport ? <CheckCircle size={16} color="var(--color-green)" /> : <XCircle size={16} color="var(--color-red)" />}
                                            {a.name}
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                                {passport ? `received ${fmtDateTime(passport.uploadedAt)}` : 'not received'}
                                            </span>
                                        </span>
                                        {passport && (
                                            <span style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => viewPassport(passport)} disabled={busyId === passport.id} aria-label={`View passport for ${a.name}`}>
                                                    {busyId === passport.id ? <Loader2 size={16} className="spinner" /> : <Eye size={16} />}
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => deletePassport(passport)} disabled={busyId === passport.id} style={{ color: 'var(--color-red)' }} aria-label={`Delete passport for ${a.name}`}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </details>

            {/* Hotel access */}
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <KeyRound size={18} color="var(--color-gold-dark)" /> Hotel access
                </div>
                <div className="card-body">
                    {newLink && (
                        <div style={{ border: '2px solid var(--color-green)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', background: 'rgba(45, 125, 70, 0.06)' }}>
                            <p style={{ margin: '0 0 var(--space-3)', fontWeight: 700 }}>
                                Access created for “{newLink.label}” — copy both now. The passcode can&apos;t be shown again.
                            </p>
                            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>1. Send this link (e.g. by email):</p>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                                <code style={{ flex: 1, minWidth: '220px', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', overflowWrap: 'anywhere' }}>{newLink.url}</code>
                                <button className="btn btn-primary btn-sm" onClick={() => copy(newLink.url, 'Hotel link')}><Copy size={16} /> Copy link</button>
                            </div>
                            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>2. Send this passcode separately (e.g. by WhatsApp or phone):</p>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                                <code style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-lg)', fontWeight: 700, letterSpacing: '0.12em' }}>{newLink.passcode}</code>
                                <button className="btn btn-primary btn-sm" onClick={() => copy(newLink.passcode, 'Passcode')}><Copy size={16} /> Copy passcode</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setNewLink(null)}>I&apos;ve saved both</button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={createHotelLink} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: data.hotelLinks.length > 0 ? 'var(--space-5)' : 0 }}>
                        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                            <label className="form-label" htmlFor="hotel-link-label">Who is this for?</label>
                            <input id="hotel-link-label" className="form-input" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} maxLength={80} required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" htmlFor="hotel-link-expiry">Access ends</label>
                            <input id="hotel-link-expiry" type="date" className="form-input" value={linkExpiry} max={data.purgeAfter} onChange={e => setLinkExpiry(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={creatingLink || data.closed}>
                            {creatingLink ? <Loader2 size={18} className="spinner" /> : <KeyRound size={18} />}
                            Create hotel access
                        </button>
                    </form>

                    {data.hotelLinks.map(link => {
                        const status = linkStatus(link);
                        return (
                            <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', padding: 'var(--space-3) 0', borderTop: '1px solid var(--border-light)' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        {link.label} <span className={`badge ${status.badge}`}>{status.text}</span>
                                    </p>
                                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        Created {fmtDateTime(link.createdAt)}{link.createdByName ? ` by ${link.createdByName}` : ''} · ends {new Date(link.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        {' · '}{link.opens} opens, {link.views} views, {link.downloads} full downloads
                                        {link.failedPasscodes > 0 && <span style={{ color: 'var(--color-red)' }}> · {link.failedPasscodes} wrong passcodes</span>}
                                        {link.lastActivity && ` · last used ${fmtDateTime(link.lastActivity)}`}
                                    </p>
                                </div>
                                {status.text === 'Active' && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => revokeLink(link)} disabled={busyId === link.id} style={{ color: 'var(--color-red)' }}>
                                        <Ban size={16} /> Withdraw access
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {data.log.length > 0 && (
                        <details style={{ marginTop: 'var(--space-3)' }}>
                            <summary style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Access log (latest {data.log.length})</summary>
                            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                {data.log.map(entry => (
                                    <p key={entry.id} style={{ margin: '2px 0', color: entry.action === 'failed_passcode' ? 'var(--color-red)' : undefined }}>
                                        {fmtDateTime(entry.at)} — {entry.link}: {ACTION_LABELS[entry.action] || entry.action}
                                        {entry.passportName ? ` ${entry.passportName}` : ''}{entry.ip ? ` (${entry.ip})` : ''}
                                    </p>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            </div>

            {/* Retention */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <ShieldCheck size={16} color="var(--color-green)" />
                    {data.closed
                        ? 'The retention date has passed — uploads are closed and files have been deleted.'
                        : `All passport files are deleted automatically after ${PASSPORT_PURGE_LABEL} (the next time this page is opened).`}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={purgeAll} disabled={data.passports.length === 0} style={{ color: 'var(--color-red)' }}>
                    <Trash2 size={16} /> Delete all passports now
                </button>
            </div>
        </section>
    );
}
