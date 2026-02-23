"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from "next-auth/react";
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState<boolean | null>(null);

  const checkAttendanceStatus = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      const currentUserId = (session.user as any).id;
      const userActiveVisit = data.attendance?.find(
        (visit: any) => visit.participant.id === currentUserId
      );
      setIsCheckedIn(!!userActiveVisit);
    } catch (err) {
      console.error("Failed to fetch attendance status", err);
    }
  }, [session]);

  useEffect(() => {
    checkAttendanceStatus();
  }, [checkAttendanceStatus]);

  const handleToggleCheckin = async () => {
    if (!session?.user) return;
    setLoading(true);
    setMessage("");
    try {
      const participantId = (session.user as any).id;
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.type === 'checkin' ? 'Successfully checked in!' : 'Successfully checked out!'}`);
        await checkAttendanceStatus(); // Re-fetch the status securely
      } else {
        setMessage(`Error: ${data.error || 'Failed to update attendance'}`);
      }
    } catch (err) {
      setMessage("Failed to connect to API");
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
          {session ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', gridColumn: '1 / -1' }}>
                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', width: '100%', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: 'white' }}>Welcome back, <strong>{session.user?.name || session.user?.email}</strong>!</p>
                  {/* Display roles if any */}
                  {((session.user as any)?.sysadmin || (session.user as any)?.keyholder) && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                      {(session.user as any)?.sysadmin && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>Sysadmin</span>}
                      {(session.user as any)?.keyholder && <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>Keyholder</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in Toggle Button */}
              {isCheckedIn !== null && (
                <button
                  className="glass-button"
                  onClick={handleToggleCheckin}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1.5rem',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    background: isCheckedIn ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    borderColor: isCheckedIn ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
                    boxShadow: isCheckedIn ? '0 0 15px rgba(239, 68, 68, 0.3)' : '0 0 15px rgba(34, 197, 94, 0.3)',
                    gridColumn: '1 / -1'
                  }}>
                  {loading ? 'Processing...' : isCheckedIn ? 'Check Out' : 'Check In'}
                </button>
              )}

              <div style={{ display: 'flex', gap: '1rem', width: '100%', gridColumn: '1 / -1' }}>
                <button className="glass-button" onClick={() => router.push('/attendance')} style={{ flex: 1 }}>
                  View Attendance
                </button>
                <button className="glass-button" onClick={() => router.push('/profile')} style={{ flex: 1, background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                  My Profile
                </button>
                <button className="glass-button" onClick={() => router.push('/household')} style={{ flex: 1, background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
                  My Household
                </button>
                <button className="glass-button" onClick={() => signOut()} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                className="glass-button"
                onClick={() => signIn('google')}
                style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }}
              >
                Sign in with Google
              </button>
              <button
                className="glass-button"
                onClick={() => router.push('/attendance')}
              >
                View Attendance
              </button>
            </>
          )}

          {((session?.user as any)?.sysadmin) && (
            <button
              className="glass-button"
              onClick={() => router.push('/admin')}
              style={{ background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)', gridColumn: '1 / -1' }}
            >
              Admin Panel
            </button>
          )}
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
