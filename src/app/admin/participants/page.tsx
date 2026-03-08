"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../page.module.css";

export default function AdminParticipantsIndex() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/participants/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.participants) {
                setResults(data.participants);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div className="glass-container animate-float" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ marginTop: 0 }}>Participants</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Search and manage system participants and households.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="glass-button" 
                        onClick={() => router.push('/admin/participants/import')}
                        style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                    >
                        Bulk Import
                    </button>
                    <button 
                        className="glass-button" 
                        onClick={() => router.push('/admin/participants/new')}
                        style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}
                    >
                        + New Participant
                    </button>
                </div>
            </div>

            <div className="glass-container" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            flex: 1, 
                            padding: '0.75rem 1rem', 
                            borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                    <button type="submit" className="glass-button" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem' }}>
                    {results.length > 0 ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {results.map(p => (
                                <div key={p.id} className="glass-container" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{p.email || 'No email'}</div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        {p.household?.name || 'No household'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchQuery && !loading ? (
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No participants found.</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
