'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Home, Info, Award, Calendar, Crown, ChevronRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

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
    const pathname = usePathname();
    const supabase = getSupabaseClient();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    const handleSignOut = async () => {
        setIsMenuOpen(false);
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const navLinks = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/about', label: 'About Us', icon: Info },
        { href: '/classes', label: 'BJJ Classes', icon: Award },
        { href: '/events', label: 'Events', icon: Calendar },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <>
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
                            style={{ height: '40px', width: 'auto' }}
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navbar-links">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`navbar-link ${isActive(link.href) ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="navbar-actions">
                        {user ? (
                            <>
                                <Link href="/dashboard" className="btn btn-ghost btn-sm desktop-only">
                                    <User size={18} />
                                    <span>Dashboard</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="btn btn-outline btn-sm desktop-only"
                                >
                                    <LogOut size={18} />
                                    <span>Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="btn btn-ghost btn-sm desktop-only">
                                    Sign In
                                </Link>
                                <Link href="/join" className="btn btn-primary btn-sm desktop-only">
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
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <div className={`mobile-menu-panel ${isMenuOpen ? 'open' : ''}`}>
                {/* Menu Header */}
                <div className="mobile-menu-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Crown size={24} color="var(--color-gold)" />
                        <span style={{ fontWeight: '700', fontSize: 'var(--text-lg)' }}>Sport of Kings</span>
                    </div>
                    <button
                        className="mobile-menu-close"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Menu Links */}
                <div className="mobile-menu-nav">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`mobile-menu-link ${isActive(link.href) ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Icon size={22} />
                                <span>{link.label}</span>
                                <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                            </Link>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className="mobile-menu-divider" />

                {/* User Section */}
                <div className="mobile-menu-footer">
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="mobile-menu-link"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <User size={22} />
                                <span>My Dashboard</span>
                                <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="mobile-menu-link"
                                style={{ width: '100%', textAlign: 'left', color: 'var(--color-red)' }}
                            >
                                <LogOut size={22} />
                                <span>Sign Out</span>
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                            <Link
                                href="/login"
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/join"
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
