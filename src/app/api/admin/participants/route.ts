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
        const { name, email, dob } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.participant.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "A participant with this email already exists" }, { status: 409 });
        }

        const newParticipant = await prisma.participant.create({
            data: {
                name,
                email,
                dob: dob ? new Date(dob).toISOString() : null,
            }
        });

        return NextResponse.json({ success: true, participant: newParticipant });
    } catch (error) {
        console.error("Failed to create participant:", error);
        return NextResponse.json({ error: "Failed to create participant" }, { status: 500 });
    }
}
