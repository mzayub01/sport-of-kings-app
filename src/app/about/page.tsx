import Image from 'next/image';
import Link from 'next/link';
import { Shield, Users, Award, Target, Heart, Star, ChevronRight, BookOpen, Swords, MapPin, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
    title: 'About Us | Sport of Kings',
    description: 'Sport of Kings is a non-profit registered charity using Sunnah sports to build strong, disciplined, faith-anchored individuals and communities.',
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
        {
            icon: BookOpen,
            text: 'Integrating spiritual development with physical training',
        },
    ];

    const sunnahSports = [
        { name: 'Wrestling & Grappling (BJJ)', status: 'Active', icon: Swords },
        { name: 'Archery', status: 'Coming Soon', icon: Target },
        { name: 'Horse Riding', status: 'Coming Soon', icon: Star },
    ];

    const differentiators = [
        {
            title: 'Sunnah-Centred',
            description: 'Training framed as a revival of Sunnah sports with emphasis on adab, intention, and character over ego.',
        },
        {
            title: 'Faith-Aligned',
            description: 'Islamic etiquette, modesty, and safeguarding built into our culture with appropriate provision for all.',
        },
        {
            title: 'Community-First',
            description: 'Operating in masjids and community spaces, prioritising access and affordability over profit.',
        },
        {
            title: 'Strong Lineage',
            description: 'Direct lineage through respected instructors like Professor Mario Sukata with consistent high standards.',
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
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(197, 164, 86, 0.15)',
                            padding: 'var(--space-1) var(--space-4)',
                            borderRadius: 'var(--radius-full)',
                            marginBottom: 'var(--space-4)',
                        }}>
                            <span style={{ color: 'var(--color-gold)', fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                                Registered Charity • Seerat Un Nabi
                            </span>
                        </div>
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
                            maxWidth: '750px',
                            margin: '0 auto',
                        }}>
                            A non-profit registered charity using Sunnah sports to build strong, disciplined, faith-anchored individuals and communities — not just fighters.
                        </p>
                    </div>
                </section>

                {/* Mission Section */}
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

                            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-6)', color: 'var(--color-gold)' }}>
                                Our Mission
                            </h2>

                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                marginBottom: 'var(--space-6)',
                                textAlign: 'center',
                                maxWidth: '800px',
                                margin: '0 auto var(--space-6)',
                            }}>
                                We exist to build <strong>strong individuals</strong>, <strong>resilient families</strong>, and <strong>confident communities</strong> — physically, mentally, and spiritually. Sport of Kings is a holistic development platform rooted in Sunnah sports, faith, and community, training Muslims for the mats and for the world.
                            </p>

                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                marginBottom: 'var(--space-6)',
                                textAlign: 'center',
                                maxWidth: '800px',
                                margin: '0 auto',
                            }}>
                                Our approach goes beyond sport. We see training as a means of developing <em>character</em>, <em>discipline</em>, <em>humility</em>, and <em>brotherhood</em>, rooted in Islamic values and lived practice.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Beyond BJJ Section */}
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
                            marginBottom: 'var(--space-4)',
                        }}>
                            More Than Just BJJ
                        </h2>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-gray-300)',
                            marginBottom: 'var(--space-8)',
                            maxWidth: '600px',
                            margin: '0 auto var(--space-8)',
                        }}>
                            While Brazilian Jiu-Jitsu and grappling are our core focus, Sport of Kings is a comprehensive platform offering:
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 'var(--space-6)',
                            marginBottom: 'var(--space-8)',
                        }}>
                            {/* Sunnah Sports */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--space-6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-gold-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 'var(--space-4)',
                                }}>
                                    <Swords size={24} color="var(--color-black)" />
                                </div>
                                <h3 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-3)' }}>Sunnah Sports</h3>
                                <ul style={{ color: 'var(--color-gray-300)', paddingLeft: 'var(--space-4)', margin: 0 }}>
                                    <li>Wrestling & Grappling (BJJ)</li>
                                    <li>Archery (coming soon)</li>
                                    <li>Horse Riding (coming soon)</li>
                                    <li>Fitness & Conditioning</li>
                                </ul>
                            </div>

                            {/* Spiritual Development */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--space-6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-gold-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 'var(--space-4)',
                                }}>
                                    <BookOpen size={24} color="var(--color-black)" />
                                </div>
                                <h3 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-3)' }}>Spiritual Development</h3>
                                <ul style={{ color: 'var(--color-gray-300)', paddingLeft: 'var(--space-4)', margin: 0 }}>
                                    <li>Dhikr gatherings & nasheeds</li>
                                    <li>Youth dars & Islamic learning</li>
                                    <li>Retreats (e.g., Morocco)</li>
                                    <li>Naseeha (advice) sessions</li>
                                </ul>
                            </div>

                            {/* Community Initiatives */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--space-6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-gold-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 'var(--space-4)',
                                }}>
                                    <Users size={24} color="var(--color-black)" />
                                </div>
                                <h3 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-3)' }}>Community Initiatives</h3>
                                <ul style={{ color: 'var(--color-gray-300)', paddingLeft: 'var(--space-4)', margin: 0 }}>
                                    <li>Youth empowerment & mentorship</li>
                                    <li>Brotherhood/sisterhood gatherings</li>
                                    <li>Da&apos;wah events & outreach</li>
                                    <li>Family-inclusive celebrations</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Commitments Section */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-lg">
                        <h2 style={{
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
                                    className="glass-card"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-4)',
                                        padding: 'var(--space-4)',
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
                                        color: 'var(--text-primary)',
                                        fontSize: 'var(--text-base)',
                                    }}>
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* What Makes Us Different */}
                <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="container container-lg">
                        <h2 style={{
                            textAlign: 'center',
                            marginBottom: 'var(--space-4)',
                        }}>
                            What Makes Us Different
                        </h2>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-8)',
                            maxWidth: '600px',
                            margin: '0 auto var(--space-8)',
                        }}>
                            Sport of Kings trains Muslims for the mats and for the world.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: 'var(--space-6)',
                        }}>
                            {differentiators.map((item, index) => (
                                <div
                                    key={index}
                                    className="glass-card"
                                    style={{ padding: 'var(--space-6)', textAlign: 'center' }}
                                >
                                    <h3 style={{
                                        color: 'var(--color-gold)',
                                        marginBottom: 'var(--space-3)',
                                        fontSize: 'var(--text-lg)',
                                    }}>
                                        {item.title}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        color: 'var(--text-secondary)',
                                        fontSize: 'var(--text-sm)',
                                        lineHeight: '1.7',
                                    }}>
                                        {item.description}
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
                            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                                Beyond the Mats
                            </h2>

                            <p style={{
                                fontSize: 'var(--text-lg)',
                                lineHeight: '1.9',
                                marginBottom: 'var(--space-6)',
                                textAlign: 'center',
                                maxWidth: '800px',
                                margin: '0 auto var(--space-6)',
                            }}>
                                Alongside regular classes, we host <strong>grading ceremonies</strong>, <strong>competitions</strong>, <strong>seminars</strong>, <strong>retreats</strong>, and <strong>community gatherings</strong>, creating spaces for learning, reflection, and connection beyond the mats.
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
                                    It is about showing up consistently, training with intention, and carrying the lessons of the mat into everyday life. Youth are trained not just to &quot;win&quot;, but to carry themselves well in life.
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

                {/* Locations Quick Info */}
                <section
                    className="section"
                    style={{
                        background: 'var(--color-dark-green)',
                        color: 'var(--color-white)',
                    }}
                >
                    <div className="container container-lg" style={{ textAlign: 'center' }}>
                        <h2 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-4)' }}>
                            5 Locations Across Manchester
                        </h2>
                        <p style={{ color: 'var(--color-gray-300)', marginBottom: 'var(--space-6)' }}>
                            Classes for kids, teens, and adults delivered by experienced instructors who uphold both technical excellence and good adab.
                        </p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: 'var(--space-3)',
                            marginBottom: 'var(--space-6)',
                        }}>
                            {['Fats Gym', 'Cheadle Masjid', 'Guidance Hub', 'Afifah School', 'PCC'].map((loc) => (
                                <span
                                    key={loc}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        padding: 'var(--space-2) var(--space-4)',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                >
                                    <MapPin size={14} />
                                    {loc}
                                </span>
                            ))}
                        </div>
                        <Link href="/classes" className="btn btn-outline btn-lg" style={{
                            borderColor: 'var(--color-gold)',
                            color: 'var(--color-gold)',
                        }}>
                            View All Classes
                            <ChevronRight size={20} />
                        </Link>
                    </div>
                </section>

                {/* CTA */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
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
                            Sport of Kings welcomes you. Join a movement building strong Muslims on and off the mats.
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
                            <Link href="/faq" className="btn btn-outline btn-lg">
                                Read FAQ
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
