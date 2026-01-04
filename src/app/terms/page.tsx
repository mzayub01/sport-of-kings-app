import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
    title: 'Terms of Service | Sport of Kings',
    description: 'Terms of Service for Sport of Kings - The terms and conditions governing your use of our services.',
};

export default async function TermsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
                            Terms of Service
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-lg)',
                            color: 'var(--text-secondary)',
                        }}>
                            Last updated: January 2025
                        </p>
                    </div>
                </section>

                {/* Content */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-md">
                        <div className="glass-card" style={{ padding: 'var(--space-8)' }}>

                            <div style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>

                                <h2 style={{ color: 'var(--text-primary)', marginTop: 0 }}>1. Introduction</h2>
                                <p>
                                    These Terms of Service (&quot;Terms&quot;) govern your use of the Sport of Kings website, services, and membership. Sport of Kings operates under the registered charity Seerat Un Nabi in England and Wales.
                                </p>
                                <p>
                                    By registering for membership, attending classes, or using our website, you agree to be bound by these Terms. If you do not agree, please do not use our services.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>2. Membership</h2>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>2.1 Eligibility</h3>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Adults (18+) may register for their own membership</li>
                                    <li>Children and teens must be registered by a parent or legal guardian</li>
                                    <li>All members must provide accurate and complete information during registration</li>
                                    <li>We reserve the right to refuse membership at our discretion</li>
                                </ul>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>2.2 Membership Fees</h3>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Membership fees are charged monthly on a recurring basis</li>
                                    <li>Current rates: Adults £30/month, Teens £20/month, Under 11s £15/month</li>
                                    <li>Some locations offer free or subsidised classes — please enquire for details</li>
                                    <li>Bursaries are available for those facing financial hardship</li>
                                    <li>Fees are non-refundable except in exceptional circumstances at our discretion</li>
                                </ul>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>2.3 Membership Changes</h3>
                                <p>
                                    For any changes to your membership — including upgrades, downgrades, pausing, or cancellations — please contact us at <a href="mailto:info@sportofkings.co.uk" style={{ color: 'var(--color-gold)' }}>info@sportofkings.co.uk</a>. We aim to process requests within 48 hours.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>3. Code of Conduct</h2>
                                <p>All members and participants must adhere to our code of conduct:</p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li><strong>Respect:</strong> Treat all instructors, fellow members, and staff with respect and courtesy</li>
                                    <li><strong>Adab (Etiquette):</strong> Conduct yourself with Islamic etiquette at all times</li>
                                    <li><strong>Safety:</strong> Follow all safety instructions from instructors</li>
                                    <li><strong>Punctuality:</strong> Arrive on time for classes; late arrivals may not be admitted</li>
                                    <li><strong>Hygiene:</strong> Maintain good personal hygiene; keep training attire clean</li>
                                    <li><strong>Equipment:</strong> A BJJ gi is mandatory for all classes; purchase links provided at registration</li>
                                    <li><strong>Behaviour:</strong> No bullying, aggression, or reckless behaviour</li>
                                    <li><strong>Substances:</strong> No alcohol, drugs, or prohibited substances</li>
                                </ul>
                                <p>
                                    Violation of the code of conduct may result in suspension or termination of membership without refund.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>4. Training and Safety</h2>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>4.1 Physical Activity Acknowledgement</h3>
                                <p>
                                    Brazilian Jiu-Jitsu and martial arts training involve physical contact and carry inherent risks of injury. By participating, you acknowledge and accept these risks.
                                </p>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>4.2 Medical Conditions</h3>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>You must disclose any medical conditions, injuries, or limitations that may affect your ability to train safely</li>
                                    <li>Consult a doctor before participating if you have any health concerns</li>
                                    <li>Inform instructors immediately if you feel unwell during training</li>
                                </ul>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>4.3 Instructor Authority</h3>
                                <p>
                                    Instructors have full authority during classes. All participants must follow their instructions regarding techniques, safety, and behaviour to ensure a safe training environment.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>5. Attendance and Check-In</h2>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Members must check in using our QR code system upon arrival at each class</li>
                                    <li>Consistent attendance is encouraged for progress and skill development</li>
                                    <li>We maintain attendance records for safety and administrative purposes</li>
                                    <li>Excessive unexplained absences may result in review of membership</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>6. Parents and Guardians</h2>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Parents/guardians are responsible for registering children and ensuring they adhere to these Terms</li>
                                    <li>Generally, parents should vacate the training area during classes to allow students to focus</li>
                                    <li>Some locations offer viewing areas — follow location-specific guidelines</li>
                                    <li>Parents must provide accurate emergency contact information</li>
                                    <li>Parents are responsible for timely collection of children after classes</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>7. Photography and Recording</h2>
                                <p>
                                    Sport of Kings may take photographs or videos during classes and events for promotional purposes. By participating, you consent to the use of such media unless you notify us in writing otherwise.
                                </p>
                                <p>
                                    Personal photography and recording during classes requires instructor approval.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>8. Intellectual Property</h2>
                                <p>
                                    All content on the Sport of Kings website, including text, graphics, logos, and training materials, is the property of Sport of Kings or its licensors and is protected by copyright laws.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>9. Limitation of Liability</h2>
                                <p>
                                    To the fullest extent permitted by law:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Sport of Kings is not liable for any injuries sustained during training where reasonable safety measures were in place</li>
                                    <li>We are not responsible for loss or damage to personal property at training venues</li>
                                    <li>Our total liability shall not exceed the fees paid by you in the 12 months preceding any claim</li>
                                </ul>
                                <p>
                                    Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>10. Safeguarding</h2>
                                <p>
                                    Sport of Kings is committed to safeguarding children and vulnerable adults. We have comprehensive safeguarding policies in place, and all instructors are DBS-checked. Any concerns should be reported immediately to our safeguarding lead.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>11. Termination</h2>
                                <p>
                                    We reserve the right to suspend or terminate membership without refund for:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Breach of these Terms or the code of conduct</li>
                                    <li>Non-payment of fees</li>
                                    <li>Behaviour that endangers others or disrupts classes</li>
                                    <li>Any illegal activity</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>12. Changes to Terms</h2>
                                <p>
                                    We may update these Terms from time to time. Continued use of our services after changes constitutes acceptance of the revised Terms. Significant changes will be communicated via email.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>13. Governing Law</h2>
                                <p>
                                    These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>14. Contact Us</h2>
                                <p>
                                    If you have any questions about these Terms, please contact us:
                                </p>
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-lg)',
                                    marginTop: 'var(--space-4)'
                                }}>
                                    <p style={{ margin: 0 }}>
                                        <strong>Sport of Kings (Seerat Un Nabi)</strong><br />
                                        Email: <a href="mailto:info@sportofkings.co.uk" style={{ color: 'var(--color-gold)' }}>info@sportofkings.co.uk</a><br />
                                        Manchester, United Kingdom
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                {/* Back Link */}
                <section style={{ background: 'var(--bg-primary)', paddingBottom: 'var(--space-12)' }}>
                    <div className="container container-md" style={{ textAlign: 'center' }}>
                        <Link href="/" className="btn btn-outline">
                            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                            Back to Home
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
