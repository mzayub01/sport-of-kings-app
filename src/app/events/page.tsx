import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import EventRegistration from '@/components/events/EventRegistration';
import PaymentStatusBanner from '@/components/events/PaymentStatusBanner';

export const metadata = {
    title: 'Events | Sport of Kings',
    description: 'Upcoming seminars, competitions, and community gatherings.',
};

export default async function EventsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userProfile: { id: string; email: string; full_name?: string } | null = null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .single();

        userProfile = {
            id: user.id,
            email: user.email!,
            full_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined
        };
    }

    // Fetch upcoming public events
    const today = new Date().toISOString().split('T')[0];
    const { data: events } = await supabase
        .from('events')
        .select(`
            *,
            location:locations(name)
        `)
        .eq('is_members_only', false)
        .gte('start_date', today)
        .order('start_date', { ascending: true });

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
                            Community Events
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-xl)',
                            color: 'var(--text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto',
                        }}>
                            Seminars, competitions, and gatherings to strengthen our brotherhood and sisterhood.
                        </p>
                    </div>
                </section>

                {/* Payment Status Banner */}
                <Suspense fallback={null}>
                    <PaymentStatusBanner />
                </Suspense>

                {/* Events List */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-lg">
                        {events && events.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                                gap: 'var(--space-6)',
                            }}>
                                {events.map((event, index) => (
                                    <EventRegistration
                                        key={event.id}
                                        event={event}
                                        user={userProfile}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card" style={{
                                textAlign: 'center',
                                padding: 'var(--space-12) var(--space-6)',
                                maxWidth: '600px',
                                margin: '0 auto',
                            }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto var(--space-6)',
                                }}>
                                    <Calendar size={32} color="var(--color-gold)" />
                                </div>
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>No Upcoming Public Events</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                                    We don&apos;t have any public events scheduled at the moment.
                                    Please check back later or start your journey with our regular classes.
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
                                    <Link href="/classes" className="btn btn-primary">
                                        View Class Schedule
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
