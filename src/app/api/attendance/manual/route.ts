import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await req.json();
        const { arrived, departed } = body;

        if (!arrived) {
            return NextResponse.json({ error: "Arrival time is required" }, { status: 400 });
        }

        const arrivalTime = new Date(arrived);
        const departureTime = departed ? new Date(departed) : null;

        if (departureTime && departureTime <= arrivalTime) {
            return NextResponse.json({ error: "Departure time must be after arrival time" }, { status: 400 });
        }

        const visit = await prisma.visit.create({
            data: {
                participantId: userId,
                arrived: arrivalTime,
                departed: departureTime,
            }
        });

        await prisma.auditLog.create({
            data: {
                actorId: userId,
                action: "CREATE",
                tableName: "Visit",
                affectedEntityId: visit.id,
                newData: JSON.stringify({ arrived, departed, type: "manual_entry" })
            }
        });

        return NextResponse.json({ message: "Manual visit recorded successfully.", visit }, { status: 201 });
    } catch (error: any) {
        console.error("Manual Attendance POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
