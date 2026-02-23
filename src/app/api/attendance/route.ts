import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Find all active visits where departed is null
        const activeVisits = await prisma.visit.findMany({
            where: {
                departed: null,
            },
            include: {
                participant: {
                    select: {
                        id: true,
                        googleId: true,
                        email: true,
                        keyholder: true,
                        sysadmin: true,
                    },
                },
            },
            orderBy: {
                arrived: "desc",
            },
        });

        return NextResponse.json({ attendance: activeVisits });
    } catch (error) {
        console.error("Attendance fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error while fetching attendance." },
            { status: 500 }
        );
    }
}
