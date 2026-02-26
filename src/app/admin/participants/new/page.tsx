"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../../page.module.css';

export default function NewParticipantPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [dob, setDob] = useState("");

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    if (status === "loading") {
        return <main className={styles.main}><div className="glass-container animate-float">Loading...</div></main>;
    }

    if (!session || (!(session.user as any)?.sysadmin && !(session.user as any)?.boardMember)) {
        router.push('/');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setIsError(false);

        try {
            const res = await fetch('/api/admin/participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    dob: dob || null
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`Participant ${data.participant.email} successfully created!`);
                setName("");
                setEmail("");
                setDob("");
            } else {
                setIsError(true);
                setMessage(data.error || "Failed to create participant");
            }
        } catch (error) {
            setIsError(true);
            setMessage("Network error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className={styles.main}>
            <div className={`glass-container ${styles.heroContainer}`} style={{ maxWidth: '800px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Register New User</h1>
                    <Link href="/admin" style={{ color: 'white', textDecoration: 'none' }} className="glass-button">
                        &larr; Admin Hub
                    </Link>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    System Administrators can manually register a new participant into the database. When they log in via their Google email for the first time, their account will instantly link to this profile.
                </p>

                {message && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`, borderRadius: '8px', color: isError ? '#ef4444' : '#4ade80' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                            <input type="text" className="glass-input" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.75rem' }} placeholder="e.g. Jane Doe" />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Google Email Address *</label>
                            <input type="email" className="glass-input" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} placeholder="jane.doe@example.com" />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date of Birth</label>
                            <input type="date" className="glass-input" value={dob} onChange={e => setDob(e.target.value)} style={{ width: '100%', padding: '0.75rem', maxWidth: '300px' }} />
                        </div>

                        <button type="submit" className="glass-button" disabled={saving || !email} style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
                            {saving ? "Registering..." : "Create Participant"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
