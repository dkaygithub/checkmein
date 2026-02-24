"use client";

import { useEffect, useState } from "react";
import styles from "../page.module.css";

type Participant = {
    id: number;
    email: string;
    keyholder: boolean;
    sysadmin: boolean;
    dob?: string | null;
    toolStatuses?: {
        tool: { name: string };
        level: string;
    }[];
};

const isMinor = (dob: string | undefined | null) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age < 18;
};

type Visit = {
    id: number;
    arrived: string;
    participant: Participant;
};

export default function AttendanceDashboard() {
    const [attendance, setAttendance] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        try {
            const res = await fetch("/api/attendance");
            const data = await res.json();
            if (data.attendance) {
                setAttendance(data.attendance);
            }
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
        // Refresh every 10 seconds
        const interval = setInterval(fetchAttendance, 10000);
        return () => clearInterval(interval);
    }, []);

    const keyholdersPresent = attendance.filter((v) => v.participant.keyholder).length;
    const minorsPresent = attendance.filter((v) => isMinor(v.participant.dob)).length;
    const adultsPresent = attendance.filter((v) => !isMinor(v.participant.dob)).length;

    return (
        <main className={styles.main}>
            <div className="glass-container" style={{ width: "100%", maxWidth: "800px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Current Attendance</h1>
                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                        <span title={`${minorsPresent} Minors Present`}>{attendance.length} People Present</span>
                    </div>
                </div>

                {minorsPresent > 0 && adultsPresent < 2 ? (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span>🚨</span>
                        <strong>Critical Warning:</strong> Two-Deep Compliance is failing! There are {minorsPresent} minors present, but only {adultsPresent} adult(s) in the building.
                    </div>
                ) : keyholdersPresent === 1 && (
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#fcd34d',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span>⚠️</span>
                        <strong>Warning:</strong> Only one keyholder is currently in the building.
                    </div>
                )}

                {loading ? (
                    <p style={{ color: "var(--color-text-muted)" }}>Loading attendance...</p>
                ) : attendance.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                        <p>The facility is currently empty.</p>
                    </div>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {attendance.map((visit) => (
                            <li
                                key={visit.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "1rem",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                }}
                            >
                                <div>
                                    <span style={{ fontWeight: 500 }}>{visit.participant.email}</span>
                                    {visit.participant.keyholder && (
                                        <span
                                            style={{
                                                marginLeft: "8px",
                                                fontSize: "0.75rem",
                                                background: "rgba(59, 130, 246, 0.2)",
                                                color: "#93c5fd",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                            }}
                                        >
                                            Keyholder
                                        </span>
                                    )}
                                    {isMinor(visit.participant.dob) && (
                                        <span
                                            style={{
                                                marginLeft: "8px",
                                                fontSize: "0.75rem",
                                                background: "rgba(168, 85, 247, 0.2)",
                                                color: "#c084fc",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                            }}
                                        >
                                            Minor
                                        </span>
                                    )}
                                    {visit.participant.toolStatuses?.filter(ts => ts.level && ts.level !== 'NONE').map((ts, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                marginLeft: "8px",
                                                fontSize: "0.75rem",
                                                background: "rgba(245, 158, 11, 0.2)",
                                                color: "#fcd34d",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                border: "1px solid rgba(245, 158, 11, 0.4)"
                                            }}
                                            title={`Level: ${ts.level}`}
                                        >
                                            {ts.tool.name}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                                    Arrived: {new Date(visit.arrived).toLocaleTimeString()}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
