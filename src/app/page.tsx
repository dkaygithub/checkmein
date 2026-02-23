import styles from './page.module.css';

export default function Home() {
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
          <button className="glass-button">Check In Now</button>
          <button className="glass-button">View Attendance</button>
        </div>
      </div>
    </main>
  );
}
