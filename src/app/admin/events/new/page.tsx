"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../../../page.module.css';

function NewEventForm() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [programs, setPrograms] = useState<{ id: number, name: string }[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [programId, setProgramId] = useState(searchParams.get('programId') || "");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // Recurrence
    const [repeats, setRepeats] = useState(false);
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
    const [until, setUntil] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const DAYS_MAP = [
        { label: 'Sun', value: 0 },
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 2 },
        { label: 'Wed', value: 3 },
        { label: 'Thu', value: 4 },
        { label: 'Fri', value: 5 },
        { label: 'Sat', value: 6 }
    ];

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            fetchPrograms();
        }
    }, [status]);

    const fetchPrograms = async () => {
        try {
            const res = await fetch('/api/programs');
            if (res.ok) {
                setPrograms(await res.json());
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: number) => {
        setDaysOfWeek(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        if (repeats && (daysOfWeek.length === 0 || !until)) {
            setMessage("Please select at least one day of the week and an end date for recurring events.");
            setSaving(false);
            return;
        }

        try {
            const payload: any = {
                name,
                description,
                programId: programId ? parseInt(programId) : null,
                startDate,
                startTime,
                endTime
            };

            if (repeats) {
                payload.recurrence = {
                    daysOfWeek,
                    until
                };
            }

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                router.push(programId ? `/admin/programs/${programId}` : '/admin/programs');
            } else {
                const err = await res.json();
                setMessage(err.error || "Failed to create event");
            }
        } catch (error) {
            setMessage("Network error");
        } finally {
            setSaving(false);
        }
    };

    if (loading || status === "loading") {
        return <div className="glass-container animate-float"><h2>Loading...</h2></div>;
    }

    return (
        <div className={`glass-container ${styles.heroContainer}`} style={{ maxWidth: '800px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="text-gradient" style={{ margin: 0 }}>Schedule Event</h1>
                <Link href={programId ? `/admin/programs/${programId}` : '/admin/programs'} style={{ color: 'white', textDecoration: 'none' }} className="glass-button">
                    Cancel
                </Link>
            </div>

            {message && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444' }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Event Name *</label>
                        <input type="text" className="glass-input" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} placeholder="e.g. Session 1: Intro to Woodworking" />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Associated Program</label>
                        <select className="glass-input" value={programId} onChange={e => setProgramId(e.target.value)} style={{ width: '100%', padding: '0.75rem' }}>
                            <option value="">-- None (Standalone Event) --</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{repeats ? 'Start Date *' : 'Date *'}</label>
                            <input type="date" className="glass-input" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Start Time *</label>
                            <input type="time" className="glass-input" value={startTime} onChange={e => setStartTime(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>End Time *</label>
                            <input type="time" className="glass-input" value={endTime} onChange={e => setEndTime(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: repeats ? '1.5rem' : '0' }}>
                            <input type="checkbox" id="repeats" checked={repeats} onChange={e => setRepeats(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} />
                            <label htmlFor="repeats" style={{ fontWeight: 500, fontSize: '1.1rem', cursor: 'pointer' }}>Generate Recurring Events</label>
                        </div>

                        {repeats && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Repeat on Days:</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {DAYS_MAP.map(day => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleDay(day.value)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    background: daysOfWeek.includes(day.value) ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                                                    color: daysOfWeek.includes(day.value) ? '#000' : '#fff',
                                                    cursor: 'pointer',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ends On *</label>
                                    <input type="date" className="glass-input" value={until} onChange={e => setUntil(e.target.value)} required={repeats} style={{ width: '100%', maxWidth: '300px', padding: '0.75rem' }} />
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'gray' }}>Events will be generated individually up to this date.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="glass-button" disabled={saving || !startDate || !startTime || !endTime || !name} style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
                        {saving ? "Scheduling..." : "Create Event(s)"}
                    </button>

                </div>
            </form>
        </div>
    );
}

export default function NewEventPage() {
    return (
        <main className={styles.main}>
            <Suspense fallback={<div className="glass-container animate-float">Loading...</div>}>
                <NewEventForm />
            </Suspense>
        </main>
    );
}
