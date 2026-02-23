import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Seeding database...")

    // Create a Keyholder
    const p1 = await prisma.participant.upsert({
        where: { email: 'keyholder@example.com' },
        update: {},
        create: {
            email: 'keyholder@example.com',
            keyholder: true,
            sysadmin: true,
        },
    })

    // Create a standard participant
    const p2 = await prisma.participant.upsert({
        where: { email: 'member@example.com' },
        update: {},
        create: {
            email: 'member@example.com',
            keyholder: false,
        },
    })

    console.log({ p1, p2 })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
