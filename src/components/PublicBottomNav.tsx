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
                <div className="public-bottom-nav-inner">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`public-nav-item ${active ? 'active' : ''} ${link.highlight ? 'highlight' : ''}`}
                            >
                                <div className={`nav-icon-wrapper ${active ? 'active' : ''} ${link.highlight ? 'highlight' : ''}`}>
                                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                                </div>
                                <span className="nav-label">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <style jsx>{`
                .public-bottom-nav-spacer {
                    display: none;
                    height: 90px;
                }
                
                .public-bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    padding: 0 var(--space-3);
                    padding-bottom: env(safe-area-inset-bottom, 8px);
                }
                
                .public-bottom-nav-inner {
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 24px;
                    padding: var(--space-2) var(--space-3);
                    margin: 0 auto;
                    max-width: 420px;
                    box-shadow: 
                        0 -4px 24px rgba(0, 0, 0, 0.08),
                        0 0 0 1px rgba(255, 255, 255, 0.8),
                        inset 0 1px 0 rgba(255, 255, 255, 0.9);
                }
                
                .public-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: var(--space-2);
                    color: var(--text-tertiary);
                    text-decoration: none;
                    transition: all 0.2s ease;
                    min-width: 56px;
                    position: relative;
                }
                
                .nav-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 14px;
                    background: transparent;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .nav-icon-wrapper.active {
                    background: rgba(197, 164, 86, 0.15);
                    color: var(--color-gold);
                    transform: translateY(-2px);
                }
                
                .nav-icon-wrapper.highlight {
                    background: linear-gradient(135deg, #D4B86A 0%, #C5A456 50%, #A88B3D 100%);
                    color: var(--color-black);
                    box-shadow: 0 4px 12px rgba(197, 164, 86, 0.4);
                }
                
                .nav-icon-wrapper.highlight.active {
                    transform: scale(1.08) translateY(-2px);
                }
                
                .nav-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.2px;
                    text-transform: uppercase;
                    transition: color 0.2s ease;
                }
                
                .public-nav-item:hover .nav-icon-wrapper:not(.highlight) {
                    background: rgba(0, 0, 0, 0.05);
                }
                
                .public-nav-item.active .nav-label {
                    color: var(--color-gold);
                }
                
                .public-nav-item.highlight .nav-label {
                    color: var(--color-gold-dark);
                }
                
                @media (max-width: 768px) {
                    .public-bottom-nav-spacer {
                        display: block;
                    }
                    
                    .public-bottom-nav {
                        display: block;
                    }
                }
                
                @supports (padding-bottom: env(safe-area-inset-bottom)) {
                    .public-bottom-nav-spacer {
                        height: calc(90px + env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </>
    );
}
