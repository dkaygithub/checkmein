"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

export default function ShopOpsHub() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return (
            <main className={styles.main}>
                <div className="glass-container animate-float">
                    <h2>Loading Shop Ops...</h2>
                </div>
            </main>
        );
    }

    const isBoardOrAdmin = (session?.user as any)?.sysadmin || (session?.user as any)?.boardMember;
    const isAuthorized = isBoardOrAdmin || (session?.user as any)?.shopSteward || (session?.user as any)?.toolStatuses?.some((ts: any) => ts.level === 'MAY_CERTIFY_OTHERS');

    if (!session || !isAuthorized) {
        router.push('/');
        return null;
    }

    return (
        <main className={styles.main}>
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: "800px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Shop Ops</h1>
                    <button className="glass-button" onClick={() => router.push('/')} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Back to Home
                    </button>
                </div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Welcome to the Shop Operations Hub. Manage shop safety guidelines, certifications, and tool access here.
                </p>

                <div className={styles.actionGrid}>
                    <button
                        className="glass-button"
                        onClick={() => router.push('/shop/tools')}
                        style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.4)', padding: '2rem', fontSize: '1.25rem', flexDirection: 'column' }}
                    >
                        <strong style={{ color: '#fcd34d' }}>Tool Certifications</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text)' }}>Assign safety levels to members and manage shop tools.</p>
                    </button>

                    {isBoardOrAdmin && (
                        <button
                            className="glass-button"
                            onClick={() => router.push('/shop/tools/new')}
                            style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)', padding: '2rem', fontSize: '1.25rem', flexDirection: 'column' }}
                        >
                            <strong style={{ color: '#93c5fd' }}>Tool Registry</strong>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text)' }}>Register new tools into the system.</p>
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
