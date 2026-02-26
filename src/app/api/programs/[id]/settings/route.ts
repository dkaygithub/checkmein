import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const programId = parseInt(id, 10);
        if (isNaN(programId)) {
            return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
        }

        const currentProgram = await prisma.program.findUnique({
            where: { id: programId }
        });

        if (!currentProgram) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 });
        }

        const currentUserId = (session.user as any).id;
        const isSysAdminOrBoard = (session.user as any)?.sysadmin || (session.user as any)?.boardMember;
        const isLeadMentor = currentProgram.leadMentorId === currentUserId;

        if (!isSysAdminOrBoard && !isLeadMentor) {
            return NextResponse.json({ error: "Forbidden: Not authorized to update program settings" }, { status: 403 });
        }

        const body = await req.json();
        const { leadMentorNotificationSettings } = body;

        const updatedProgram = await prisma.program.update({
            where: { id: programId },
            data: {
                leadMentorNotificationSettings: leadMentorNotificationSettings !== undefined ? (leadMentorNotificationSettings as any) : undefined
            }
        });

        await prisma.auditLog.create({
            data: {
                actorId: currentUserId,
                action: 'EDIT',
                tableName: 'Program',
                affectedEntityId: programId,
                newData: { leadMentorNotificationSettings } as any
            }
        });

        return NextResponse.json({ success: true, program: updatedProgram });
    } catch (error) {
        console.error("Program settings update error:", error);
        return NextResponse.json({ error: "Failed to update program settings" }, { status: 500 });
    }
}
