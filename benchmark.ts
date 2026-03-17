import { processPostEventEmails } from './src/lib/postEventEmails';
import prisma from './src/lib/prisma';
import * as email from './src/lib/email';

const mockEvents = Array.from({ length: 100 }).map((_, i) => ({
    id: i + 1,
    name: `Event ${i + 1}`,
    program: {
        id: i + 1,
        leadMentorId: i + 1,
        volunteers: []
    },
    rsvps: [],
    visits: []
}));

let callCount = 0;
const origFindMany = prisma.event.findMany;
prisma.event.findMany = async () => {
    if (callCount === 0) {
        callCount++;
        return mockEvents as any;
    }
    return [];
};

prisma.event.update = async () => { return {} as any; };

const origFindUnique = prisma.participant.findUnique;
prisma.participant.findUnique = async ({ where }: any) => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return { email: `lead${where.id}@example.com` } as any;
};

const origFindManyParticipants = prisma.participant.findMany;
prisma.participant.findMany = async ({ where }: any) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const ids = where.id.in as number[];
    return ids.map(id => ({ id, email: `lead${id}@example.com` })) as any;
};

// mock sendEmail
(email as any).sendEmail = async () => true;

async function runBenchmark() {
    console.log(`Starting benchmark for 100 events...`);
    const start = Date.now();
    await processPostEventEmails({ forceImmediate: true, batchSize: 100 });
    const end = Date.now();

    console.log(`Time taken: ${end - start}ms`);

    // Restore original functions just in case
    prisma.event.findMany = origFindMany;
    prisma.participant.findUnique = origFindUnique;
    prisma.participant.findMany = origFindManyParticipants;
}

runBenchmark().catch(console.error);
