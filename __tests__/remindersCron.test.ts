import { GET as RemindersCron } from '@/app/api/cron/reminders/route';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

jest.mock('@/lib/notifications', () => ({
    sendNotification: jest.fn()
}));

jest.mock('@/lib/prisma', () => ({
    event: {
        findMany: jest.fn().mockResolvedValue([])
    }
}));

describe('Reminders Cron Endpoint Security', () => {
    const originalCronSecret = process.env.CRON_SECRET;

    beforeAll(() => {
        process.env.CRON_SECRET = 'test_cron_secret';
    });

    afterAll(() => {
        process.env.CRON_SECRET = originalCronSecret;
    });

    it('Should return 401 Unauthorized if Authorization header is missing', async () => {
        const req = new Request(`http://localhost/api/cron/reminders`, {
            method: 'GET'
        });

        const res = await RemindersCron(req);
        expect(res.status).toBe(401);
    });

    it('Should return 401 Unauthorized if Authorization header is incorrect', async () => {
        const req = new Request(`http://localhost/api/cron/reminders`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer wrong_secret` }
        });

        const res = await RemindersCron(req);
        expect(res.status).toBe(401);
    });

    it('Should process correctly and return 200 OK if Authorization header is correct', async () => {
        const req = new Request(`http://localhost/api/cron/reminders`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer test_cron_secret` }
        });

        const res = await RemindersCron(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
    });
});