"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function HouseholdPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [household, setHousehold] = useState<any>(null);
    const [message, setMessage] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    // New states for household creation form
    const [creatingHousehold, setCreatingHousehold] = useState(false);
    const [householdName, setHouseholdName] = useState("");

    const [memberForm, setMemberForm] = useState({
        name: "",
        email: "",
        dob: ""
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            fetchHousehold();
        }
    }, [status, router]);

    const fetchHousehold = async () => {
        try {
            const res = await fetch('/api/household');
            if (res.ok) {
                const data = await res.json();
                setHousehold(data.household);
            }
        } catch (error) {
            setMessage("Network error loading household.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHousehold = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/household', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: householdName })
            });
            if (res.ok) {
                const data = await res.json();
                setHousehold(data.household);
                setMessage("Household created successfully!");
                setCreatingHousehold(false);
            } else {
                setMessage("Failed to create household.");
            }
        } catch (error) {
            setMessage("Network error creating household.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            const res = await fetch('/api/household', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberName: memberForm.name,
                    memberEmail: memberForm.email,
                    memberDob: memberForm.dob
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "Member added successfully!");
                setMemberForm({ name: "", email: "", dob: "" });
                setAddingMember(false);
                fetchHousehold(); // Refresh list
            } else {
                setMessage(data.error || "Failed to add member.");
            }
        } catch (error) {
            setMessage("Network error adding member.");
        }
    };

    if (loading || status === "loading") {
        return (
            <main className={styles.main}>
                <div className="glass-container animate-float">
                    <h2>Loading Household...</h2>
                </div>
            </main>
        );
    }

    if (!session) return null;

    return (
        <main className={styles.main}>
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>
                        {household?.name ? household.name : 'My Household'}
                    </h1>
                    <button className="glass-button" onClick={() => router.push('/')} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Back
                    </button>
                </div>

                {message && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: message.includes('success') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${message.includes('success') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '8px',
                        color: message.includes('success') ? '#4ade80' : '#f87171',
                    }}>
                        {message}
                    </div>
                )}

                {!household ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            You are not currently part of a family household structure. Create one to add dependents or combine billing.
                        </p>

                        {!creatingHousehold ? (
                            <button className="glass-button" onClick={() => setCreatingHousehold(true)} style={{ background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
                                Register New Household
                            </button>
                        ) : (
                            <form onSubmit={handleCreateHousehold} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Household Name</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={householdName}
                                        onChange={(e) => setHouseholdName(e.target.value)}
                                        placeholder="e.g. The Smith Family"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="glass-button" style={{ flex: 1, background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                                        Create
                                    </button>
                                    <button type="button" className="glass-button" onClick={() => setCreatingHousehold(false)} style={{ flex: 1 }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Household Members</h2>
                            <div className={styles.actionGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                {household.participants?.map((p: any) => (
                                    <div key={p.id} style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{p.name || "Unnamed"}</h3>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{p.email}</p>
                                        {household.leads?.some((l: any) => l.participantId === p.id) && (
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: '0.5rem',
                                                background: 'rgba(168, 85, 247, 0.2)',
                                                color: '#c084fc',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem'
                                            }}>Household Lead</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!addingMember ? (
                            <button
                                className="glass-button"
                                onClick={() => setAddingMember(true)}
                                style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                            >
                                + Add Household Member
                            </button>
                        ) : (
                            <form onSubmit={handleAddMember} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', textAlign: 'left' }}>
                                <h3 style={{ marginTop: 0 }}>Household Member Registration</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    If you enter an email address, their account will be correctly linked to this household the first time they log in via Google. Leave the email blank if they are a minor dependent who will not sign in themselves.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Full Name</label>
                                        <input
                                            type="text"
                                            className="glass-input"
                                            value={memberForm.name}
                                            onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="glass-input"
                                            value={memberForm.email}
                                            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                                            placeholder="spouse@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Date of Birth (Optional)</label>
                                        <input
                                            type="date"
                                            className="glass-input"
                                            value={memberForm.dob}
                                            onChange={(e) => setMemberForm({ ...memberForm, dob: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button type="submit" className="glass-button" style={{ flex: 1, background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                                            Save / Invite Member
                                        </button>
                                        <button type="button" className="glass-button" onClick={() => setAddingMember(false)} style={{ flex: 1 }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
