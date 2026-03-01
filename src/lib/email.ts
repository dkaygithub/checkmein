import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_ADDRESS = process.env.EMAIL_FROM || 'CheckMeIn <onboarding@resend.dev>';

/**
 * Send an email via Resend. Falls back to console.log if no API key is configured.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!resend) {
        console.log(`[Email (no RESEND_API_KEY)] To: ${to} | Subject: ${subject}`);
        console.log(`[Email Body]: ${html}`);
        return false;
    }

    try {
        const { error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to,
            subject,
            html,
        });

        if (error) {
            console.error(`[Email Error] Failed to send to ${to}:`, error);
            return false;
        }

        console.log(`[Email Sent] To: ${to} | Subject: ${subject}`);
        return true;
    } catch (err) {
        console.error(`[Email Exception] Failed to send to ${to}:`, err);
        return false;
    }
}
