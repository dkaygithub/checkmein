import prisma from "@/lib/prisma";
import { isMinor } from "@/lib/time";

/**
 * @deprecated Use isMinor() from @/lib/time instead.
 */
export const isStudentByDob = isMinor;

export async function getFullAttendance() {
    const activeVisits = await prisma.visit.findMany({
        where: { departed: null },
        include: {
            participant: {
                select: {
                    id: true,
                    googleId: true,
                    email: true,
                    name: true,
                    keyholder: true,
                    sysadmin: true,
                    dob: true,
                    householdId: true,
                    phone: true,
                    household: {
                        select: {
                            emergencyContactName: true,
                            emergencyContactPhone: true,
                        }
                    }
                },
            },
            event: {
                include: {
                    program: true
                }
            }
        },
        orderBy: { arrived: "desc" },
    });

    const keyholderVisits = activeVisits.filter(v => v.participant.keyholder);
    const studentVisits = activeVisits.filter(v => isStudentByDob(v.participant.dob));
    const volunteerVisits = activeVisits.filter(v => !v.participant.keyholder && !isStudentByDob(v.participant.dob));

    const counts = {
        keyholders: keyholderVisits.length,
        volunteers: volunteerVisits.length,
        students: studentVisits.length,
        total: activeVisits.length,
    };

    const unaccompaniedStudents = studentVisits.filter(sv => {
        if (!sv.participant.householdId) return true;
        const adultVisits = activeVisits.filter(v => !isStudentByDob(v.participant.dob));
        return !adultVisits.some(av => av.participant.householdId === sv.participant.householdId);
    });
    const adultsPresent = activeVisits.filter(v => !isStudentByDob(v.participant.dob));
    const safety = {
        isLastKeyholder: keyholderVisits.length === 1,
        isTwoDeepViolation: unaccompaniedStudents.length > 0 && adultsPresent.length < 2,
    };

    return { attendance: activeVisits, counts, safety };
}
