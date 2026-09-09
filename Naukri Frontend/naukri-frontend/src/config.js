const cleanUrl = (rawUrl) => {
    if (!rawUrl) return '';
    try {
        let url = decodeURIComponent(rawUrl).replace(/\s+/g, '').replace(/%20/g, '');
        // Repeatedly strip any leading http://, https://, ws://, wss://, //
        url = url.replace(/^(https?:|wss?:|\/+)+/gi, '');
        // Remove trailing slashes
        url = url.replace(/\/+$/, '');
        return url;
    } catch {
        return rawUrl.trim();
    }
};

export const API_URL = (() => {
    let raw = import.meta.env.VITE_API_URL;
    if (raw) {
        const cleanedHost = cleanUrl(raw);
        if (cleanedHost) {
            const isLocal = cleanedHost.includes('localhost') || cleanedHost.includes('127.0.0.1');
            const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const protocol = (isPageHttps && !isLocal) ? 'https' : (raw.includes('http://') ? 'http' : 'https');
            return `${protocol}://${cleanedHost}`;
        }
    }
    if (import.meta.env.PROD) return "/api"; // Use Nginx proxy in production/docker
    return "http://localhost:8001";
})();

export const WS_URL = (() => {
    let rawWs = import.meta.env.VITE_WS_URL;
    if (rawWs) {
        const cleanedHost = cleanUrl(rawWs);
        if (cleanedHost) {
            const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const protocol = isPageHttps ? 'wss' : 'ws';
            return `${protocol}://${cleanedHost}`;
        }
    }

    // In Docker/Prod, infer WS URL from current window location if serving relative
    if (API_URL === "/api") {
        const protocol = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/api/ws`;
    }

    const host = cleanUrl(API_URL);
    const isHttps = (typeof window !== 'undefined' && window.location.protocol === 'https:') || API_URL.startsWith('https:');
    const protocol = isHttps ? 'wss' : 'ws';
    return `${protocol}://${host}`;
})();
