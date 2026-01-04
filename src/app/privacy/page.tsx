import Link from 'next/link';
import { ChevronRight, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
    title: 'Privacy Policy | Sport of Kings',
    description: 'Privacy Policy for Sport of Kings - Learn how we collect, use, and protect your personal information.',
};

export default async function PrivacyPage() {
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
                            Privacy Policy
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
                                    Sport of Kings (&quot;Seerat Un Nabi&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a registered charity in England and Wales. We are committed to protecting and respecting your privacy in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                                </p>
                                <p>
                                    This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website, register for membership, attend our classes, or engage with our services.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>2. Information We Collect</h2>
                                <p>We may collect and process the following types of personal information:</p>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>2.1 Information You Provide</h3>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li><strong>Contact Information:</strong> Name, email address, phone number, postal address</li>
                                    <li><strong>Account Information:</strong> Username, password (encrypted), profile details</li>
                                    <li><strong>Membership Information:</strong> Membership tier, payment details, attendance records</li>
                                    <li><strong>Child Information:</strong> For parents registering children — child&apos;s name, date of birth, emergency contact details, medical information relevant to training</li>
                                    <li><strong>Health Information:</strong> Any relevant medical conditions, allergies, or physical limitations that may affect training</li>
                                    <li><strong>Payment Information:</strong> Card details are processed securely by Stripe and are not stored on our servers</li>
                                </ul>

                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>2.2 Information Collected Automatically</h3>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li><strong>Usage Data:</strong> Pages visited, time spent on site, browser type, device information</li>
                                    <li><strong>Attendance Data:</strong> Check-in records, class attendance history</li>
                                    <li><strong>Cookies:</strong> Essential cookies for website functionality and authentication</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>3. How We Use Your Information</h2>
                                <p>We use your personal information for the following purposes:</p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>To provide and manage your membership and access to classes</li>
                                    <li>To process payments and maintain billing records</li>
                                    <li>To communicate with you about classes, schedules, events, and announcements</li>
                                    <li>To ensure the safety of participants during training sessions</li>
                                    <li>To maintain attendance records and track progress</li>
                                    <li>To comply with legal and regulatory requirements</li>
                                    <li>To improve our services and website functionality</li>
                                    <li>To respond to enquiries and provide support</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>4. Legal Basis for Processing</h2>
                                <p>We process your personal data under the following legal bases:</p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li><strong>Contract:</strong> Processing necessary to fulfil our membership agreement with you</li>
                                    <li><strong>Legitimate Interests:</strong> To operate our charity, improve services, and communicate with members</li>
                                    <li><strong>Legal Obligation:</strong> To comply with safeguarding requirements and charity regulations</li>
                                    <li><strong>Consent:</strong> For marketing communications (where applicable)</li>
                                    <li><strong>Vital Interests:</strong> For health and safety emergencies during training</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>5. Data Sharing</h2>
                                <p>We do not sell your personal information. We may share your data with:</p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li><strong>Instructors:</strong> Relevant information to conduct safe and effective training</li>
                                    <li><strong>Payment Processors:</strong> Stripe processes payments securely on our behalf</li>
                                    <li><strong>Service Providers:</strong> Our website and database are hosted securely with industry-approved encryption standards and security protocols</li>
                                    <li><strong>Legal Authorities:</strong> When required by law or to protect safety</li>
                                    <li><strong>Partner Organisations:</strong> Only with your consent for collaborative events</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>6. Data Security</h2>
                                <p>
                                    We implement appropriate technical and organisational measures to protect your personal data, including:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Encryption of data in transit (HTTPS/TLS)</li>
                                    <li>Secure password hashing</li>
                                    <li>Access controls limiting data access to authorised personnel</li>
                                    <li>Regular security reviews and updates</li>
                                    <li>Secure payment processing through PCI-compliant providers</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>7. Data Retention</h2>
                                <p>
                                    We retain your personal data for as long as necessary to fulfil the purposes for which it was collected, typically:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li><strong>Active Members:</strong> For the duration of membership plus 7 years for financial records</li>
                                    <li><strong>Former Members:</strong> Up to 7 years for financial and legal compliance</li>
                                    <li><strong>Children&apos;s Data:</strong> Until the child reaches adulthood plus 7 years, or as required by safeguarding regulations</li>
                                    <li><strong>Website Analytics:</strong> Up to 2 years</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>8. Your Rights</h2>
                                <p>Under UK GDPR, you have the following rights:</p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                                    <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                                    <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal obligations)</li>
                                    <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                                    <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
                                    <li><strong>Right to Object:</strong> Object to certain types of processing</li>
                                    <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent</li>
                                </ul>
                                <p>
                                    To exercise any of these rights, please contact us at <a href="mailto:info@sportofkings.co.uk" style={{ color: 'var(--color-gold)' }}>info@sportofkings.co.uk</a>.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>9. Children&apos;s Privacy</h2>
                                <p>
                                    We take the privacy of children seriously. We only collect children&apos;s personal data with parental/guardian consent. Parents have the right to access, correct, or delete their child&apos;s information at any time.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>10. Cookies</h2>
                                <p>
                                    Our website uses essential cookies for authentication and functionality. We do not use tracking cookies for advertising purposes. By using our website, you consent to the use of essential cookies.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>11. Changes to This Policy</h2>
                                <p>
                                    We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through our website. The &quot;Last updated&quot; date at the top indicates when this policy was last revised.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>12. Contact Us</h2>
                                <p>
                                    If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
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

                                <h2 style={{ color: 'var(--text-primary)' }}>13. Complaints</h2>
                                <p>
                                    If you are unhappy with how we have handled your personal data, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO):
                                </p>
                                <p>
                                    <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)' }}>https://ico.org.uk/make-a-complaint/</a>
                                </p>

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
