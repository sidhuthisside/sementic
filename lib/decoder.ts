/**
 * Robust Base64 to UTF-8 decoder that works on both client (browser) and server (Node.js).
 */
export function base64ToUtf8(base64: string): string {
    if (!base64) return "";

    try {
        if (typeof window !== 'undefined' && typeof window.atob === 'function') {
            // Browser environment
            const binaryString = window.atob(base64.replace(/\n/g, ''));
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new TextDecoder().decode(bytes);
        } else if (typeof Buffer !== 'undefined') {
            // Node.js environment
            return Buffer.from(base64, 'base64').toString('utf-8');
        } else {
            // Fallback for edge cases
            throw new Error("No base64 decoder available");
        }
    } catch (e) {
        console.error("Base64 decoding failed:", e);
        return base64; // Return raw if decoding fails
    }
}
