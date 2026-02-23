"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [participantId, setParticipantId] = useState<number>(1);

  const handleMockScan = async () => {
    setLoading(true);
    setMessage("");
    try {
      // Mock scanning Participant ID input
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.type.toUpperCase()}: ${data.message} for ${data.participant.email}`);
      } else {
        setMessage(`Error: ${data.error || 'Failed to scan'}`);
      }
    } catch (err) {
      setMessage("Failed to connect to scanner API");
    }
    setLoading(false);
  };

  return (
    <main className={styles.main}>
      <div className={`glass-container animate-float ${styles.heroContainer}`}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>
          CheckMeIn
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', marginBottom: '2rem' }}>
          The elegant next-generation facility check-in system.
        </p>

        <div className={styles.actionGrid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Participant ID:</label>
            <input
              type="number"
              value={participantId}
              onChange={(e) => setParticipantId(Number(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'white',
                minWidth: '200px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <button
            className="glass-button"
            onClick={handleMockScan}
            disabled={loading}
          >
            {loading ? 'Scanning...' : 'Mock Scan'}
          </button>
          <button
            className="glass-button"
            onClick={() => router.push('/attendance')}
          >
            View Attendance
          </button>
        </div>

        {message && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'var(--color-primary)',
            backdropFilter: 'blur(10px)'
          }}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
