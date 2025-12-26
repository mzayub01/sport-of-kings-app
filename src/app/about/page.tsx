import Image from 'next/image';
import Link from 'next/link';
import { Shield, Users, Award, Target, Heart, Star, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
    title: 'About Us | Sport of Kings',
    description: 'Sport of Kings is a community-led movement dedicated to reviving the Sunnah of wrestling through Brazilian Jiu-Jitsu and other noble disciplines.',
};

export default async function AboutPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const commitments = [
        {
            icon: Shield,
            text: 'Reviving Prophetic traditions of strength and self-defence',
        },
        {
            icon: Star,
            text: 'Empowering youth with confidence, discipline, and resilience',
        },
        {
            icon: Users,
            text: 'Strengthening bonds of brotherhood and sisterhood',
        },
        {
            icon: Target,
            text: 'Providing clear pathways for growth, progression, and leadership',
        },
        {
            icon: Heart,
            text: 'Using sport as a vehicle for positive change within the Ummah',
        },
    ];

    return (
        <>
            <Navbar user={user ? { id: user.id, email: user.email! } : null} />

            <main>
                {/* Hero Section */}
                <section
                    style={{
                        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
                        padding: 'var(--space-16) var(--space-6)',
                        textAlign: 'center',
                    }}
                >
                    <div className="container container-md animate-slide-up">
                        <h1 style={{
                            marginBottom: 'var(--space-4)',
                            background: 'var(--color-gold-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            About Sport of Kings
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-xl)',
                            color: 'var(--text-secondary)',
                            maxWidth: '700px',
                            margin: '0 auto',
                        }}>
                            A community-led movement dedicated to reviving the Sunnah of wrestling through Brazilian Jiu-Jitsu and other noble disciplines.
                        </p>
                    </div>
                </section>

                {/* Main Content */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-lg">
                        <div className="glass-card" style={{
                            padding: 'var(--space-10)',
                            marginBottom: 'var(--space-8)',
                        }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 'var(--space-6)',
                                marginBottom: 'var(--space-8)',
                            }}>
                                <Image
                                    src="/logo-full.png"
                                    alt="Sport of Kings"
                                    width={180}
                                    height={180}
                                    style={{ height: '140px', width: 'auto' }}
                                />
                            </div>

                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                marginBottom: 'var(--space-6)',
                            }}>
                                We exist to build <strong>strong individuals</strong>, <strong>resilient families</strong>, and <strong>confident communities</strong> — physically, mentally, and spiritually. Our approach goes beyond sport. We see training as a means of developing character, discipline, humility, and brotherhood, rooted in Islamic values and lived practice.
                            </p>

                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                marginBottom: 'var(--space-6)',
                            }}>
                                Across our locations, we provide structured, high-quality training for children, youth, and adults, delivered by experienced instructors who uphold both technical excellence and good <em>adab</em>. Our environments are intentionally designed to be safe, respectful, and purposeful — places where effort is valued, progress is earned, and character matters.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Commitments Section */}
                <section
                    className="section"
                    style={{
                        background: 'var(--color-dark-green)',
                        color: 'var(--color-white)',
                    }}
                >
                    <div className="container container-lg">
                        <h2 style={{
                            color: 'var(--color-gold)',
                            textAlign: 'center',
                            marginBottom: 'var(--space-8)',
                        }}>
                            Sport of Kings is Committed To
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 'var(--space-4)',
                        }}>
                            {commitments.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-4)',
                                        padding: 'var(--space-4)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--color-gold-gradient)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <item.icon size={24} color="var(--color-black)" />
                                    </div>
                                    <p style={{
                                        margin: 0,
                                        color: 'var(--color-gray-300)',
                                        fontSize: 'var(--text-base)',
                                    }}>
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Beyond the Mats */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-lg">
                        <div className="glass-card" style={{ padding: 'var(--space-10)' }}>
                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                marginBottom: 'var(--space-6)',
                            }}>
                                Alongside regular classes, we host <strong>events</strong>, <strong>seminars</strong>, <strong>retreats</strong>, and <strong>community gatherings</strong>, creating spaces for learning, reflection, and connection beyond the mats.
                            </p>

                            <div style={{
                                background: 'rgba(197, 164, 86, 0.1)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--space-8)',
                                borderLeft: '4px solid var(--color-gold)',
                                marginBottom: 'var(--space-6)',
                            }}>
                                <p style={{
                                    fontSize: 'var(--text-xl)',
                                    fontWeight: '600',
                                    marginBottom: 'var(--space-4)',
                                    color: 'var(--text-primary)',
                                }}>
                                    Sport of Kings is not about trophies or titles.
                                </p>
                                <p style={{
                                    fontSize: 'var(--text-lg)',
                                    lineHeight: '1.8',
                                    marginBottom: 0,
                                    color: 'var(--text-secondary)',
                                }}>
                                    It is about showing up consistently, training with intention, and carrying the lessons of the mat into everyday life.
                                </p>
                            </div>

                            <div style={{
                                textAlign: 'center',
                                padding: 'var(--space-6)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-xl)',
                            }}>
                                <p style={{
                                    fontSize: 'var(--text-2xl)',
                                    fontWeight: '700',
                                    marginBottom: 0,
                                    background: 'var(--color-gold-gradient)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>
                                    Strength with purpose. Discipline with faith. Community with direction.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="container container-md" style={{ textAlign: 'center' }}>
                        <h2 style={{ marginBottom: 'var(--space-4)' }}>
                            Be Part of Our Community
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-8)',
                            fontSize: 'var(--text-lg)',
                        }}>
                            Whether you&apos;re a complete beginner or an experienced martial artist,
                            Sport of Kings welcomes you.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-4)',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <Link href="/register" className="btn btn-primary btn-lg">
                                Join Now
                                <ChevronRight size={20} />
                            </Link>
                            <Link href="/classes" className="btn btn-outline btn-lg">
                                View Classes
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
