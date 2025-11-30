const isProd = import.meta.env.PROD;

export const API_URL = isProd
    ? "https://job-application-automation-sg17.onrender.com"
    : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000");

export const WS_URL = (() => {
    const protocol = API_URL.startsWith('https') ? 'wss' : 'ws';
    const host = API_URL.replace(/^https?:\/\//, '');
    return `${protocol}://${host}`;
})();
