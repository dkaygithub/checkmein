import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    const isAuthorized = (session?.user as any)?.sysadmin || (session?.user as any)?.boardMember || (session?.user as any)?.shopSteward;

    if (!session || !isAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tools = await prisma.tool.findMany({
            orderBy: { name: 'asc' }
        });

        const participants = await prisma.participant.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                toolStatuses: {
                    select: {
                        toolId: true,
                        level: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ tools, participants });
    } catch (error) {
        console.error("Failed to fetch shop tools data:", error);
        return NextResponse.json({ error: "Failed to fetch shop tools data" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const canCreateTools = (session?.user as any)?.sysadmin || (session?.user as any)?.boardMember;

    if (!session || !canCreateTools) {
        return NextResponse.json({ error: "Forbidden: Only Admin or Board Members can create tools" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, safetyGuide } = body;

        if (!name) {
            return NextResponse.json({ error: "Tool name is required" }, { status: 400 });
        }

        const newTool = await prisma.tool.create({
            data: {
                name,
                safetyGuide: safetyGuide || null
            }
        });

        await prisma.auditLog.create({
            data: {
                userId: (session.user as any).id,
                action: 'CREATE',
                targetType: 'TOOL',
                targetId: newTool.id,
                details: `Created new tool: ${name}`
            }
        });

        return NextResponse.json({ success: true, tool: newTool });
    } catch (error) {
        console.error("Tool creation error:", error);
        return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    const canAssignLevels = (session?.user as any)?.sysadmin || (session?.user as any)?.shopSteward;

    if (!session || !canAssignLevels) {
        return NextResponse.json({ error: "Forbidden: Only Admin or Shop Stewards can assign tool access" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { targetUserId, toolId, level } = body;

        if (!targetUserId || !toolId || !level) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (level === "NONE") {
            // Delete the certification relation entirely
            await prisma.toolStatus.deleteMany({
                where: {
                    userId: targetUserId,
                    toolId: toolId
                }
            });
        } else {
            // Upsert the certification level
            await prisma.toolStatus.upsert({
                where: {
                    userId_toolId: {
                        userId: targetUserId,
                        toolId: toolId
                    }
                },
                update: {
                    level: level as any
                },
                create: {
                    userId: targetUserId,
                    toolId: toolId,
                    level: level as any
                }
            });
        }

        await prisma.auditLog.create({
            data: {
                userId: (session.user as any).id,
                action: 'EDIT',
                targetType: 'TOOL_STATUS',
                targetId: targetUserId,
                details: `Updated Tool ${toolId} for User ${targetUserId} to Level: ${level}`
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Tool status assignment error:", error);
        return NextResponse.json({ error: "Failed to assign tool status" }, { status: 500 });
    }
}
