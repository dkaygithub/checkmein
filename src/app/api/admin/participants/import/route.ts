import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import * as xlsx from "xlsx";

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

        let insertedOrUpdatedCount = 0;
        let errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const firstName = row[firstNameIndex]?.toString().trim() || "";
            const lastName = row[lastNameIndex]?.toString().trim() || "";
            const email = emailIndex !== -1 ? row[emailIndex]?.toString().trim() : "";
            const parentEmail = parentEmailIndex !== -1 ? row[parentEmailIndex]?.toString().trim() : "";
            const dobString = dobIndex !== -1 ? row[dobIndex]?.toString().trim() : "";
            const address = addressIndex !== -1 ? row[addressIndex]?.toString().trim() : "";

            if (!firstName && !lastName) {
                // skip empty rows
                continue;
            }

            const fullName = `${firstName} ${lastName}`.trim();
            let parsedDob: Date | undefined;

            if (dobString) {
                const d = new Date(dobString);
                if (!isNaN(d.getTime())) {
                    parsedDob = d;
                }
            }

            try {
                let participantId: number | null = null;
                let householdId: number | null = null;

                // Case 1: They have an email, so we use it to find/update them
                if (email) {
                    let participant = await prisma.participant.findUnique({ where: { email } });

                    if (participant) {
                        participant = await prisma.participant.update({
                            where: { id: participant.id },
                            data: {
                                name: fullName,
                                dob: parsedDob ?? participant.dob,
                                homeAddress: address || participant.homeAddress
                            }
                        });
                    } else {
                        participant = await prisma.participant.create({
                            data: {
                                email,
                                name: fullName,
                                dob: parsedDob,
                                homeAddress: address
                            }
                        });
                    }
                    participantId = participant.id;
                    householdId = participant.householdId;
                }
                // Case 2: No email (e.g. minor), but they have a parent email
                else if (parentEmail) {
                    // Try to find parent by email
                    let parent = await prisma.participant.findUnique({ where: { email: parentEmail } });

                    // Ensure parent exists
                    if (!parent) {
                        // Create placeholder parent
                        parent = await prisma.participant.create({
                            data: {
                                email: parentEmail,
                                name: parentEmail.split('@')[0], // placeholder name
                            }
                        });
                    }

                    // Ensure parent has a household
                    if (!parent.householdId) {
                        const newHousehold = await prisma.household.create({
                            data: {
                                name: `${parent.name}'s Household`,
                                leads: {
                                    create: {
                                        participantId: parent.id
                                    }
                                }
                            }
                        });

                        parent = await prisma.participant.update({
                            where: { id: parent.id },
                            data: { householdId: newHousehold.id }
                        });
                    }

                    householdId = parent.householdId;

                    // Search for a matching name within this household
                    let participant = await prisma.participant.findFirst({
                        where: {
                            householdId: householdId,
                            name: fullName
                        }
                    });

                    if (participant) {
                        participant = await prisma.participant.update({
                            where: { id: participant.id },
                            data: {
                                dob: parsedDob ?? participant.dob,
                                homeAddress: address || participant.homeAddress
                            }
                        });
                    } else {
                        participant = await prisma.participant.create({
                            data: {
                                name: fullName,
                                dob: parsedDob,
                                homeAddress: address,
                                householdId: householdId
                            }
                        });
                    }
                    participantId = participant.id;
                }
                // Case 3: No email, no parent email. Attempt to find by name and DOB.
                else {
                    let participantQuery: any = { name: fullName };
                    if (parsedDob) {
                        participantQuery.dob = parsedDob;
                    }

                    let participant = await prisma.participant.findFirst({ where: participantQuery });

                    if (participant) {
                        participant = await prisma.participant.update({
                            where: { id: participant.id },
                            data: {
                                homeAddress: address || participant.homeAddress
                            }
                        });
                    } else {
                        participant = await prisma.participant.create({
                            data: {
                                name: fullName,
                                dob: parsedDob,
                                homeAddress: address
                            }
                        });
                    }
                    participantId = participant.id;
                    householdId = participant.householdId;
                }

                // If a parent email was provided AND the participant isn't the parent themselves, 
                // link them to the parent's household if they aren't already.
                if (parentEmail && email !== parentEmail && householdId && participantId) {
                    await prisma.participant.update({
                        where: { id: participantId },
                        data: { householdId: householdId }
                    });
                }

                insertedOrUpdatedCount++;

            } catch (err: any) {
                console.error(`Error processing row ${i + 2}:`, err);
                errors.push(`Row ${i + 2} (${fullName || 'Unknown'}): ${err.message || 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully imported or updated ${insertedOrUpdatedCount} participants.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("Error in participant bulk import:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
