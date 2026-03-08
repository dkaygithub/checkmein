"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./trends.module.css";

type PeriodType = "week" | "month" | "quarter" | "year";

interface TrendBucket {
    label: string;
    periodStart: string;
    uniqueVolunteers: number;
    uniqueStudents: number;
    totalVolunteerHours: number;
    totalStudentHours: number;
    structuredHours: number;
    unstructuredHours: number;
}

interface ProgramOption {
    id: number;
    name: string;
}

export default function ParticipationTrendsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [period, setPeriod] = useState<PeriodType>("month");
    const [programId, setProgramId] = useState<string>("");
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [buckets, setBuckets] = useState<TrendBucket[]>([]);
    const [totals, setTotals] = useState<TrendBucket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        } else if (status === "authenticated") {
            const isAuthorized =
                (session?.user as any)?.sysadmin || (session?.user as any)?.boardMember;
            if (!isAuthorized) {
                router.push("/");
            }
        }
    }, [status, session, router]);

    // Fetch programs for the dropdown
    useEffect(() => {
        fetch("/api/programs")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setPrograms(data.map((p: any) => ({ id: p.id, name: p.name })));
                }
            })
            .catch(console.error);
    }, []);

    // Fetch trends data
    useEffect(() => {
        if (status !== "authenticated") return;

        setLoading(true);
        const params = new URLSearchParams({ period });
        if (programId) params.set("programId", programId);

        fetch(`/api/admin/trends?${params}`)
            .then((res) => res.json())
            .then((data) => {
                setBuckets(data.buckets || []);
                setTotals(data.totals || null);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [period, programId, status]);

    if (status === "loading" || (status === "authenticated" && loading && buckets.length === 0)) {
        return (
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div className="glass-container animate-float" style={{ textAlign: "center", padding: "3rem" }}>
                    <h2>Loading Participation Trends…</h2>
                </div>
            </div>
        );
    }

    const fmtHours = (h: number) => {
        if (h === 0) return "0";
        if (h < 1) return `${Math.round(h * 60)}m`;
        return h.toFixed(1);
    };

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            {/* Header */}
            <div className="glass-container" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
                <h1 className="text-gradient" style={{ margin: 0, fontSize: "2rem" }}>
                    📈 Participation Trends
                </h1>
                <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 0" }}>
                    Facility usage metrics across time periods and programs.
                </p>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.periodGroup}>
                    {(["week", "month", "quarter", "year"] as PeriodType[]).map((p) => (
                        <button
                            key={p}
                            className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ""}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                <select
                    className={styles.programSelect}
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                >
                    <option value="">All Programs (Aggregate)</option>
                    {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            {totals && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{totals.uniqueVolunteers}</div>
                        <div className={styles.statLabel}>Unique Volunteers</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{totals.uniqueStudents}</div>
                        <div className={styles.statLabel}>Unique Students</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{fmtHours(totals.totalVolunteerHours)}</div>
                        <div className={styles.statLabel}>Volunteer Hours</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{fmtHours(totals.totalStudentHours)}</div>
                        <div className={styles.statLabel}>Student Hours</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{fmtHours(totals.structuredHours)}</div>
                        <div className={styles.statLabel}>Structured Hours</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{fmtHours(totals.unstructuredHours)}</div>
                        <div className={styles.statLabel}>Unstructured Hours</div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="glass-container" style={{ padding: "0", overflow: "hidden" }}>
                <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Volunteers</th>
                                <th>Students</th>
                                <th>Vol. Hours</th>
                                <th>Stu. Hours</th>
                                <th>Structured</th>
                                <th>Unstructured</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buckets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                                        No visit data found for this time range.
                                    </td>
                                </tr>
                            ) : (
                                buckets.map((b) => (
                                    <tr key={b.periodStart}>
                                        <td>{b.label}</td>
                                        <td>{b.uniqueVolunteers}</td>
                                        <td>{b.uniqueStudents}</td>
                                        <td>{fmtHours(b.totalVolunteerHours)}</td>
                                        <td>{fmtHours(b.totalStudentHours)}</td>
                                        <td>{fmtHours(b.structuredHours)}</td>
                                        <td>{fmtHours(b.unstructuredHours)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {totals && buckets.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td>Total</td>
                                    <td>{totals.uniqueVolunteers}</td>
                                    <td>{totals.uniqueStudents}</td>
                                    <td>{fmtHours(totals.totalVolunteerHours)}</td>
                                    <td>{fmtHours(totals.totalStudentHours)}</td>
                                    <td>{fmtHours(totals.structuredHours)}</td>
                                    <td>{fmtHours(totals.unstructuredHours)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
