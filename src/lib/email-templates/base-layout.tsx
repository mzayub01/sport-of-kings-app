import * as React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Link,
    Img,
    Hr,
} from '@react-email/components';

interface BaseLayoutProps {
    children: React.ReactNode;
    previewText?: string;
}

const baseStyles = {
    body: {
        backgroundColor: '#f8f9fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        margin: 0,
        padding: 0,
    },
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    logo: {
        display: 'block',
        margin: '0 auto 24px',
        height: '60px',
        width: 'auto',
    },
    heading: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center' as const,
        margin: '0 0 16px',
    },
    text: {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#4a4a4a',
        margin: '0 0 16px',
    },
    button: {
        display: 'inline-block',
        backgroundColor: '#c5a456',
        color: '#000000',
        fontSize: '16px',
        fontWeight: '600',
        textDecoration: 'none',
        padding: '14px 28px',
        borderRadius: '8px',
        textAlign: 'center' as const,
    },
    buttonContainer: {
        textAlign: 'center' as const,
        margin: '24px 0',
    },
    footer: {
        textAlign: 'center' as const,
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e5e5',
    },
    footerText: {
        fontSize: '14px',
        color: '#888888',
        margin: '0 0 8px',
    },
    footerLink: {
        color: '#c5a456',
        textDecoration: 'none',
    },
};

export function BaseEmailLayout({ children, previewText }: BaseLayoutProps) {
    return (
        <Html>
            <Head />
            {previewText && <Text style={{ display: 'none' }}>{previewText}</Text>}
            <Body style={baseStyles.body}>
                <Container style={baseStyles.container}>
                    <Section style={baseStyles.card}>
                        <Img
                            src="https://sportofkings.info/logo-full.png"
                            alt="Sport of Kings"
                            style={baseStyles.logo}
                            height={60}
                        />
                        {children}
                    </Section>
                    <Section style={baseStyles.footer}>
                        <Text style={baseStyles.footerText}>
                            Sport of Kings - Seerat Un Nabi
                        </Text>
                        <Text style={baseStyles.footerText}>
                            Brazilian Jiu-Jitsu Classes in Manchester
                        </Text>
                        <Link href="https://sportofkings.info" style={baseStyles.footerLink}>
                            Visit our website
                        </Link>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export { baseStyles };
