import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (!(session.user as any)?.sysadmin && !(session.user as any)?.boardMember)) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, email, parentEmail, dob } = body;

        // Either email or parentEmail must be provided
        if (!email && !parentEmail) {
            return NextResponse.json({ error: "Email or Parent Email is required" }, { status: 400 });
        }

        // Check if user already exists
        if (email) {
            const existingUser = await prisma.participant.findUnique({
                where: { email }
            });

            if (existingUser) {
                return NextResponse.json({ error: "A participant with this email already exists" }, { status: 409 });
            }
        }

        let householdIdToAssign: number | null = null;

        // Handle parent logic
        if (parentEmail) {
            let parent = await prisma.participant.findUnique({
                where: { email: parentEmail }
            });

            if (!parent) {
                // Create a placeholder parent if they don't exist
                parent = await prisma.participant.create({
                    data: {
                        email: parentEmail,
                    }
                });
            }

            // Ensure parent has a household
            if (!parent.householdId) {
                const household = await prisma.household.create({
                    data: {
                        name: `${parent.name || 'Family'} Household`,
                    }
                });
                await prisma.participant.update({
                    where: { id: parent.id },
                    data: { householdId: household.id }
                });
                householdIdToAssign = household.id;
            } else {
                householdIdToAssign = parent.householdId;
            }
        }

        const newParticipant = await prisma.participant.create({
            data: {
                name,
                ...(email && { email }),
                dob: dob ? new Date(dob).toISOString() : null,
                ...(householdIdToAssign && { householdId: householdIdToAssign })
            }
        });

        return NextResponse.json({ success: true, participant: newParticipant });
    } catch (error: any) {
        console.error("Failed to create participant:", error);
        return NextResponse.json({ error: `Failed to create participant: ${error.message || error}` }, { status: 500 });
    }
}
