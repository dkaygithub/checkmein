"use client";

import { useEffect, useState } from "react";
import styles from "../../page.module.css";
import { useRouter } from "next/navigation";

type Visit = {
    id: number;
    arrived: string;
    departed: string | null;
    participant: { email: string; keyholder: boolean };
};

export default function AdminDashboard() {
    const router = useRouter();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editVisitId, setEditVisitId] = useState<number | null>(null);
    const [editArrived, setEditArrived] = useState("");
    const [editDeparted, setEditDeparted] = useState("");

    const fetchVisits = async () => {
        try {
            // Sending x-mock-user-id header to simulate Admin (ID=1)
            const res = await fetch("/api/admin/visits", {
                headers: { "x-mock-user-id": "1" }
            });
            const data = await res.json();
            if (res.ok) {
                setVisits(data.visits);
            } else {
                setError(data.error || "Failed to fetch visits");
            }
        } catch (err) {
            setError("Failed to connect to admin API");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    const handleEdit = (visit: Visit) => {
        setEditVisitId(visit.id);
        setEditArrived(new Date(visit.arrived).toISOString().slice(0, 16));
        setEditDeparted(visit.departed ? new Date(visit.departed).toISOString().slice(0, 16) : "");
    };

    const handleSave = async () => {
        try {
            const res = await fetch("/api/admin/visits", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-mock-user-id": "1" // Simulate Admin
                },
                body: JSON.stringify({
                    visitId: editVisitId,
                    arrived: editArrived ? new Date(editArrived).toISOString() : undefined,
                    departed: editDeparted ? new Date(editDeparted).toISOString() : undefined,
                })
            });

            if (res.ok) {
                setEditVisitId(null);
                fetchVisits(); // Refresh data
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update visit");
            }
        } catch (err) {
            alert("Failed to connect to API");
        }
    };

    return (
        <main className={styles.main}>
            <div className="glass-container" style={{ width: "100%", maxWidth: "1000px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Admin Panel - Visits</h1>
                    <button className="glass-button" onClick={() => router.push('/')}>Home</button>
                </div>

                {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

                {loading ? (
                    <p>Loading visits...</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                <th style={{ padding: "0.75rem" }}>Participant</th>
                                <th style={{ padding: "0.75rem" }}>Arrived</th>
                                <th style={{ padding: "0.75rem" }}>Departed</th>
                                <th style={{ padding: "0.75rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visits.map((visit) => (
                                <tr key={visit.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "0.75rem" }}>{visit.participant.email}</td>
                                    <td style={{ padding: "0.75rem" }}>
                                        {editVisitId === visit.id ? (
                                            <input
                                                type="datetime-local"
                                                value={editArrived}
                                                onChange={(e) => setEditArrived(e.target.value)}
                                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '4px' }}
                                            />
                                        ) : (
                                            new Date(visit.arrived).toLocaleString()
                                        )}
                                    </td>
                                    <td style={{ padding: "0.75rem" }}>
                                        {editVisitId === visit.id ? (
                                            <input
                                                type="datetime-local"
                                                value={editDeparted}
                                                onChange={(e) => setEditDeparted(e.target.value)}
                                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '4px' }}
                                            />
                                        ) : (
                                            visit.departed ? new Date(visit.departed).toLocaleString() : "Active"
                                        )}
                                    </td>
                                    <td style={{ padding: "0.75rem" }}>
                                        {editVisitId === visit.id ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={handleSave} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                                                <button onClick={() => setEditVisitId(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(visit)}
                                                style={{ background: 'rgba(59, 130, 246, 0.5)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
