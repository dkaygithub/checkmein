import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Find the user's household
        const user = await prisma.participant.findUnique({
            where: { id: userId },
            select: { householdId: true }
        });

        if (!user || !user.householdId) {
            return NextResponse.json({ visits: [] }, { status: 200 }); // Not in a household
        }

        // Fetch the 100 most recent visits for anyone in this household
        const visits = await prisma.visit.findMany({
            where: {
                participant: {
                    householdId: user.householdId
                }
            },
            orderBy: { arrived: 'desc' },
            take: 100,
            include: {
                participant: { select: { id: true, name: true } },
                event: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json({ visits }, { status: 200 });
    } catch (error: any) {
        console.error("Household Visits GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
