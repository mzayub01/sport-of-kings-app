'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentStatusBanner() {
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get('payment');
    const eventId = searchParams.get('event');

    if (!paymentStatus) return null;

    if (paymentStatus === 'success') {
        return (
            <div
                className="container container-lg animate-slide-up"
                style={{ marginBottom: 'var(--space-6)' }}
            >
                <div
                    className="glass-card"
                    style={{
                        padding: 'var(--space-6)',
                        borderTop: '4px solid var(--color-green)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(45, 125, 70, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-4)',
                    }}>
                        <CheckCircle size={32} color="var(--color-green)" />
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-green)' }}>
                        Payment Successful!
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Thank you for your registration. You will receive a confirmation email shortly.
                    </p>
                </div>
            </div>
        );
    }

    if (paymentStatus === 'cancelled') {
        return (
            <div
                className="container container-lg animate-slide-up"
                style={{ marginBottom: 'var(--space-6)' }}
            >
                <div
                    className="glass-card"
                    style={{
                        padding: 'var(--space-6)',
                        borderTop: '4px solid var(--color-red)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(220, 53, 69, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-4)',
                    }}>
                        <XCircle size={32} color="var(--color-red)" />
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-red)' }}>
                        Payment Cancelled
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Your payment was cancelled. You can try registering again below.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
