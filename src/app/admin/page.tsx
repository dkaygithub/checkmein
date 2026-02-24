"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

export default function AdminDashboardIndex() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return (
            <main className={styles.main}>
                <div className="glass-container animate-float">
                    <h2>Loading Admin Hub...</h2>
                </div>
            </main>
        );
    }

    if (!session || (!(session.user as any)?.sysadmin && !(session.user as any)?.boardMember)) {
        router.push('/');
        return null;
    }

    return (
        <main className={styles.main}>
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: "800px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Admin Hub</h1>
                    <button className="glass-button" onClick={() => router.push('/')} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Back to Home
                    </button>
                </div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Welcome to the CheckMeIn Administration Hub. From here you can access operational tools to manage facility events and overrides.
                </p>

                <div className={styles.actionGrid}>
                    <button
                        className="glass-button"
                        onClick={() => router.push('/admin/events/visits')}
                        style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)', padding: '2rem', fontSize: '1.25rem', flexDirection: 'column' }}
                    >
                        <strong>Manage Historical Visits</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text)' }}>View and edit past check-in/out records.</p>
                    </button>

                    <button
                        className="glass-button"
                        onClick={() => router.push('/admin/events/badges')}
                        style={{ background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)', padding: '2rem', fontSize: '1.25rem', flexDirection: 'column' }}
                    >
                        <strong>Raw Badge Events</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text)' }}>Audit real-time RFID tap events across the facility.</p>
                    </button>

                    <button
                        className="glass-button"
                        onClick={() => router.push('/admin/roles')}
                        style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)', padding: '2rem', fontSize: '1.25rem', gridColumn: '1 / -1', flexDirection: 'column' }}
                    >
                        <strong>Role Assignment</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text)' }}>Grant or revoke participant privileges and access levels.</p>
                    </button>
                </div>
            </div>
        </main>
    );
}
