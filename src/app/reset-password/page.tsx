'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<'verify' | 'reset'>('verify');

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = getSupabaseClient();

    useEffect(() => {
        // Pre-fill the token from URL if available
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl) {
            setToken(codeFromUrl);
        }
    }, [searchParams]);

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Verify the OTP code
            const { error } = await supabase.auth.verifyOtp({
                email: email,
                token: token,
                type: 'recovery',
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Successfully verified, move to password reset step
            setStep('reset');
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                setError(error.message);
                return;
            }

            setSuccess(true);

            // Sign out and redirect to login after 3 seconds
            await supabase.auth.signOut();
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
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
                <h2 style={{ marginBottom: 'var(--space-4)' }}>Password Updated!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                    Your password has been successfully reset. Redirecting you to login...
                </p>
                <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                    Go to Login
                </Link>
            </div>
        );
    }

    if (step === 'verify') {
        return (
            <>
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerifyCode}>
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
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '42px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                        <label className="form-label" htmlFor="token">
                            Reset Code
                        </label>
                        <input
                            id="token"
                            type="text"
                            className="form-input"
                            placeholder="Enter the code from your email"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                            style={{ textAlign: 'center', fontSize: 'var(--text-lg)', letterSpacing: '4px' }}
                        />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                            Check your email for the 8-digit reset code
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: 'var(--space-6)' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner" style={{ width: '20px', height: '20px' }} />
                        ) : (
                            'Verify Code'
                        )}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-6)',
                    color: 'var(--text-secondary)',
                }}>
                    Didn&apos;t receive a code?{' '}
                    <Link
                        href="/forgot-password"
                        style={{
                            color: 'var(--color-gold)',
                            fontWeight: '600',
                        }}
                    >
                        Request New Code
                    </Link>
                </p>
            </>
        );
    }

    return (
        <>
            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    {error}
                </div>
            )}

            <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                <CheckCircle size={18} />
                Code verified! Now set your new password.
            </div>

            <form onSubmit={handleResetPassword}>
                <div className="form-group">
                    <label className="form-label" htmlFor="password">
                        New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Lock
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
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ paddingLeft: '42px', paddingRight: '42px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                    <label className="form-label" htmlFor="confirmPassword">
                        Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Lock
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
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ paddingLeft: '42px' }}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--space-6)' }}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="spinner" style={{ width: '20px', height: '20px' }} />
                    ) : (
                        'Reset Password'
                    )}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
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
                        Enter your email and the code from your email
                    </p>
                </div>

                <Suspense fallback={
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
