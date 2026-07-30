const isProd = import.meta.env.PROD;

export const API_URL = (() => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (import.meta.env.PROD) return "/api"; // Use Nginx proxy in production/docker
    return "http://localhost:8001";
})();

export const WS_URL = (() => {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;

    // In Docker/Prod, infer WS URL from current window location if serving relative
    if (API_URL === "/api") {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/api/ws`;
        // Note: You might need to adjust /api/ws path mapping in Nginx if WS is at root
        // or ensure backend mounts WS at /ws and we proxy /api/ws -> backend/ws
    }

    const protocol = API_URL.startsWith('https') ? 'wss' : 'ws';
    const host = API_URL.replace(/^https?:\/\//, '');
    return `${protocol}://${host}`;
})();
