'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, User, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

interface ChildProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
}

interface ChildSwitcherProps {
    parentProfile: {
        id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        profile_image_url?: string;
    };
    children: ChildProfile[];
    hasParentMembership: boolean;
    selectedProfileId: string;
    onProfileChange: (profileId: string) => void;
}

export default function ChildSwitcher({
    parentProfile,
    children,
    hasParentMembership,
    selectedProfileId,
    onProfileChange,
}: ChildSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Filter out the parent profile from children to avoid duplicates
    // This happens when a child registers first and has parent_guardian_id pointing to themselves
    const filteredChildren = children.filter(c => c.id !== parentProfile.id);

    // Don't show switcher if there are no other profiles to switch to
    if (filteredChildren.length === 0 && !hasParentMembership) {
        return null;
    }

    const allProfiles = [
        // Only show parent if they have membership (adult member managing children)
        // OR if there are children to switch between (guardian managing children)
        ...(hasParentMembership || filteredChildren.length > 0 ? [{ ...parentProfile, isParent: true }] : []),
        ...filteredChildren.map(c => ({ ...c, isParent: false })),
    ];

    const selectedProfile = allProfiles.find(p => p.user_id === selectedProfileId) || allProfiles[0];

    // Helper to get profile label
    const getProfileLabel = (isParent: boolean) => {
        if (!isParent) return 'Child';
        return hasParentMembership ? 'Myself' : 'Guardian';
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'rgba(197, 164, 86, 0.1)',
                    border: '1px solid var(--color-gold)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    width: '100%',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Avatar
                        src={selectedProfile?.profile_image_url}
                        firstName={selectedProfile?.first_name || ''}
                        lastName={selectedProfile?.last_name || ''}
                        size="sm"
                    />
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: 'var(--text-sm)' }}>
                            {selectedProfile?.first_name} {selectedProfile?.last_name}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {getProfileLabel((selectedProfile as { isParent?: boolean })?.isParent ?? false)}
                        </p>
                    </div>
                </div>
                <ChevronDown
                    size={18}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                    }}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10,
                        }}
                    />

                    {/* Dropdown */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 'var(--space-2)',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 20,
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: 'var(--space-2)' }}>
                            <p style={{
                                margin: 0,
                                padding: 'var(--space-2)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                Switch Profile
                            </p>

                            {allProfiles.map((profile) => (
                                <button
                                    key={profile.user_id}
                                    onClick={() => {
                                        onProfileChange(profile.user_id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        width: '100%',
                                        padding: 'var(--space-2)',
                                        background: profile.user_id === selectedProfileId
                                            ? 'rgba(197, 164, 86, 0.1)'
                                            : 'transparent',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <Avatar
                                        src={profile.profile_image_url}
                                        firstName={profile.first_name}
                                        lastName={profile.last_name}
                                        size="sm"
                                    />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '500', fontSize: 'var(--text-sm)' }}>
                                            {profile.first_name} {profile.last_name}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                            {getProfileLabel((profile as { isParent?: boolean }).isParent ?? false)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div style={{
                            borderTop: '1px solid var(--border-light)',
                            padding: 'var(--space-2)',
                        }}>
                            <Link
                                href="/dashboard/add-child"
                                onClick={() => setIsOpen(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-2)',
                                    color: 'var(--color-gold)',
                                    textDecoration: 'none',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: '500',
                                }}
                            >
                                <Plus size={16} />
                                Add Another Child
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
