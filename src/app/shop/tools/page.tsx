"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

type UserRole = {
    id: number;
    name: string | null;
    email: string;
};

type Tool = {
    id: number;
    name: string;
    safetyGuide: string | null;
};

type ToolStatus = {
    userId: number;
    toolId: number;
    level: string;
};

export default function ShopToolsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<UserRole[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [statuses, setStatuses] = useState<Record<number, Record<number, string>>>({}); // userId -> toolId -> level

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    // Search filters
    const [userSearchText, setUserSearchText] = useState("");
    const [toolSearchText, setToolSearchText] = useState("");

    const currentUserIsBoardOrAdmin = (session?.user as any)?.sysadmin || (session?.user as any)?.boardMember || false;
    const currentUserIsStewardOrAdmin = (session?.user as any)?.sysadmin || (session?.user as any)?.shopSteward || false;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            const isAuthorized = (session.user as any)?.sysadmin || (session.user as any)?.boardMember || (session.user as any)?.shopSteward || (session.user as any)?.toolStatuses?.some((ts: any) => ts.level === 'MAY_CERTIFY_OTHERS');
            if (!isAuthorized) {
                router.push('/');
            } else {
                fetchData();
            }
        }
    }, [status, router, session]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/shop/tools');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.participants);
                setTools(data.tools);

                // Convert flat array into nested dictionary for easy lookups
                const statusMap: Record<number, Record<number, string>> = {};
                data.participants.forEach((p: any) => {
                    statusMap[p.id] = {};
                    p.toolStatuses.forEach((ts: any) => {
                        statusMap[p.id][ts.toolId] = ts.level;
                    });
                });
                setStatuses(statusMap);
            } else {
                setMessage("Failed to load shop data.");
            }
        } catch (error) {
            setMessage("Network error loading shop data.");
        } finally {
            setLoading(false);
        }
    };

    const handleLevelChange = async (userId: number, toolId: number, newLevel: string) => {
        setSaving(true);
        setMessage("");

        // Optimistic update
        setStatuses(prev => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || {}),
                [toolId]: newLevel
            }
        }));

        try {
            const res = await fetch('/api/shop/tools', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: userId,
                    toolId: toolId,
                    level: newLevel
                })
            });

            if (!res.ok) {
                const data = await res.json();
                setMessage(data.error || "Failed to update tool certification.");
                fetchData(); // Revert on failure
            }
        } catch (e) {
            setMessage("Network error updating certification.");
            fetchData();
        } finally {
            setSaving(false);
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

    const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase().includes(userSearchText.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchText.toLowerCase()))
    );

    const filteredTools = tools.filter(t =>
        t.name.toLowerCase().includes(toolSearchText.toLowerCase())
    );

    return (
        <main className={styles.main}>
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: '1200px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Tool Certifications</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="glass-button" onClick={() => router.push('/shop')} style={{ padding: '0.5rem 1rem' }}>
                            &larr; Back to Shop Ops
                        </button>
                    </div>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Manage tools and assign safety certification levels to members. Shop Stewards and certified peers can assign access.
                </p>

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

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="glass-input"
                        style={{ flex: '1 1 250px', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        value={userSearchText}
                        onChange={e => setUserSearchText(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        className="glass-input"
                        style={{ flex: '1 1 250px', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        value={toolSearchText}
                        onChange={e => setToolSearchText(e.target.value)}
                    />
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                    <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                <th style={{ padding: '1rem', minWidth: '200px', position: 'sticky', left: 0, backgroundColor: '#1e293b', zIndex: 10, borderRight: '1px solid rgba(255,255,255,0.1)', boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }}>Member</th>
                                {filteredTools.map(tool => (
                                    <th key={tool.id} style={{ padding: '1rem 0.5rem', textAlign: 'center', minWidth: '160px' }}>
                                        <div style={{ color: '#fcd34d' }}>{tool.name}</div>
                                        {tool.safetyGuide && (
                                            <a href={tool.safetyGuide} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Guide</a>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', position: 'sticky', left: 0, backgroundColor: '#1e293b', zIndex: 5, borderRight: '1px solid rgba(255,255,255,0.1)', boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontWeight: 500 }}>{user.name || 'Unnamed'}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                                    </td>
                                    {filteredTools.map(tool => {
                                        const currentLevel = statuses[user.id]?.[tool.id] || "NONE";
                                        const isCertifierForThisTool = (session?.user as any)?.toolStatuses?.some((ts: any) => ts.toolId === tool.id && ts.level === 'MAY_CERTIFY_OTHERS');
                                        const canEditThisTool = currentUserIsStewardOrAdmin || isCertifierForThisTool;

                                        return (
                                            <td key={tool.id} style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                                <select
                                                    value={currentLevel}
                                                    disabled={saving || !canEditThisTool}
                                                    onChange={(e) => handleLevelChange(user.id, tool.id, e.target.value)}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.3)',
                                                        color: 'white',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        padding: '0.4rem',
                                                        borderRadius: '4px',
                                                        width: '100%'
                                                    }}
                                                >
                                                    <option value="NONE">- None -</option>
                                                    <option value="BASIC">Basic</option>
                                                    <option value="DOF">DOF (Needs Oversight)</option>
                                                    <option value="CERTIFIED">Certified</option>
                                                    <option value="MAY_CERTIFY_OTHERS">Certifier</option>
                                                </select>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
