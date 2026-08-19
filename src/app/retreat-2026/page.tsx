'use client';

import { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    ChevronDown,
    Flame,
    Swords,
    Target,
    Waves,
    Mountain,
    BookOpen,
    Mic,
    Moon,
    HeartHandshake,
    Plane,
    ArrowDown,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSupabaseClient } from '@/lib/supabase/client';
import { RETREAT, RETREAT_PRICES, formatPence } from '@/lib/retreat';
import RegistrationForm from './RegistrationForm';

const HERO_IMG = 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=2000&q=80';
const KASBAH_IMG = 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=2000&q=80';
const ZELLIGE_IMG = 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1200&q=80';

const FAQS = [
    {
        q: 'When and where is the retreat?',
        a: `${RETREAT.dates}, at a private resort in the Atlas Mountains outside Marrakech, Morocco. The exact venue and full itinerary are shared with confirmed attendees after registration.`,
    },
    {
        q: 'What’s included in the price?',
        a: 'Private resort accommodation with swimming pool, all meals, all activities and training — BJJ with expert instructors, archery, excursions, swimming — and the full spiritual programme of daily zikr, Qur’an and talks. Flights are the only thing not included.',
    },
    {
        q: 'Who can attend?',
        a: 'The retreat is for brothers — adults and boys. Children must be part of a booking that includes at least one adult responsible for them throughout the retreat.',
    },
    {
        q: 'Do I need BJJ experience?',
        a: 'Not at all. Training is delivered by expert instructors and works for complete beginners through to experienced grapplers. Every activity is optional — come as you are.',
    },
    {
        q: 'How do flights work?',
        a: 'Flights are not included. Current guide prices from Manchester to Marrakech are around £150–£220 return, but they rise quickly — we strongly recommend booking as soon as your place is confirmed. We’ll share travel guidance with confirmed attendees.',
    },
    {
        q: 'What if the cost is a barrier?',
        a: 'Bursaries are available on request — please contact us in confidence at sportofkings786@gmail.com. And if you’d like to sponsor a place for someone less able to afford it, we’d love to hear from you.',
    },
    {
        q: 'How does payment work?',
        a: 'Registration is completed with full payment through our secure Stripe checkout — you’ll receive an itemised receipt and a confirmation email straight away. If your circumstances change after booking, contact us as soon as possible and we’ll do our best to help.',
    },
];

export default function Retreat2026Page() {
    const [user, setUser] = useState<{ id: string; email: string } | null>(null);
    const [soldOut, setSoldOut] = useState(false);
    // Only populated by the API when places are genuinely low; null = plenty left
    const [remaining, setRemaining] = useState<number | null>(null);
    const supabase = getSupabaseClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUser({ id: data.user.id, email: data.user.email || '' });
        });
        fetch('/api/retreat/availability')
            .then(res => res.json())
            .then(data => {
                setSoldOut(!!data.soldOut);
                setRemaining(typeof data.remaining === 'number' ? data.remaining : null);
            })
            .catch(() => {
                setSoldOut(false);
                setRemaining(null);
            });
    }, [supabase]);

    const lowAvailability = !soldOut && remaining !== null;

    return (
        <div className="rt26">
            <Navbar user={user} />

            {/* ===== Hero ===== */}
            <header className="rt26-hero">
                <div className="rt26-hero-bg" role="img" aria-label="The Koutoubia minaret in Marrakech against the snow-capped Atlas Mountains" />
                <div className="rt26-hero-scrim" />
                <div className="rt26-hero-content">
                    <p className="rt26-kicker">Sport of Kings presents</p>
                    <h1 className="rt26-title">
                        Suhba Retreat
                        <span className="rt26-title-year">2026</span>
                    </h1>
                    <p className="rt26-hero-sub">
                        Brotherhood in the Atlas Mountains — Marrakech, Morocco
                    </p>
                    <div className="rt26-hero-meta">
                        <span><Calendar size={16} /> {RETREAT.dates}</span>
                        <span className="rt26-meta-dot">·</span>
                        <span><MapPin size={16} /> Private mountain resort</span>
                    </div>
                    <div className="rt26-hero-actions">
                        {soldOut ? (
                            <a href="mailto:sportofkings786@gmail.com?subject=Retreat 2026 waiting list" className="rt26-btn-gold">
                                <Flame size={18} />
                                Fully booked — join the waiting list
                            </a>
                        ) : (
                            <a href="#register" className="rt26-btn-gold">
                                <Flame size={18} />
                                Secure your place
                            </a>
                        )}
                        <a href="#experience" className="rt26-btn-ghost">
                            Explore the retreat
                            <ArrowDown size={16} />
                        </a>
                    </div>
                    <p className="rt26-urgency">
                        {soldOut
                            ? 'Every place has been taken. Email us to be first in line if one opens up.'
                            : lowAvailability
                                ? `Only ${remaining} ${remaining === 1 ? 'place' : 'places'} left — first come, first served.`
                                : 'Last year sold out. Spaces are strictly limited — first come, first served.'}
                    </p>
                </div>
            </header>

            <main>
                {/* ===== Intro ===== */}
                <section className="rt26-section" id="experience">
                    <div className="rt26-container rt26-narrow">
                        <h2 className="rt26-statement">
                            This is the one you&apos;ve been <em>waiting for</em>.
                        </h2>
                        <p className="rt26-lead">
                            Three nights in the stillness of the Atlas Mountains. Train hard, eat well,
                            swim under the open sky — then gather for zikr as the sun sets behind the
                            peaks. The Suhba Retreat is built to strengthen both <strong>body and
                            soul</strong>: resilience on the mats, brotherhood at the table, and faith
                            at the heart of it all.
                        </p>
                    </div>
                </section>

                {/* ===== Body & Soul ===== */}
                <section className="rt26-section rt26-section-tight">
                    <div className="rt26-container">
                        <div className="rt26-split">
                            <div className="rt26-split-col">
                                <h3 className="rt26-col-title">The Body</h3>
                                <ul className="rt26-list">
                                    <li><Swords size={20} /> <div><strong>Brazilian Jiu-Jitsu</strong><span>Daily sessions with expert instructors — every level welcome</span></div></li>
                                    <li><Target size={20} /> <div><strong>Archery</strong><span>Reviving a Sunnah sport in the mountain air</span></div></li>
                                    <li><Mountain size={20} /> <div><strong>Excursions</strong><span>Adventures into the Atlas — earned views, shared stories</span></div></li>
                                    <li><Waves size={20} /> <div><strong>Swimming</strong><span>Private pool sessions at the resort</span></div></li>
                                </ul>
                            </div>
                            <div className="rt26-split-rule" aria-hidden="true" />
                            <div className="rt26-split-col">
                                <h3 className="rt26-col-title">The Soul</h3>
                                <ul className="rt26-list">
                                    <li><Moon size={20} /> <div><strong>Daily zikr</strong><span>Hizbul Bahr in congregation, morning and evening</span></div></li>
                                    <li><BookOpen size={20} /> <div><strong>Qur&apos;an</strong><span>Surah Al-Waqi&apos;ah, Al-Mulk &amp; Yasin recited together</span></div></li>
                                    <li><Mic size={20} /> <div><strong>Lessons &amp; talks</strong><span>Suhba with esteemed Sheikhs throughout the retreat</span></div></li>
                                    <li><HeartHandshake size={20} /> <div><strong>Brotherhood</strong><span>The company that outlasts the journey</span></div></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== Image band ===== */}
                <section className="rt26-band" style={{ backgroundImage: `url(${KASBAH_IMG})` }}>
                    <div className="rt26-band-scrim" />
                    <blockquote className="rt26-band-quote">
                        <p>&ldquo;Strengthen the body. Nourish the soul.&rdquo;</p>
                        <footer>Kasbahs and palm groves beneath the High Atlas</footer>
                    </blockquote>
                </section>

                {/* ===== Pricing ===== */}
                <section className="rt26-section" id="pricing">
                    <div className="rt26-container">
                        <h2 className="rt26-heading">Your place</h2>
                        <p className="rt26-subheading">
                            One price covers everything on the ground — accommodation at a private
                            resort with pool, all meals, all activities and training.
                        </p>

                        <div className="rt26-tiers">
                            <div className="rt26-tier rt26-tier-featured">
                                <p className="rt26-tier-label">Adults</p>
                                <p className="rt26-tier-price">{formatPence(RETREAT_PRICES.adult)}</p>
                                <p className="rt26-tier-note">16 and over</p>
                            </div>
                            <div className="rt26-tier">
                                <p className="rt26-tier-label">Children 10–15</p>
                                <p className="rt26-tier-price">{formatPence(RETREAT_PRICES.child_10_15)}</p>
                                <p className="rt26-tier-note">Sharing a room</p>
                            </div>
                            <div className="rt26-tier">
                                <p className="rt26-tier-label">Children under 10</p>
                                <p className="rt26-tier-price">{formatPence(RETREAT_PRICES.child_under_10)}</p>
                                <p className="rt26-tier-note">With a parent</p>
                            </div>
                        </div>

                        <div className="rt26-price-notes">
                            <p>
                                <Plane size={18} />
                                <span>
                                    <strong>Flights not included.</strong> Manchester → Marrakech is currently
                                    around £150–£220 return — prices rise quickly, so book early once your
                                    place is confirmed.
                                </span>
                            </p>
                            <p>
                                <HeartHandshake size={18} />
                                <span>
                                    <strong>Bursaries available on request.</strong> If cost is a barrier — or
                                    if you&apos;d like to sponsor a place for someone else — contact us at{' '}
                                    <a href="mailto:sportofkings786@gmail.com">sportofkings786@gmail.com</a>.
                                </span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* ===== Spiritual rhythm ===== */}
                <section className="rt26-section rt26-section-tight">
                    <div className="rt26-container">
                        <div className="rt26-media-split">
                            <img
                                src={ZELLIGE_IMG}
                                alt="Hand-cut zellige mosaic fountain framed by carved Moorish arches"
                                loading="lazy"
                            />
                            <div>
                                <h2 className="rt26-heading" style={{ textAlign: 'left' }}>A day with its own rhythm</h2>
                                <p className="rt26-body">
                                    Fajr in congregation as the mountains take shape in the dawn light.
                                    Training while the day is cool. An afternoon in the pool or out on
                                    excursion. And as evening falls — zikr, Qur&apos;an, tea, and the kind
                                    of conversation that only happens away from home.
                                </p>
                                <p className="rt26-body">
                                    No phones demanding attention. No schedule but the adhan and the
                                    programme. Three nights that leave you stronger than they found you.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== Registration ===== */}
                <section className="rt26-section rt26-register" id="register">
                    <div className="rt26-container rt26-narrow">
                        <h2 className="rt26-heading">{soldOut ? 'Fully booked' : 'Register now'}</h2>
                        {soldOut ? (
                            <div className="rt26-card" style={{ textAlign: 'center' }}>
                                <p className="rt26-body" style={{ marginBottom: 'var(--space-5)' }}>
                                    Every place on the Suhba Retreat 2026 has been taken, alhamdulillah.
                                    Places do occasionally open up — email us and we&apos;ll put you first
                                    in line.
                                </p>
                                <a
                                    href="mailto:sportofkings786@gmail.com?subject=Retreat 2026 waiting list"
                                    className="rt26-btn-gold"
                                >
                                    Join the waiting list
                                </a>
                            </div>
                        ) : (
                            <>
                                <p className="rt26-subheading">
                                    Add everyone travelling in your party — the total updates as you go, and
                                    payment is taken securely by card at checkout. Places are only confirmed
                                    once payment is complete.
                                    {lowAvailability && (
                                        <strong style={{ display: 'block', color: 'var(--color-gold-dark)', marginTop: 'var(--space-2)' }}>
                                            Only {remaining} {remaining === 1 ? 'place' : 'places'} left.
                                        </strong>
                                    )}
                                </p>
                                <RegistrationForm remaining={remaining} />
                            </>
                        )}
                    </div>
                </section>

                {/* ===== FAQ ===== */}
                <section className="rt26-section" id="faq">
                    <div className="rt26-container rt26-narrow">
                        <h2 className="rt26-heading">Questions, answered</h2>
                        <div className="rt26-faq">
                            {FAQS.map((faq) => (
                                <details key={faq.q} className="rt26-faq-item">
                                    <summary>
                                        {faq.q}
                                        <ChevronDown size={18} className="rt26-faq-chevron" />
                                    </summary>
                                    <p>{faq.a}</p>
                                </details>
                            ))}
                        </div>
                        <p className="rt26-faq-footer">
                            Anything else? Email{' '}
                            <a href="mailto:sportofkings786@gmail.com">sportofkings786@gmail.com</a>
                            {' '}and we&apos;ll get straight back to you.
                        </p>
                    </div>
                </section>

                {/* ===== Final CTA ===== */}
                <section className="rt26-final">
                    <div className="rt26-container rt26-narrow" style={{ textAlign: 'center' }}>
                        <h2 className="rt26-statement">
                            Once places are gone, <em>they&apos;re gone</em>.
                        </h2>
                        <p className="rt26-lead">
                            {soldOut
                                ? 'And now they are. Email us to join the waiting list in case one opens up.'
                                : 'For those who missed out last year — don’t make the same mistake again.'}
                        </p>
                        {soldOut ? (
                            <a
                                href="mailto:sportofkings786@gmail.com?subject=Retreat 2026 waiting list"
                                className="rt26-btn-gold"
                                style={{ marginTop: 'var(--space-6)' }}
                            >
                                Join the waiting list
                            </a>
                        ) : (
                            <a href="#register" className="rt26-btn-gold" style={{ marginTop: 'var(--space-6)' }}>
                                <Flame size={18} />
                                Secure your place
                            </a>
                        )}
                    </div>
                </section>
            </main>

            <Footer />

            {/* ===== Page styles ===== */}
            <style>{`
                .rt26 {
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }
                .rt26 main { overflow-x: hidden; }
                .rt26-container {
                    max-width: 1080px;
                    margin: 0 auto;
                    padding: 0 clamp(1.25rem, 4vw, 2.5rem);
                }
                .rt26-narrow { max-width: 780px; }

                /* --- Hero --- */
                .rt26-hero {
                    position: relative;
                    min-height: 100svh;
                    display: flex;
                    align-items: center;
                    isolation: isolate;
                    overflow: hidden; /* clip the slow-zoom background to the hero */
                }
                .rt26-hero-bg {
                    position: absolute;
                    inset: 0;
                    background-image: url(${HERO_IMG});
                    background-size: cover;
                    background-position: center 30%;
                    z-index: -2;
                    animation: rt26-drift 28s ease-out forwards;
                }
                @keyframes rt26-drift {
                    from { transform: scale(1.08); }
                    to { transform: scale(1); }
                }
                .rt26-hero-scrim {
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    /* Two layers: an even darkening for text contrast, plus a separate
                       white fade at the bottom — keeps the photo consistently dark all
                       the way down instead of brightening just before the page starts */
                    background:
                        linear-gradient(to bottom, rgba(255, 255, 255, 0) 72%, var(--bg-primary) 97%),
                        linear-gradient(to bottom, rgba(10, 20, 15, 0.55) 0%, rgba(10, 20, 15, 0.42) 100%);
                }
                .rt26-hero-content {
                    width: 100%;
                    max-width: 1080px;
                    margin: 0 auto;
                    padding: clamp(6rem, 12vh, 8rem) clamp(1.25rem, 4vw, 2.5rem) clamp(6rem, 14vh, 9rem);
                    text-align: center;
                }
                .rt26-kicker {
                    font-size: 0.85rem;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: #d9c584;
                    margin: 0 0 var(--space-4);
                    font-weight: 600;
                }
                .rt26-title {
                    font-family: var(--font-outfit, var(--font-display));
                    font-size: clamp(2.75rem, 9vw, 5.75rem);
                    line-height: 1.02;
                    letter-spacing: -0.02em;
                    text-transform: uppercase;
                    font-weight: 800;
                    color: #fdfbf5;
                    margin: 0;
                    text-wrap: balance;
                }
                .rt26-title-year {
                    display: block;
                    color: transparent;
                    -webkit-text-stroke: 2px #C5A456;
                    font-size: clamp(3.25rem, 11vw, 7rem);
                    line-height: 1;
                }
                .rt26-hero-sub {
                    font-size: clamp(1.05rem, 2.2vw, 1.35rem);
                    color: #e8e0cd;
                    margin: var(--space-5) 0 0;
                }
                .rt26-hero-meta {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    align-items: center;
                    gap: var(--space-3);
                    margin-top: var(--space-4);
                    color: #d9c584;
                    font-weight: 600;
                    font-size: 0.95rem;
                }
                .rt26-hero-meta span { display: inline-flex; align-items: center; gap: 6px; }
                .rt26-meta-dot { color: rgba(217, 197, 132, 0.5); }
                .rt26-hero-actions {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: var(--space-3);
                    margin-top: var(--space-7, 2rem);
                }
                .rt26-urgency {
                    margin-top: var(--space-5);
                    font-size: 0.9rem;
                    color: rgba(242, 237, 226, 0.75);
                }

                /* --- Buttons --- */
                .rt26-btn-gold, .rt26-btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0.95rem 1.9rem;
                    border-radius: 999px;
                    font-weight: 700;
                    font-size: 1rem;
                    text-decoration: none;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
                }
                .rt26-btn-gold {
                    background: var(--color-gold-gradient);
                    color: #17130a;
                    box-shadow: 0 6px 24px rgba(197, 164, 86, 0.35);
                }
                .rt26-btn-gold:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(197, 164, 86, 0.45); }
                .rt26-btn-ghost {
                    border: 1px solid rgba(242, 237, 226, 0.35);
                    color: #f2ede2;
                }
                .rt26-btn-ghost:hover { background: rgba(242, 237, 226, 0.08); }

                /* --- Sections & type --- */
                .rt26-section { padding: clamp(4rem, 10vw, 7rem) 0; }
                .rt26-section-tight { padding-top: 0; }
                .rt26-statement {
                    font-family: var(--font-outfit, var(--font-display));
                    font-size: clamp(1.9rem, 4.5vw, 3rem);
                    line-height: 1.15;
                    text-align: center;
                    color: var(--text-primary);
                    margin: 0 0 var(--space-5);
                    text-wrap: balance;
                }
                .rt26-statement em { color: var(--color-gold-dark); font-style: italic; }
                .rt26-lead {
                    font-size: clamp(1.05rem, 2vw, 1.25rem);
                    line-height: 1.75;
                    color: var(--text-secondary);
                    text-align: center;
                    margin: 0;
                }
                .rt26-lead strong { color: var(--color-gold-dark); }
                .rt26-heading {
                    font-family: var(--font-outfit, var(--font-display));
                    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
                    color: var(--text-primary);
                    text-align: center;
                    margin: 0 0 var(--space-4);
                    text-wrap: balance;
                }
                .rt26-subheading {
                    text-align: center;
                    color: var(--text-secondary);
                    max-width: 620px;
                    margin: 0 auto var(--space-8);
                    line-height: 1.7;
                }
                .rt26-body {
                    color: var(--text-secondary);
                    line-height: 1.8;
                    margin: 0 0 var(--space-4);
                }

                /* --- Body & Soul split --- */
                .rt26-split {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: clamp(2rem, 5vw, 4rem);
                    align-items: start;
                }
                .rt26-split-rule {
                    width: 1px;
                    align-self: stretch;
                    background: linear-gradient(to bottom, transparent, rgba(197, 164, 86, 0.5), transparent);
                }
                .rt26-col-title {
                    font-family: var(--font-outfit, var(--font-display));
                    font-size: 1.35rem;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--color-gold-dark);
                    margin: 0 0 var(--space-5);
                }
                .rt26-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-5); }
                .rt26-list li { display: flex; gap: var(--space-3); align-items: flex-start; }
                .rt26-list li svg { color: var(--color-gold-dark); flex-shrink: 0; margin-top: 3px; }
                .rt26-list li strong { display: block; color: var(--text-primary); font-size: 1.05rem; }
                .rt26-list li span { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }

                /* --- Image band --- */
                .rt26-band {
                    position: relative;
                    min-height: 52vh;
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    isolation: isolate;
                }
                @media (hover: none) { .rt26-band { background-attachment: scroll; } }
                .rt26-band-scrim { position: absolute; inset: 0; background: rgba(12, 26, 19, 0.55); z-index: -1; }
                .rt26-band-quote { margin: 0; padding: var(--space-8) var(--space-6); text-align: center; }
                .rt26-band-quote p {
                    font-family: var(--font-outfit, var(--font-display));
                    font-size: clamp(1.6rem, 4vw, 2.6rem);
                    color: #fdfbf5;
                    margin: 0 0 var(--space-3);
                    text-wrap: balance;
                }
                .rt26-band-quote footer { color: #d9c584; font-size: 0.9rem; letter-spacing: 0.08em; }

                /* --- Pricing --- */
                .rt26-tiers {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: var(--space-4);
                    max-width: 860px;
                    margin: 0 auto var(--space-8);
                }
                .rt26-tier {
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-xl);
                    padding: var(--space-6) var(--space-5);
                    text-align: center;
                    background: var(--bg-primary);
                    box-shadow: var(--shadow-sm);
                }
                .rt26-tier-featured {
                    border: 2px solid var(--color-gold);
                    background: rgba(197, 164, 86, 0.06);
                    box-shadow: var(--shadow-gold);
                }
                .rt26-tier-label { margin: 0 0 var(--space-2); color: var(--color-gold-dark); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.85rem; }
                .rt26-tier-price {
                    font-family: var(--font-outfit, var(--font-display));
                    font-size: clamp(2.2rem, 5vw, 2.9rem);
                    font-weight: 800;
                    color: var(--text-primary);
                    margin: 0;
                    line-height: 1.1;
                }
                .rt26-tier-note { margin: var(--space-2) 0 0; color: var(--text-secondary); font-size: 0.9rem; }
                .rt26-price-notes { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-4); }
                .rt26-price-notes p { display: flex; gap: var(--space-3); align-items: flex-start; margin: 0; color: var(--text-secondary); line-height: 1.7; }
                .rt26-price-notes svg { color: var(--color-gold-dark); flex-shrink: 0; margin-top: 4px; }
                .rt26-price-notes a { color: var(--color-gold-dark); text-decoration: underline; }

                /* --- Media split --- */
                .rt26-media-split {
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    gap: clamp(2rem, 5vw, 4rem);
                    align-items: center;
                }
                .rt26-media-split img {
                    width: 100%;
                    border-radius: var(--radius-xl);
                    border: 1px solid rgba(197, 164, 86, 0.35);
                    max-height: 460px;
                    object-fit: cover;
                }

                /* --- Register --- */
                .rt26-register {
                    background:
                        radial-gradient(ellipse at 50% 0%, rgba(197, 164, 86, 0.08), transparent 60%),
                        var(--bg-secondary);
                }

                /* --- FAQ --- */
                .rt26-faq { display: flex; flex-direction: column; gap: var(--space-3); }
                .rt26-faq-item {
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-lg);
                    background: var(--bg-primary);
                    box-shadow: var(--shadow-sm);
                    overflow: hidden;
                }
                .rt26-faq-item summary {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: var(--space-4);
                    padding: var(--space-4) var(--space-5);
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--text-primary);
                    list-style: none;
                }
                .rt26-faq-item summary::-webkit-details-marker { display: none; }
                .rt26-faq-chevron { color: var(--color-gold-dark); flex-shrink: 0; transition: transform 0.25s ease; }
                .rt26-faq-item[open] .rt26-faq-chevron { transform: rotate(180deg); }
                .rt26-faq-item p {
                    margin: 0;
                    padding: 0 var(--space-5) var(--space-5);
                    color: var(--text-secondary);
                    line-height: 1.75;
                }
                .rt26-faq-item a { color: var(--color-gold-dark); text-decoration: underline; }
                .rt26-faq-footer { text-align: center; margin-top: var(--space-6); color: var(--text-secondary); }
                .rt26-faq-footer a { color: var(--color-gold-dark); text-decoration: underline; }

                /* --- Final CTA --- */
                .rt26-final {
                    padding: clamp(4rem, 10vw, 7rem) 0;
                    background: linear-gradient(135deg, var(--color-dark-green) 0%, var(--color-dark-green-light) 100%);
                }
                .rt26-final .rt26-statement { color: var(--color-white); }
                .rt26-final .rt26-statement em { color: var(--color-gold); }
                .rt26-final .rt26-lead { color: var(--color-gray-300); }

                /* --- Form (RegistrationForm uses these) --- */
                .rt26-form { display: flex; flex-direction: column; gap: var(--space-6); }
                .rt26-card {
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-xl);
                    background: var(--bg-primary);
                    box-shadow: var(--shadow-sm);
                    padding: var(--space-6) var(--space-5);
                }
                .rt26-card h3 {
                    margin: 0 0 var(--space-4);
                    font-size: 1.05rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--color-gold-dark);
                }
                .rt26-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-4); }
                .rt26-field label { font-size: 0.9rem; font-weight: 600; color: var(--color-gray-700); }
                .rt26-field input, .rt26-field textarea, .rt26-field select {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-medium);
                    border-radius: var(--radius-md);
                    padding: 0.8rem 1rem;
                    color: var(--text-primary);
                    font-size: 1rem;
                    font-family: inherit;
                    width: 100%;
                }
                .rt26-field input::placeholder, .rt26-field textarea::placeholder { color: var(--color-gray-500); }
                .rt26-field input:focus-visible, .rt26-field textarea:focus-visible, .rt26-field select:focus-visible {
                    outline: 2px solid var(--color-gold);
                    outline-offset: 1px;
                    border-color: var(--color-gold);
                }
                .rt26-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 var(--space-4); }
                .rt26-stepper-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: var(--space-3);
                    padding: var(--space-3) 0;
                    border-bottom: 1px solid var(--border-light);
                }
                .rt26-stepper-row:last-child { border-bottom: none; }
                .rt26-stepper-label strong { display: block; color: var(--text-primary); }
                .rt26-stepper-label span { color: var(--text-secondary); font-size: 0.9rem; }
                .rt26-stepper { display: flex; align-items: center; gap: var(--space-3); }
                .rt26-stepper button {
                    width: 44px; height: 44px;
                    border-radius: 999px;
                    border: 1px solid var(--color-gold);
                    background: transparent;
                    color: var(--color-gold-dark);
                    font-size: 1.3rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.15s ease;
                }
                .rt26-stepper button:hover:not(:disabled) { background: rgba(197, 164, 86, 0.12); }
                .rt26-stepper button:disabled { opacity: 0.3; cursor: default; }
                .rt26-stepper-count { min-width: 28px; text-align: center; font-weight: 800; font-size: 1.2rem; color: var(--text-primary); }
                .rt26-attendee {
                    border: 1px dashed rgba(168, 139, 61, 0.5);
                    border-radius: var(--radius-lg);
                    padding: var(--space-4);
                    margin-top: var(--space-4);
                    background: var(--bg-secondary);
                }
                .rt26-attendee-tag {
                    display: inline-block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--color-gold-dark);
                    margin-bottom: var(--space-3);
                }
                .rt26-total {
                    position: sticky;
                    bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: var(--space-4);
                    flex-wrap: wrap;
                    background: rgba(255, 255, 255, 0.94);
                    backdrop-filter: blur(8px);
                    border: 1px solid var(--color-gold);
                    border-radius: var(--radius-xl);
                    padding: var(--space-4) var(--space-5);
                    box-shadow: var(--shadow-xl);
                    z-index: 5;
                }
                .rt26-total-amount { font-family: var(--font-outfit, var(--font-display)); font-size: 1.9rem; font-weight: 800; color: var(--text-primary); }
                .rt26-total-breakdown { color: var(--text-secondary); font-size: 0.9rem; }
                .rt26-form-error {
                    border: 1px solid rgba(197, 48, 48, 0.5);
                    background: rgba(197, 48, 48, 0.08);
                    color: var(--color-red);
                    border-radius: var(--radius-lg);
                    padding: var(--space-4);
                }
                .rt26-submit {
                    width: 100%;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    font-family: inherit;
                }
                .rt26-submit:disabled { opacity: 0.6; cursor: default; transform: none; }
                .rt26-secure-note { text-align: center; color: var(--text-secondary); font-size: 0.85rem; margin: var(--space-3) 0 0; }

                /* --- Responsive --- */
                @media (max-width: 820px) {
                    .rt26-split { grid-template-columns: 1fr; }
                    .rt26-split-rule { width: 100%; height: 1px; background: linear-gradient(to right, transparent, rgba(197, 164, 86, 0.5), transparent); }
                    .rt26-media-split { grid-template-columns: 1fr; }
                    .rt26-grid-2 { grid-template-columns: 1fr; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .rt26-hero-bg { animation: none; }
                    .rt26-btn-gold:hover { transform: none; }
                    .rt26-faq-chevron { transition: none; }
                }
            `}</style>
        </div>
    );
}
