'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function LocationQrPosterPage() {
    const params = useParams<{ locationId: string }>();
    const locationId = params.locationId;
    const supabase = getSupabaseClient();

    const [locationName, setLocationName] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [checkinUrl, setCheckinUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data: location } = await supabase
                    .from('locations')
                    .select('name')
                    .eq('id', locationId)
                    .maybeSingle();

                setLocationName(location?.name || 'Unknown location');

                const url = `${window.location.origin}/checkin/${locationId}`;
                setCheckinUrl(url);
                const dataUrl = await QRCode.toDataURL(url, {
                    width: 640,
                    margin: 1,
                    color: { dark: '#1A1A1A', light: '#FFFFFF' },
                });
                setQrDataUrl(dataUrl);
            } catch (err) {
                console.error('Error generating QR poster:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [locationId, supabase]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <Loader2 size={28} className="spinner" />
            </div>
        );
    }

    return (
        <div>
            {/* Screen-only toolbar */}
            <div className="no-print" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
            }}>
                <Link href="/admin/locations" className="btn btn-ghost">
                    <ArrowLeft size={18} />
                    Back to Locations
                </Link>
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={18} />
                    Print Poster
                </button>
            </div>

            {/* The poster itself */}
            <div style={{
                maxWidth: '640px',
                margin: '0 auto',
                background: 'white',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-10)',
                textAlign: 'center',
            }}>
                <Image
                    src="/logo-full.png"
                    alt="Sport of Kings"
                    width={200}
                    height={100}
                    priority
                    style={{ height: '80px', width: 'auto', margin: '0 auto var(--space-6)' }}
                />

                <h1 style={{
                    fontSize: 'var(--text-4xl)',
                    margin: '0 0 var(--space-2)',
                    color: 'var(--color-black)',
                }}>
                    Scan to Check In
                </h1>
                <p style={{
                    fontSize: 'var(--text-lg)',
                    color: 'var(--color-gray-600)',
                    margin: '0 0 var(--space-8)',
                }}>
                    {locationName}
                </p>

                {qrDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={qrDataUrl}
                        alt={`Check-in QR code for ${locationName}`}
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            border: '8px solid var(--color-gold)',
                            borderRadius: 'var(--radius-lg)',
                        }}
                    />
                )}

                <ol style={{
                    textAlign: 'left',
                    maxWidth: '380px',
                    margin: 'var(--space-8) auto 0',
                    paddingLeft: 'var(--space-6)',
                    color: 'var(--color-gray-700)',
                    fontSize: 'var(--text-lg)',
                    lineHeight: 1.8,
                }}>
                    <li>Open your phone camera</li>
                    <li>Point it at the code</li>
                    <li>Tap your name — done!</li>
                </ol>

                <p style={{
                    marginTop: 'var(--space-6)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-gray-500)',
                    wordBreak: 'break-all',
                }}>
                    Or visit: {checkinUrl}
                </p>
            </div>
        </div>
    );
}
