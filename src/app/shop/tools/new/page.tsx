"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';

export default function CreateToolPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [newToolName, setNewToolName] = useState("");
    const [newToolGuide, setNewToolGuide] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            const isAuthorized = (session.user as any)?.sysadmin || (session.user as any)?.boardMember;
            if (!isAuthorized) {
                router.push('/shop'); // Redirect non-admins back to shop
            }
        }
    }, [status, router, session]);

    const handleCreateTool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newToolName) return;

        setSaving(true);
        setMessage("");

        try {
            const res = await fetch('/api/shop/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newToolName,
                    safetyGuide: newToolGuide || null
                })
            });

            if (res.ok) {
                setNewToolName("");
                setNewToolGuide("");
                setMessage("Tool created successfully. You can now assign varying certification levels from the Tool Certifications list.");
                setMessageType("success");
            } else {
                const data = await res.json();
                setMessage(data.error || "Failed to create tool.");
                setMessageType("error");
            }
        } catch {
            setMessage("Network error creating tool.");
            setMessageType("error");
        } finally {
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
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Register New Tool</h1>
                    <button className="glass-button" onClick={() => router.push('/shop')} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Back to Shop Ops
                    </button>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Register a new tool for use in the facility. Tool names are globally visible to members undergoing certification training.
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
                    <form onSubmit={handleCreateTool} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tool Name</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={newToolName}
                                    onChange={e => setNewToolName(e.target.value)}
                                    placeholder="e.g. Table Saw"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Safety Guide URL (Optional)</label>
                                <input
                                    type="url"
                                    className="glass-input"
                                    value={newToolGuide}
                                    placeholder="e.g. https://docs.google.com/..."
                                    onChange={e => setNewToolGuide(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    Link to the manufacturer's manual or internal safety quiz for users to study.
                                </p>
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="submit" className="glass-button" disabled={saving || !newToolName.trim()} style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                                {saving ? "Saving..." : "Register Tool"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
