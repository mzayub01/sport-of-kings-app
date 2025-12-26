'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    user?: {
        id: string;
        email: string;
        role?: string;
    } | null;
}

export default function Navbar({ user }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const router = useRouter();
    const supabase = getSupabaseClient();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About Us' },
        { href: '/classes', label: 'BJJ Classes' },
        { href: '/events', label: 'Events' },
    ];

    return (
        <nav
            className="navbar"
            style={{
                boxShadow: isScrolled ? 'var(--shadow-md)' : 'none',
            }}
        >
            <div className="navbar-container">
                {/* Logo */}
                <Link href="/" className="navbar-logo">
                    <Image
                        src="/logo-full.png"
                        alt="Sport of Kings"
                        width={160}
                        height={48}
                        priority
                        style={{ height: '48px', width: 'auto' }}
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="navbar-link"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="navbar-actions">
                    {user ? (
                        <>
                            <Link href="/dashboard" className="btn btn-ghost btn-sm">
                                <User size={18} />
                                <span className="hidden md:block">Dashboard</span>
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="btn btn-outline btn-sm"
                            >
                                <LogOut size={18} />
                                <span className="hidden md:block">Sign Out</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-ghost btn-sm">
                                Sign In
                            </Link>
                            <Link href="/register" className="btn btn-primary btn-sm">
                                Join Now
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-glass-dark)',
                        backdropFilter: 'var(--glass-blur)',
                        borderBottom: '1px solid var(--border-light)',
                        padding: 'var(--space-4) var(--space-6)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-2)',
                    }}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="navbar-link"
                            onClick={() => setIsMenuOpen(false)}
                            style={{
                                padding: 'var(--space-3) 0',
                                borderBottom: '1px solid var(--border-light)',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!user && (
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                            <Link href="/login" className="btn btn-ghost" style={{ flex: 1 }}>
                                Sign In
                            </Link>
                            <Link href="/register" className="btn btn-primary" style={{ flex: 1 }}>
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
