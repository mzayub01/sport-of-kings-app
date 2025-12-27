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
                {links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`bottom-nav-item ${active ? 'active' : ''}`}
                        >
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style jsx>{`
                .bottom-nav-spacer {
                    display: none;
                    height: 80px;
                }
                
                .bottom-nav {
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
                
                .bottom-nav-item {
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
                }
                
                .bottom-nav-item:hover {
                    color: var(--text-secondary);
                }
                
                .bottom-nav-item.active {
                    color: var(--color-gold);
                }
                
                .bottom-nav-item.active::before {
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
                
                @media (max-width: 1024px) {
                    .bottom-nav-spacer {
                        display: block;
                    }
                    
                    .bottom-nav {
                        display: flex;
                    }
                }
                
                @supports (padding-bottom: env(safe-area-inset-bottom)) {
                    .bottom-nav {
                        height: calc(70px + env(safe-area-inset-bottom));
                    }
                    
                    .bottom-nav-spacer {
                        height: calc(80px + env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </>
    );
}
