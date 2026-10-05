'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Loader2, AlertCircle, Eye, Download, FileText, ShieldCheck, CheckCircle } from 'lucide-react';

interface Guest {
    id: string;
    name: string;
    group: string;
    isPdf: boolean;
    uploadedAt: string;
}

interface Portal {
    retreat: string;
    dates: string;
    label: string;
    expiresAt: string;
    expectedGuests: number;
    guests: Guest[];
}

export default function HotelPassportPortal() {
    const params = useParams<{ token: string }>();
    const token = params.token;

    const [passcode, setPasscode] = useState('');
    const [portal, setPortal] = useState<Portal | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [openingId, setOpeningId] = useState<string | null>(null);
    const [zipProgress, setZipProgress] = useState<string | null>(null);

    const call = async (action: string, extra: Record<string, unknown> = {}) => {
        const response = await fetch('/api/retreat/hotel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, passcode, action, ...extra }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
        return data;
    };

    const unlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            setPortal(await call('list'));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setBusy(false);
        }
    };

    const view = async (guest: Guest) => {
        setError('');
        // Open the tab synchronously (inside the click) so browsers don't block it
        const tab = window.open('', '_blank');
        setOpeningId(guest.id);
        try {
            const { url } = await call('view', { passportId: guest.id });
            if (tab) {
                tab.opener = null;
                tab.location.replace(url);
            } else {
                window.location.assign(url);
            }
        } catch (err) {
            tab?.close();
            setError(err instanceof Error ? err.message : 'Could not open that document.');
        } finally {
            setOpeningId(null);
        }
    };

    const downloadAll = async () => {
        setError('');
        setZipProgress('Preparing…');
        try {
            const { files } = await call('bundle') as { files: { url: string; path: string }[] };
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            for (let i = 0; i < files.length; i++) {
                setZipProgress(`Downloading ${i + 1} of ${files.length}…`);
                const response = await fetch(files[i].url, { referrerPolicy: 'no-referrer' });
                if (!response.ok) throw new Error(`Could not download ${files[i].path}`);
                zip.file(files[i].path, await response.blob());
            }
            setZipProgress('Creating ZIP…');
            const blob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Suhba-Retreat-2026-guest-passports.zip';
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            setError(err instanceof Error ? `${err.message}. You can still open each document individually.` : 'Download failed.');
        } finally {
            setZipProgress(null);
        }
    };

    const groups = useMemo(() => {
        const map = new Map<string, Guest[]>();
        (portal?.guests || []).forEach(g => {
            if (!map.has(g.group)) map.set(g.group, []);
            map.get(g.group)!.push(g);
        });
        return [...map.entries()].sort((a, b) =>
            a[0] === 'Other guests' ? 1 : b[0] === 'Other guests' ? -1 : a[0].localeCompare(b[0]));
    }, [portal]);

    return (
        <div style={{
            minHeight: '100vh',
            padding: 'var(--space-6) var(--space-4) var(--space-12)',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <Image src="/logo-full.png" alt="Sport of Kings" width={140} height={70} priority style={{ height: '64px', width: 'auto', margin: '0 auto' }} />
                    <h1 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-3) 0 var(--space-1)' }}>Guest passports</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        {portal ? `${portal.retreat} · ${portal.dates}` : 'Secure access for hotel reception'}
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {!portal ? (
                    <form onSubmit={unlock} className="card" style={{ maxWidth: '420px', margin: '0 auto' }}>
                        <div className="card-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                                <Lock size={20} color="var(--color-gold-dark)" />
                                <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Enter your passcode</h2>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)' }}>
                                The passcode was sent to you separately by the retreat organisers.
                            </p>
                            <div className="form-group">
                                <label className="form-label" htmlFor="hotel-passcode">Passcode</label>
                                <input
                                    id="hotel-passcode"
                                    type="text"
                                    className="form-input"
                                    required
                                    autoComplete="off"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    placeholder="XXXX-XXXX"
                                    value={passcode}
                                    onChange={e => setPasscode(e.target.value)}
                                    style={{ letterSpacing: '0.12em', fontWeight: 600 }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={busy} style={{ width: '100%' }}>
                                {busy ? <Loader2 size={18} className="spinner" /> : <Lock size={18} />}
                                {busy ? 'Checking…' : 'Open guest list'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <CheckCircle size={18} color="var(--color-green)" />
                                        {portal.guests.length} of {portal.expectedGuests} guest passports available
                                    </p>
                                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        Access for {portal.label} · expires {new Date(portal.expiresAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <button className="btn btn-primary" onClick={downloadAll} disabled={zipProgress !== null || portal.guests.length === 0}>
                                    {zipProgress !== null ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                                    {zipProgress ?? 'Download all (ZIP)'}
                                </button>
                            </div>
                        </div>

                        {portal.guests.length === 0 ? (
                            <div className="card">
                                <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No passports have been uploaded yet. Please check back shortly.
                                </div>
                            </div>
                        ) : groups.map(([group, guests]) => (
                            <div key={group} className="card" style={{ marginBottom: 'var(--space-4)' }}>
                                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                                    {group === 'Other guests' ? group : `Booking: ${group}`}
                                    <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> · {guests.length} {guests.length === 1 ? 'guest' : 'guests'}</span>
                                </div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    {guests.map((guest, i) => (
                                        <div key={guest.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderBottom: i < guests.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 500, minWidth: 0 }}>
                                                <FileText size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                                                {guest.name}
                                                {guest.isPdf && <span className="badge badge-gray">PDF</span>}
                                            </span>
                                            <button className="btn btn-ghost btn-sm" onClick={() => view(guest)} disabled={openingId === guest.id} style={{ minHeight: '40px' }}>
                                                {openingId === guest.id ? <Loader2 size={16} className="spinner" /> : <Eye size={16} />}
                                                View
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <p style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginTop: 'var(--space-6)' }}>
                            <ShieldCheck size={18} color="var(--color-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>
                                These documents are shared in confidence for guest registration only. Access is recorded,
                                and each document link stays valid for one minute. Please delete any downloaded copies
                                once registration is complete.
                            </span>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
