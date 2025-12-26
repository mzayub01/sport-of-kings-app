'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Give webhook time to process
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [sessionId]);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={48} className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Processing your payment...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        }}>
            <div className="glass-card animate-slide-up" style={{
                maxWidth: '500px',
                textAlign: 'center',
                padding: 'var(--space-10)',
            }}>
                <Link href="/">
                    <Image
                        src="/logo-full.png"
                        alt="Sport of Kings"
                        width={140}
                        height={70}
                        style={{ height: '50px', width: 'auto', margin: '0 auto var(--space-6)' }}
                    />
                </Link>

                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-6)',
                }}>
                    <CheckCircle size={40} color="white" />
                </div>

                <h1 style={{
                    fontSize: 'var(--text-2xl)',
                    marginBottom: 'var(--space-2)',
                    background: 'var(--color-gold-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Payment Successful!
                </h1>

                <p style={{
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-8)',
                    fontSize: 'var(--text-lg)',
                }}>
                    Your membership is now active. Welcome to Sport of Kings!
                </p>

                <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    Go to Dashboard
                    <ArrowRight size={18} />
                </Link>

                <p style={{
                    marginTop: 'var(--space-6)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                }}>
                    A confirmation email has been sent to your email address.
                </p>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
            }}>
                <div className="spinner spinner-lg" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
