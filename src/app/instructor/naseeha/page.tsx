'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle, AlertCircle, Edit, Calendar } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Naseeha {
    id: string;
    title: string;
    content: string;
    week_number: number;
    year: number;
    is_active: boolean;
    created_at: string;
}

export default function InstructorNaseehaPage() {
    const [naseehaList, setNaseehaList] = useState<Naseeha[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Naseeha | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const currentYear = new Date().getFullYear();
    const currentWeek = Math.ceil((new Date().getTime() - new Date(currentYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        week_number: currentWeek,
        year: currentYear,
    });

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchNaseeha();
    }, []);

    const fetchNaseeha = async () => {
        try {
            const { data } = await supabase
                .from('naseeha')
                .select('*')
                .order('year', { ascending: false })
                .order('week_number', { ascending: false })
                .limit(20);

            setNaseehaList(data || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (naseeha?: Naseeha) => {
        if (naseeha) {
            setEditing(naseeha);
            setFormData({
                title: naseeha.title,
                content: naseeha.content,
                week_number: naseeha.week_number,
                year: naseeha.year,
            });
        } else {
            setEditing(null);
            setFormData({
                title: '',
                content: '',
                week_number: currentWeek,
                year: currentYear,
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.title || !formData.content) {
            setError('Please fill in title and content');
            return;
        }

        try {
            const payload = {
                title: formData.title,
                content: formData.content,
                week_number: formData.week_number,
                year: formData.year,
                is_active: true,
            };

            if (editing) {
                const { error } = await supabase
                    .from('naseeha')
                    .update(payload)
                    .eq('id', editing.id);
                if (error) throw error;
                setSuccess('Naseeha updated successfully!');
            } else {
                const { error } = await supabase
                    .from('naseeha')
                    .insert(payload);
                if (error) throw error;
                setSuccess('Naseeha added successfully!');
            }

            setShowModal(false);
            fetchNaseeha();
        } catch (err: any) {
            setError(err.message || 'Failed to save naseeha');
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
                    <h1 className="dashboard-title">Weekly Naseeha</h1>
                    <p className="dashboard-subtitle">
                        Share weekly advice and spiritual guidance with students
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <Plus size={18} />
                    Add Naseeha
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

            {naseehaList.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <BookOpen size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Naseeha Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                        Start sharing weekly naseeha with your students.
                    </p>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <Plus size={18} />
                        Add First Naseeha
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {naseehaList.map((naseeha) => {
                        const isCurrentWeek = naseeha.week_number === currentWeek && naseeha.year === currentYear;

                        return (
                            <div key={naseeha.id} className="card">
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <span className="badge badge-gold">Week {naseeha.week_number}, {naseeha.year}</span>
                                            {isCurrentWeek && (
                                                <span className="badge badge-green">Current Week</span>
                                            )}
                                        </div>
                                        <button onClick={() => openModal(naseeha)} className="btn btn-ghost btn-sm">
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                    </div>

                                    <h4 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>
                                        {naseeha.title}
                                    </h4>

                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: '1.7',
                                    }}>
                                        {naseeha.content.length > 300
                                            ? naseeha.content.substring(0, 300) + '...'
                                            : naseeha.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editing ? 'Edit Naseeha' : 'Add Naseeha'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Week Number</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.week_number}
                                            onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) })}
                                            min="1"
                                            max="52"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Year</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                            min="2024"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Title*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. The Importance of Patience"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Content*</label>
                                    <textarea
                                        className="form-input"
                                        rows={10}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Write the naseeha content here..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editing ? 'Save Changes' : 'Add Naseeha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
