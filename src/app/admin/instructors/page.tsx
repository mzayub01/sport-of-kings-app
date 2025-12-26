'use client';

import { useState, useEffect } from 'react';
import { Plus, User, Award, Edit, CheckCircle, AlertCircle, Mail, Calendar, BookOpen } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Member {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    belt_rank: string;
    created_at: string;
}

interface Instructor {
    id: string;
    user_id: string;
    bio: string | null;
    specializations: string[] | null;
    is_active: boolean;
    created_at: string;
    profile?: {
        first_name: string;
        last_name: string;
        email: string;
        belt_rank: string;
    };
}

export default function AdminInstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        bio: '',
        specializations: '',
    });

    const [selectedMember, setSelectedMember] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [instructorsRes, membersRes] = await Promise.all([
                supabase
                    .from('instructors')
                    .select('*, profile:profiles(first_name, last_name, email, belt_rank)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('profiles')
                    .select('*')
                    .in('role', ['member', 'instructor'])
                    .order('first_name'),
            ]);

            setInstructors(instructorsRes.data || []);
            setMembers(membersRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (instructor: Instructor) => {
        setEditingInstructor(instructor);
        setFormData({
            bio: instructor.bio || '',
            specializations: instructor.specializations?.join(', ') || '',
        });
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInstructor) return;

        setError('');
        setSuccess('');

        try {
            const { error } = await supabase
                .from('instructors')
                .update({
                    bio: formData.bio || null,
                    specializations: formData.specializations
                        ? formData.specializations.split(',').map(s => s.trim()).filter(Boolean)
                        : null,
                })
                .eq('id', editingInstructor.id);

            if (error) throw error;

            setSuccess('Instructor updated successfully!');
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to update instructor');
        }
    };

    const promoteToInstructor = async () => {
        if (!selectedMember) return;

        setError('');
        setSuccess('');

        try {
            const member = members.find(m => m.id === selectedMember);
            if (!member) throw new Error('Member not found');

            // Create instructor record
            const { error: instructorError } = await supabase
                .from('instructors')
                .insert({
                    user_id: member.user_id,
                    is_active: true,
                });

            if (instructorError) throw instructorError;

            // Update profile role
            await supabase
                .from('profiles')
                .update({ role: 'instructor' })
                .eq('id', selectedMember);

            setSuccess(`${member.first_name} ${member.last_name} is now an instructor!`);
            setShowPromoteModal(false);
            setSelectedMember('');
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to promote member');
        }
    };

    const toggleInstructorStatus = async (instructor: Instructor) => {
        try {
            await supabase
                .from('instructors')
                .update({ is_active: !instructor.is_active })
                .eq('id', instructor.id);
            fetchData();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    // Get members who are not already instructors
    const eligibleMembers = members.filter(m =>
        !instructors.some(i => i.user_id === m.user_id)
    );

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
                    <h1 className="dashboard-title">Instructors</h1>
                    <p className="dashboard-subtitle">
                        Manage instructors and their profiles ({instructors.length} total)
                    </p>
                </div>
                <button onClick={() => setShowPromoteModal(true)} className="btn btn-primary">
                    <Plus size={18} />
                    Add Instructor
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

            {instructors.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <User size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Instructors</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                        Promote members to become instructors.
                    </p>
                    <button onClick={() => setShowPromoteModal(true)} className="btn btn-primary">
                        <Plus size={18} />
                        Add First Instructor
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 'var(--space-4)',
                }}>
                    {instructors.map((instructor) => (
                        <div
                            key={instructor.id}
                            className="card"
                            style={{ opacity: instructor.is_active ? 1 : 0.6 }}
                        >
                            <div className="card-body">
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                                    {/* Avatar */}
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
                                        flexShrink: 0,
                                    }}>
                                        {instructor.profile?.first_name?.[0]}{instructor.profile?.last_name?.[0]}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
                                            <h4 style={{ margin: 0 }}>
                                                {instructor.profile?.first_name} {instructor.profile?.last_name}
                                            </h4>
                                            <span className={`badge ${instructor.is_active ? 'badge-green' : 'badge-gray'}`}>
                                                {instructor.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
                                                <Mail size={14} /> {instructor.profile?.email}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                                <Award size={14} /> {(instructor.profile?.belt_rank || 'white').charAt(0).toUpperCase() + (instructor.profile?.belt_rank || 'white').slice(1)} Belt
                                            </span>
                                        </div>

                                        {instructor.specializations && instructor.specializations.length > 0 && (
                                            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                                                {instructor.specializations.map((spec, i) => (
                                                    <span key={i} className="badge badge-gold" style={{ fontSize: 'var(--text-xs)' }}>
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {instructor.bio && (
                                            <p style={{
                                                fontSize: 'var(--text-sm)',
                                                color: 'var(--text-secondary)',
                                                fontStyle: 'italic',
                                                marginBottom: 0,
                                            }}>
                                                "{instructor.bio.length > 100 ? instructor.bio.substring(0, 100) + '...' : instructor.bio}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-light)' }}>
                                    <button onClick={() => openEditModal(instructor)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                                        <Edit size={16} />
                                        Edit Profile
                                    </button>
                                    <button onClick={() => toggleInstructorStatus(instructor)} className="btn btn-ghost btn-sm">
                                        <CheckCircle size={16} />
                                        {instructor.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {showModal && editingInstructor && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                Edit Instructor: {editingInstructor.profile?.first_name} {editingInstructor.profile?.last_name}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">
                                        <BookOpen size={16} style={{ marginRight: 'var(--space-1)' }} />
                                        Bio
                                    </label>
                                    <textarea
                                        className="form-input"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Brief bio about the instructor..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Award size={16} style={{ marginRight: 'var(--space-1)' }} />
                                        Specializations
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.specializations}
                                        onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                                        placeholder="Guard, Submissions, Takedowns (comma separated)"
                                    />
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                                        Enter specializations separated by commas
                                    </p>
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

            {/* Promote Modal */}
            {showPromoteModal && (
                <div className="modal-overlay" onClick={() => setShowPromoteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Instructor</h2>
                        </div>

                        <div className="modal-body">
                            <p style={{ marginBottom: 'var(--space-4)' }}>
                                Select a member to promote to instructor. This will give them access to instructor features.
                            </p>

                            {eligibleMembers.length === 0 ? (
                                <div className="alert alert-warning">
                                    <AlertCircle size={18} />
                                    All eligible members are already instructors.
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Select Member</label>
                                    <select
                                        className="form-input"
                                        value={selectedMember}
                                        onChange={(e) => setSelectedMember(e.target.value)}
                                    >
                                        <option value="">Choose a member...</option>
                                        {eligibleMembers.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.first_name} {member.last_name} ({member.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" onClick={() => setShowPromoteModal(false)} className="btn btn-ghost">
                                Cancel
                            </button>
                            <button
                                onClick={promoteToInstructor}
                                disabled={!selectedMember}
                                className="btn btn-primary"
                            >
                                <Award size={18} />
                                Promote to Instructor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
