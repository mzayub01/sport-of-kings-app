'use client';

import { useState, useEffect } from 'react';
import { Plus, Video, Play, Clock, Award, Edit, Trash2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface VideoItem {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail_url: string;
    category: string;
    belt_level: string | null;
    duration_seconds: number | null;
    is_active: boolean;
    created_at: string;
}

const BELT_LEVELS = ['white', 'blue', 'purple', 'brown', 'black'];
const CATEGORIES = ['fundamentals', 'guard', 'passing', 'submissions', 'takedowns', 'escapes', 'drills', 'competition'];

export default function AdminVideosPage() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        url: '',
        thumbnail_url: '',
        category: 'fundamentals',
        belt_level: '',
        duration_seconds: '',
    });

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (err) {
            console.error('Error fetching videos:', err);
            setError('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (video?: VideoItem) => {
        if (video) {
            setEditingVideo(video);
            setFormData({
                title: video.title,
                description: video.description || '',
                url: video.url,
                thumbnail_url: video.thumbnail_url || '',
                category: video.category,
                belt_level: video.belt_level || '',
                duration_seconds: video.duration_seconds?.toString() || '',
            });
        } else {
            setEditingVideo(null);
            setFormData({
                title: '',
                description: '',
                url: '',
                thumbnail_url: '',
                category: 'fundamentals',
                belt_level: '',
                duration_seconds: '',
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const payload = {
            title: formData.title,
            description: formData.description || null,
            url: formData.url,
            thumbnail_url: formData.thumbnail_url || null,
            category: formData.category,
            belt_level: formData.belt_level || null,
            duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null,
            is_active: true,
        };

        try {
            if (editingVideo) {
                const { error } = await supabase
                    .from('videos')
                    .update(payload)
                    .eq('id', editingVideo.id);
                if (error) throw error;
                setSuccess('Video updated successfully!');
            } else {
                const { error } = await supabase
                    .from('videos')
                    .insert(payload);
                if (error) throw error;
                setSuccess('Video added successfully!');
            }
            setShowModal(false);
            fetchVideos();
        } catch (err: any) {
            setError(err.message || 'Failed to save video');
        }
    };

    const toggleVideoStatus = async (video: VideoItem) => {
        try {
            await supabase
                .from('videos')
                .update({ is_active: !video.is_active })
                .eq('id', video.id);
            fetchVideos();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const deleteVideo = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            await supabase.from('videos').delete().eq('id', id);
            fetchVideos();
            setSuccess('Video deleted successfully!');
        } catch (err) {
            console.error('Error deleting video:', err);
        }
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                    <h1 className="dashboard-title">Videos</h1>
                    <p className="dashboard-subtitle">
                        Manage training videos for members ({videos.length} total)
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <Plus size={18} />
                    Add Video
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

            {videos.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Video size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Videos</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                        Add training videos for your members to watch.
                    </p>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        <Plus size={18} />
                        Add First Video
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 'var(--space-4)',
                }}>
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="card"
                            style={{ opacity: video.is_active ? 1 : 0.6 }}
                        >
                            {/* Thumbnail */}
                            <div style={{
                                height: '180px',
                                background: video.thumbnail_url
                                    ? `url(${video.thumbnail_url}) center/cover`
                                    : 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
                                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'rgba(0,0,0,0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Play size={28} color="white" />
                                </div>

                                {video.duration_seconds && (
                                    <span style={{
                                        position: 'absolute',
                                        bottom: 'var(--space-2)',
                                        right: 'var(--space-2)',
                                        background: 'rgba(0,0,0,0.8)',
                                        color: 'white',
                                        padding: 'var(--space-1) var(--space-2)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: 'var(--text-xs)',
                                    }}>
                                        {formatDuration(video.duration_seconds)}
                                    </span>
                                )}
                            </div>

                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                                    <h4 style={{ margin: 0, fontSize: 'var(--text-md)' }}>{video.title}</h4>
                                    <span className={`badge ${video.is_active ? 'badge-green' : 'badge-gray'}`}>
                                        {video.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                                    <span className="badge badge-gold" style={{ textTransform: 'capitalize' }}>
                                        {video.category}
                                    </span>
                                    {video.belt_level && (
                                        <span className={`badge badge-belt-${video.belt_level}`}>
                                            {video.belt_level.charAt(0).toUpperCase() + video.belt_level.slice(1)}
                                        </span>
                                    )}
                                </div>

                                {video.description && (
                                    <p style={{
                                        fontSize: 'var(--text-sm)',
                                        color: 'var(--text-secondary)',
                                        marginBottom: 'var(--space-3)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}>
                                        {video.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'auto' }}>
                                    <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost btn-sm"
                                        style={{ flex: 1 }}
                                    >
                                        <ExternalLink size={16} />
                                        View
                                    </a>
                                    <button onClick={() => openModal(video)} className="btn btn-ghost btn-sm">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => toggleVideoStatus(video)} className="btn btn-ghost btn-sm">
                                        <CheckCircle size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteVideo(video.id)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--color-red)' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingVideo ? 'Edit Video' : 'Add Video'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="Video title..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Video URL*</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        required
                                        placeholder="https://youtube.com/watch?v=..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Thumbnail URL</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        value={formData.thumbnail_url}
                                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the video..."
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Category*</label>
                                        <select
                                            className="form-input"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Belt Level</label>
                                        <select
                                            className="form-input"
                                            value={formData.belt_level}
                                            onChange={(e) => setFormData({ ...formData, belt_level: e.target.value })}
                                        >
                                            <option value="">All Levels</option>
                                            {BELT_LEVELS.map(belt => (
                                                <option key={belt} value={belt}>
                                                    {belt.charAt(0).toUpperCase() + belt.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Duration (sec)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.duration_seconds}
                                            onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                                            placeholder="180"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingVideo ? 'Save Changes' : 'Add Video'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
