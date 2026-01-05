import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Default from address
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Sport of Kings <noreply@sportofkings.co.uk>';

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}

export interface EmailResult {
    success: boolean;
    id?: string;
    error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!resend) {
        console.warn('Email service not configured. Set RESEND_API_KEY in environment.');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: options.from || DEFAULT_FROM,
            to: Array.isArray(options.to) ? options.to : [options.to],
            subject: options.subject,
            html: options.html,
            replyTo: options.replyTo,
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }

        console.log('Email sent successfully:', data?.id);
        return { success: true, id: data?.id };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Email send exception:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
    return !!resend;
}
