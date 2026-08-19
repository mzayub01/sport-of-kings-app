'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Mail, Plane, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSupabaseClient } from '@/lib/supabase/client';
import { RETREAT } from '@/lib/retreat';

export default function RetreatSuccessPage() {
    const [user, setUser] = useState<{ id: string; email: string } | null>(null);
    const supabase = getSupabaseClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUser({ id: data.user.id, email: data.user.email || '' });
        });
    }, [supabase]);

    return (
        <div style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar user={user} />
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(6rem, 15vh, 9rem) var(--space-4) var(--space-12)',
            }}>
                <div style={{
                    maxWidth: '560px',
                    width: '100%',
                    textAlign: 'center',
                    border: '1px solid var(--color-gold)',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-primary)',
                    boxShadow: 'var(--shadow-gold)',
                    padding: 'clamp(2rem, 6vw, 3.5rem)',
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '999px',
                        background: 'var(--color-gold-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-5)',
                    }}>
                        <CheckCircle size={36} color="#17130a" />
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-outfit, var(--font-display))',
                        fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                        color: 'var(--text-primary)',
                        margin: '0 0 var(--space-3)',
                    }}>
                        Alhamdulillah — you&apos;re in! 🏔️
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 var(--space-6)' }}>
                        Your payment is complete and your place on the <strong>Suhba Retreat 2026</strong> is
                        secured. See you in the Atlas Mountains.
                    </p>
                    <div style={{
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        marginBottom: 'var(--space-6)',
                    }}>
                        <p style={{ margin: 0, display: 'flex', gap: '10px' }}>
                            <Mail size={18} color="#C5A456" style={{ flexShrink: 0, marginTop: '2px' }} />
                            A confirmation email with your booking details is on its way.
                        </p>
                        <p style={{ margin: 0, display: 'flex', gap: '10px' }}>
                            <Plane size={18} color="#C5A456" style={{ flexShrink: 0, marginTop: '2px' }} />
                            Book your Manchester → Marrakech flights soon — prices rise quickly.
                        </p>
                        <p style={{ margin: 0, display: 'flex', gap: '10px' }}>
                            <Calendar size={18} color="#C5A456" style={{ flexShrink: 0, marginTop: '2px' }} />
                            {RETREAT.dates} — the full itinerary and venue details will follow by email.
                        </p>
                    </div>
                    <Link href="/" className="btn btn-primary" style={{ borderRadius: '999px' }}>
                        Back to Sport of Kings
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}
