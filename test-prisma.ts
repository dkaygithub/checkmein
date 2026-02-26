import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const newProgram = await prisma.program.create({
      data: {
        name: "Test Program",
        leadMentorId: null,
        begin: null,
        end: null,
        memberOnly: false
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: "1" as any, // simulating session.user.id as string
        action: 'CREATE',
        tableName: 'Program',
        affectedEntityId: newProgram.id,
        newData: JSON.stringify(newProgram)
      }
    });
    console.log("Success");
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
