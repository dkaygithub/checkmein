"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../page.module.css";

export default function BulkImportParticipants() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; message?: string; errors?: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null); // Clear previous results
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/participants/import", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ success: true, message: data.message, errors: data.errors });
            } else {
                setResult({ success: false, message: data.error || "Failed to upload file." });
            }
        } catch (err: any) {
            console.error("Upload error:", err);
            setResult({ success: false, message: "An unexpected error occurred during upload." });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <main className={styles.main}>
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: "800px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Bulk Import Participants</h1>
                    <button className="glass-button" onClick={() => router.push('/admin')} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Back to Admin
                    </button>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Upload an Excel (.xlsx) or CSV file containing participant records. This tool can be used to quickly register multiple members and automatically group them into households based on Parent Email.
                </p>

                <div style={{ marginBottom: '2rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#60a5fa' }}>Instructions</h3>
                    <ol style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--color-text)' }}>
                        <li style={{ marginBottom: '0.5rem' }}>Download the import template provided below.</li>
                        <li style={{ marginBottom: '0.5rem' }}>Fill in the participant data. <strong>First Name</strong> and <strong>Last Name</strong> are required.</li>
                        <li style={{ marginBottom: '0.5rem' }}>For adult members, provide their <strong>Email</strong>. If they are an existing participant, their record will be updated.</li>
                        <li style={{ marginBottom: '0.5rem' }}>For minors (or spouses/dependents sharing a household), leave their <strong>Email</strong> blank and provide the primary member's email in the <strong>Parent Email</strong> column.</li>
                        <li>Save the file and upload it here.</li>
                    </ol>
                    <div style={{ marginTop: '1.5rem' }}>
                        <a
                            href="/Participant_Import_Template.xlsx"
                            download
                            className="glass-button"
                            style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.2)', textDecoration: 'none' }}
                        >
                            <span style={{ marginRight: '0.5rem' }}>⬇️</span> Download Template (.xlsx)
                        </a>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Upload File</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            style={{
                                padding: '1rem',
                                border: '2px dashed rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                background: 'rgba(0,0,0,0.2)',
                                cursor: 'pointer'
                            }}
                        />

                        <button
                            className="glass-button primary"
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            style={{
                                opacity: (!file || isUploading) ? 0.5 : 1,
                                justifyContent: 'center',
                                padding: '1rem'
                            }}
                        >
                            {isUploading ? "Uploading & Processing..." : "Upload & Import"}
                        </button>
                    </div>
                </div>

                {result && (
                    <div style={{
                        padding: '1.5rem',
                        borderRadius: '12px',
                        background: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${result.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                        <h3 style={{ marginTop: 0, color: result.success ? '#4ade80' : '#f87171' }}>
                            {result.success ? "✅ Import Successful" : "❌ Import Failed"}
                        </h3>
                        <p style={{ marginBottom: result.errors?.length ? '1rem' : 0 }}>{result.message}</p>

                        {result.errors && result.errors.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#fca5a5' }}>Warnings / Partial Errors:</h4>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem' }}>
                                    {result.errors.map((err, i) => (
                                        <li key={i} style={{ marginBottom: '0.25rem' }}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
