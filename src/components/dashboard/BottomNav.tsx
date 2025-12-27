'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Award, User, Bell } from 'lucide-react';

interface BottomNavProps {
    role?: 'member' | 'instructor' | 'admin';
}

export default function BottomNav({ role = 'member' }: BottomNavProps) {
    const pathname = usePathname();

    const memberLinks = [
        { href: '/dashboard', label: 'Home', icon: Home },
        { href: '/dashboard/classes', label: 'Classes', icon: Calendar },
        { href: '/dashboard/progress', label: 'Progress', icon: Award },
        { href: '/dashboard/announcements', label: 'Updates', icon: Bell },
        { href: '/dashboard/profile', label: 'Profile', icon: User },
    ];

    const adminLinks = [
        { href: '/admin', label: 'Home', icon: Home },
        { href: '/admin/members', label: 'Members', icon: User },
        { href: '/admin/classes', label: 'Classes', icon: Calendar },
        { href: '/admin/waitlist', label: 'Waitlist', icon: Bell },
        { href: '/admin/settings', label: 'Settings', icon: User },
    ];

    const instructorLinks = [
        { href: '/instructor', label: 'Home', icon: Home },
        { href: '/instructor/classes', label: 'Classes', icon: Calendar },
        { href: '/instructor/attendance', label: 'Check-in', icon: Award },
        { href: '/instructor/students', label: 'Students', icon: User },
        { href: '/instructor/naseeha', label: 'Naseeha', icon: Bell },
    ];

    const links = role === 'admin' ? adminLinks : role === 'instructor' ? instructorLinks : memberLinks;

    const isActive = (href: string) => {
        if (href === '/dashboard' || href === '/admin' || href === '/instructor') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Spacer to prevent content from being hidden behind bottom nav */}
            <div className="bottom-nav-spacer" />

            <nav className="bottom-nav">
                <div className="bottom-nav-inner">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-item ${active ? 'active' : ''}`}
                            >
                                <div className={`icon-wrapper ${active ? 'active' : ''}`}>
                                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                                </div>
                                <span className="nav-label">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <style jsx>{`
                .bottom-nav-spacer {
                    display: none;
                    height: 90px;
                }
                
                .bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    padding: 0 var(--space-3);
                    padding-bottom: env(safe-area-inset-bottom, 8px);
                }
                
                .bottom-nav-inner {
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
                
                .nav-item {
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
                
                .icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 14px;
                    background: transparent;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .icon-wrapper.active {
                    background: linear-gradient(135deg, rgba(212, 184, 106, 0.2) 0%, rgba(197, 164, 86, 0.25) 100%);
                    color: var(--color-gold);
                    transform: translateY(-2px);
                }
                
                .nav-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.2px;
                    text-transform: uppercase;
                    transition: color 0.2s ease;
                }
                
                .nav-item:hover .icon-wrapper:not(.active) {
                    background: rgba(0, 0, 0, 0.05);
                }
                
                .nav-item.active .nav-label {
                    color: var(--color-gold);
                }
                
                @media (max-width: 1024px) {
                    .bottom-nav-spacer {
                        display: block;
                    }
                    
                    .bottom-nav {
                        display: block;
                    }
                }
                
                @supports (padding-bottom: env(safe-area-inset-bottom)) {
                    .bottom-nav-spacer {
                        height: calc(90px + env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </>
    );
}
