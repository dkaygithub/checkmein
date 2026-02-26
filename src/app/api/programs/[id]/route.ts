import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const program = await prisma.program.findUnique({
            where: { id: programId },
            include: {
                volunteers: {
                    include: { participant: true }
                },
                participants: {
                    include: { participant: true }
                },
                events: true,
                fees: true
            }
        });

        if (!program) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 });
        }

        // Apply memberOnly visibility checks
        if (program.memberOnly) {
            let canSeeMemberOnly = false;
            if (session && session.user) {
                const user = session.user as any;
                if (user.sysadmin || user.boardMember) {
                    canSeeMemberOnly = true;
                } else {
                    const participant = await prisma.participant.findUnique({
                        where: { id: user.id },
                        include: {
                            memberships: {
                                where: { active: true }
                            }
                        }
                    });
                    if (participant && participant.memberships.length > 0) {
                        canSeeMemberOnly = true;
                    }
                }
            }

            if (!canSeeMemberOnly) {
                return NextResponse.json({ error: "Forbidden: Member-Only Program" }, { status: 403 });
            }
        }

        return NextResponse.json(program);
    } catch (error) {
        console.error("Failed to fetch program:", error);
        return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
    }
}

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

        const currentProgram = await prisma.program.findUnique({ where: { id: programId } });
        if (!currentProgram) {
            return NextResponse.json({ error: "Program not found" }, { status: 404 });
        }

        const isLeadMentor = currentProgram.leadMentorId === (session.user as any).id;
        const isSysAdminOrBoard = (session.user as any)?.sysadmin || (session.user as any)?.boardMember;

        if (!isLeadMentor && !isSysAdminOrBoard) {
            return NextResponse.json({ error: "Forbidden: Only Admin, Board Members, or Lead Mentors can edit" }, { status: 403 });
        }

        const body = await req.json();
        const { name, leadMentorId, begin, end, memberOnly, isPublished, minAge, maxParticipants, leadMentorNotificationSettings } = body;

        const updatedProgram = await prisma.program.update({
            where: { id: programId },
            data: {
                ...(name !== undefined && { name }),
                ...(leadMentorId !== undefined && { leadMentorId }),
                ...(begin !== undefined && { begin: begin ? new Date(begin) : null }),
                ...(end !== undefined && { end: end ? new Date(end) : null }),
                ...(memberOnly !== undefined && { memberOnly }),
                ...(isPublished !== undefined && { isPublished }),
                ...(minAge !== undefined && { minAge }),
                ...(maxParticipants !== undefined && { maxParticipants }),
                ...(leadMentorNotificationSettings !== undefined && { leadMentorNotificationSettings }),
            }
        });

        await prisma.auditLog.create({
            data: {
                actorId: (session.user as any).id,
                action: 'EDIT',
                tableName: 'Program',
                affectedEntityId: updatedProgram.id,
                oldData: JSON.stringify(currentProgram),
                newData: JSON.stringify(updatedProgram)
            }
        });

        return NextResponse.json({ success: true, program: updatedProgram });
    } catch (error) {
        console.error("Program update error:", error);
        return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
    }
}
