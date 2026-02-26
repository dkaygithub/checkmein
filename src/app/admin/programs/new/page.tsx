"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

export default function CreateProgramPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [name, setName] = useState("");
    const [begin, setBegin] = useState("");
    const [end, setEnd] = useState("");
    const [memberOnly, setMemberOnly] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            const isAuthorized = (session.user as any)?.sysadmin || (session.user as any)?.boardMember;
            if (!isAuthorized) {
                router.push('/admin');
            }
        }
    }, [status, router, session]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setSaving(true);
        setMessage("");

        try {
            const res = await fetch('/api/programs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    begin: begin || null,
                    end: end || null,
                    memberOnly
                })
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/admin/programs/${data.program.id}`);
            } else {
                const data = await res.json();
                setMessage(data.error || "Failed to create program.");
                setMessageType("error");
                setSaving(false);
            }
        } catch {
            setMessage("Network error creating program.");
            setMessageType("error");
            setSaving(false);
        }
    };

    if (status === "loading") {
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
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Create Program</h1>
                    <button className="glass-button" onClick={() => router.push('/admin/programs')} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Back to Programs
                    </button>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Create a new program. You can assign the lead mentor and configure the roster later.
                </p>

                {message && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: messageType === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${messageType === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '8px',
                        color: messageType === 'success' ? '#4ade80' : '#f87171',
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ marginBottom: '2rem' }}>
                    <form onSubmit={handleCreate} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Program Name</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. FRC Robotics 2026"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Start Date</label>
                                    <input
                                        type="date"
                                        className="glass-input"
                                        value={begin}
                                        onChange={e => setBegin(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>End Date</label>
                                    <input
                                        type="date"
                                        className="glass-input"
                                        value={end}
                                        onChange={e => setEnd(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="memberOnly"
                                checked={memberOnly}
                                onChange={e => setMemberOnly(e.target.checked)}
                                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                            />
                            <label htmlFor="memberOnly" style={{ cursor: 'pointer', fontWeight: 500 }}>
                                Member-Only Program
                            </label>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '2rem' }}>
                            If checked, this program will only be visible to logged-in users with active memberships.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="submit" className="glass-button" disabled={saving || !name.trim()} style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                                {saving ? "Saving..." : "Create Program"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
