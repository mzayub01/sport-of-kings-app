import Link from 'next/link';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
    title: 'Liability Waiver | Sport of Kings',
    description: 'Liability Waiver and Assumption of Risk for Sport of Kings martial arts training.',
};

export default async function WaiverPage() {
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
                            Liability Waiver
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-lg)',
                            color: 'var(--text-secondary)',
                        }}>
                            Assumption of Risk and Release of Liability
                        </p>
                    </div>
                </section>

                {/* Content */}
                <section className="section" style={{ background: 'var(--bg-primary)' }}>
                    <div className="container container-md">
                        <div className="glass-card" style={{ padding: 'var(--space-8)' }}>

                            {/* Important Notice */}
                            <div style={{
                                background: 'rgba(234, 179, 8, 0.1)',
                                border: '1px solid var(--color-gold)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-4)',
                                marginBottom: 'var(--space-6)',
                                display: 'flex',
                                gap: 'var(--space-3)',
                                alignItems: 'flex-start',
                            }}>
                                <AlertTriangle size={24} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ color: 'var(--color-gold)' }}>Important Notice</strong>
                                    <p style={{ margin: 'var(--space-2) 0 0 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                        Please read this document carefully before participating in any Sport of Kings activities. By registering and participating, you acknowledge that you have read, understood, and agree to the terms below.
                                    </p>
                                </div>
                            </div>

                            <div style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>

                                <h2 style={{ color: 'var(--text-primary)', marginTop: 0 }}>1. Acknowledgement of Risks</h2>
                                <p>
                                    I understand and acknowledge that participation in Brazilian Jiu-Jitsu (BJJ), grappling, wrestling, and other martial arts activities involves inherent risks of physical injury. These risks include, but are not limited to:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Sprains, strains, and muscle injuries</li>
                                    <li>Bruises, cuts, and abrasions</li>
                                    <li>Dislocations and joint injuries</li>
                                    <li>Bone fractures</li>
                                    <li>Concussions and head injuries</li>
                                    <li>Skin infections and conditions</li>
                                    <li>Cardiovascular incidents</li>
                                    <li>In rare cases, permanent disability or death</li>
                                </ul>
                                <p>
                                    I acknowledge that these risks exist despite the reasonable safety measures implemented by Sport of Kings.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>2. Voluntary Participation</h2>
                                <p>
                                    I confirm that my participation in Sport of Kings activities is entirely voluntary. I have chosen to participate with full knowledge of the inherent risks involved.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>3. Physical Fitness Declaration</h2>
                                <p>
                                    I declare that:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>I am in good physical health and have no medical conditions that would prevent my safe participation, OR</li>
                                    <li>I have disclosed all relevant medical conditions to Sport of Kings and have obtained medical clearance to participate</li>
                                    <li>I will inform instructors immediately if I experience pain, discomfort, or illness during training</li>
                                    <li>I will not participate while under the influence of alcohol, drugs, or any substance that may impair my judgement or physical ability</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>4. Assumption of Risk</h2>
                                <p>
                                    I voluntarily assume all risks associated with participation in Sport of Kings activities, including risks arising from:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>My own actions or inactions</li>
                                    <li>The actions or inactions of other participants</li>
                                    <li>The condition of the training facilities and equipment</li>
                                    <li>Instruction and supervision provided</li>
                                    <li>Transport to and from training venues</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>5. Release and Waiver of Liability</h2>
                                <p>
                                    To the fullest extent permitted by law, I hereby release, waive, and discharge Sport of Kings (Seerat Un Nabi), its trustees, directors, officers, employees, instructors, volunteers, agents, and affiliates from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury that may be sustained during or as a result of my participation in Sport of Kings activities.
                                </p>
                                <p>
                                    This release includes, but is not limited to, claims arising from negligence of Sport of Kings or any of the persons listed above.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>6. Indemnification</h2>
                                <p>
                                    I agree to indemnify and hold harmless Sport of Kings and its representatives from any claims, damages, losses, or expenses (including legal fees) arising from my participation in activities or any breach of this waiver.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>7. Emergency Medical Treatment</h2>
                                <p>
                                    In the event of an emergency, I authorise Sport of Kings personnel to seek and consent to emergency medical treatment on my behalf (or on behalf of my child, if applicable). I understand that I am responsible for any medical expenses incurred.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>8. Parent/Guardian Consent (for Minors)</h2>
                                <p>
                                    If registering a child under 18 years of age, I confirm that:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>I am the parent or legal guardian of the child</li>
                                    <li>I have the authority to bind the child to this waiver</li>
                                    <li>I accept the risks on behalf of the child</li>
                                    <li>I agree to all terms of this waiver on behalf of both myself and the child</li>
                                    <li>I will ensure the child follows all rules and instructions</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>9. Rules and Regulations</h2>
                                <p>
                                    I agree to:
                                </p>
                                <ul style={{ paddingLeft: 'var(--space-6)' }}>
                                    <li>Follow all rules, policies, and instructions provided by Sport of Kings</li>
                                    <li>Train in a safe and controlled manner</li>
                                    <li>Respect the safety of myself and others at all times</li>
                                    <li>Immediately stop training if instructed to do so</li>
                                    <li>Report any safety concerns to instructors</li>
                                </ul>

                                <h2 style={{ color: 'var(--text-primary)' }}>10. Insurance</h2>
                                <p>
                                    I understand that Sport of Kings maintains public liability insurance but that this does not cover personal injury claims. I am encouraged to obtain my own personal accident and medical insurance.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>11. Severability</h2>
                                <p>
                                    If any provision of this waiver is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>12. Governing Law</h2>
                                <p>
                                    This waiver shall be governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
                                </p>

                                <h2 style={{ color: 'var(--text-primary)' }}>13. Acknowledgement</h2>
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    padding: 'var(--space-5)',
                                    borderRadius: 'var(--radius-lg)',
                                    marginTop: 'var(--space-4)',
                                    border: '1px solid var(--border-light)',
                                }}>
                                    <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-primary)' }}>
                                        By registering for Sport of Kings and participating in our activities, I acknowledge that:
                                    </p>
                                    <ul style={{ paddingLeft: 'var(--space-6)', marginTop: 'var(--space-3)', marginBottom: 0 }}>
                                        <li>I have read and fully understand this Liability Waiver</li>
                                        <li>I agree to be bound by all its terms</li>
                                        <li>I am signing this waiver voluntarily</li>
                                        <li>I understand that this waiver is legally binding</li>
                                    </ul>
                                </div>

                                <h2 style={{ color: 'var(--text-primary)' }}>14. Contact</h2>
                                <p>
                                    For any questions regarding this waiver, please contact:
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
