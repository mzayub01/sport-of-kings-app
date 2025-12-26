import { createClient } from '@/lib/supabase/server';
import { Video, Play, Clock, Award, Filter } from 'lucide-react';

export const metadata = {
    title: 'Video Library | Sport of Kings',
    description: 'Training drill videos for members',
};

interface VideoItem {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail_url: string;
    category: string;
    belt_level: string | null;
    duration_seconds: number | null;
}

const BELT_COLORS: Record<string, string> = {
    white: '#FFFFFF',
    blue: '#1E40AF',
    purple: '#6B21A8',
    brown: '#78350F',
    black: '#1A1A1A',
};

export default async function DashboardVideosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all active videos
    const { data: rawVideos } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    const videos = (rawVideos || []) as VideoItem[];

    // Get unique categories
    const categories = [...new Set(videos.map(v => v.category))];

    // Format duration
    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Video Library</h1>
                <p className="dashboard-subtitle">
                    Training drills and technique videos to improve your game
                </p>
            </div>

            {videos.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Video size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Videos Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        Training videos will be added here soon. Check back after your next class!
                    </p>
                </div>
            ) : (
                <>
                    {/* Categories Filter */}
                    {categories.length > 1 && (
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-2)',
                            marginBottom: 'var(--space-6)',
                            flexWrap: 'wrap',
                        }}>
                            <span className="badge badge-gold">All ({videos.length})</span>
                            {categories.map(cat => (
                                <span key={cat} className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Video Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--space-6)',
                    }}>
                        {videos.map((video) => (
                            <div key={video.id} className="card" style={{ overflow: 'hidden' }}>
                                {/* Thumbnail */}
                                <div style={{
                                    position: 'relative',
                                    background: 'var(--bg-tertiary)',
                                    paddingTop: '56.25%', // 16:9 aspect ratio
                                }}>
                                    {video.thumbnail_url ? (
                                        <img
                                            src={video.thumbnail_url}
                                            alt={video.title}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Video size={40} color="var(--text-tertiary)" />
                                        </div>
                                    )}

                                    {/* Play button overlay */}
                                    <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'var(--color-gold-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: 'var(--shadow-lg)',
                                            transition: 'transform var(--transition-base)',
                                        }}
                                    >
                                        <Play size={24} color="var(--color-black)" fill="var(--color-black)" />
                                    </a>

                                    {/* Duration badge */}
                                    {video.duration_seconds && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 'var(--space-2)',
                                            right: 'var(--space-2)',
                                            background: 'rgba(0, 0, 0, 0.8)',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: 'var(--text-xs)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}>
                                            <Clock size={12} />
                                            {formatDuration(video.duration_seconds)}
                                        </div>
                                    )}
                                </div>

                                {/* Video Info */}
                                <div className="card-body">
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                        <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                                            {video.category}
                                        </span>
                                        {video.belt_level && (
                                            <span
                                                className="badge"
                                                style={{
                                                    background: BELT_COLORS[video.belt_level] || 'var(--bg-tertiary)',
                                                    color: video.belt_level === 'white' ? 'var(--color-black)' : 'white',
                                                    border: video.belt_level === 'white' ? '1px solid var(--border-medium)' : 'none',
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {video.belt_level} Belt
                                            </span>
                                        )}
                                    </div>
                                    <h4 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-base)' }}>
                                        {video.title}
                                    </h4>
                                    {video.description && (
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: 'var(--text-sm)',
                                            margin: 0,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {video.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
