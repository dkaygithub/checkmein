"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../page.module.css";

export default function AdminParticipantsIndex() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
    const [householdId, setHouseholdId] = useState("");
    const [householdSearch, setHouseholdSearch] = useState("");
    const [householdResults, setHouseholdResults] = useState<any[]>([]);
    const [householdSearching, setHouseholdSearching] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Debounced household search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (householdSearch && !householdId) {
                const search = async () => {
                    setHouseholdSearching(true);
                    try {
                        const res = await fetch(`/api/admin/households?q=${encodeURIComponent(householdSearch)}`);
                        if (res.ok) {
                            const data = await res.json();
                            setHouseholdResults(data.households || []);
                        }
                    } finally {
                        setHouseholdSearching(false);
                    }
                };
                search();
            } else if (!householdSearch) {
                setHouseholdResults([]);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [householdSearch, householdId]);

    const handleAssignHousehold = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParticipant) return;
        setAssigning(true);
        try {
            const res = await fetch(`/api/admin/participants/${selectedParticipant.id}/household`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    householdId: householdId ? parseInt(householdId) : undefined,
                    createNew: !householdId
                })
            });
            if (res.ok) {
                const data = await res.json();
                setResults(results.map(p => p.id === selectedParticipant.id ? data.participant : p));
                setAssignModalOpen(false);
                setHouseholdId("");
                setHouseholdSearch("");
                setSelectedParticipant(null);
            } else {
                alert("Failed to assign household");
            }
        } catch (err) {
            console.error(err);
            alert("Network error");
        } finally {
            setAssigning(false);
        }
    };

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
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {p.household?.name || 'No household'}
                                        {!p.household && (
                                            <button 
                                                className="glass-button" 
                                                onClick={() => { setSelectedParticipant(p); setAssignModalOpen(true); }}
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)' }}
                                            >
                                                Assign Household
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchQuery && !loading ? (
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No participants found.</p>
                    ) : null}
                </div>
            </div>

            {assignModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div className="glass-container" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginTop: 0 }}>Assign Household to {selectedParticipant?.name}</h2>
                        <form onSubmit={handleAssignHousehold}>
                            <div style={{ position: 'relative', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Search for Existing Household
                                </label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 0, marginBottom: '1rem' }}>
                                    If left blank, a new household will be created.
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        value={householdSearch}
                                        onChange={e => { setHouseholdSearch(e.target.value); setHouseholdId(""); }}
                                        style={{ width: '100%', padding: '0.75rem' }}
                                        placeholder="Search households..."
                                    />
                                    {householdId && (
                                        <button
                                            type="button"
                                            onClick={() => { setHouseholdId(""); setHouseholdSearch(""); }}
                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {householdSearching && <div style={{ marginTop: '0.5rem', color: 'gray', fontSize: '0.8rem' }}>Searching...</div>}
                                {householdResults.length > 0 && !householdId && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', zIndex: 10, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginTop: '4px' }}>
                                        {householdResults.map(h => (
                                            <div
                                                key={h.id}
                                                onClick={() => {
                                                    setHouseholdId(h.id.toString());
                                                    setHouseholdSearch(h.name || `Household #${h.id}`);
                                                    setHouseholdResults([]);
                                                }}
                                                style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{ fontWeight: 500 }}>{h.name || `Household #${h.id}`}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    {h.participants.map((p: any) => p.name || p.email || 'Unnamed').join(', ') || 'Empty'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="glass-button" onClick={() => { setAssignModalOpen(false); setSelectedParticipant(null); setHouseholdSearch(""); setHouseholdId(""); }} disabled={assigning}>
                                    Cancel
                                </button>
                                <button type="submit" className="glass-button" disabled={assigning} style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                                    {assigning ? "Saving..." : (householdId ? "Add to Household" : "Create New Household")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
