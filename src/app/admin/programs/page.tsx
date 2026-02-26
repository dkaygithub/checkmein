"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../page.module.css';

type ProgramSummary = {
    id: number;
    name: string;
    begin: string | null;
    end: string | null;
    leadMentorId: number | null;
    _count: {
        participants: number;
        volunteers: number;
        events: number;
    };
};

export default function AdminProgramsDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [programs, setPrograms] = useState<ProgramSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [activeOnly, setActiveOnly] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/');
        } else if (status === "authenticated") {
            const isAuthorized = (session.user as any)?.sysadmin || (session.user as any)?.boardMember;
            if (!isAuthorized) {
                router.push('/admin');
            } else {
                fetchPrograms();
            }
        }
    }, [status, router, session, activeOnly]);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/programs${activeOnly ? '?active=true' : ''}`);
            if (res.ok) {
                const data = await res.json();
                setPrograms(data);
            } else {
                setMessage("Failed to load programs list.");
            }
        } catch (error) {
            setMessage("Network error loading programs.");
        } finally {
            setLoading(false);
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
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: '1000px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>Programs Management</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="glass-button" onClick={() => router.push('/admin')} style={{ padding: '0.5rem 1rem' }}>
                            &larr; Back to Admin Hub
                        </button>
                        <button className="glass-button primary-button" onClick={() => router.push('/admin/programs/new')} style={{ padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                            + New Program
                        </button>
                    </div>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Manage all programs, view enrollments, and coordinate mentor assignments.
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

                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="checkbox"
                        id="activeOnly"
                        checked={activeOnly}
                        onChange={e => setActiveOnly(e.target.checked)}
                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                    />
                    <label htmlFor="activeOnly" style={{ cursor: 'pointer' }}>Show active programs only</label>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                <th style={{ padding: '1rem 0.5rem' }}>Program Name</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Start Date</th>
                                <th style={{ padding: '1rem 0.5rem' }}>End Date</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Participants</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Volunteers</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Events</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {programs.map(program => (
                                <tr key={program.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{program.name}</td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-muted)' }}>
                                        {program.begin ? new Date(program.begin).toLocaleDateString() : 'TBD'}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-muted)' }}>
                                        {program.end ? new Date(program.end).toLocaleDateString() : 'Ongoing'}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>{program._count.participants}</td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>{program._count.volunteers}</td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>{program._count.events}</td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                        <Link href={`/admin/programs/${program.id}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}>
                                            Manage &rarr;
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {programs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No programs found.
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
