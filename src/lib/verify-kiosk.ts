import crypto from "crypto";

/**
 * Verify an Ed25519 signature from the kiosk client.
 *
 * The kiosk signs: `${timestamp}:${method}:${path}:${body}`
 * Headers: X-Kiosk-Timestamp, X-Kiosk-Signature (hex-encoded)
 *
 * Rejects if:
 *  - Missing headers
 *  - Timestamp older than MAX_AGE_SECONDS
 *  - Invalid signature
 *
 * Requires KIOSK_PUBLIC_KEY env var (hex-encoded 32-byte Ed25519 public key).
 */

const MAX_AGE_SECONDS = 60;

export function getKioskPublicKey(): Buffer | null {
    const hex = process.env.KIOSK_PUBLIC_KEY;
    if (!hex) return null;
    return Buffer.from(hex, "hex");
}

export type VerifyResult =
    | { ok: true }
    | { ok: false; status: number; error: string };

export function verifyKioskSignature(
    method: string,
    path: string,
    body: string,
    timestampHeader: string | null,
    signatureHeader: string | null,
    publicKey: Buffer
): VerifyResult {
    if (!timestampHeader || !signatureHeader) {
        return { ok: false, status: 401, error: "Missing kiosk signature headers" };
    }

    // Check timestamp freshness
    const ts = parseInt(timestampHeader, 10);
    if (isNaN(ts)) {
        return { ok: false, status: 401, error: "Invalid timestamp" };
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > MAX_AGE_SECONDS) {
        return { ok: false, status: 401, error: "Timestamp too old or too far in the future" };
    }

    // Reconstruct signed message
    const message = Buffer.from(`${timestampHeader}:${method}:${path}:${body}`);

    // Decode signature from hex
    let sigBytes: Buffer;
    try {
        sigBytes = Buffer.from(signatureHeader, "hex");
    } catch {
        return { ok: false, status: 401, error: "Malformed signature" };
    }

    // Verify Ed25519
    try {
        const ok = crypto.verify(
            null, // Ed25519 doesn't use a separate hash algorithm
            message,
            {
                key: crypto.createPublicKey({
                    key: Buffer.concat([
                        // Ed25519 DER prefix for a 32-byte public key
                        Buffer.from("302a300506032b6570032100", "hex"),
                        publicKey,
                    ]),
                    format: "der",
                    type: "spki",
                }),
            },
            sigBytes
        );
        if (!ok) {
            return { ok: false, status: 401, error: "Invalid signature" };
        }
    } catch (e) {
        console.error("Signature verification error:", e);
        return { ok: false, status: 401, error: "Signature verification failed" };
    }

    return { ok: true };
}
