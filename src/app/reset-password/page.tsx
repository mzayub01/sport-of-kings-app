'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = getSupabaseClient();

    useEffect(() => {
        // Check if we have a valid session from the reset link
        const checkSession = async () => {
            try {
                // The code parameter is exchanged automatically by Supabase
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    setIsValidSession(true);
                } else {
                    // Check for code in URL - Supabase may need to exchange it
                    const code = searchParams.get('code');
                    if (code) {
                        // Try to exchange the code
                        const { error } = await supabase.auth.exchangeCodeForSession(code);
                        if (!error) {
                            setIsValidSession(true);
                        } else {
                            setError('This password reset link has expired or is invalid. Please request a new one.');
                        }
                    } else {
                        setError('No reset code found. Please request a new password reset link.');
                    }
                }
            } catch (err) {
                console.error('Session check error:', err);
                setError('Unable to verify reset link. Please try again.');
            } finally {
                setCheckingSession(false);
            }
        };

        checkSession();
    }, [searchParams, supabase.auth]);

    const handleSubmit = async (e: React.FormEvent) => {
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

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto var(--space-4)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Verifying reset link...</p>
            </div>
        );
    }

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

    if (!isValidSession && error) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(220, 38, 38, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-6)',
                }}>
                    <AlertCircle size={32} color="var(--color-red)" />
                </div>
                <h2 style={{ marginBottom: 'var(--space-4)' }}>Link Expired</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                    {error}
                </p>
                <Link href="/forgot-password" className="btn btn-primary" style={{ width: '100%' }}>
                    Request New Reset Link
                </Link>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
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
                        Set New Password
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                        Enter your new password below
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
