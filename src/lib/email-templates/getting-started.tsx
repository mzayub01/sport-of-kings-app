import * as React from 'react';
import { Text, Link, Hr } from '@react-email/components';
import { BaseEmailLayout, baseStyles } from './base-layout';

export interface GettingStartedClass {
    name: string;
    dayLabel: string;   // e.g. "Sundays"
    timeLabel: string;  // e.g. "7:00 pm - 8:00 pm"
}

export interface GettingStartedMembership {
    memberName: string | null;   // set when the membership is for a child
    membershipType: string;
    locationName: string;
    classes: GettingStartedClass[];
}

interface GettingStartedEmailProps {
    firstName: string;
    locationName: string;
    memberships: GettingStartedMembership[];
    firstClassDate: string | null;
    giFormUrl: string;
}

const ETIQUETTE: { title: string; body: string }[] = [
    { title: 'Respect for the Professor and Coaches', body: 'Islam teaches us to respect our instructors, as they guide us in our practice. Listen attentively to their guidance and follow their instructions diligently.' },
    { title: 'Wearing a Gi', body: 'During the class, it is important to wear a gi (uniform) as this is a gi session. This shows respect for the tradition and uniformity among participants.' },
    { title: 'No Eating or Drinking on the Mats', body: 'To maintain cleanliness and hygiene, refrain from eating or drinking on the mats. This helps us to avoid any contamination or distractions during training.' },
    { title: 'No Shoes on Mats', body: 'Shoes are not allowed on the mats to keep them clean and safe for everyone. Remember to remove your shoes before stepping onto the training area.' },
    { title: 'Personal Hygiene', body: 'Being in close contact with others during training requires proper personal hygiene. Ensure that there are no unpleasant odours on your clothes or body to maintain a comfortable environment for everyone.' },
    { title: 'Clipped Finger and Toe Nails', body: 'For the safety of yourself and others, trim your finger and toe nails regularly to prevent accidental scratching or injury.' },
    { title: 'No Eye Gouging, Punching, or Kicking', body: 'We have a strict policy against any form of violence or aggressive behaviour during training. Engaging in eye gouging, punching, or kicking is not tolerated. If an accident happens, quickly apologise and rectify the situation.' },
    { title: 'Parental Involvement and Side Coaching', body: 'Parents are kindly requested to refrain from entering the mats during kids’ classes. Avoid giving instructions or coaching from the sidelines to maintain a focused learning environment.' },
    { title: 'Displaying Good Adab', body: 'Adab (good manners) is a fundamental aspect of our practice. Always exhibit respect, humility, and kindness towards fellow participants on and off the mats. Show appreciation and congratulate your training partners for their efforts.' },
];

const subheading = { ...baseStyles.text, fontWeight: '700', fontSize: '17px', margin: '24px 0 8px' };

export function GettingStartedEmail({
    firstName,
    locationName,
    memberships,
    firstClassDate,
    giFormUrl,
}: GettingStartedEmailProps) {
    return (
        <BaseEmailLayout previewText={`Welcome to Sport of Kings BJJ at ${locationName} — your first class details and next steps`}>
            <Text style={{ ...baseStyles.text, fontStyle: 'italic', color: '#6b7280' }}>Bismillahirrahmanirrahim</Text>

            <Text style={baseStyles.text}>Asalamualikum {firstName},</Text>

            <Text style={baseStyles.text}>
                <strong>Congratulations!</strong> We are thrilled to confirm that you have secured a place for your
                requested membership(s) for Brazilian Jiu Jitsu (BJJ) classes at <strong>{locationName}</strong>.
                We can&apos;t wait to welcome you to the mats for an exciting journey of learning and growth.
            </Text>

            <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0' }} />

            <Text style={subheading}>Your requested Membership(s) for:</Text>
            {memberships.map((m, i) => (
                <div key={i} style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', marginBottom: '12px' }}>
                    <Text style={{ ...baseStyles.text, margin: '0 0 8px', fontWeight: '600' }}>
                        {m.memberName ? `${m.memberName} — ` : ''}{m.membershipType}
                    </Text>
                    <Text style={{ ...baseStyles.text, margin: '0 0 6px', fontWeight: '600', fontSize: '14px' }}>
                        Allocated Class Details:
                    </Text>
                    {m.classes.length === 0 ? (
                        <Text style={{ ...baseStyles.text, margin: 0, fontSize: '14px' }}>
                            Class times will be confirmed with you shortly.
                        </Text>
                    ) : (
                        m.classes.map((c, j) => (
                            <Text key={j} style={{ ...baseStyles.text, margin: '0 0 4px', fontSize: '14px' }}>
                                {c.name}: {c.dayLabel}, {c.timeLabel}
                            </Text>
                        ))
                    )}
                </div>
            ))}

            {firstClassDate && (
                <Text style={baseStyles.text}>
                    📅 <strong>First Class Date:</strong> {firstClassDate}
                </Text>
            )}

            <Text style={subheading}>Important Next Steps:</Text>
            <Text style={{ ...baseStyles.text, fontWeight: '600', margin: '0 0 6px' }}>
                If you have not already done so, please order your Gi (Uniform):
            </Text>
            <Text style={baseStyles.text}>
                To be ready for class, please order your Gi by filling out the form here:{' '}
                <Link href={giFormUrl} style={{ color: '#C5A456', fontWeight: '600' }}>Order Your Gi</Link>.
                In the meantime, while you await your Gi, please wear suitable training clothes, such as full
                length joggers and a t-shirt / light full sleeve top. Please also bring water bottles for your children.
            </Text>

            <Text style={baseStyles.text}>
                Thank you for joining us on this journey to revive the Sunnah of wrestling and grappling. We&apos;re
                excited to welcome you on the mats, and we&apos;re here to support you every step of the way.
            </Text>

            <Text style={baseStyles.text}>
                Please don&apos;t hesitate to reach out if you have any questions to help prepare for your first class.
            </Text>

            <Text style={baseStyles.text}>
                Please also review the Best Practice and Etiquette guide below that members must adhere to:
            </Text>

            <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0' }} />

            <Text style={{ ...subheading, fontSize: '19px', margin: '0 0 12px' }}>Etiquette and Best Practice</Text>
            <Text style={baseStyles.text}>
                In attending Brazilian Jiu Jitsu classes with Sport of Kings, we aim to uphold the sunnah of our
                beloved Prophet Muhammad صلى الله عليه وسلم and build a strong bond of brotherhood/sisterhood amongst
                us. We believe in the importance of intention and self-reflection (muhasaba), striving to be
                competitive but respectful to our opponents. To ensure a harmonious environment, we must adhere to
                the following etiquette:
            </Text>

            {ETIQUETTE.map((item) => (
                <Text key={item.title} style={baseStyles.text}>
                    <strong>{item.title}:</strong> {item.body}
                </Text>
            ))}

            <Text style={baseStyles.text}>
                By following these guidelines, we can create a respectful and inclusive atmosphere that aligns with
                the teachings of Islam and promotes the revival of our beloved Prophet Muhammad&apos;s Sunnah. May
                Allah bless our training and strengthen our bonds of brotherhood/sisterhood.
            </Text>

            <Text style={subheading}>Additional Information:</Text>
            <Text style={baseStyles.text}>
                <strong>Salah Times:</strong> In cases where Salah times overlap with a class, participants are
                expected to join the Jamaat prayers and resume classes following Salah.
            </Text>

            <Text style={baseStyles.text}>
                JazakAllah Khair,<br />
                <strong>Sport of Kings</strong>
            </Text>
        </BaseEmailLayout>
    );
}

/**
 * Render getting-started email to HTML string
 */
export function renderGettingStartedEmail(props: GettingStartedEmailProps): string {
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(<GettingStartedEmail {...props} />);
}
