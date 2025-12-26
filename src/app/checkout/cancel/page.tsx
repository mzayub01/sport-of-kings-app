'use client';

import Link from 'next/link';
import Image from 'next/image';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CheckoutCancelPage() {
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
                    background: 'var(--color-red)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-6)',
                }}>
                    <XCircle size={40} color="white" />
                </div>

                <h1 style={{
                    fontSize: 'var(--text-2xl)',
                    marginBottom: 'var(--space-2)',
                }}>
                    Payment Cancelled
                </h1>

                <p style={{
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-8)',
                    fontSize: 'var(--text-lg)',
                }}>
                    Your payment was not completed. No charges have been made.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Link href="/join" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                        <RefreshCw size={18} />
                        Try Again
                    </Link>

                    <Link href="/dashboard" className="btn btn-ghost" style={{ width: '100%' }}>
                        <ArrowLeft size={18} />
                        Go to Dashboard
                    </Link>
                </div>

                <p style={{
                    marginTop: 'var(--space-6)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                }}>
                    Need help? Contact us at support@sportofkings.co.uk
                </p>
            </div>
        </div>
    );
}
