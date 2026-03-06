"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../page.module.css";

type RowStatus = "ready" | "update" | "warning" | "error";

interface RowPreview {
    rowNumber: number;
    data: {
        firstName: string;
        lastName: string;
        email: string;
        parentEmail: string;
        dob: string;
        address: string;
        sameHouseholdAs: string;
    };
    status: RowStatus;
    action: string;
    warnings: string[];
    existingParticipant?: { id: number; name: string | null };
}

interface PreviewResult {
    columns: string[];
    rows: RowPreview[];
    summary: { ready: number; update: number; warning: number; error: number };
}

type ImportResult = { success?: boolean; message?: string; errors?: string[] };

const STATUS_CONFIG: Record<RowStatus, { label: string; icon: string; color: string; bg: string; border: string }> = {
    ready: { label: "New", icon: "✅", color: "#4ade80", bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.25)" },
    update: { label: "Update", icon: "🔄", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.25)" },
    warning: { label: "Warning", icon: "⚠️", color: "#fbbf24", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)" },
    error: { label: "Error", icon: "❌", color: "#f87171", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)" },
};

export default function BulkImportParticipants() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [statusFilter, setStatusFilter] = useState<RowStatus | "all">("all");
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setPreview(null);
            setImportResult(null);
            setPreviewError(null);
        }
    };

    const handlePreview = async () => {
        if (!file) return;

        setIsPreviewing(true);
        setPreview(null);
        setPreviewError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/participants/import/preview", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                setPreview(data);
            } else {
                setPreviewError(data.error || "Failed to parse file.");
            }
        } catch (err) {
            console.error("Preview error:", err);
            setPreviewError("An unexpected error occurred during preview.");
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/participants/import", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                setImportResult({ success: true, message: data.message, errors: data.errors });
                setPreview(null); // Clear preview after successful import
            } else {
                setImportResult({ success: false, message: data.error || "Failed to import." });
            }
        } catch (err) {
            console.error("Import error:", err);
            setImportResult({ success: false, message: "An unexpected error occurred during import." });
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setImportResult(null);
        setPreviewError(null);
        setStatusFilter("all");
        setExpandedRow(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    const filteredRows = preview
        ? statusFilter === "all"
            ? preview.rows
            : preview.rows.filter(r => r.status === statusFilter)
        : [];

    const importableCount = preview
        ? preview.rows.filter(r => r.status !== "error").length
        : 0;

    return (
        <main className={styles.main}>
            <div className={`glass-container animate-float ${styles.heroContainer}`} style={{ maxWidth: "900px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Bulk Import Participants</h1>
                    <button className="glass-button" onClick={() => router.push('/admin')} style={{ padding: '0.5rem 1rem' }}>
                        &larr; Back to Admin
                    </button>
                </div>

                {/* Step 1: Upload */}
                {!preview && !importResult && (
                    <>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            Upload an Excel (.xlsx) or CSV file containing participant records. You&apos;ll get a chance to review everything before anything is imported.
                        </p>

                        <div style={{ marginBottom: '2rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1.5rem', borderRadius: '12px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#60a5fa' }}>Instructions</h3>
                            <ol style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--color-text)' }}>
                                <li style={{ marginBottom: '0.5rem' }}>Download the import template provided below.</li>
                                <li style={{ marginBottom: '0.5rem' }}>Fill in the participant data. <strong>First Name</strong> and <strong>Last Name</strong> are required.</li>
                                <li style={{ marginBottom: '0.5rem' }}>For adult members, provide their <strong>Email</strong>. A household and membership will be created automatically.</li>
                                <li style={{ marginBottom: '0.5rem' }}>For minors or dependents, leave <strong>Email</strong> blank and provide the primary member&apos;s email in <strong>Parent Email</strong>.</li>
                                <li style={{ marginBottom: '0.5rem' }}>Use <strong>Same Household As</strong> to link someone to another participant&apos;s household by name or email (e.g. a spouse).</li>
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
                                    onClick={handlePreview}
                                    disabled={!file || isPreviewing}
                                    style={{
                                        opacity: (!file || isPreviewing) ? 0.5 : 1,
                                        justifyContent: 'center',
                                        padding: '1rem'
                                    }}
                                >
                                    {isPreviewing ? "Analyzing File..." : "🔍 Preview Import"}
                                </button>
                            </div>
                        </div>

                        {previewError && (
                            <div style={{
                                padding: '1.5rem',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                <h3 style={{ marginTop: 0, color: '#f87171' }}>❌ Preview Failed</h3>
                                <p style={{ margin: 0 }}>{previewError}</p>
                            </div>
                        )}
                    </>
                )}

                {/* Step 2: Preview / Staging */}
                {preview && !importResult && (
                    <>
                        {/* Summary bar */}
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                            marginBottom: '1.5rem',
                        }}>
                            {(["all", "ready", "update", "warning", "error"] as const).map(key => {
                                const count = key === "all"
                                    ? preview.rows.length
                                    : preview.summary[key];
                                const isActive = statusFilter === key;
                                const cfg = key === "all"
                                    ? { label: "All", icon: "📋", color: "white", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.25)" }
                                    : STATUS_CONFIG[key];

                                return (
                                    <button
                                        key={key}
                                        onClick={() => setStatusFilter(key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1rem',
                                            borderRadius: '8px',
                                            border: `1px solid ${isActive ? cfg.color : cfg.border}`,
                                            background: isActive ? cfg.bg : 'transparent',
                                            color: cfg.color,
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: isActive ? 600 : 400,
                                            transition: 'all 0.2s ease',
                                            opacity: count === 0 && key !== "all" ? 0.4 : 1,
                                        }}
                                    >
                                        <span>{cfg.icon}</span>
                                        <span>{cfg.label}</span>
                                        <span style={{
                                            background: cfg.bg,
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                        }}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Staging table */}
                        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', width: '40px' }}>Row</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map(row => {
                                        const cfg = STATUS_CONFIG[row.status];
                                        const isExpanded = expandedRow === row.rowNumber;
                                        return (
                                            <tr
                                                key={row.rowNumber}
                                                onClick={() => setExpandedRow(isExpanded ? null : row.rowNumber)}
                                                style={{
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    background: cfg.bg,
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s ease',
                                                }}
                                            >
                                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)' }}>
                                                    {row.rowNumber}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${cfg.border}`,
                                                        fontSize: '0.8rem',
                                                        color: cfg.color,
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {cfg.icon} {cfg.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>
                                                    {row.data.firstName} {row.data.lastName}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)' }}>
                                                    {row.data.email || row.data.parentEmail ? (
                                                        <>
                                                            {row.data.email || <span style={{ fontStyle: 'italic' }}>none</span>}
                                                            {row.data.parentEmail && (
                                                                <div style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                                                    ↳ Parent: {row.data.parentEmail}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span style={{ fontStyle: 'italic' }}>none</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <div>{row.action}</div>
                                                    {isExpanded && row.warnings.length > 0 && (
                                                        <ul style={{
                                                            margin: '0.5rem 0 0 0',
                                                            padding: '0.5rem 0.75rem 0.5rem 1.5rem',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.85rem',
                                                            color: '#fbbf24',
                                                        }}>
                                                            {row.warnings.map((w, i) => (
                                                                <li key={i} style={{ marginBottom: '0.25rem' }}>{w}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {isExpanded && (
                                                        <div style={{
                                                            marginTop: '0.5rem',
                                                            fontSize: '0.8rem',
                                                            color: 'var(--color-text-muted)',
                                                            display: 'flex',
                                                            gap: '1rem',
                                                            flexWrap: 'wrap',
                                                        }}>
                                                            {row.data.dob && <span>DOB: {row.data.dob}</span>}
                                                            {row.data.address && <span>Address: {row.data.address}</span>}
                                                            {row.data.sameHouseholdAs && <span>Same Household As: {row.data.sameHouseholdAs}</span>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {filteredRows.length === 0 && (
                                <div style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--color-text-muted)',
                                    fontStyle: 'italic',
                                }}>
                                    No rows match the selected filter.
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                        }}>
                            <button
                                className="glass-button"
                                onClick={handleReset}
                                style={{ padding: '0.75rem 1.5rem' }}
                            >
                                ← Back to File Selection
                            </button>

                            <button
                                className="glass-button primary"
                                onClick={handleConfirmImport}
                                disabled={isImporting || importableCount === 0}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    opacity: (isImporting || importableCount === 0) ? 0.5 : 1,
                                }}
                            >
                                {isImporting
                                    ? "Importing..."
                                    : `🚀 Import ${importableCount} Participant${importableCount !== 1 ? "s" : ""}`
                                }
                                {preview.summary.error > 0 && !isImporting && (
                                    <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', opacity: 0.7 }}>
                                        ({preview.summary.error} error{preview.summary.error !== 1 ? "s" : ""} skipped)
                                    </span>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Step 3: Import Result */}
                {importResult && (
                    <div>
                        <div style={{
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            background: importResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${importResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                            <h3 style={{ marginTop: 0, color: importResult.success ? '#4ade80' : '#f87171' }}>
                                {importResult.success ? "✅ Import Successful" : "❌ Import Failed"}
                            </h3>
                            <p style={{ marginBottom: importResult.errors?.length ? '1rem' : 0 }}>{importResult.message}</p>

                            {importResult.errors && importResult.errors.length > 0 && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#fca5a5' }}>Warnings / Partial Errors:</h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem' }}>
                                        {importResult.errors.map((err, i) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            className="glass-button"
                            onClick={handleReset}
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            Import Another File
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
