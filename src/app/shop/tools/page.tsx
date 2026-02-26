"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../page.module.css';

type Tool = {
    id: number;
    name: string;
    safetyGuide: string | null;
};

type Certification = {
    userId: number;
    toolId: number;
    level: "BASIC" | "DOF" | "CERTIFIED" | "MAY_CERTIFY_OTHERS";
    user: {
        id: number;
        name: string | null;
        email: string;
    };
};

type ParticipantOption = {
    id: number;
    name: string | null;
    email: string;
};

export default function ToolManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [tools, setTools] = useState<Tool[]>([]);
    const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [allParticipants, setAllParticipants] = useState<ParticipantOption[]>([]);

    const [confirmDialog, setConfirmDialog] = useState<{
        type: 'PROMOTION' | 'DEMOTION' | 'NEW';
        userName: string;
        oldLevel: string;
        newLevel: string;
        payload: { toolId: number, participantId: number, level: string }
    } | null>(null);

    const LEVEL_RANKS: Record<string, number> = {
        "NONE": 0,
        "BASIC": 1,
        "DOF": 2,
        "CERTIFIED": 3,
        "MAY_CERTIFY_OTHERS": 4
    };

    const [newCertUserId, setNewCertUserId] = useState("");
    const [newCertLevel, setNewCertLevel] = useState("CERTIFIED");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            // Only fetch if we haven't already, preventing infinite loops
            if (tools.length === 0 && allParticipants.length === 0) {
                fetchTools();
                fetchAllParticipants();
            }
        }
    }, [status, router]); // removed tools/allParticipants to prevent loop, relying on initial fetch

    useEffect(() => {
        if (selectedToolId) {
            fetchCertifications(selectedToolId);
        } else {
            setCertifications([]);
        }
    }, [selectedToolId]);

    const fetchTools = async () => {
        try {
            const res = await fetch('/api/shop/tools');
            if (res.ok) setTools(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const fetchAllParticipants = async () => {
        try {
            const res = await fetch('/api/shop/members');
            if (res.ok) {
                const data = await res.json();
                setAllParticipants(data.members || []);
            }
        } catch { /* silent fail */ }
    };

    const fetchCertifications = async (toolId: number) => {
        try {
            const res = await fetch(`/api/shop/certifications?toolId=${toolId}`);
            if (res.ok) setCertifications(await res.json());
        } catch { }
    };

    const initiateGrantCertification = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        if (!selectedToolId || !newCertUserId || !newCertLevel) return;

        const participantId = parseInt(newCertUserId);
        const participant = allParticipants.find(p => p.id === participantId);
        const userName = participant?.name || participant?.email || "Unknown User";

        const existingCert = certifications.find(c => c.userId === participantId);
        const oldLevel = existingCert ? existingCert.level : "NONE";

        if (oldLevel === newCertLevel) {
            setMessage("User already has this certification level.");
            return;
        }

        const oldRank = LEVEL_RANKS[oldLevel];
        const newRank = LEVEL_RANKS[newCertLevel];
        const type = oldRank === 0 ? 'NEW' : newRank > oldRank ? 'PROMOTION' : 'DEMOTION';

        setConfirmDialog({
            type,
            userName,
            oldLevel,
            newLevel: newCertLevel,
            payload: {
                toolId: selectedToolId,
                participantId,
                level: newCertLevel
            }
        });
    };

    const confirmGrantCertification = async () => {
        if (!confirmDialog) return;
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch('/api/shop/certifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(confirmDialog.payload)
            });

            if (res.ok) {
                setMessage(`Certification successfully updated for ${confirmDialog.userName}.`);
                setNewCertUserId("");
                fetchCertifications(selectedToolId!);
            } else {
                const data = await res.json();
                setMessage(data.error || "Failed to grant certification.");
            }
        } catch (error) {
            setMessage("Network error.");
        } finally {
            setSaving(false);
            setConfirmDialog(null);
        }
    };

    const filteredTools = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getBadgeStyle = (level: string) => {
        switch (level) {
            case 'BASIC': return { bg: '#3b82f6', color: '#fff', label: 'Basic' };
            case 'DOF': return { bg: '#8b5cf6', color: '#fff', label: 'DoF' };
            case 'CERTIFIED': return { bg: '#22c55e', color: '#000', label: 'Certified' };
            case 'MAY_CERTIFY_OTHERS': return { bg: '#eab308', color: '#000', label: 'Certifier' };
            default: return { bg: 'transparent', color: 'gray', label: '-' };
        }
    };



    if (loading || status === "loading") {
        return <main className={styles.main}><div className="glass-container animate-float"><h2>Loading...</h2></div></main>;
    }

    return (
        <main className={styles.main}>
            <div className={`glass-container ${styles.heroContainer}`} style={{ maxWidth: '1000px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>Tool Certifications</h1>
                    <Link href="/shop" className="glass-button" style={{ textDecoration: 'none' }}>
                        &larr; Shop Dashboard
                    </Link>
                </div>

                {message && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', color: '#38bdf8' }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '2rem' }}>

                    {/* Left Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>Select Tool</h3>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Search tools..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem' }}
                                />
                            </div>
                            <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {filteredTools.map(tool => (
                                        <li key={tool.id}>
                                            <button
                                                onClick={() => setSelectedToolId(tool.id)}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: selectedToolId === tool.id ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                                                    background: selectedToolId === tool.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    color: selectedToolId === tool.id ? '#fff' : 'var(--color-text-muted)',
                                                    cursor: 'pointer',
                                                    fontWeight: selectedToolId === tool.id ? 600 : 400,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {tool.name}
                                            </button>
                                        </li>
                                    ))}
                                    {filteredTools.length === 0 && <p style={{ color: 'gray' }}>No tools match your search.</p>}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', minHeight: '400px' }}>
                        {!selectedToolId ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>
                                Select a tool from the list to view or grant certifications.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Grant Certification Level</h3>
                                    <form onSubmit={initiateGrantCertification} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'gray' }}>Member</label>
                                            <select className="glass-input" value={newCertUserId} onChange={e => setNewCertUserId(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }}>
                                                <option value="">-- Search... --</option>
                                                {allParticipants.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ width: '150px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'gray' }}>Level</label>
                                            <select className="glass-input" value={newCertLevel} onChange={e => setNewCertLevel(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }}>
                                                <option value="BASIC">Basic</option>
                                                <option value="DOF">DoF</option>
                                                <option value="CERTIFIED">Certified</option>
                                                <option value="MAY_CERTIFY_OTHERS">Certifier</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="glass-button" disabled={saving || !newCertUserId} style={{ padding: '0.75rem 1.5rem', background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                                            Grant
                                        </button>
                                    </form>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#fbbf24' }}>* You must have the 'Certifier' level on this tool, or be an Admin, to successfully grant levels to others.</p>
                                </div>

                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0' }}>Certified Members On Tool</h3>
                                    {certifications.length === 0 ? <p style={{ color: 'gray' }}>No users have certifications for this tool.</p> : (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {certifications.map(cert => {
                                                const style = getBadgeStyle(cert.level);
                                                return (
                                                    <li key={cert.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                                                        <span>{cert.user.name || 'Unnamed'} <span style={{ color: 'gray', fontSize: '0.85rem' }}>({cert.user.email})</span></span>
                                                        <span style={{
                                                            background: style.bg,
                                                            color: style.color,
                                                            padding: '0.3rem 0.6rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {style.label}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {confirmDialog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-container" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 1rem 0' }}>Confirm {confirmDialog.type === 'PROMOTION' ? 'Promotion' : confirmDialog.type === 'DEMOTION' ? 'Demotion' : 'Certification'}</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            {confirmDialog.type === 'PROMOTION' && <div style={{ fontSize: '3rem', color: '#4ade80', lineHeight: 1 }}>&#8593;</div>}
                            {confirmDialog.type === 'DEMOTION' && <div style={{ fontSize: '3rem', color: '#ef4444', lineHeight: 1 }}>&#8595;</div>}
                            {confirmDialog.type === 'NEW' && <div style={{ fontSize: '3rem', color: '#38bdf8', lineHeight: 1 }}>&#10024;</div>}
                        </div>

                        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                            You are about to change the certification level for <strong>{confirmDialog.userName}</strong>.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', fontWeight: 'bold' }}>
                            {confirmDialog.oldLevel !== 'NONE' && (
                                <>
                                    <span style={{ color: 'gray' }}>{confirmDialog.oldLevel}</span>
                                    <span>&rarr;</span>
                                </>
                            )}
                            <span style={{ color: confirmDialog.type === 'DEMOTION' ? '#ef4444' : '#4ade80' }}>
                                {confirmDialog.newLevel}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="glass-button" onClick={() => setConfirmDialog(null)} style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <button className="glass-button" onClick={confirmGrantCertification} disabled={saving} style={{ flex: 1, background: confirmDialog.type === 'DEMOTION' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)', borderColor: confirmDialog.type === 'DEMOTION' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)' }}>
                                {saving ? "Saving..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
