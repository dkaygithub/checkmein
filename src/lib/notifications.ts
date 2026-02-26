import prisma from "./prisma";

/**
 * Service to handle sending notifications to users via their defined preferences
 * (Email, Text, Slack as per DESIGN.md).
 * 
 * Note: Actual integrations (SendGrid, Twilio, Slack Webhooks) would be configured here.
 */

export type NotificationEvent =
    | 'RSVP_REMINDER'
    | 'PROGRAM_ENROLLMENT'
    | 'EVENT_STARTING_SOON'
    | 'ATTENDANCE_VALIDATED'
    | 'RSVP_UPDATED'
    | 'PROGRAM_ASSIGNMENT';

export async function sendNotification(userId: number, eventType: NotificationEvent, payload: Record<string, any>) {
    try {
        const user = await prisma.participant.findUnique({
            where: { id: userId },
            select: { email: true, notificationSettings: true, name: true }
        });

        if (!user) return;

        // Construct message based on type
        let message = "";
        let subject = "Treehouse Notification";

        switch (eventType) {
            case 'PROGRAM_ENROLLMENT':
                subject = `Confirmed: Enrollment in ${payload.programName}`;
                message = `Hi ${user.name}, you have been successfully enrolled in ${payload.programName}.`;
                break;
            case 'EVENT_STARTING_SOON':
                subject = `Reminder: ${payload.eventName} starts soon!`;
                message = `Hi ${user.name}, your event ${payload.eventName} is starting in ${payload.hours} hours.`;
                break;
            case 'ATTENDANCE_VALIDATED':
                subject = `Attendance Verified: ${payload.eventName}`;
                message = `Hi ${user.name}, your attendance at ${payload.eventName} has been recorded by administrators.`;
                break;
            default:
                message = `System Action: ${eventType}`;
        }

        // Check user preferences
        const settings = user.notificationSettings as any;
        const wantsEmail = settings?.email !== false; // Active by default
        const wantsText = !!settings?.sms;

        if (wantsEmail) {
            console.log(`[Email -> ${user.email}] SUBJ: ${subject} | BODY: ${message}`);
            // await emailClient.send({...})
        }

        if (wantsText) {
            console.log(`[SMS -> User ID ${userId}] ${message}`);
            // await smsClient.send({...})
        }

    } catch (error) {
        console.error("Failed to sequence notification:", error);
    }
}
