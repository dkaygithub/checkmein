"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

type EventAttendanceData = {
    id: number;
    name: string;
    start: string;
    end: string;
    program?: { id: number; name: string };
    rsvps: {
        participantId: number;
        status: string;
        participant: { name: string; email: string };
    }[];
    visits: {
        participantId: number;
        arrived: string;
        departed: string | null;
    }[];
};

export default function EventAttendanceValidationPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [eventData, setEventData] = useState<EventAttendanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [validating, setValidating] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            // Need a fetching strategy here for the detailed attendance data
            // To keep things simple we assume we can fetch it, but wait!
            // I haven't written `GET /api/events/[id]` yet.
            // Let's render a placeholder indicating this depends on a missing route.
            setMessage("Please Note: A specific GET /api/events/[id] endpoint must be created to fetch the full shape of RSVPs and raw Visits. For now, this is a placeholder UI.");
            setLoading(false);
        }
    }, [status, router]);

    const handleValidate = async () => {
        setValidating(true);
        try {
            const resolvedParams = await params;
            const res = await fetch(`/api/events/${resolvedParams.id}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantIds: Array.from(selectedParticipants)
                })
            });

            if (res.ok) {
                setMessage("Attendance validated successfully!");
            } else {
                setMessage("Failed to validate attendance.");
            }
        } catch {
            setMessage("Network error.");
        } finally {
            setValidating(false);
        }
    };

    if (loading || status === "loading") {
        return (
            <main className={styles.main}>
                <div className="glass-container animate-float">
                    <h2>Loading...</h2>
                </div>
            </main>
        );
    }

    if (!session) return null;

    return (
        <main className={styles.main}>
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: '800px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Validate Attendance</h1>
                    <button className="glass-button" onClick={() => router.back()} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Go Back
                    </button>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Reconcile those who RSVP'd against those who actually checked into the building during the event timeframe.
                </p>

                {message && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Attendees List</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Select the final list of verified attendees. (Data mock for Phase 2 testing)
                    </p>

                    {/* Dummy Checkboxes representing the merge of RSVP/Visit data */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" onChange={(e) => {
                                const newSet = new Set(selectedParticipants);
                                e.target.checked ? newSet.add(1) : newSet.delete(1);
                                setSelectedParticipants(newSet);
                            }} />
                            Jane Doe (jane@example.com) — <span style={{ color: '#4ade80' }}>RSVP'd & Badged In</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" onChange={(e) => {
                                const newSet = new Set(selectedParticipants);
                                e.target.checked ? newSet.add(2) : newSet.delete(2);
                                setSelectedParticipants(newSet);
                            }} />
                            John Smith (john@example.com) — <span style={{ color: '#fbbf24' }}>RSVP'd, No Badge Record</span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="glass-button"
                        onClick={handleValidate}
                        disabled={validating || selectedParticipants.size === 0}
                        style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}
                    >
                        {validating ? "Saving..." : `Validate ${selectedParticipants.size} Attendees`}
                    </button>
                </div>
            </div>
        </main>
    );
}
