/**
 * Utility to consistently normalize repository identifiers (URLs or names) into a slug
 * suitable for file naming or internal keys.
 */
export function getRepoSlug(id: string): string {
    if (!id) return 'unknown';

    const decoded = decodeURIComponent(id);

    // 1. Handle full GitHub URLs
    if (decoded.includes('github.com/')) {
        const parts = decoded.split('github.com/');
        if (parts.length >= 2) {
            const path = parts[1].split('/').filter(p => p);
            if (path.length >= 2) {
                // Return "owner-repo"
                return `${path[0]}-${path[1]}`.replace(/[\/\\?%*:|"<>]/g, '-');
            }
        }
    }

    // 2. Handle "owner/repo" format
    if (decoded.includes('/') && !decoded.includes(':') && !decoded.includes('\\')) {
        return decoded.replace(/\//g, '-').replace(/[\/\\?%*:|"<>]/g, '-');
    }

    // 3. Handle local paths or other identifiers
    // Replace illegal characters with dashes
    return decoded
        .replace(/[\\/]/g, '-') // Replace slashes and backslashes
        .replace(/[:?%*|"<>]/g, '-') // Replace other illegal chars
        .replace(/-+/g, '-') // De-duplicate dashes
        .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
}
