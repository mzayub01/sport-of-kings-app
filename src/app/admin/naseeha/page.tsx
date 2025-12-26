'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen, Calendar, Edit, Trash2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Naseeha } from '@/lib/types';

export default function AdminNaseehaPage() {
    const [naseehaList, setNaseehaList] = useState<Naseeha[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editNaseeha, setEditNaseeha] = useState<Naseeha | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchYear, setSearchYear] = useState(new Date().getFullYear());

    const supabase = getSupabaseClient();

    const currentWeek = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        week_number: currentWeek,
        year: new Date().getFullYear(),
    });

    useEffect(() => {
        fetchNaseeha();
    }, [searchYear]);

    const fetchNaseeha = async () => {
        const { data, error } = await supabase
            .from('naseeha')
            .select('*')
            .eq('year', searchYear)
            .order('week_number', { ascending: false });

        if (error) {
            console.error('Error fetching naseeha:', error);
        } else {
            setNaseehaList(data || []);
        }
        setLoading(false);
    };

    const openModal = (naseeha?: Naseeha) => {
        if (naseeha) {
            setEditNaseeha(naseeha);
            setFormData({
                title: naseeha.title,
                content: naseeha.content,
                week_number: naseeha.week_number,
                year: naseeha.year,
            });
        } else {
            setEditNaseeha(null);
            setFormData({
                title: '',
                content: '',
                week_number: currentWeek,
                year: new Date().getFullYear(),
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
            const { data: { user } } = await supabase.auth.getUser();

            if (editNaseeha) {
                const { error } = await supabase
                    .from('naseeha')
                    .update({
                        title: formData.title,
                        content: formData.content,
                        week_number: formData.week_number,
                        year: formData.year,
                    })
                    .eq('id', editNaseeha.id);

                if (error) throw error;
                setSuccess('Naseeha updated successfully');
            } else {
                const { error } = await supabase
                    .from('naseeha')
                    .insert({
                        title: formData.title,
                        content: formData.content,
                        week_number: formData.week_number,
                        year: formData.year,
                        author_id: user?.id,
                    });

                if (error) throw error;
                setSuccess('Naseeha created successfully');
            }

            setShowModal(false);
            fetchNaseeha();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        }
    };

    const deleteNaseeha = async (id: string) => {
        if (!confirm('Are you sure you want to delete this naseeha?')) return;

        const { error } = await supabase
            .from('naseeha')
            .delete()
            .eq('id', id);

        if (!error) {
            setSuccess('Naseeha deleted');
            fetchNaseeha();
        }
    };

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="dashboard-title">Naseeha</h1>
                    <p className="dashboard-subtitle">Weekly Islamic advice for instructors to share during classes</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Add Naseeha
                </button>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* Year Filter */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar size={18} color="var(--text-tertiary)" />
                    <span style={{ fontWeight: '500' }}>Year:</span>
                </div>
                <select
                    className="form-input"
                    style={{ width: 'auto' }}
                    value={searchYear}
                    onChange={(e) => setSearchYear(parseInt(e.target.value))}
                >
                    {[2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Current Week: {currentWeek}
                </span>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                    <div className="spinner spinner-lg" />
                </div>
            ) : naseehaList.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <BookOpen size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Naseeha for {searchYear}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        Add weekly Islamic advice for instructors to share during classes.
                    </p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add Naseeha
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {naseehaList.map((naseeha) => (
                        <div key={naseeha.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                                            <span className="badge badge-gold">Week {naseeha.week_number}</span>
                                            {naseeha.week_number === currentWeek && naseeha.year === new Date().getFullYear() && (
                                                <span className="badge badge-green">This Week</span>
                                            )}
                                        </div>
                                        <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-lg)' }}>
                                            {naseeha.title}
                                        </h3>
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: '1.7',
                                        }}>
                                            {naseeha.content.substring(0, 300)}
                                            {naseeha.content.length > 300 ? '...' : ''}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'var(--space-4)' }}>
                                        <button className="btn btn-ghost btn-icon" onClick={() => openModal(naseeha)}>
                                            <Edit size={18} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" onClick={() => deleteNaseeha(naseeha.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editNaseeha ? 'Edit Naseeha' : 'Add New Naseeha'}
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Week Number*</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.week_number}
                                            onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) })}
                                            min="1"
                                            max="53"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Year*</label>
                                        <select
                                            className="form-input"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        >
                                            {[2024, 2025, 2026].map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Title*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. The Importance of Dhikr"
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
                                        placeholder="Write the naseeha content here. Include relevant Quranic verses and hadith if applicable..."
                                        required
                                        style={{ minHeight: '250px' }}
                                    />
                                    <p className="form-hint">
                                        This content will be shared with instructors to deliver at the end of classes.
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editNaseeha ? 'Save Changes' : 'Create Naseeha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
