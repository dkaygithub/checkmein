"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../page.module.css';

type Tool = {
    id: number;
    name: string;
    safetyGuide: string | null;
};

type Occupant = {
    visitId: number;
    arrived: string;
    participant: {
        id: number;
        name: string | null;
        email: string;
        toolStatuses: {
            toolId: number;
            level: "BASIC" | "DOF" | "CERTIFIED" | "MAY_CERTIFY_OTHERS";
            tool: Tool;
        }[];
    };
};

export default function ShopStewardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [tools, setTools] = useState<Tool[]>([]);
    const [occupants, setOccupants] = useState<Occupant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            fetchData();
        }
    }, [status]);

    const fetchData = async () => {
        try {
            const [toolsRes, activeRes] = await Promise.all([
                fetch('/api/shop/tools'),
                fetch('/api/shop/active')
            ]);

            if (!activeRes.ok) {
                if (activeRes.status === 403) {
                    setError("Forbidden: You require the Shop Steward or Admin role to view this page.");
                } else {
                    setError("Failed to load active shop users.");
                }
                setLoading(false);
                return;
            }

            if (toolsRes.ok) setTools(await toolsRes.json());
            if (activeRes.ok) setOccupants(await activeRes.json());

        } catch (err) {
            setError("Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

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

    if (error) {
        return (
            <main className={styles.main}>
                <div className="glass-container animate-float">
                    <h2>Access Denied</h2>
                    <p style={{ color: '#ef4444' }}>{error}</p>
                    <button className="glass-button" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={`glass-container ${styles.heroContainer}`} style={{ maxWidth: '1400px', width: '100%', overflowX: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>Shop Operations</h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)' }}>Live view of facility occupants and their tool safety clearances.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href="/shop/tools" className="glass-button" style={{ textDecoration: 'none', background: 'rgba(56, 189, 248, 0.2)', borderColor: 'rgba(56, 189, 248, 0.5)' }}>
                            Manage Certifications
                        </Link>
                        <Link href="/dashboard" className="glass-button" style={{ textDecoration: 'none' }}>
                            Dashboard
                        </Link>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '1rem', position: 'sticky', left: 0, background: 'rgba(30,41,59,0.9)', zIndex: 10 }}>Member</th>
                                <th style={{ padding: '1rem' }}>Time Arrived</th>
                                {tools.map(tool => (
                                    <th key={tool.id} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                        {tool.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {occupants.map(occ => (
                                <tr key={occ.visitId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', position: 'sticky', left: 0, background: 'rgba(30,41,59,0.9)', zIndex: 10, fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                        <span>{occ.participant.name || 'Unnamed'}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'gray', fontWeight: 400 }}>{occ.participant.email}</span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        {new Date(occ.arrived).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>

                                    {tools.map(tool => {
                                        const cert = occ.participant.toolStatuses.find(ts => ts.toolId === tool.id);
                                        const style = getBadgeStyle(cert?.level || 'NONE');

                                        return (
                                            <td key={tool.id} style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                {cert ? (
                                                    <span style={{
                                                        background: style.bg,
                                                        color: style.color,
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        letterSpacing: '0.05em',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {style.label}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {occupants.length === 0 && (
                                <tr>
                                    <td colSpan={tools.length + 2} style={{ padding: '3rem', textAlign: 'center', color: 'gray' }}>
                                        The facility is currently empty.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </main>
    );
}
