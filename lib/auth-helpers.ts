
/**
 * Helper to get the base URL for redirects.
 * Prioritizes the production URL if estamos en vpc,
 * otherwise falls back to window.location.origin.
 */
export const getURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your production URL in Vercel
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
        "http://localhost:3000"; // Fallback to localhost

    // Make sure to include `https://` when not localhost.
    url = url.includes("http") ? url : `https://${url}`;
    // Make sure to include a trailing slash.
    url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;

    // In local development, window.location.origin is usually best.
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return window.location.origin + '/';
    }

    return url;
};

export const getRedirectUrl = (path: string = 'auth/callback') => {
    const base = getURL();
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
};
