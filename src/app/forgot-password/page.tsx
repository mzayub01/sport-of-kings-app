'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = getSupabaseClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message);
                return;
            }

            setSuccess(true);
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-6)',
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
            }}
        >
            <div
                className="glass-card animate-slide-up"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: 'var(--space-8)',
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                    <Link href="/">
                        <Image
                            src="/logo-full.png"
                            alt="Sport of Kings"
                            width={160}
                            height={80}
                            priority
                            style={{ height: '70px', width: 'auto', margin: '0 auto' }}
                        />
                    </Link>
                    <h1 style={{
                        fontSize: 'var(--text-2xl)',
                        marginTop: 'var(--space-4)',
                    }}>
                        Reset Password
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                        {success
                            ? "Check your email for the reset link"
                            : "Enter your email to receive a password reset link"
                        }
                    </p>
                </div>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(45, 125, 70, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-6)',
                        }}>
                            <CheckCircle size={32} color="var(--color-green)" />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                            We&apos;ve sent a password reset link to <strong>{email}</strong>.
                            Please check your inbox and follow the instructions.
                        </p>
                        <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                            <ArrowLeft size={18} />
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Error Message */}
                        {error && (
                            <div
                                className="alert alert-error"
                                style={{ marginBottom: 'var(--space-4)' }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail
                                        size={18}
                                        style={{
                                            position: 'absolute',
                                            left: '14px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-tertiary)',
                                        }}
                                    />
                                    <input
                                        id="email"
                                        type="email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{ paddingLeft: '42px' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: 'var(--space-4)' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="spinner" style={{ width: '20px', height: '20px' }} />
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Back to Login */}
                        <p style={{
                            textAlign: 'center',
                            marginTop: 'var(--space-6)',
                            color: 'var(--text-secondary)',
                        }}>
                            Remember your password?{' '}
                            <Link
                                href="/login"
                                style={{
                                    color: 'var(--color-gold)',
                                    fontWeight: '600',
                                }}
                            >
                                Sign In
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
