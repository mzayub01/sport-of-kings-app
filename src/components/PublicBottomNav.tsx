'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, Award, Calendar, UserPlus } from 'lucide-react';

export default function PublicBottomNav() {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/about', label: 'About', icon: Info },
        { href: '/classes', label: 'Classes', icon: Award },
        { href: '/events', label: 'Events', icon: Calendar },
        { href: '/join', label: 'Join', icon: UserPlus, highlight: true },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    // Don't show on dashboard, admin, or instructor pages
    if (pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/instructor') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register')) {
        return null;
    }

    return (
        <>
            {/* Spacer to prevent content from being hidden behind bottom nav */}
            <div className="public-bottom-nav-spacer" />

            <nav className="public-bottom-nav">
                {links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`public-bottom-nav-item ${active ? 'active' : ''} ${link.highlight ? 'highlight' : ''}`}
                        >
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style jsx>{`
                .public-bottom-nav-spacer {
                    display: none;
                    height: 80px;
                }
                
                .public-bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 70px;
                    background: var(--bg-glass-dark);
                    backdrop-filter: var(--glass-blur);
                    -webkit-backdrop-filter: var(--glass-blur);
                    border-top: 1px solid var(--border-light);
                    padding: 0 var(--space-2);
                    padding-bottom: env(safe-area-inset-bottom, 0);
                    z-index: 100;
                    justify-content: space-around;
                    align-items: flex-start;
                }
                
                .public-bottom-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: var(--space-2) var(--space-3);
                    padding-top: var(--space-3);
                    color: var(--text-tertiary);
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all var(--transition-fast);
                    min-width: 60px;
                    position: relative;
                }
                
                .public-bottom-nav-item:hover {
                    color: var(--text-secondary);
                }
                
                .public-bottom-nav-item.active {
                    color: var(--color-gold);
                }
                
                .public-bottom-nav-item.active::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 3px;
                    background: var(--color-gold);
                    border-radius: 0 0 var(--radius-full) var(--radius-full);
                }
                
                .public-bottom-nav-item.highlight {
                    color: var(--color-gold);
                }
                
                .public-bottom-nav-item.highlight :global(svg) {
                    background: var(--color-gold-gradient);
                    color: var(--color-black);
                    padding: 6px;
                    border-radius: var(--radius-full);
                    width: 34px;
                    height: 34px;
                    box-shadow: var(--shadow-gold);
                }
                
                @media (max-width: 768px) {
                    .public-bottom-nav-spacer {
                        display: block;
                    }
                    
                    .public-bottom-nav {
                        display: flex;
                    }
                }
                
                @supports (padding-bottom: env(safe-area-inset-bottom)) {
                    .public-bottom-nav {
                        height: calc(70px + env(safe-area-inset-bottom));
                    }
                    
                    .public-bottom-nav-spacer {
                        height: calc(80px + env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </>
    );
}
