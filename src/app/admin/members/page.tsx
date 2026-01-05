'use client';

import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Award, Shield, Edit, ChevronDown, AlertCircle, CheckCircle, XCircle, Calendar, MapPin, Filter, ClipboardList, Plus, Loader2, Eye, EyeOff, X, Info, ChevronUp, Trash2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Location, MembershipType } from '@/lib/types';
import MemberAttendanceModal from '@/components/admin/MemberAttendanceModal';
import Avatar from '@/components/Avatar';

interface Member {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: 'member' | 'instructor' | 'professor' | 'admin';
    belt_rank: string;
    stripes: number;
    date_of_birth: string;
    address?: string;
    city: string;
    postcode?: string;
    gender?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    medical_info?: string;
    is_child: boolean;
    parent_guardian_id?: string;
    guardian_email?: string;
    profile_image_url?: string;
    created_at: string;
    best_practice_accepted?: boolean;
    best_practice_accepted_at?: string;
    waiver_accepted?: boolean;
    waiver_accepted_at?: string;
    memberships?: any[];
}

const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black'];
const ROLES = ['member', 'instructor', 'professor', 'admin'];

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
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [viewingMember, setViewingMember] = useState<Member | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        role: 'member',
        belt_rank: 'white',
        stripes: 0,
    });

    // Create user state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'member',
    });

    // Delete member state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingMember, setDeletingMember] = useState<Member | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

            // Create a map of profile IDs to emails for guardian lookup
            const profileIdToEmail: Record<string, string> = {};
            profiles.forEach((p: any) => {
                profileIdToEmail[p.id] = p.email;
            });

            // Attach memberships and guardian email to profiles
            const membersWithData = profiles.map((profile: any) => ({
                ...profile,
                memberships: memberships.filter((m: { user_id: string }) => m.user_id === profile.user_id),
                guardian_email: profile.is_child && profile.parent_guardian_id
                    ? profileIdToEmail[profile.parent_guardian_id]
                    : undefined,
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

            // Handle instructor record creation/management
            if (formData.role === 'instructor' && editingMember.role !== 'instructor') {
                // Check if instructor record already exists
                const { data: existingInstructor } = await supabase
                    .from('instructors')
                    .select('id')
                    .eq('user_id', editingMember.user_id)
                    .single();

                if (!existingInstructor) {
                    // Create new instructor record
                    await supabase
                        .from('instructors')
                        .insert({
                            user_id: editingMember.user_id,
                            is_active: true,
                        });
                } else {
                    // Reactivate existing instructor record
                    await supabase
                        .from('instructors')
                        .update({ is_active: true })
                        .eq('user_id', editingMember.user_id);
                }
            } else if (formData.role !== 'instructor' && editingMember.role === 'instructor') {
                // Deactivate instructor record when role changed from instructor
                await supabase
                    .from('instructors')
                    .update({ is_active: false })
                    .eq('user_id', editingMember.user_id);
            }

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

    const handleDeleteMember = async () => {
        if (!deletingMember) return;

        setDeleteLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/members?userId=${deletingMember.user_id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete member');
            }

            setSuccess(`${deletingMember.first_name} ${deletingMember.last_name} has been deleted.`);
            setShowDeleteModal(false);
            setDeletingMember(null);
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to delete member');
        } finally {
            setDeleteLoading(false);
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'admin': return 'badge-red';
            case 'instructor': return 'badge-gold';
            case 'professor': return 'badge-blue';
            default: return 'badge-gray';
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createFormData),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(`User ${createFormData.email} created successfully!`);
                setShowCreateModal(false);
                setCreateFormData({ email: '', password: '', firstName: '', lastName: '', role: 'member' });
                fetchData();
            } else {
                setError(data.error || 'Failed to create user');
            }
        } catch {
            setError('Failed to create user');
        } finally {
            setCreateLoading(false);
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
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                    <h1 className="dashboard-title">Members</h1>
                    <p className="dashboard-subtitle">
                        Manage all {members.length} registered members
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                    <Plus size={18} />
                    Create User
                </button>
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
                                    <Avatar
                                        src={member.profile_image_url}
                                        firstName={member.first_name}
                                        lastName={member.last_name}
                                        size="md"
                                    />

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
                                    </div>

                                    {/* Joined Date */}
                                    <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <Calendar size={14} />
                                        {new Date(member.created_at).toLocaleDateString('en-GB')}
                                    </div>

                                    {/* View Details Button */}
                                    <button
                                        onClick={() => {
                                            setViewingMember(member);
                                            setShowDetailsModal(true);
                                        }}
                                        className="btn btn-ghost btn-sm"
                                        title="View Details"
                                    >
                                        <Info size={18} />
                                    </button>

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

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => {
                                            setDeletingMember(member);
                                            setShowDeleteModal(true);
                                        }}
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--color-red)' }}
                                        title="Delete Member"
                                    >
                                        <Trash2 size={18} />
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

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Plus size={20} />
                                Create User
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                    <div className="form-group">
                                        <label className="form-label">First Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={createFormData.firstName}
                                            onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Last Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={createFormData.lastName}
                                            onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required
                                        value={createFormData.email}
                                        onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-input"
                                            required
                                            minLength={6}
                                            value={createFormData.password}
                                            onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-tertiary)',
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-select"
                                        value={createFormData.role}
                                        onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                                    >
                                        {ROLES.map((role) => (
                                            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createLoading} className="btn btn-primary">
                                    {createLoading ? (
                                        <>
                                            <Loader2 size={16} className="spinner" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Create User
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingMember && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Trash2 size={24} color="var(--color-red)" />
                                Delete Member
                            </h2>
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeletingMember(null); }}
                                className="btn btn-ghost btn-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
                                <AlertCircle size={18} />
                                <span>This action cannot be undone!</span>
                            </div>
                            <p>Are you sure you want to delete <strong>{deletingMember.first_name} {deletingMember.last_name}</strong>?</p>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                                This will permanently remove their profile, membership, and all attendance records.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeletingMember(null); }}
                                className="btn btn-ghost"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMember}
                                className="btn"
                                style={{ background: 'var(--color-red)', color: 'white' }}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <>
                                        <Loader2 size={16} className="spinner" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete Member
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Details Modal */}
            {showDetailsModal && viewingMember && (
                <div className="modal-overlay" onClick={() => { setShowDetailsModal(false); setViewingMember(null); }}>
                    <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <Avatar
                                    src={viewingMember.profile_image_url}
                                    firstName={viewingMember.first_name}
                                    lastName={viewingMember.last_name}
                                    size="md"
                                />
                                <div>
                                    <span>{viewingMember.first_name} {viewingMember.last_name}</span>
                                    {viewingMember.is_child && (
                                        <span className="badge badge-gold" style={{ marginLeft: 'var(--space-2)' }}>Child</span>
                                    )}
                                </div>
                            </h2>
                            <button
                                onClick={() => { setShowDetailsModal(false); setViewingMember(null); }}
                                className="btn btn-ghost btn-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {/* Contact Information */}
                            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                                Contact Information
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Email</p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <Mail size={14} />
                                        {viewingMember.is_child && viewingMember.guardian_email ? (
                                            <span><span style={{ color: 'var(--text-tertiary)' }}>Guardian:</span> {viewingMember.guardian_email}</span>
                                        ) : viewingMember.email}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Phone</p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <Phone size={14} /> {viewingMember.phone || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Address</p>
                                    <p style={{ margin: 0 }}>{viewingMember.address || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>City / Postcode</p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <MapPin size={14} /> {viewingMember.city || '-'}{viewingMember.postcode ? `, ${viewingMember.postcode}` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                                Personal Information
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Date of Birth</p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <Calendar size={14} /> {viewingMember.date_of_birth ? new Date(viewingMember.date_of_birth).toLocaleDateString('en-GB') : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Gender</p>
                                    <p style={{ margin: 0 }}>{viewingMember.gender ? viewingMember.gender.charAt(0).toUpperCase() + viewingMember.gender.slice(1) : '-'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Belt Rank</p>
                                    <p style={{ margin: 0 }}>
                                        <span className={`badge badge-belt-${viewingMember.belt_rank || 'white'}`}>
                                            {(viewingMember.belt_rank || 'white').charAt(0).toUpperCase() + (viewingMember.belt_rank || 'white').slice(1)}
                                        </span>
                                        {viewingMember.stripes > 0 && <span style={{ marginLeft: 'var(--space-1)' }}>({viewingMember.stripes} stripe{viewingMember.stripes > 1 ? 's' : ''})</span>}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Role</p>
                                    <p style={{ margin: 0 }}>
                                        <span className={`badge ${getRoleBadgeClass(viewingMember.role)}`}>{viewingMember.role || 'member'}</span>
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Member Since</p>
                                    <p style={{ margin: 0 }}>{new Date(viewingMember.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                                Emergency Contact
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Name</p>
                                    <p style={{ margin: 0 }}>{viewingMember.emergency_contact_name || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Phone</p>
                                    <p style={{ margin: 0 }}>{viewingMember.emergency_contact_phone || '-'}</p>
                                </div>
                            </div>

                            {/* Medical Information */}
                            {viewingMember.medical_info && (
                                <>
                                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                                        Medical Information
                                    </h3>
                                    <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                                        <AlertCircle size={16} />
                                        <p style={{ margin: 0 }}>{viewingMember.medical_info}</p>
                                    </div>
                                </>
                            )}

                            {/* Agreements */}
                            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                                Agreements
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    {viewingMember.waiver_accepted ? (
                                        <CheckCircle size={16} color="var(--color-green)" />
                                    ) : (
                                        <XCircle size={16} color="var(--color-red)" />
                                    )}
                                    <span>Waiver Accepted</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    {viewingMember.best_practice_accepted ? (
                                        <CheckCircle size={16} color="var(--color-green)" />
                                    ) : (
                                        <XCircle size={16} color="var(--color-red)" />
                                    )}
                                    <span>Best Practices Accepted</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => { setShowDetailsModal(false); setViewingMember(null); }}
                                className="btn btn-ghost"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    openEditModal(viewingMember);
                                }}
                                className="btn btn-primary"
                            >
                                <Edit size={16} /> Edit Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
