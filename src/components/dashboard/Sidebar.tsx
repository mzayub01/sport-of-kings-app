'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    Calendar,
    CheckCircle,
    Video,
    Award,
    Bell,
    User,
    Settings,
    LogOut,
    BookOpen,
    X,
    Menu,
    PartyPopper,
    Users,
    CreditCard,
    MapPin,
    ChevronRight,
    Crown,
    ClipboardList
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
    role: 'member' | 'instructor' | 'professor' | 'admin';
    userName?: string;
}

export default function DashboardSidebar({ role, userName = 'Member' }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = getSupabaseClient();
    const [isOpen, setIsOpen] = useState(false);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleSignOut = async () => {
        setIsOpen(false);
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const memberLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/classes', label: 'Classes', icon: Calendar },
        { href: '/dashboard/events', label: 'Events', icon: PartyPopper },
        { href: '/dashboard/attendance', label: 'Attendance', icon: CheckCircle },
        { href: '/dashboard/progress', label: 'Belt Progress', icon: Award },
        { href: '/dashboard/videos', label: 'Video Library', icon: Video },
        { href: '/dashboard/naseeha', label: 'Naseeha', icon: BookOpen },
        { href: '/dashboard/announcements', label: 'Announcements', icon: Bell },
    ];

    const instructorLinks = [
        { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/instructor/classes', label: 'My Classes', icon: Calendar },
        { href: '/admin/class-roster', label: 'Class Roster', icon: ClipboardList },
        { href: '/instructor/attendance', label: 'Attendance', icon: CheckCircle },
        { href: '/instructor/students', label: 'Students', icon: User },
        { href: '/instructor/naseeha', label: 'Weekly Naseeha', icon: BookOpen },
    ];

    const professorLinks = [
        { href: '/professor', label: 'Grading', icon: Award },
    ];

    const adminLinks = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/members', label: 'Members', icon: User },
        { href: '/admin/memberships', label: 'Memberships', icon: CreditCard },
        { href: '/admin/waitlist', label: 'Waitlist', icon: Users },
        { href: '/admin/locations', label: 'Locations', icon: MapPin },
        { href: '/admin/membership-types', label: 'Membership Types', icon: CreditCard },
        { href: '/admin/classes', label: 'Classes', icon: Calendar },
        { href: '/admin/class-roster', label: 'Class Roster', icon: ClipboardList },
        { href: '/professor', label: 'Grading', icon: Award },
        { href: '/admin/instructors', label: 'Instructors', icon: Award },
        { href: '/admin/attendance', label: 'Attendance', icon: CheckCircle },
        { href: '/admin/videos', label: 'Videos', icon: Video },
        { href: '/admin/events', label: 'Events', icon: PartyPopper },
        { href: '/admin/naseeha', label: 'Naseeha', icon: BookOpen },
        { href: '/admin/announcements', label: 'Announcements', icon: Bell },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    const links = role === 'admin' ? adminLinks : role === 'instructor' ? instructorLinks : role === 'professor' ? professorLinks : memberLinks;

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="dashboard-mobile-header">
                <button
                    onClick={() => setIsOpen(true)}
                    className="dashboard-mobile-menu-btn"
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>
                <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <Image
                        src="/logo-full.png"
                        alt="Sport of Kings"
                        width={120}
                        height={36}
                        style={{ height: '32px', width: 'auto' }}
                    />
                </Link>
                <Link href="/dashboard/profile" className="dashboard-mobile-profile-btn">
                    <User size={20} />
                </Link>
            </div>

            {/* Overlay */}
            <div
                className={`dashboard-sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <Image
                                src="/logo-full.png"
                                alt="Sport of Kings"
                                width={140}
                                height={40}
                                style={{ height: '36px', width: 'auto' }}
                            />
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="sidebar-close-btn"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div style={{
                        marginTop: 'var(--space-4)',
                        padding: 'var(--space-3)',
                        background: 'rgba(197, 164, 86, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-gold-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-black)',
                            fontWeight: '700',
                        }}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontWeight: '600', fontSize: 'var(--text-sm)', margin: 0 }}>{userName}</p>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>
                                {role}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <span className="sidebar-section-title">Menu</span>
                        {links.slice(0, 8).map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon size={20} />
                                <span style={{ flex: 1 }}>{link.label}</span>
                                <ChevronRight size={16} style={{ opacity: 0.3 }} className="sidebar-link-arrow" />
                            </Link>
                        ))}
                    </div>

                    {links.length > 8 && (
                        <div className="sidebar-section">
                            <span className="sidebar-section-title">More</span>
                            {links.slice(8).map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <link.icon size={20} />
                                    <span style={{ flex: 1 }}>{link.label}</span>
                                    <ChevronRight size={16} style={{ opacity: 0.3 }} className="sidebar-link-arrow" />
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="sidebar-section sidebar-account-section" style={{ marginTop: 'auto' }}>
                        <span className="sidebar-section-title">Account</span>
                        <Link
                            href="/dashboard/profile"
                            className={`sidebar-link ${pathname === '/dashboard/profile' ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <User size={20} />
                            <span style={{ flex: 1 }}>Profile</span>
                            <ChevronRight size={16} style={{ opacity: 0.3 }} className="sidebar-link-arrow" />
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="sidebar-link"
                            style={{
                                width: '100%',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                color: 'var(--color-red)',
                            }}
                        >
                            <LogOut size={20} />
                            <span style={{ flex: 1 }}>Sign Out</span>
                        </button>
                    </div>
                </nav>
            </aside>

            <style jsx>{`
                .dashboard-mobile-header {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: var(--bg-glass-dark);
                    backdrop-filter: var(--glass-blur);
                    -webkit-backdrop-filter: var(--glass-blur);
                    border-bottom: 1px solid var(--border-light);
                    padding: 0 var(--space-4);
                    align-items: center;
                    justify-content: space-between;
                    z-index: 50;
                }
                
                .dashboard-mobile-menu-btn,
                .dashboard-mobile-profile-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    border: none;
                    background: transparent;
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    color: var(--text-primary);
                    transition: background var(--transition-fast);
                }
                
                .dashboard-mobile-menu-btn:hover,
                .dashboard-mobile-profile-btn:hover {
                    background: var(--bg-tertiary);
                }
                
                .dashboard-mobile-profile-btn {
                    background: rgba(197, 164, 86, 0.1);
                    color: var(--color-gold);
                }
                
                .dashboard-sidebar-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0);
                    z-index: 55;
                    pointer-events: none;
                    transition: background 0.3s ease;
                }
                
                .dashboard-sidebar-overlay.open {
                    background: rgba(0, 0, 0, 0.5);
                    pointer-events: auto;
                }
                
                .sidebar-close-btn {
                    display: none;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border: none;
                    background: transparent;
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    color: var(--text-primary);
                    transition: background var(--transition-fast);
                }
                
                .sidebar-close-btn:hover {
                    background: var(--bg-tertiary);
                }
                
                @media (max-width: 1024px) {
                    .dashboard-mobile-header {
                        display: flex;
                    }
                    
                    .dashboard-sidebar-overlay {
                        display: block;
                    }
                    
                    .sidebar-close-btn {
                        display: flex;
                    }
                    
                    :global(.sidebar) {
                        transform: translateX(-100%);
                        z-index: 60;
                    }
                    
                    :global(.sidebar.open) {
                        transform: translateX(0);
                    }
                    
                    :global(.dashboard-main) {
                        margin-left: 0;
                        padding-top: 76px;
                    }
                }
                
                @supports (padding-top: env(safe-area-inset-top)) {
                    .dashboard-mobile-header {
                        padding-top: env(safe-area-inset-top);
                        height: calc(60px + env(safe-area-inset-top));
                    }
                    
                    @media (max-width: 1024px) {
                        :global(.dashboard-main) {
                            padding-top: calc(76px + env(safe-area-inset-top));
                        }
                    }
                }
            `}</style>
        </>
    );
}
