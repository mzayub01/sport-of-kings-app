'use client';

import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Award, Shield, Edit, ChevronDown, AlertCircle, CheckCircle, Calendar, MapPin, Filter, ClipboardList } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Location, MembershipType } from '@/lib/types';
import MemberAttendanceModal from '@/components/admin/MemberAttendanceModal';

interface Member {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: 'member' | 'instructor' | 'admin';
    belt_rank: string;
    stripes: number;
    date_of_birth: string;
    city: string;
    is_child: boolean;
    created_at: string;
    memberships?: any[];
}

const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black'];
const ROLES = ['member', 'instructor', 'admin'];

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [beltFilter, setBeltFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [membershipTypeFilter, setMembershipTypeFilter] = useState('all');

    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [attendanceMember, setAttendanceMember] = useState<Member | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        role: 'member',
        belt_rank: 'white',
        stripes: 0,
    });

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterMembers();
    }, [members, search, roleFilter, beltFilter, locationFilter, membershipTypeFilter]);

    const fetchData = async () => {
        try {
            const [profilesRes, membershipsRes, locationsRes, typesRes] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('memberships').select('*, location:locations(name), membership_type:membership_types(name)'),
                supabase.from('locations').select('*').eq('is_active', true).order('name'),
                supabase.from('membership_types').select('*').eq('is_active', true).order('name'),
            ]);

            if (profilesRes.error) throw profilesRes.error;

            const profiles = profilesRes.data || [];
            const memberships = membershipsRes.data || [];

            // Attach memberships to profiles
            const membersWithData = profiles.map((profile: Member) => ({
                ...profile,
                memberships: memberships.filter((m: { user_id: string }) => m.user_id === profile.user_id),
            }));

            setMembers(membersWithData);
            setLocations(locationsRes.data || []);
            setMembershipTypes(typesRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const filterMembers = () => {
        let filtered = [...members];

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(m =>
                m.first_name?.toLowerCase().includes(searchLower) ||
                m.last_name?.toLowerCase().includes(searchLower) ||
                m.email?.toLowerCase().includes(searchLower) ||
                m.phone?.includes(search)
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(m => m.role === roleFilter);
        }

        // Belt filter
        if (beltFilter !== 'all') {
            filtered = filtered.filter(m => m.belt_rank === beltFilter);
        }

        // Location filter
        if (locationFilter !== 'all') {
            filtered = filtered.filter(m =>
                m.memberships?.some(mem =>
                    mem.location_id === locationFilter &&
                    (mem.status === 'active' || mem.status === 'pending')
                )
            );
        }

        // Membership Type filter
        if (membershipTypeFilter !== 'all') {
            filtered = filtered.filter(m =>
                m.memberships?.some(mem =>
                    mem.membership_type_id === membershipTypeFilter &&
                    (mem.status === 'active' || mem.status === 'pending')
                )
            );
        }

        setFilteredMembers(filtered);
    };

    const openEditModal = (member: Member) => {
        setEditingMember(member);
        setFormData({
            role: member.role || 'member',
            belt_rank: member.belt_rank || 'white',
            stripes: member.stripes || 0,
        });
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        setError('');
        setSuccess('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: formData.role,
                    belt_rank: formData.belt_rank,
                    stripes: formData.stripes,
                })
                .eq('id', editingMember.id);

            if (error) throw error;

            // Also record belt progression if belt changed
            if (formData.belt_rank !== editingMember.belt_rank || formData.stripes !== editingMember.stripes) {
                const { data: { user } } = await supabase.auth.getUser();
                await supabase
                    .from('belt_progression')
                    .insert({
                        user_id: editingMember.user_id,
                        belt_rank: formData.belt_rank,
                        stripes: formData.stripes,
                        awarded_by: user?.id,
                        awarded_date: new Date().toISOString().split('T')[0],
                    });
            }

            setSuccess(`${editingMember.first_name}'s profile updated successfully!`);
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to update member');
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'admin': return 'badge-red';
            case 'instructor': return 'badge-gold';
            default: return 'badge-gray';
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Members</h1>
                <p className="dashboard-subtitle">
                    Manage all {members.length} registered members
                </p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
                        <label className="form-label">Search</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, email, or phone..."
                                style={{ paddingLeft: '40px' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
                        <label className="form-label">Role</label>
                        <select
                            className="form-input"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            {ROLES.map(role => (
                                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
                        <label className="form-label">Belt</label>
                        <select
                            className="form-input"
                            value={beltFilter}
                            onChange={(e) => setBeltFilter(e.target.value)}
                        >
                            <option value="all">All Belts</option>
                            {BELT_RANKS.map(belt => (
                                <option key={belt} value={belt}>{belt.charAt(0).toUpperCase() + belt.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
                        <label className="form-label">Location</label>
                        <select
                            className="form-input"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        >
                            <option value="all">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
                        <label className="form-label">Membership</label>
                        <select
                            className="form-input"
                            value={membershipTypeFilter}
                            onChange={(e) => setMembershipTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {membershipTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="stat-card glass-card">
                    <p className="stat-label">Total Members</p>
                    <p className="stat-value">{filteredMembers.length} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>/ {members.length}</span></p>
                </div>
                <div className="stat-card glass-card">
                    <p className="stat-label">Admins</p>
                    <p className="stat-value">{filteredMembers.filter(m => m.role === 'admin').length}</p>
                </div>
                <div className="stat-card glass-card">
                    <p className="stat-label">Instructors</p>
                    <p className="stat-value">{filteredMembers.filter(m => m.role === 'instructor').length}</p>
                </div>
                <div className="stat-card glass-card">
                    <p className="stat-label">Child Members</p>
                    <p className="stat-value">{filteredMembers.filter(m => m.is_child).length}</p>
                </div>
            </div>

            {/* Members List */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {filteredMembers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <User size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>No members found matching your criteria.</p>
                        </div>
                    ) : (
                        <div>
                            {filteredMembers.map((member, index) => (
                                <div
                                    key={member.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-4)',
                                        padding: 'var(--space-4)',
                                        borderBottom: index < filteredMembers.length - 1 ? '1px solid var(--border-light)' : 'none',
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--color-gold-gradient)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '600',
                                        color: 'var(--color-black)',
                                        flexShrink: 0,
                                    }}>
                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: '600' }}>
                                                {member.first_name} {member.last_name}
                                            </span>
                                            <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                                                {member.role || 'member'}
                                            </span>
                                            <span className={`badge badge-belt-${member.belt_rank || 'white'}`}>
                                                {(member.belt_rank || 'white').charAt(0).toUpperCase() + (member.belt_rank || 'white').slice(1)}
                                            </span>
                                            {member.is_child && (
                                                <span className="badge badge-gold">Child</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', marginRight: 'var(--space-3)' }}>
                                                <Mail size={14} /> {member.email}
                                            </span>
                                            {member.phone && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', marginRight: 'var(--space-3)' }}>
                                                    <Phone size={14} /> {member.phone}
                                                </span>
                                            )}
                                            {member.city && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                                    <MapPin size={14} /> {member.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Joined Date */}
                                    <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <Calendar size={14} />
                                        {new Date(member.created_at).toLocaleDateString('en-GB')}
                                    </div>

                                    {/* View Attendance Button */}
                                    <button
                                        onClick={() => {
                                            setAttendanceMember(member);
                                            setShowAttendanceModal(true);
                                        }}
                                        className="btn btn-ghost btn-sm"
                                        title="View Attendance"
                                    >
                                        <ClipboardList size={18} />
                                    </button>

                                    {/* Edit Button */}
                                    <button
                                        onClick={() => openEditModal(member)}
                                        className="btn btn-ghost btn-sm"
                                        title="Edit Member"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && editingMember && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                Edit Member: {editingMember.first_name} {editingMember.last_name}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-4)',
                                    marginBottom: 'var(--space-6)',
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--color-gold-gradient)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'var(--text-xl)',
                                        fontWeight: '600',
                                        color: 'var(--color-black)',
                                    }}>
                                        {editingMember.first_name?.[0]}{editingMember.last_name?.[0]}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '600', margin: 0 }}>{editingMember.email}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                                            Joined {new Date(editingMember.created_at).toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Shield size={16} style={{ marginRight: 'var(--space-1)' }} />
                                        Role
                                    </label>
                                    <select
                                        className="form-input"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {ROLES.map(role => (
                                            <option key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                                        {formData.role === 'admin' && '⚠️ Admins have full access to all data and settings.'}
                                        {formData.role === 'instructor' && 'Instructors can manage classes and view attendance.'}
                                        {formData.role === 'member' && 'Standard member access.'}
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Award size={16} style={{ marginRight: 'var(--space-1)' }} />
                                        Belt Rank
                                    </label>
                                    <select
                                        className="form-input"
                                        value={formData.belt_rank}
                                        onChange={(e) => setFormData({ ...formData, belt_rank: e.target.value })}
                                    >
                                        {BELT_RANKS.map(belt => (
                                            <option key={belt} value={belt}>
                                                {belt.charAt(0).toUpperCase() + belt.slice(1)} Belt
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Stripes (0-4)</label>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        {[0, 1, 2, 3, 4].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, stripes: s })}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: formData.stripes === s ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                                    background: formData.stripes === s ? 'var(--bg-secondary)' : 'transparent',
                                                    cursor: 'pointer',
                                                    fontWeight: formData.stripes === s ? '600' : '400',
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    {(formData.belt_rank !== editingMember.belt_rank || formData.stripes !== editingMember.stripes) && (
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gold)', marginTop: 'var(--space-2)' }}>
                                            🎉 Belt change will be recorded in their progression history!
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance Modal */}
            <MemberAttendanceModal
                isOpen={showAttendanceModal}
                onClose={() => {
                    setShowAttendanceModal(false);
                    setAttendanceMember(null);
                }}
                member={attendanceMember}
            />
        </div>
    );
}
