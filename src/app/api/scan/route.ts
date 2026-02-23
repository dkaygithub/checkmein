import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    console.log("--> API /api/scan HIT");
    try {
        const body = await req.json();
        const participantId = body.participantId;
        console.log(`Parsed body, participantId: ${participantId}`);

        if (!participantId) {
            return NextResponse.json(
                { error: "participantId is required." },
                { status: 400 }
            );
        }

        console.log("Checking if participant exists...");
        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
        });
        console.log(`Participant lookup result: ${participant ? participant.email : 'null'}`);

        if (!participant) {
            return NextResponse.json(
                { error: `Participant ${participantId} not found.` },
                { status: 404 }
            );
        }

        console.log("Logging raw badge event...");
        await prisma.rawBadgeEvent.create({
            data: {
                participantId: participant.id,
                location: "Main Entrance", // Or from request if multiple scanners exist
            },
        });
        console.log("Raw event logged.");

        console.log("Checking active visits...");
        // Step 3: Check for an active open visit (i.e. check-in without check-out)
        const activeVisit = await prisma.visit.findFirst({
            where: {
                participantId: participant.id,
                departed: null, // Still in the building
            },
            orderBy: { arrived: "desc" },
        });
        console.log(`Active visit found: ${activeVisit ? 'Yes' : 'No'}`);

        if (activeVisit) {
            // User is already checked in, so we Check them Out
            const updatedVisit = await prisma.visit.update({
                where: { id: activeVisit.id },
                data: { departed: new Date() },
            });

            let facilityClosed = false;

            // Check if they were a keyholder
            if (participant.keyholder) {
                // Count how many OTHER keyholders are still in the building
                const remainingKeyholders = await prisma.visit.count({
                    where: {
                        departed: null,
                        participant: { keyholder: true }
                    }
                });

                // If 0 remaining, close the facility
                if (remainingKeyholders === 0) {
                    facilityClosed = true;
                    // Forcibly checkout all remaining attendees
                    await prisma.visit.updateMany({
                        where: { departed: null },
                        data: { departed: new Date() }
                    });
                    console.log("Facility closed. Forcibly checked out all remaining members.");
                }
            }

            return NextResponse.json({
                message: facilityClosed ? "Checked out and Facility closed" : "Checked out successfully",
                type: "checkout",
                participant,
                visit: updatedVisit,
                facilityClosed
            });
        } else {
            // User is not checked in, so we Check them In
            const newVisit = await prisma.visit.create({
                data: {
                    participantId: participant.id,
                    arrived: new Date(),
                },
            });

            return NextResponse.json({
                message: "Checked in successfully",
                type: "checkin",
                participant,
                visit: newVisit,
            });
        }
    } catch (error) {
        console.error("Scan processing error:", error);
        return NextResponse.json(
            { error: "Internal Server Error while processing scan." },
            { status: 500 }
        );
    }
}
