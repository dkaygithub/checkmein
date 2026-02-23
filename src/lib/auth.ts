import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Mock authentication utility for Phase 4 logic while Phase 3 (NextAuth) is skipped.
 * Replaces true Google OAuth session checking.
 */
export async function getCurrentUser(req: NextRequest) {
    // Check for a mock header or default to the sysadmin user (Participant 1)
    const mockIdHeader = req.headers.get("x-mock-user-id");
    const userId = mockIdHeader ? parseInt(mockIdHeader, 10) : 1;

    if (isNaN(userId)) return null;

    const user = await prisma.participant.findUnique({
        where: { id: userId },
    });

    return user;
}

export function requireAdmin(user: any) {
    if (!user || (!user.sysadmin && !user.boardMember)) {
        throw new Error("Unauthorized: Requires Admin Role");
    }
}

export function requireKeyholder(user: any) {
    if (!user || !user.keyholder) {
        throw new Error("Unauthorized: Requires Keyholder Role");
    }
}
