'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Award, User, CheckCircle } from 'lucide-react';

interface BottomNavProps {
    role?: 'member' | 'instructor' | 'professor' | 'admin';
}

export default function BottomNav({ role = 'member' }: BottomNavProps) {
    const pathname = usePathname();

    // Member nav with central check-in button
    const memberNavItems = [
        { href: '/dashboard', label: 'Home', icon: Home, isCheckIn: false },
        { href: '/dashboard/classes', label: 'Classes', icon: Calendar, isCheckIn: false },
        { href: '/dashboard/classes', label: 'Check In', icon: CheckCircle, isCheckIn: true },
        { href: '/dashboard/progress', label: 'Progress', icon: Award, isCheckIn: false },
        { href: '/dashboard/profile', label: 'Profile', icon: User, isCheckIn: false },
    ];

    const adminLinks = [
        { href: '/admin', label: 'Home', icon: Home, isCheckIn: false },
        { href: '/admin/members', label: 'Members', icon: User, isCheckIn: false },
        { href: '/admin/class-roster', label: 'Roster', icon: CheckCircle, isCheckIn: true },
        { href: '/admin/classes', label: 'Classes', icon: Calendar, isCheckIn: false },
        { href: '/professor', label: 'Grading', icon: Award, isCheckIn: false },
    ];

    const instructorLinks = [
        { href: '/instructor', label: 'Home', icon: Home, isCheckIn: false },
        { href: '/instructor/classes', label: 'Classes', icon: Calendar, isCheckIn: false },
        { href: '/admin/class-roster', label: 'Check-in', icon: CheckCircle, isCheckIn: true },
        { href: '/instructor/students', label: 'Students', icon: User, isCheckIn: false },
        { href: '/instructor/naseeha', label: 'Naseeha', icon: Award, isCheckIn: false },
    ];

    const professorLinks = [
        { href: '/professor', label: 'Grading', icon: Award, isCheckIn: false },
    ];

    const links = role === 'admin' ? adminLinks : role === 'instructor' ? instructorLinks : role === 'professor' ? professorLinks : memberNavItems;

    const isActive = (href: string) => {
        if (href === '/dashboard' || href === '/admin' || href === '/instructor' || href === '/professor') {
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
                    {links.map((link, index) => {
                        const Icon = link.icon;
                        const active = isActive(link.href);

                        if (link.isCheckIn) {
                            // Central check-in button with special styling
                            return (
                                <Link
                                    key={`${link.href}-${index}`}
                                    href={link.href}
                                    className="nav-item check-in-btn"
                                >
                                    <div className="check-in-icon">
                                        <Icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <span className="nav-label check-in-label">{link.label}</span>
                                </Link>
                            );
                        }

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
                    min-width: 52px;
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
                
                /* Central Check-in Button */
                .check-in-btn {
                    margin-top: -20px;
                }
                
                .check-in-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #2D7D46 0%, #3A9659 100%);
                    color: white;
                    box-shadow: 
                        0 4px 16px rgba(45, 125, 70, 0.4),
                        0 2px 4px rgba(45, 125, 70, 0.2);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .check-in-btn:hover .check-in-icon,
                .check-in-btn:active .check-in-icon {
                    transform: scale(1.05);
                    box-shadow: 
                        0 6px 20px rgba(45, 125, 70, 0.5),
                        0 2px 4px rgba(45, 125, 70, 0.3);
                }
                
                .check-in-label {
                    color: var(--color-green);
                    font-weight: 700;
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
                
                /* Hide bottom nav when sidebar is open */
                :global(.dashboard-sidebar-overlay.open) ~ .bottom-nav,
                :global(body:has(.dashboard-sidebar-overlay.open)) .bottom-nav {
                    opacity: 0;
                    pointer-events: none;
                }
            `}</style>
        </>
    );
}
