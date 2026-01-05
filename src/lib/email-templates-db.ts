import { createAdminClient } from '@/lib/supabase/server';

export interface EmailTemplateData {
    template_key: string;
    name: string;
    subject: string;
    greeting: string;
    body_intro: string;
    body_details: string | null;
    body_action: string | null;
    body_closing: string;
    signature: string;
    button_text: string | null;
    button_url: string | null;
    is_active: boolean;
}

/**
 * Fetch an email template from the database
 */
export async function getEmailTemplate(templateKey: string): Promise<EmailTemplateData | null> {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.error(`Failed to fetch email template '${templateKey}':`, error);
        return null;
    }

    return data;
}

/**
 * Replace placeholders in template text with actual values
 */
export function replacePlaceholders(text: string, data: Record<string, string>): string {
    let result = text;
    Object.entries(data).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    // Convert markdown-style bold to HTML
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Convert newlines to <br> for HTML
    result = result.replace(/\n/g, '<br>');
    return result;
}

/**
 * Render an email template to HTML with the Sport of Kings branding
 */
export function renderTemplateToHtml(
    template: EmailTemplateData,
    data: Record<string, string>,
    logoUrl: string = 'https://sportofkings.info/logo-full.png'
): string {
    const subject = replacePlaceholders(template.subject, data);
    const greeting = replacePlaceholders(template.greeting, data);
    const bodyIntro = replacePlaceholders(template.body_intro, data);
    const bodyDetails = template.body_details ? replacePlaceholders(template.body_details, data) : '';
    const bodyAction = template.body_action ? replacePlaceholders(template.body_action, data) : '';
    const bodyClosing = replacePlaceholders(template.body_closing, data);
    const buttonText = template.button_text || '';
    const buttonUrl = template.button_url ? replacePlaceholders(template.button_url, data) : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; max-width: 600px;">
                    <!-- Main Card -->
                    <tr>
                        <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                            <!-- Logo -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="text-align: center; padding-bottom: 24px;">
                                        <img src="${logoUrl}" alt="Sport of Kings" height="60" style="height: 60px; width: auto;">
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Heading -->
                            <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center; margin: 0 0 24px;">
                                ${subject.replace(/{{firstName}},?/g, '').trim()}
                            </h1>
                            
                            <!-- Greeting -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px;">
                                ${greeting}
                            </p>
                            
                            <!-- Body Intro -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px;">
                                ${bodyIntro}
                            </p>
                            
                            ${bodyDetails ? `
                            <!-- Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                                <tr>
                                    <td style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                                        <p style="font-size: 16px; line-height: 1.8; color: #4a4a4a; margin: 0; white-space: pre-line;">
                                            ${bodyDetails}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                            
                            ${bodyAction ? `
                            <!-- Action Text -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px; white-space: pre-line;">
                                ${bodyAction}
                            </p>
                            ` : ''}
                            
                            ${buttonText && buttonUrl ? `
                            <!-- Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${buttonUrl}" style="display: inline-block; background: linear-gradient(135deg, #c5a456, #a68935); color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
                                            ${buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                            
                            <!-- Closing -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px;">
                                ${bodyClosing}
                            </p>
                            
                            <!-- Signature -->
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0;">
                                JazakAllahu Khayran,<br>
                                <strong>${template.signature}</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding-top: 24px; text-align: center;">
                            <p style="font-size: 14px; color: #888888; margin: 0 0 4px;">
                                Sport of Kings - Seerat Un Nabi
                            </p>
                            <p style="font-size: 14px; color: #888888; margin: 0 0 8px;">
                                Brazilian Jiu-Jitsu Classes in Manchester
                            </p>
                            <a href="https://sportofkings.info" style="font-size: 14px; color: #c5a456; text-decoration: none;">
                                Visit our website
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Convenience function to fetch and render a template
 */
export async function renderEmailFromDatabase(
    templateKey: string,
    data: Record<string, string>
): Promise<{ html: string; subject: string } | null> {
    const template = await getEmailTemplate(templateKey);

    if (!template) {
        return null;
    }

    const html = renderTemplateToHtml(template, data);
    const subject = replacePlaceholders(template.subject, data);

    return { html, subject };
}
