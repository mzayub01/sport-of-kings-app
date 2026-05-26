'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, Heart, Shield, Loader2, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSupabaseClient } from '@/lib/supabase/client';

type DonationType = 'bursary' | 'general' | 'equipment';

const DONATION_TYPES = [
    {
        key: 'bursary' as DonationType,
        label: 'Child Bursary',
        description: "Fund a child's BJJ training who otherwise couldn't afford it",
        icon: GraduationCap,
    },
    {
        key: 'general' as DonationType,
        label: 'General Fund',
        description: 'Support Sport of Kings operations, events, and community programmes',
        icon: Heart,
    },
    {
        key: 'equipment' as DonationType,
        label: 'Equipment Fund',
        description: 'Help us provide gis, mats, and training equipment',
        icon: Shield,
    },
];

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

function DonateContent() {
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get('payment');

    const [user, setUser] = useState<{ id: string; email: string } | null>(null);
    const [donationType, setDonationType] = useState<DonationType>('bursary');
    const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
    const [customAmount, setCustomAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donorEmail, setDonorEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const supabase = getSupabaseClient();
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            if (user) setUser({ id: user.id, email: user.email! });
        });
    }, []);

    const amountInPounds = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);
    const amountInPence = Math.round(amountInPounds * 100);
    const isValidAmount = amountInPounds >= 1;

    const handlePresetClick = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (value: string) => {
        setCustomAmount(value);
        setSelectedAmount(null);
    };

    const handleSubmit = async () => {
        if (!donorName.trim() || !donorEmail.trim()) {
            setError('Please fill in your name and email.');
            return;
        }
        if (!isValidAmount) {
            setError('Please select or enter a donation amount (minimum £1).');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/stripe/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountInPence,
                    donorName: donorName.trim(),
                    donorEmail: donorEmail.trim(),
                    donationType,
                    message: message.trim() || undefined,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Something went wrong');
            }

            if (result.url) {
                window.location.href = result.url;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to process donation. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <>
            <Navbar user={user} />

            <main>
                {/* Payment Status Banners */}
                {paymentStatus === 'success' && (
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        borderBottom: '2px solid rgba(34, 197, 94, 0.4)',
                        padding: 'var(--space-4) var(--space-6)',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-3)',
                        }}>
                            <CheckCircle size={24} color="#22c55e" />
                            <p style={{ margin: 0, fontSize: 'var(--text-lg)', color: '#22c55e', fontWeight: '600' }}>
                                JazakAllahu Khayran! Your donation has been received. May Allah reward you abundantly.
                            </p>
                        </div>
                    </div>
                )}

                {paymentStatus === 'cancelled' && (
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        borderBottom: '2px solid rgba(245, 158, 11, 0.4)',
                        padding: 'var(--space-4) var(--space-6)',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-3)',
                        }}>
                            <XCircle size={24} color="#f59e0b" />
                            <p style={{ margin: 0, fontSize: 'var(--text-lg)', color: '#f59e0b', fontWeight: '600' }}>
                                Donation cancelled. You can try again whenever you&apos;re ready.
                            </p>
                        </div>
                    </div>
                )}

                {/* Hero Section */}
                <section style={{
                    background: 'var(--color-dark-green)',
                    color: 'var(--color-white)',
                    padding: 'var(--space-16) var(--space-6)',
                    textAlign: 'center',
                }}>
                    <div className="container container-md animate-slide-up">
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(197, 164, 86, 0.15)',
                            padding: 'var(--space-1) var(--space-4)',
                            borderRadius: 'var(--radius-full)',
                            marginBottom: 'var(--space-4)',
                        }}>
                            <span style={{ color: 'var(--color-gold)', fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                                Registered Charity • Seerat Un Nabi
                            </span>
                        </div>
                        <h1 style={{
                            marginBottom: 'var(--space-4)',
                            background: 'var(--color-gold-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            Support Sport of Kings
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-xl)',
                            color: 'var(--color-gray-300)',
                            maxWidth: '650px',
                            margin: '0 auto',
                        }}>
                            Help us develop young people through Sunnah sports. Your generosity changes lives.
                        </p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-lg">
                        <div className="glass-card" style={{
                            padding: 'var(--space-10)',
                            textAlign: 'center',
                        }}>
                            <h2 style={{
                                marginBottom: 'var(--space-6)',
                                color: 'var(--color-gold)',
                            }}>
                                Why Your Donation Matters
                            </h2>

                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                maxWidth: '800px',
                                margin: '0 auto var(--space-6)',
                            }}>
                                Sport of Kings is a <strong>registered non-profit charity</strong> dedicated to developing
                                young people through Sunnah sports including BJJ and wrestling. We believe every child
                                deserves the opportunity to train, grow, and build confidence — regardless of their
                                financial circumstances.
                            </p>

                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                maxWidth: '800px',
                                margin: '0 auto var(--space-6)',
                            }}>
                                Some children in our community <strong>cannot afford training fees</strong>. Through
                                bursaries, we allow children from disadvantaged backgrounds to train alongside their
                                peers. Your contribution goes directly towards a child&apos;s BJJ journey or wider
                                Sport of Kings initiatives.
                            </p>

                            <div style={{
                                background: 'rgba(197, 164, 86, 0.1)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--space-6)',
                                borderLeft: '4px solid var(--color-gold)',
                                maxWidth: '600px',
                                margin: '0 auto',
                            }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: 'var(--text-xl)',
                                    fontWeight: '600',
                                    color: 'var(--color-gold)',
                                }}>
                                    Every penny makes a difference.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Donation Form Section */}
                <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="container container-md">

                        {/* Donation Type Selector */}
                        <h2 style={{
                            textAlign: 'center',
                            marginBottom: 'var(--space-6)',
                        }}>
                            Choose Where Your Donation Goes
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 'var(--space-4)',
                            marginBottom: 'var(--space-10)',
                        }}>
                            {DONATION_TYPES.map((type) => {
                                const Icon = type.icon;
                                const isSelected = donationType === type.key;
                                return (
                                    <button
                                        key={type.key}
                                        onClick={() => setDonationType(type.key)}
                                        className="glass-card"
                                        style={{
                                            padding: 'var(--space-6)',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            border: isSelected
                                                ? '2px solid var(--color-gold)'
                                                : '2px solid transparent',
                                            transition: 'all 0.2s ease',
                                            background: 'none',
                                            width: '100%',
                                        }}
                                    >
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: 'var(--radius-full)',
                                            background: isSelected
                                                ? 'var(--color-gold-gradient)'
                                                : 'rgba(197, 164, 86, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto var(--space-4)',
                                            transition: 'all 0.2s ease',
                                        }}>
                                            <Icon
                                                size={28}
                                                color={isSelected ? 'var(--color-black)' : 'var(--color-gold)'}
                                            />
                                        </div>
                                        <h3 style={{
                                            fontSize: 'var(--text-lg)',
                                            marginBottom: 'var(--space-2)',
                                            color: isSelected ? 'var(--color-gold)' : 'var(--text-primary)',
                                        }}>
                                            {type.label}
                                        </h3>
                                        <p style={{
                                            margin: 0,
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--text-secondary)',
                                            lineHeight: '1.6',
                                        }}>
                                            {type.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Amount Selection */}
                        <div className="glass-card" style={{
                            padding: 'var(--space-8)',
                            marginBottom: 'var(--space-6)',
                        }}>
                            <h3 style={{
                                marginBottom: 'var(--space-6)',
                                textAlign: 'center',
                            }}>
                                Select Amount
                            </h3>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 'var(--space-3)',
                                justifyContent: 'center',
                                marginBottom: 'var(--space-6)',
                            }}>
                                {PRESET_AMOUNTS.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => handlePresetClick(amount)}
                                        className={`btn ${selectedAmount === amount ? 'btn-primary' : 'btn-outline'}`}
                                        style={{
                                            minWidth: '80px',
                                            fontSize: 'var(--text-lg)',
                                            fontWeight: '600',
                                        }}
                                    >
                                        £{amount}
                                    </button>
                                ))}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-3)',
                            }}>
                                <span style={{
                                    fontSize: 'var(--text-lg)',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)',
                                }}>
                                    or
                                </span>
                                <div style={{ position: 'relative', maxWidth: '200px' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 'var(--space-3)',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: 'var(--text-lg)',
                                        fontWeight: '600',
                                        color: 'var(--text-secondary)',
                                    }}>
                                        £
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Custom"
                                        value={customAmount}
                                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                                        className="form-input"
                                        style={{
                                            paddingLeft: 'var(--space-7)',
                                            fontSize: 'var(--text-lg)',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Donor Info Form */}
                        <div className="glass-card" style={{
                            padding: 'var(--space-8)',
                            marginBottom: 'var(--space-6)',
                        }}>
                            <h3 style={{
                                marginBottom: 'var(--space-6)',
                                textAlign: 'center',
                            }}>
                                Your Details
                            </h3>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-4)',
                                maxWidth: '500px',
                                margin: '0 auto',
                            }}>
                                <div>
                                    <label
                                        htmlFor="donorName"
                                        style={{
                                            display: 'block',
                                            marginBottom: 'var(--space-2)',
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Full Name *
                                    </label>
                                    <input
                                        id="donorName"
                                        type="text"
                                        required
                                        placeholder="Your full name"
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        className="form-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="donorEmail"
                                        style={{
                                            display: 'block',
                                            marginBottom: 'var(--space-2)',
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Email Address *
                                    </label>
                                    <input
                                        id="donorEmail"
                                        type="email"
                                        required
                                        placeholder="your@email.com"
                                        value={donorEmail}
                                        onChange={(e) => setDonorEmail(e.target.value)}
                                        className="form-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="donorMessage"
                                        style={{
                                            display: 'block',
                                            marginBottom: 'var(--space-2)',
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Message (optional)
                                    </label>
                                    <textarea
                                        id="donorMessage"
                                        placeholder="Leave a message of support..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="form-input"
                                        rows={3}
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-4)',
                                marginBottom: 'var(--space-6)',
                                textAlign: 'center',
                                color: '#ef4444',
                                fontSize: 'var(--text-sm)',
                                fontWeight: '500',
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Donate Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !isValidAmount}
                            className="btn btn-primary btn-lg"
                            style={{
                                width: '100%',
                                fontSize: 'var(--text-lg)',
                                padding: 'var(--space-4) var(--space-6)',
                                opacity: submitting || !isValidAmount ? 0.6 : 1,
                                cursor: submitting || !isValidAmount ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={20} className="spinner" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Donate £{amountInPounds > 0 ? amountInPounds.toFixed(2) : '0.00'}
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>

                        {/* Gift Aid Note */}
                        <div style={{
                            marginTop: 'var(--space-8)',
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            background: 'rgba(197, 164, 86, 0.08)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(197, 164, 86, 0.2)',
                        }}>
                            <p style={{
                                margin: 0,
                                fontSize: 'var(--text-sm)',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.7',
                            }}>
                                🇬🇧 <strong style={{ color: 'var(--color-gold)' }}>Gift Aid:</strong> If you are a UK
                                taxpayer, your donation may qualify for Gift Aid, allowing us to claim an extra 25p for
                                every £1 you donate at no extra cost to you. Please contact us for details.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

export default function DonatePage() {
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
            <DonateContent />
        </Suspense>
    );
}
