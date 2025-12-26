import Link from 'next/link';
import { MapPin, Users, User, ChevronRight, Star, Clock, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
    title: 'Classes & Locations | Sport of Kings',
    description: 'Find Brazilian Jiu-Jitsu classes at one of our 5 locations across Manchester. Classes for kids, teens, and adults.',
};

export default async function ClassesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const locations = [
        {
            name: "Fats Gym",
            area: "Manchester City Centre",
            classes: [
                { type: "Kids (Under 11)", gender: "Male & Female" },
                { type: "Teens", gender: "Male & Female" },
                { type: "Adults", gender: "Male & Female" },
            ],
            color: "var(--color-gold)",
        },
        {
            name: "Cheadle Masjid",
            area: "Cheadle",
            classes: [
                { type: "Kids (Under 11)", gender: "Male & Female" },
                { type: "Teens", gender: "Male & Female" },
                { type: "Adults", gender: "Male & Female" },
            ],
            color: "var(--color-gold)",
        },
        {
            name: "Guidance Hub",
            area: "Manchester",
            classes: [
                { type: "Kids (Under 11)", gender: "Male Only" },
                { type: "Teens", gender: "Male Only" },
                { type: "Adults", gender: "Male Only" },
            ],
            color: "var(--color-green)",
        },
        {
            name: "Afifah School",
            area: "Manchester",
            classes: [
                { type: "Kids (Under 11)", gender: "Male Only" },
                { type: "Teens", gender: "Male Only" },
                { type: "Adults", gender: "Male Only" },
            ],
            color: "var(--color-green)",
        },
        {
            name: "Pakistani Community Centre",
            area: "Manchester",
            partner: "Delivered by our brother organisation 313",
            classes: [
                { type: "Kids (Under 11)", gender: "Male Only" },
                { type: "Teens", gender: "Male Only" },
                { type: "Adults", gender: "Male Only" },
            ],
            color: "var(--color-green)",
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
                            Classes & Locations
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-xl)',
                            color: 'var(--text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto',
                        }}>
                            Brazilian Jiu-Jitsu training across 5 locations in Manchester.
                            Find a class that suits you.
                        </p>
                    </div>
                </section>

                {/* Locations Grid */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: 'var(--space-6)',
                        }}>
                            {locations.map((location, index) => (
                                <div
                                    key={location.name}
                                    className="glass-card animate-slide-up"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        borderTop: `4px solid ${location.color}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-full)',
                                            background: location.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <MapPin size={24} color="var(--color-black)" />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>{location.name}</h3>
                                            <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                                                {location.area}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                        {location.classes.map((cls, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: 'var(--space-3)',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: 'var(--radius-md)',
                                                }}
                                            >
                                                <span style={{ fontWeight: '500' }}>{cls.type}</span>
                                                <span style={{
                                                    fontSize: 'var(--text-sm)',
                                                    color: cls.gender === 'Male & Female' ? 'var(--color-gold)' : 'var(--text-tertiary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-1)',
                                                }}>
                                                    {cls.gender === 'Male & Female' ? <Users size={14} /> : <User size={14} />}
                                                    {cls.gender}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {'partner' in location && location.partner && (
                                        <p style={{
                                            marginTop: 'var(--space-3)',
                                            marginBottom: 0,
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--text-tertiary)',
                                            fontStyle: 'italic',
                                            textAlign: 'center',
                                            padding: 'var(--space-2)',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                        }}>
                                            {location.partner}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Coming Soon Card */}
                            <div
                                className="glass-card animate-slide-up"
                                style={{
                                    animationDelay: `${locations.length * 100}ms`,
                                    borderTop: '4px solid var(--border-light)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    minHeight: '200px',
                                }}
                            >
                                <Star size={32} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-3)' }} />
                                <h3 style={{ margin: '0 0 var(--space-2)', color: 'var(--text-secondary)' }}>
                                    More Locations Coming Soon
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                                    We&apos;re expanding across Manchester
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Info Section */}
                <section
                    className="section"
                    style={{
                        background: 'var(--color-dark-green)',
                        color: 'var(--color-white)',
                    }}
                >
                    <div className="container container-lg">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: 'var(--space-6)',
                            textAlign: 'center',
                        }}>
                            <div>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-gold-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto var(--space-4)',
                                }}>
                                    <Users size={28} color="var(--color-black)" />
                                </div>
                                <h4 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-2)' }}>All Ages Welcome</h4>
                                <p style={{ color: 'var(--color-gray-400)', margin: 0 }}>
                                    Classes for children, teens, and adults at every location.
                                </p>
                            </div>
                            <div>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-gold-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto var(--space-4)',
                                }}>
                                    <Calendar size={28} color="var(--color-black)" />
                                </div>
                                <h4 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-2)' }}>Flexible Schedule</h4>
                                <p style={{ color: 'var(--color-gray-400)', margin: 0 }}>
                                    Classes throughout the week and weekends to fit your lifestyle.
                                </p>
                            </div>
                            <div>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-gold-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto var(--space-4)',
                                }}>
                                    <Star size={28} color="var(--color-black)" />
                                </div>
                                <h4 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-2)' }}>Expert Instruction</h4>
                                <p style={{ color: 'var(--color-gray-400)', margin: 0 }}>
                                    Learn from qualified instructors with competitive experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-md" style={{ textAlign: 'center' }}>
                        <h2 style={{ marginBottom: 'var(--space-4)' }}>
                            Ready to Start Training?
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-8)',
                            fontSize: 'var(--text-lg)',
                        }}>
                            Register now and choose a location that works for you.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-4)',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <Link href="/register" className="btn btn-primary btn-lg">
                                Register Now
                                <ChevronRight size={20} />
                            </Link>
                            <Link href="/about" className="btn btn-outline btn-lg">
                                Learn More About Us
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
