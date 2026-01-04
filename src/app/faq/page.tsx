'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ChevronDown,
    ChevronRight,
    HelpCircle,
    Users,
    Shield,
    Calendar,
    CreditCard,
    MapPin,
    Heart,
    UserCheck,
    Swords,
    Star
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface FAQItem {
    question: string;
    answer: string | React.ReactNode;
}

interface FAQSection {
    title: string;
    icon: React.ElementType;
    items: FAQItem[];
}

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
    return (
        <div
            style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-light)',
            }}
        >
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: 'var(--space-4) var(--space-5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: '500',
                }}
            >
                <span>{item.question}</span>
                <ChevronDown
                    size={20}
                    style={{
                        flexShrink: 0,
                        color: 'var(--color-gold)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                />
            </button>
            <div
                style={{
                    maxHeight: isOpen ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                }}
            >
                <div
                    style={{
                        padding: '0 var(--space-5) var(--space-5)',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.7',
                    }}
                >
                    {typeof item.answer === 'string' ? <p style={{ margin: 0 }}>{item.answer}</p> : item.answer}
                </div>
            </div>
        </div>
    );
}

export default function FAQPage() {
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const toggleItem = (sectionIndex: number, itemIndex: number) => {
        const key = `${sectionIndex}-${itemIndex}`;
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const faqSections: FAQSection[] = [
        {
            title: 'About Sport of Kings',
            icon: Shield,
            items: [
                {
                    question: 'What is Sport of Kings?',
                    answer: 'Sport of Kings is a non-profit registered charity organisation that uses Sunnah sports to build strong, disciplined, faith-anchored individuals and communities — not just fighters. We are a holistic development platform rooted in Sunnah sports, faith, and community, training individuals for the mats and for life. Everyone is welcome.'
                },
                {
                    question: 'Is Sport of Kings just about Brazilian Jiu-Jitsu?',
                    answer: (
                        <div>
                            <p style={{ marginTop: 0 }}>No. While BJJ and grappling are our core focus, Sport of Kings offers much more:</p>
                            <ul style={{ paddingLeft: 'var(--space-5)', marginBottom: 0 }}>
                                <li><strong>Sunnah Sports:</strong> Wrestling, grappling, archery (coming soon), horse riding (coming soon)</li>
                                <li><strong>Spiritual Development:</strong> Dhikr gatherings, youth dars, Islamic learning sessions, retreats</li>
                                <li><strong>Community Initiatives:</strong> Youth mentorship, brotherhood/sisterhood gatherings, da'wah events</li>
                                <li><strong>Fitness:</strong> Conditioning and self-defence training</li>
                            </ul>
                        </div>
                    )
                },
                {
                    question: 'What makes Sport of Kings different from other martial arts clubs?',
                    answer: (
                        <div>
                            <p style={{ marginTop: 0 }}>Sport of Kings is fundamentally different in several ways:</p>
                            <ul style={{ paddingLeft: 'var(--space-5)', marginBottom: 0 }}>
                                <li><strong>Sunnah-Centred:</strong> Training is framed as a revival of Sunnah sports with emphasis on adab, intention, and character</li>
                                <li><strong>Faith-Aligned:</strong> Islamic etiquette, modesty, and safeguarding are built into our culture with appropriate provision for all</li>
                                <li><strong>Community-First:</strong> We operate in masjids and community spaces, prioritising access and affordability over profit</li>
                                <li><strong>Strong Lineage:</strong> Direct lineage through respected instructors like Professor Mario Sukata with consistent high standards</li>
                                <li><strong>Whole-Person Development:</strong> Physical training + spiritual grounding + brotherhood/sisterhood</li>
                            </ul>
                        </div>
                    )
                },
                {
                    question: 'Will this fit with Islamic values?',
                    answer: 'Absolutely. Sport of Kings is intentionally designed to uphold Islamic etiquette (adab), encourage good character and brotherhood/sisterhood, and align training with faith — not distract from it. Classes are structured around salah times where relevant, and we maintain clear separation and appropriate provision for women, girls, boys, and men.'
                },
            ]
        },
        {
            title: 'Classes & Training',
            icon: Swords,
            items: [
                {
                    question: 'What can I expect in a typical class?',
                    answer: 'Classes include warm-ups, technique drills, controlled sparring (for appropriate levels), and cool-down. All training is conducted with respect, discipline, and safety in mind. Sessions begin and end with appropriate etiquette, and our instructors maintain a positive, encouraging environment throughout.'
                },
                {
                    question: 'Do I need prior martial arts experience?',
                    answer: 'No prior experience is required. Beginners are fully supported with clear onboarding, best-practice guidance, and ongoing communication. Our structured curriculum ensures everyone can progress at their own pace regardless of starting point.'
                },
                {
                    question: 'Is BJJ safe for children?',
                    answer: 'Yes. Our children\'s classes are age-appropriate and structured, led by qualified instructors, and focused on control, safety, and respect. We have comprehensive safeguarding policies, DBS-checked staff, and clear escalation processes to ensure your child\'s wellbeing.'
                },
                {
                    question: 'Is training too aggressive?',
                    answer: 'No. Sport of Kings emphasises self-control, humility, and discipline. We have zero tolerance for bullying or reckless behaviour. Strength is framed as responsibility, not dominance. Our students learn to protect themselves while respecting others.'
                },
                {
                    question: 'What age groups do you cater for?',
                    answer: 'We offer classes for Under 11s (Kids), Teens, and Adults at most locations. Each age group has specifically designed curricula that are appropriate for their developmental stage and learning needs.'
                },
                {
                    question: 'What should I wear to training?',
                    answer: 'A BJJ gi (uniform) is mandatory for all classes. A link to purchase your gi will be provided during the sign-up process. Modest clothing that allows movement is required in line with Islamic values. Footwear isn\'t needed on the mats (we train barefoot), but bring flip-flops/sandals for walking around the venue.'
                },
            ]
        },
        {
            title: 'Membership & Pricing',
            icon: CreditCard,
            items: [
                {
                    question: 'How much does membership cost?',
                    answer: (
                        <div>
                            <p style={{ marginTop: 0 }}>Our standard monthly membership rates are:</p>
                            <ul style={{ paddingLeft: 'var(--space-5)', marginBottom: 'var(--space-3)' }}>
                                <li><strong>Adults:</strong> £30/month</li>
                                <li><strong>Teens:</strong> £20/month</li>
                                <li><strong>Under 11s (Kids):</strong> £15/month</li>
                            </ul>
                            <p style={{ marginBottom: 0 }}>Some locations offer free kids classes (such as Fats Gym). Bursaries are available for those who need financial support — we believe cost should never be a barrier to participation.</p>
                        </div>
                    )
                },
                {
                    question: 'Are there any discounts available?',
                    answer: 'Yes. We offer family discounts for multiple members from the same household. Bursaries and financial support are available for those who need it — please speak to us in confidence. At certain locations like Fats Gym, kids classes are completely free.'
                },
                {
                    question: 'How do I pay for membership?',
                    answer: 'Membership payments are handled through our secure online system via Stripe. You can set up monthly recurring payments with a credit or debit card. Your subscription can be managed through your member dashboard.'
                },
                {
                    question: 'How do I make changes to my membership?',
                    answer: 'For any changes to your membership — including upgrades, downgrades, pausing, or cancellations — please contact us directly at info@sportofkings.co.uk. Our team will be happy to assist you and discuss the best options for your situation.'
                },
            ]
        },
        {
            title: 'Locations & Schedule',
            icon: MapPin,
            items: [
                {
                    question: 'Where are your training locations?',
                    answer: (
                        <div>
                            <p style={{ marginTop: 0 }}>We currently operate at 5 locations across Manchester:</p>
                            <ul style={{ paddingLeft: 'var(--space-5)', marginBottom: 'var(--space-3)' }}>
                                <li><strong>Fats Gym</strong> (Manchester City Centre) — Saturday — Male & Female</li>
                                <li><strong>Cheadle Masjid</strong> (Cheadle) — Sunday — Male & Female</li>
                                <li><strong>Guidance Hub</strong> (Manchester) — Monday — Male Only</li>
                                <li><strong>Afifah School</strong> (Manchester) — Sunday — Male Only</li>
                                <li><strong>Pakistani Community Centre (PCC)</strong> (Manchester) — Wednesday — Male Only (delivered by brother organisation 313)</li>
                            </ul>
                            <p style={{ marginBottom: 0 }}>More locations are coming soon as we continue to expand across Manchester.</p>
                        </div>
                    )
                },
                {
                    question: 'Which location should I choose?',
                    answer: 'Choose based on your location, the day that suits you, and whether you require mixed or single-gender classes. Fats Gym and Cheadle Masjid offer male & female classes, while other locations are currently male-only. Visit our Classes page for full details.'
                },
                {
                    question: 'What are the class times?',
                    answer: 'Class times vary by location and age group. Please check our Classes page or contact us directly for the most up-to-date schedule. Classes are generally structured around salah times where relevant.'
                },

            ]
        },
        {
            title: 'For Parents',
            icon: Heart,
            items: [
                {
                    question: 'How do you ensure my child\'s safety?',
                    answer: 'Safety is our top priority. All instructors are DBS-checked, we maintain comprehensive safeguarding policies, and have clear escalation processes. Classes are age-appropriate with proper supervision, and we emphasise respect and controlled practice at all times.'
                },
                {
                    question: 'What will my child learn beyond techniques?',
                    answer: 'Beyond BJJ techniques, your child will develop discipline, confidence, resilience, humility, and respect for others. We emphasise Islamic values including good adab (etiquette), brotherhood/sisterhood, and the importance of intention (niyyah) in everything we do.'
                },
                {
                    question: 'What if my child misses classes?',
                    answer: 'We understand that life happens. While we have clear attendance expectations (consistency is important for progress), we show understanding for genuine absences. We have fair waiting-list policies for high-demand classes. The emphasis is on building consistency, not creating pressure.'
                },
                {
                    question: 'Do parents need to stay during classes?',
                    answer: 'Generally, parents are asked to vacate the training area during classes to allow students to focus and develop independence. However, some locations do offer viewing areas where parents can observe. It\'s important to adhere to the specific guidelines of each training location — your instructor will advise on the arrangements at your venue.'
                },
                {
                    question: 'How can parents get involved?',
                    answer: 'We love parent involvement! You can support by ensuring your child attends consistently, reinforcing the values we teach, joining our community events, or even training yourself. We also welcome parent volunteers for events and administration.'
                },
            ]
        },
        {
            title: 'Getting Started',
            icon: UserCheck,
            items: [
                {
                    question: 'How do I register?',
                    answer: (
                        <div>
                            <p style={{ marginTop: 0 }}>Registration is simple:</p>
                            <ol style={{ paddingLeft: 'var(--space-5)', marginBottom: 'var(--space-3)' }}>
                                <li>Click "Register" or "Join Now" on our website</li>
                                <li>Create your account and fill in your details</li>
                                <li>Select your preferred location and membership tier</li>
                                <li>Complete payment setup</li>
                                <li>You're ready to train!</li>
                            </ol>
                            <p style={{ marginBottom: 0 }}>If you have any questions during registration, please don't hesitate to contact us.</p>
                        </div>
                    )
                },
                {
                    question: 'What should I bring to my first class?',
                    answer: 'Bring comfortable athletic clothing, a water bottle, and a positive attitude! Wear something you can move freely in. Footwear isn\'t needed on the mats (we train barefoot), but bring flip-flops/sandals for walking around the venue.'
                },
                {
                    question: 'I\'m nervous about starting. Is that normal?',
                    answer: 'Absolutely! Everyone feels nervous before their first class. Remember, every black belt started as a nervous beginner. Our community is welcoming and supportive, and our instructors are experienced at helping newcomers feel comfortable. Just show up — that\'s the hardest part!'
                },
                {
                    question: 'Can I register my children?',
                    answer: 'Yes, parents can register their children through our system. You\'ll create a parent account and add your children as linked profiles. You can manage their attendance and progress through your dashboard, and the check-in QR code works for all family members.'
                },
            ]
        },
        {
            title: 'Spiritual & Community',
            icon: Star,
            items: [
                {
                    question: 'What spiritual activities does Sport of Kings offer?',
                    answer: (
                        <div>
                            <p style={{ marginTop: 0 }}>Sport of Kings integrates faith throughout our programme:</p>
                            <ul style={{ paddingLeft: 'var(--space-5)', marginBottom: 0 }}>
                                <li>Regular dhikr gatherings and nasheeds</li>
                                <li>Youth dars and Islamic learning sessions</li>
                                <li>Retreats combining training, worship, and reflection (e.g., Morocco retreat)</li>
                                <li>Emphasis on niyyah (intention) in all training</li>
                                <li>Naseeha (advice) sessions for members</li>
                            </ul>
                        </div>
                    )
                },
                {
                    question: 'What community activities are available?',
                    answer: (
                        <div>
                            <p style={{ marginTop: 0 }}>We offer a rich programme of community activities:</p>
                            <ul style={{ paddingLeft: 'var(--space-5)', marginBottom: 0 }}>
                                <li>Monthly brotherhood/sisterhood gatherings</li>
                                <li>Youth empowerment and mentorship programmes</li>
                                <li>Grading ceremonies rooted in adab and achievement</li>
                                <li>Competitions and tournaments</li>
                                <li>Family-inclusive events and celebrations</li>
                                <li>Da'wah events and community outreach</li>
                            </ul>
                        </div>
                    )
                },
                {
                    question: 'What is the Fajr40 Challenge?',
                    answer: 'The Fajr40 Challenge is a Sport of Kings initiative encouraging 40 days of Fajr prayer in congregation. It\'s a spiritual challenge to build consistency, discipline, and connection with Allah ﷻ. It demonstrates our commitment to developing individuals on and off the mats.'
                },
                {
                    question: 'Are there opportunities for retreats or trips?',
                    answer: 'Yes! We organise retreats that combine training with worship and reflection. Past trips have included destinations like Morocco. These experiences deepen bonds of brotherhood/sisterhood and allow for focused spiritual and physical development away from daily distractions.'
                },
            ]
        },
        {
            title: 'Technical & Account',
            icon: HelpCircle,
            items: [
                {
                    question: 'I\'ve forgotten my password. What do I do?',
                    answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive a password reset link. If you don\'t receive the email, check your spam folder or contact us for assistance.'
                },
                {
                    question: 'How do I update my contact details?',
                    answer: 'Log into your member dashboard and navigate to your Profile settings. From there you can update your email, phone number, and other contact information.'
                },
                {
                    question: 'How does class check-in work?',
                    answer: 'We use a QR code check-in system. When you arrive at class, scan the QR code displayed at the venue using your phone camera or our app. This marks your attendance and helps track your training progress.'
                },
                {
                    question: 'Can I view my attendance history?',
                    answer: 'Yes, your attendance history and progress are available in your member dashboard under the Attendance/Progress sections. You can see your training consistency and track your journey.'
                },
                {
                    question: 'Who do I contact for support?',
                    answer: 'For any questions or support needs, email us at info@sportofkings.co.uk. For urgent matters during class times, speak directly to your instructor. We aim to respond to all enquiries within 24-48 hours.'
                },
            ]
        },
    ];

    return (
        <>
            <Navbar user={null} />

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
                            Frequently Asked Questions
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-xl)',
                            color: 'var(--text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto',
                        }}>
                            Everything you need to know about Sport of Kings —
                            a movement building strong, disciplined, faith-anchored individuals and communities.
                        </p>
                    </div>
                </section>

                {/* FAQ Sections */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-lg">
                        {faqSections.map((section, sectionIndex) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={sectionIndex}
                                    id={`section-${sectionIndex}`}
                                    style={{
                                        marginBottom: 'var(--space-10)',
                                        scrollMarginTop: '100px',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        marginBottom: 'var(--space-5)',
                                    }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'var(--color-gold-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Icon size={24} color="var(--color-black)" />
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>
                                            {section.title}
                                        </h2>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--space-3)',
                                    }}>
                                        {section.items.map((item, itemIndex) => (
                                            <FAQAccordion
                                                key={itemIndex}
                                                item={item}
                                                isOpen={openItems[`${sectionIndex}-${itemIndex}`] || false}
                                                onToggle={() => toggleItem(sectionIndex, itemIndex)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Still Have Questions CTA */}
                <section
                    className="section"
                    style={{
                        background: 'var(--color-dark-green)',
                        color: 'var(--color-white)',
                    }}
                >
                    <div className="container container-md" style={{ textAlign: 'center' }}>
                        <h2 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-4)' }}>
                            Still Have Questions?
                        </h2>
                        <p style={{
                            color: 'var(--color-gray-300)',
                            marginBottom: 'var(--space-8)',
                            fontSize: 'var(--text-lg)',
                        }}>
                            We&apos;re here to help. Reach out to us and we&apos;ll get back to you as soon as possible.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-4)',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <a
                                href="mailto:info@sportofkings.co.uk"
                                className="btn btn-primary btn-lg"
                            >
                                Email Us
                                <ChevronRight size={20} />
                            </a>
                            <Link href="/register" className="btn btn-outline btn-lg" style={{
                                borderColor: 'var(--color-gold)',
                                color: 'var(--color-gold)',
                            }}>
                                Join Now
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
