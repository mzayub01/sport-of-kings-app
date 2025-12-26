'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
    MapPin
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
    role: 'member' | 'instructor' | 'admin';
    userName?: string;
}

export default function DashboardSidebar({ role, userName = 'Member' }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = getSupabaseClient();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
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
        { href: '/instructor/attendance', label: 'Attendance', icon: CheckCircle },
        { href: '/instructor/students', label: 'Students', icon: User },
        { href: '/instructor/naseeha', label: 'Weekly Naseeha', icon: BookOpen },
    ];

    const adminLinks = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/members', label: 'Members', icon: User },
        { href: '/admin/memberships', label: 'Memberships', icon: CreditCard },
        { href: '/admin/waitlist', label: 'Waitlist', icon: Users },
        { href: '/admin/locations', label: 'Locations', icon: MapPin },
        { href: '/admin/membership-types', label: 'Membership Types', icon: CreditCard },
        { href: '/admin/classes', label: 'Classes', icon: Calendar },
        { href: '/admin/instructors', label: 'Instructors', icon: Award },
        { href: '/admin/attendance', label: 'Attendance', icon: CheckCircle },
        { href: '/admin/videos', label: 'Videos', icon: Video },
        { href: '/admin/events', label: 'Events', icon: PartyPopper },
        { href: '/admin/naseeha', label: 'Naseeha', icon: BookOpen },
        { href: '/admin/announcements', label: 'Announcements', icon: Bell },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    const links = role === 'admin' ? adminLinks : role === 'instructor' ? instructorLinks : memberLinks;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-ghost btn-icon"
                style={{
                    position: 'fixed',
                    top: 'var(--space-4)',
                    left: 'var(--space-4)',
                    zIndex: 60,
                    display: 'none',
                }}
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 40,
                    }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar ${isOpen ? 'open' : ''}`}
                style={{
                    transform: isOpen ? 'translateX(0)' : undefined,
                }}
            >
                <div className="sidebar-header">
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Image
                            src="/logo-full.png"
                            alt="Sport of Kings"
                            width={140}
                            height={40}
                            style={{ height: '36px', width: 'auto' }}
                        />
                    </Link>
                    <p style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-2)',
                    }}>
                        Welcome, {userName}
                    </p>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <span className="sidebar-section-title">Menu</span>
                        {links.slice(0, 7).map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon size={20} />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {links.length > 7 && (
                        <div className="sidebar-section">
                            <span className="sidebar-section-title">More</span>
                            {links.slice(7).map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <link.icon size={20} />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                        <span className="sidebar-section-title">Account</span>
                        <Link
                            href="/dashboard/profile"
                            className={`sidebar-link ${pathname === '/dashboard/profile' ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <User size={20} />
                            Profile
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="sidebar-link"
                            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </nav>
            </aside>

            <style jsx>{`
        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          button[aria-label="Toggle menu"] {
            display: flex !important;
          }
        }
      `}</style>
        </>
    );
}
