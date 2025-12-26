'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, Sparkles, ArrowRight, Star, PartyPopper } from 'lucide-react';

// Confetti component
const Confetti = () => {
    const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

    useEffect(() => {
        const colors = ['#c5a456', '#ffd700', '#fff', '#e8d5a3', '#ff6b6b', '#4ecdc4', '#45b7d1'];
        const pieces = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 3 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));
        setConfetti(pieces);
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    style={{
                        position: 'absolute',
                        left: `${piece.left}%`,
                        top: '-20px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: piece.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s infinite`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-20px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

// Floating stars component
const FloatingStars = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
                    }}
                >
                    <Star size={12 + Math.random() * 12} color="var(--color-gold)" fill="var(--color-gold)" style={{ opacity: 0.3 }} />
                </div>
            ))}
            <style jsx>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};

// Photo Gallery Component
const PhotoGallery = () => {
    const photos = [
        { src: '/majid-1.jpg', alt: 'Majid Ali training' },
        { src: '/majid-2.jpg', alt: 'Majid Ali sparring' },
        { src: '/majid-3.jpg', alt: 'Sport of Kings pride' },
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
            flexWrap: 'wrap',
        }}>
            {photos.map((photo, index) => (
                <div
                    key={index}
                    style={{
                        width: '180px',
                        height: '180px',
                        borderRadius: 'var(--radius-xl)',
                        overflow: 'hidden',
                        border: '3px solid var(--color-gold)',
                        boxShadow: '0 0 30px rgba(197, 164, 86, 0.4)',
                        animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
                        animationDelay: `${index * 0.3}s`,
                    }}
                >
                    <Image
                        src={photo.src}
                        alt={photo.alt}
                        width={180}
                        height={180}
                        style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default function LaunchPage() {
    const [showContent, setShowContent] = useState(false);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        setTimeout(() => setShowContent(true), 500);
        setTimeout(() => setShowButton(true), 2000);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
            padding: 'var(--space-6)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <Confetti />
            <FloatingStars />

            {/* Radial glow */}
            <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(197, 164, 86, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
            }} />

            <div style={{
                maxWidth: '800px',
                width: '100%',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2,
            }}>
                {/* Logo with glow */}
                <div style={{
                    marginBottom: 'var(--space-6)',
                    animation: showContent ? 'fadeInUp 1s ease-out' : 'none',
                    opacity: showContent ? 1 : 0,
                }}>
                    <div style={{
                        display: 'inline-block',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-xl)',
                        background: 'rgba(197, 164, 86, 0.1)',
                        boxShadow: '0 0 60px rgba(197, 164, 86, 0.3)',
                        marginBottom: 'var(--space-4)',
                    }}>
                        <Image
                            src="/logo-full.png"
                            alt="Sport of Kings"
                            width={200}
                            height={100}
                            priority
                            style={{ height: '70px', width: 'auto' }}
                        />
                    </div>
                </div>

                {/* Birthday Message */}
                <div style={{
                    animation: showContent ? 'fadeInUp 1s ease-out 0.3s both' : 'none',
                }}>
                    {/* Party icons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 'var(--space-4)',
                        marginBottom: 'var(--space-4)',
                    }}>
                        <PartyPopper size={32} color="var(--color-gold)" style={{ animation: 'bounce 1s ease-in-out infinite' }} />
                        <Sparkles size={32} color="var(--color-gold)" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                        <PartyPopper size={32} color="var(--color-gold)" style={{ animation: 'bounce 1s ease-in-out infinite 0.2s' }} />
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #ffd700 0%, #c5a456 50%, #ffd700 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--space-4)',
                        textShadow: '0 0 40px rgba(197, 164, 86, 0.5)',
                        lineHeight: 1.2,
                    }}>
                        Happy Birthday<br />Majid Ali! 🎂
                    </h1>

                    <p style={{
                        fontSize: 'var(--text-xl)',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--space-6)',
                        lineHeight: 1.6,
                    }}>
                        Wishing you a blessed year ahead filled with success,<br />
                        good health, and endless barakah!
                    </p>
                </div>

                {/* Photo Gallery */}
                <div style={{
                    animation: showContent ? 'fadeInUp 1s ease-out 0.5s both' : 'none',
                }}>
                    <PhotoGallery />
                </div>

                {/* App Launch Announcement */}
                <div style={{
                    animation: showContent ? 'fadeInUp 1s ease-out 0.7s both' : 'none',
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(197, 164, 86, 0.15) 0%, rgba(197, 164, 86, 0.05) 100%)',
                        border: '2px solid var(--color-gold)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-6)',
                        marginBottom: 'var(--space-6)',
                        boxShadow: '0 0 40px rgba(197, 164, 86, 0.2)',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            marginBottom: 'var(--space-3)',
                        }}>
                            <Crown size={24} color="var(--color-gold)" />
                            <span style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: '600',
                                color: 'var(--color-gold)',
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                            }}>
                                Official Launch
                            </span>
                            <Crown size={24} color="var(--color-gold)" />
                        </div>

                        <h2 style={{
                            fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
                            fontWeight: '700',
                            color: '#FFFFF0',
                            marginBottom: 'var(--space-2)',
                        }}>
                            The Sport of Kings App Is Finally Here! 🚀
                        </h2>

                        <p style={{
                            fontSize: 'var(--text-md)',
                            color: 'var(--text-secondary)',
                            maxWidth: '500px',
                            margin: '0 auto',
                        }}>
                            Your complete platform for BJJ training, membership management,
                            and spiritual growth through martial arts.
                        </p>
                    </div>
                </div>

                {/* Enter Button */}
                <div style={{
                    animation: showButton ? 'fadeInUp 1s ease-out' : 'none',
                    opacity: showButton ? 1 : 0,
                }}>
                    <Link
                        href="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-5) var(--space-10)',
                            fontSize: 'var(--text-xl)',
                            fontWeight: '700',
                            color: 'var(--color-black)',
                            background: 'linear-gradient(135deg, #ffd700 0%, #c5a456 50%, #ffd700 100%)',
                            backgroundSize: '200% 200%',
                            borderRadius: 'var(--radius-full)',
                            textDecoration: 'none',
                            boxShadow: '0 4px 30px rgba(197, 164, 86, 0.5), 0 0 60px rgba(197, 164, 86, 0.3)',
                            transition: 'all 0.3s ease',
                            animation: 'shimmer 3s ease-in-out infinite, pulse-glow 2s ease-in-out infinite',
                        }}
                    >
                        <Sparkles size={24} />
                        Enter Now
                        <ArrowRight size={24} />
                    </Link>

                    <p style={{
                        marginTop: 'var(--space-4)',
                        color: 'var(--text-tertiary)',
                        fontSize: 'var(--text-sm)',
                    }}>
                        Click to explore the Sport of Kings experience
                    </p>
                </div>
            </div>

            {/* Global animations */}
            <style jsx global>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shimmer {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 4px 30px rgba(197, 164, 86, 0.5), 0 0 60px rgba(197, 164, 86, 0.3); }
                    50% { box-shadow: 0 4px 40px rgba(197, 164, 86, 0.7), 0 0 80px rgba(197, 164, 86, 0.5); }
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
