/**
 * Integration Test for Audit Logs
 * Ensures that various actions across the system correctly generate an AuditLog.
 * Using Next.js testing practices with local Prisma DB.
 */

import { POST as createProgram } from '@/app/api/programs/route';
import { PATCH as updateProgramSettings } from '@/app/api/programs/[id]/settings/route';
import { POST as enrollParticipant } from '@/app/api/programs/[id]/participants/route';
import { POST as markAttendance } from '@/app/api/events/[id]/attendance/route';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock NextAuth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

// Mock Notifications to avoid external calls
jest.mock('@/lib/notifications', () => ({
    sendNotification: jest.fn()
}));

describe('AuditLog Integration Tests', () => {
    let testAdminId: number;
    let testParticipantId: number;
    let testProgramId: number;
    let testEventId: number;
    let testVisitId: number;

    beforeAll(async () => {
        // Setup mock database records
        const admin = await prisma.participant.create({
            data: { email: 'admin-audit-test@example.com', name: 'Admin Test', sysadmin: true }
        });
        testAdminId = admin.id;

        const participant = await prisma.participant.create({
            data: { email: 'participant-audit-test@example.com', name: 'Participant Test' }
        });
        testParticipantId = participant.id;
    });

    afterAll(async () => {
        // Clean up
        await prisma.auditLog.deleteMany({
            where: { actorId: { in: [testAdminId, testParticipantId] } }
        });
        await prisma.visit.deleteMany({ where: { participantId: testParticipantId } });
        await prisma.rSVP.deleteMany({ where: { participantId: testParticipantId } });
        await prisma.event.deleteMany({ where: { programId: testProgramId } });
        await prisma.programParticipant.deleteMany({ where: { programId: testProgramId } });
        await prisma.program.deleteMany({ where: { id: testProgramId } });
        await prisma.participant.deleteMany({
            where: { id: { in: [testAdminId, testParticipantId] } }
        });
    });

    beforeEach(() => {
        // Reset mocks and default to admin session
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: testAdminId, sysadmin: true }
        });
    });

    it('should generate an AuditLog when a Program is created', async () => {
        const req = new Request('http://localhost:3000/api/programs', {
            method: 'POST',
            body: JSON.stringify({ name: 'Audit Test Program', begin: new Date() })
        });

        const res = await createProgram(req);
        expect(res.status).toBe(200);

        const responseData = await res.json();
        testProgramId = responseData.program.id;

        // Verify Audit Log
        const log = await prisma.auditLog.findFirst({
            where: {
                actorId: testAdminId,
                action: 'CREATE',
                tableName: 'Program',
                affectedEntityId: testProgramId
            },
            orderBy: { time: 'desc' }
        });

        expect(log).toBeDefined();
        expect(log?.newData).toBeDefined();
    });

    it('should generate an AuditLog when Program Settings are updated', async () => {
        const req = new Request(`http://localhost:3000/api/programs/${testProgramId}/settings`, {
            method: 'PATCH',
            body: JSON.stringify({ leadMentorNotificationSettings: { notifyRsvp: true } })
        });

        const res = await updateProgramSettings(req, { params: Promise.resolve({ id: testProgramId.toString() }) });
        expect(res.status).toBe(200);

        // Verify Audit Log
        const log = await prisma.auditLog.findFirst({
            where: {
                actorId: testAdminId,
                action: 'EDIT',
                tableName: 'Program',
                affectedEntityId: testProgramId
            },
            orderBy: { time: 'desc' }
        });

        expect(log).toBeDefined();
        const newData = log?.newData as any;
        expect(newData.leadMentorNotificationSettings.notifyRsvp).toBe(true);
    });

    it('should generate an AuditLog when an Admin enrolls a participant', async () => {
        const req = new Request(`http://localhost:3000/api/programs/${testProgramId}/participants`, {
            method: 'POST',
            body: JSON.stringify({ participantId: testParticipantId })
        });

        const res = await enrollParticipant(req, { params: Promise.resolve({ id: testProgramId.toString() }) });
        expect(res.status).toBe(200);

        // Verify Audit Log
        const log = await prisma.auditLog.findFirst({
            where: {
                actorId: testAdminId,
                action: 'CREATE',
                tableName: 'ProgramParticipant',
                affectedEntityId: testParticipantId,
                secondaryAffectedEntity: testProgramId
            },
            orderBy: { time: 'desc' }
        });

        expect(log).toBeDefined();
    });

    it('should generate an AuditLog when attendance is validated', async () => {
        // First create an event and visit manually to test validation
        const event = await prisma.event.create({
            data: { programId: testProgramId, name: 'Audit Test Event', start: new Date(), end: new Date() }
        });
        testEventId = event.id;

        const visit = await prisma.visit.create({
            data: { participantId: testParticipantId, arrived: new Date(Date.now() - 100000), departed: new Date(Date.now() + 100000) }
        });
        testVisitId = visit.id;

        const req = new Request(`http://localhost:3000/api/events/${testEventId}/attendance`, {
            method: 'POST',
            body: JSON.stringify({ participantIds: [testParticipantId] })
        });

        const res = await markAttendance(req, { params: Promise.resolve({ id: testEventId.toString() }) });
        expect(res.status).toBe(200);

        // Verify Audit Log
        const log = await prisma.auditLog.findFirst({
            where: {
                actorId: testAdminId,
                action: 'EDIT',
                tableName: 'Visit',
                affectedEntityId: testVisitId,
                secondaryAffectedEntity: testEventId
            },
            orderBy: { time: 'desc' }
        });

        expect(log).toBeDefined();
        const oldData = log?.oldData as any;
        expect(oldData.associatedEventId).toBeNull();
    });
});
