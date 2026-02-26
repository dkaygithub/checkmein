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
    const [parentEmail, setParentEmail] = useState("");
    const [dob, setDob] = useState("");

    const isMinor = () => {
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

    const minorSelected = isMinor();

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
                    email: email || null,
                    parentEmail: minorSelected ? parentEmail : null,
                    dob: dob || null
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`Participant ${name || data.participant.email || 'created'} successfully!`);
                setName("");
                setEmail("");
                setParentEmail("");
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date of Birth {minorSelected && <span style={{ color: '#c084fc', marginLeft: '8px', fontSize: '0.8rem' }}>(Minor Detected)</span>}</label>
                            <input type="date" className="glass-input" value={dob} onChange={e => setDob(e.target.value)} style={{ width: '100%', padding: '0.75rem', maxWidth: '300px' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Participant Google Email {minorSelected ? "(Optional for Minors)" : "*"}</label>
                            <input type="email" className="glass-input" value={email} onChange={e => setEmail(e.target.value)} required={!minorSelected} style={{ width: '100%', padding: '0.75rem' }} placeholder="jane.doe@example.com" />
                        </div>

                        {minorSelected && (
                            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Parent / Guardian Google Email *</label>
                                <p style={{ fontSize: '0.85rem', color: 'gray', marginTop: 0, marginBottom: '1rem' }}>Because the participant is under 18, a parent or guardian's email is required to associate their accounts.</p>
                                <input type="email" className="glass-input" value={parentEmail} onChange={e => setParentEmail(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} placeholder="parent@example.com" />
                            </div>
                        )}

                        <button type="submit" className="glass-button" disabled={saving || (!minorSelected && !email) || (minorSelected && !parentEmail)} style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
                            {saving ? "Registering..." : "Create Participant"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
