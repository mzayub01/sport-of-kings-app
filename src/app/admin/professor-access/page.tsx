'use client';

import { useState, useEffect } from 'react';
import { Award, Users, Plus, Trash2, Loader2, MapPin, CheckCircle, Search } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Professor {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface ClassOption {
    id: string;
    name: string;
    location_name: string;
}

interface ClassAccess {
    id: string;
    class_id: string;
    class_name: string;
    location_name: string;
}

export default function ProfessorAccessPage() {
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedProfessor, setSelectedProfessor] = useState<string>('');
    const [professorAccess, setProfessorAccess] = useState<ClassAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const [accessLoading, setAccessLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedClassToAdd, setSelectedClassToAdd] = useState<string>('');
    const [message, setMessage] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchProfessorsAndClasses();
    }, []);

    useEffect(() => {
        if (selectedProfessor) {
            fetchProfessorAccess();
        } else {
            setProfessorAccess([]);
        }
    }, [selectedProfessor]);

    const fetchProfessorsAndClasses = async () => {
        try {
            // Fetch all professors
            const { data: profs } = await supabase
                .from('profiles')
                .select('user_id, first_name, last_name, email')
                .eq('role', 'professor')
                .order('first_name');

            // Fetch all active classes
            const { data: cls } = await supabase
                .from('classes')
                .select('id, name, location:locations(name)')
                .eq('is_active', true)
                .order('name');

            setProfessors(profs || []);
            setClasses(
                (cls || []).map((c: { id: string; name: string; location: { name: string } | null }) => ({
                    id: c.id,
                    name: c.name,
                    location_name: c.location?.name || '',
                }))
            );
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfessorAccess = async () => {
        setAccessLoading(true);
        try {
            const { data } = await supabase
                .from('professor_class_access')
                .select('id, class_id, class:classes(name, location:locations(name))')
                .eq('professor_user_id', selectedProfessor);

            setProfessorAccess(
                (data || []).map((a: {
                    id: string;
                    class_id: string;
                    class: { name: string; location: { name: string } | null } | null
                }) => ({
                    id: a.id,
                    class_id: a.class_id,
                    class_name: a.class?.name || '',
                    location_name: a.class?.location?.name || '',
                }))
            );
        } catch (err) {
            console.error('Error fetching access:', err);
        } finally {
            setAccessLoading(false);
        }
    };

    const handleAddAccess = async () => {
        if (!selectedProfessor || !selectedClassToAdd) return;

        // Check if already exists
        if (professorAccess.some(a => a.class_id === selectedClassToAdd)) {
            setMessage('Professor already has access to this class');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('professor_class_access')
                .insert({
                    professor_user_id: selectedProfessor,
                    class_id: selectedClassToAdd,
                });

            if (error) throw error;

            setMessage('Access granted!');
            setSelectedClassToAdd('');
            fetchProfessorAccess();
        } catch (err) {
            console.error('Error adding access:', err);
            setMessage('Failed to grant access');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveAccess = async (accessId: string) => {
        if (!confirm('Remove access to this class?')) return;

        try {
            const { error } = await supabase
                .from('professor_class_access')
                .delete()
                .eq('id', accessId);

            if (error) throw error;

            setProfessorAccess(prev => prev.filter(a => a.id !== accessId));
            setMessage('Access removed');
        } catch (err) {
            console.error('Error removing access:', err);
            setMessage('Failed to remove access');
        }
    };

    const selectedProfessorInfo = professors.find(p => p.user_id === selectedProfessor);

    // Classes not yet assigned to this professor
    const availableClasses = classes.filter(
        c => !professorAccess.some(a => a.class_id === c.id)
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
            <div className="dashboard-header">
                <h1 className="dashboard-title">Professor Access</h1>
                <p className="dashboard-subtitle">Manage which classes each professor can grade</p>
            </div>

            {professors.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <Users size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-4)' }} />
                    <h3>No Professors Found</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        To add a professor, edit a user&apos;s profile and set their role to &quot;professor&quot;
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
                    {/* Professor Selection */}
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Users size={20} />
                                Professors
                            </h3>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {professors.map(prof => (
                                <button
                                    key={prof.user_id}
                                    onClick={() => setSelectedProfessor(prof.user_id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        width: '100%',
                                        padding: 'var(--space-3) var(--space-4)',
                                        border: 'none',
                                        background: selectedProfessor === prof.user_id ? 'rgba(212, 184, 106, 0.1)' : 'transparent',
                                        borderLeft: selectedProfessor === prof.user_id ? '3px solid var(--color-gold)' : '3px solid transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--color-gold)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: 'var(--text-sm)',
                                    }}>
                                        {prof.first_name[0]}{prof.last_name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{prof.first_name} {prof.last_name}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{prof.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Class Access Management */}
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Award size={20} />
                                Class Access
                            </h3>
                        </div>
                        <div className="card-body">
                            {!selectedProfessor ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                                    Select a professor to manage their class access
                                </div>
                            ) : accessLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
                                    <Loader2 size={24} className="spinner" />
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: 'var(--space-4)' }}>
                                        <p style={{ fontWeight: '600', marginBottom: 'var(--space-1)' }}>
                                            {selectedProfessorInfo?.first_name} {selectedProfessorInfo?.last_name}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                            Can grade {professorAccess.length} class{professorAccess.length !== 1 ? 'es' : ''}
                                        </p>
                                    </div>

                                    {/* Add Class */}
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                        <select
                                            value={selectedClassToAdd}
                                            onChange={(e) => setSelectedClassToAdd(e.target.value)}
                                            className="form-select"
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">Add a class...</option>
                                            {availableClasses.map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name} ({cls.location_name})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAddAccess}
                                            disabled={!selectedClassToAdd || saving}
                                            className="btn btn-primary btn-sm"
                                        >
                                            {saving ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                                        </button>
                                    </div>

                                    {/* Message */}
                                    {message && (
                                        <p style={{
                                            fontSize: 'var(--text-sm)',
                                            color: message.includes('Failed') ? 'var(--color-red)' : 'var(--color-green)',
                                            marginBottom: 'var(--space-3)',
                                        }}>
                                            {message}
                                        </p>
                                    )}

                                    {/* Current Access List */}
                                    {professorAccess.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: 'var(--space-4)',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--text-secondary)',
                                            fontSize: 'var(--text-sm)',
                                        }}>
                                            No classes assigned yet
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                            {professorAccess.map(access => (
                                                <div
                                                    key={access.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: 'var(--space-3)',
                                                        background: 'var(--bg-secondary)',
                                                        borderRadius: 'var(--radius-md)',
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: '500' }}>{access.class_name}</div>
                                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <MapPin size={10} />
                                                            {access.location_name}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveAccess(access.id)}
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ color: 'var(--color-red)' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
