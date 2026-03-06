import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import * as xlsx from "xlsx";

type RowStatus = "ready" | "update" | "warning" | "error";

interface RowPreview {
    rowNumber: number;
    data: {
        firstName: string;
        lastName: string;
        email: string;
        parentEmail: string;
        dob: string;
        address: string;
    };
    status: RowStatus;
    action: string;
    warnings: string[];
    existingParticipant?: { id: number; name: string | null };
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        if (!user.sysadmin && !user.boardMember) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: "buffer" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawData.length < 2) {
            return NextResponse.json({ error: "Empty spreadsheet or no data rows found" }, { status: 400 });
        }

        const headers = rawData[0].map((h: any) => String(h).trim().toLowerCase());
        const rows = rawData.slice(1);

        const emailIndex = headers.findIndex(h => h.includes("email") && !h.includes("parent"));
        const parentEmailIndex = headers.findIndex(h => h.includes("parent email"));
        const firstNameIndex = headers.findIndex(h => h.includes("first name"));
        const lastNameIndex = headers.findIndex(h => h.includes("last name"));
        const dobIndex = headers.findIndex(h => h.includes("dob"));
        const addressIndex = headers.findIndex(h => h.includes("address"));

        if (firstNameIndex === -1 || lastNameIndex === -1) {
            return NextResponse.json({ error: "Missing required 'First Name' or 'Last Name' columns." }, { status: 400 });
        }

        const previews: RowPreview[] = [];
        const emailsSeen = new Map<string, number>(); // email -> first row number

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // 1-indexed, skip header

            const firstName = row[firstNameIndex]?.toString().trim() || "";
            const lastName = row[lastNameIndex]?.toString().trim() || "";
            const email = emailIndex !== -1 ? row[emailIndex]?.toString().trim() || "" : "";
            const parentEmail = parentEmailIndex !== -1 ? row[parentEmailIndex]?.toString().trim() || "" : "";
            const dobString = dobIndex !== -1 ? row[dobIndex]?.toString().trim() || "" : "";
            const address = addressIndex !== -1 ? row[addressIndex]?.toString().trim() || "" : "";

            // Skip fully empty rows
            if (!firstName && !lastName && !email && !parentEmail) {
                continue;
            }

            const warnings: string[] = [];
            let status: RowStatus = "ready";
            let action = "";
            let existingParticipant: { id: number; name: string | null } | undefined;

            // Check: missing name
            if (!firstName && !lastName) {
                previews.push({
                    rowNumber,
                    data: { firstName, lastName, email, parentEmail, dob: dobString, address },
                    status: "error",
                    action: "Cannot import — missing both first and last name",
                    warnings: [],
                });
                continue;
            }

            const fullName = `${firstName} ${lastName}`.trim();

            // Check: DOB parsing
            let parsedDob: Date | undefined;
            if (dobString) {
                const d = new Date(dobString);
                if (isNaN(d.getTime())) {
                    warnings.push(`Could not parse date of birth: "${dobString}"`);
                } else {
                    parsedDob = d;
                }
            }

            // Check: minor without parent email
            if (parsedDob) {
                const age = (Date.now() - parsedDob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                if (age < 18 && !parentEmail) {
                    warnings.push("Minor (under 18) without a parent email");
                }
            }

            // Check: no email and no parent email
            if (!email && !parentEmail) {
                warnings.push("No email or parent email — will attempt to match by name" + (parsedDob ? " and DOB" : " only (no DOB)"));
            }

            // Check: duplicate email within spreadsheet
            if (email) {
                const lowerEmail = email.toLowerCase();
                if (emailsSeen.has(lowerEmail)) {
                    warnings.push(`Duplicate email in spreadsheet (also on row ${emailsSeen.get(lowerEmail)})`);
                } else {
                    emailsSeen.set(lowerEmail, rowNumber);
                }
            }

            // Check against existing DB records
            if (email) {
                const existing = await prisma.participant.findUnique({
                    where: { email },
                    select: { id: true, name: true },
                });
                if (existing) {
                    status = "update";
                    action = `Update existing participant: "${existing.name || 'Unnamed'}" (ID ${existing.id})`;
                    existingParticipant = existing;
                } else {
                    action = "Create new participant with email";
                }
            } else if (parentEmail) {
                const parent = await prisma.participant.findUnique({
                    where: { email: parentEmail },
                    select: { id: true, name: true, householdId: true },
                });

                if (parent) {
                    // Check if child already exists in household
                    if (parent.householdId) {
                        const existingChild = await prisma.participant.findFirst({
                            where: { householdId: parent.householdId, name: fullName },
                            select: { id: true, name: true },
                        });
                        if (existingChild) {
                            status = "update";
                            action = `Update existing household member: "${existingChild.name}" under "${parent.name || parentEmail}"`;
                            existingParticipant = existingChild;
                        } else {
                            action = `Create new participant under "${parent.name || parentEmail}"'s household`;
                        }
                    } else {
                        action = `Create new participant; will create household for parent "${parent.name || parentEmail}"`;
                    }
                } else {
                    action = `Create new participant + placeholder parent for ${parentEmail}`;
                    warnings.push(`Parent email "${parentEmail}" not found — a placeholder parent will be created`);
                }
            } else {
                // No email, no parent email — match by name
                let matchQuery: any = { name: fullName };
                if (parsedDob) matchQuery.dob = parsedDob;

                const existing = await prisma.participant.findFirst({
                    where: matchQuery,
                    select: { id: true, name: true },
                });
                if (existing) {
                    status = "update";
                    action = `Update existing participant matched by name${parsedDob ? " and DOB" : ""}: "${existing.name}" (ID ${existing.id})`;
                    existingParticipant = existing;
                } else {
                    action = `Create new participant (matched by name${parsedDob ? " + DOB" : ""}, no email)`;
                }
            }

            // If there are warnings but status is still "ready" or "update", elevate to "warning"
            if (warnings.length > 0 && (status === "ready" || status === "update")) {
                // keep the action, but mark status as warning
                status = "warning";
            }

            previews.push({
                rowNumber,
                data: { firstName, lastName, email, parentEmail, dob: dobString, address },
                status,
                action,
                warnings,
                existingParticipant,
            });
        }

        const summary = {
            ready: previews.filter(p => p.status === "ready").length,
            update: previews.filter(p => p.status === "update").length,
            warning: previews.filter(p => p.status === "warning").length,
            error: previews.filter(p => p.status === "error").length,
        };

        return NextResponse.json({
            columns: ["First Name", "Last Name", "Email", "Parent Email", "DOB", "Address"],
            rows: previews,
            summary,
        });

    } catch (error) {
        console.error("Error in participant import preview:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
