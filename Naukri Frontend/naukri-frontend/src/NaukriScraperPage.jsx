import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Key,
    Settings,
    Zap,
    Briefcase,
    ChevronDown,
    Loader2,
    Clock,
    RefreshCw,
    Layers,
    Send,
    MapPin,
    FileText,
    Hash,
    Terminal,
    Eye,
    EyeOff
} from 'lucide-react';
import { API_URL, WS_URL } from './config';

// --- Configuration and Initialization ---
const BACKEND_URL = API_URL;

const initialFormData = {
    // Section 0: Credentials
    username: 'user@example.com',
    password: 'securePassword123',
    continueSession: false,

    // Section 1: Required
    location: 'Pune',
    experience: 3,
    roles: 'Data Analyst, BI Developer, ETL Specialist',
    postalCode: '412207',
    totalExpYears: '3',

    // Section 2: Tech Filter
    techKeywords: 'SQL, Python, Power BI, AWS',
    applyTechFilter: true,
    applyMinScore: true,
    minScore: 75,

    // Section 3: Experience
    userExperience: 'Python 3Y, SQL 4Y, AWS 1Y',
    includeUserExperience: true,

    // Section 4: Common Answers
    includeCommonAnswers: true,
    noticePeriod: '1 Month',
    currentCtc: 8,
    expectedCtc: 12,
    linkedinUrl: 'https://linkedin.com/in/cyber-analyst-profile',
    faceToFace: 'Flexible',
};

// --- Reusable Components ---

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-start gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shadow-sm">
            {Icon && <Icon className="w-6 h-6" />}
        </div>
        <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
    </div>
);

const InputField = ({ label, id, type = "text", icon: Icon, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="group">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5 transition-colors group-focus-within:text-blue-600">
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    id={id}
                    type={inputType}
                    className={`block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-all duration-200 sm:text-sm py-3 ${Icon ? 'pl-10' : 'pl-4'} ${isPassword ? 'pr-10' : ''}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

const TextAreaField = ({ label, id, ...props }) => (
    <div className="group">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5 transition-colors group-focus-within:text-blue-600">
            {label}
        </label>
        <textarea
            id={id}
            className="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-all duration-200 sm:text-sm py-3 px-4 resize-none"
            {...props}
        />
    </div>
);

const ToggleSwitch = ({ id, label, checked, onChange, name }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}>
        <span className="text-sm font-medium text-gray-700 select-none">{label}</span>
        <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </div>
    </div>
);

const ActionButton = ({ onClick, disabled, loading, icon: Icon, label, colorClass }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative overflow-hidden group w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${colorClass}`}
    >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <div className="relative flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
            <span>{loading ? 'Processing...' : label}</span>
        </div>
    </button>
);

// --- Main Component ---
const NaukriScraperPage = () => {
    // Track whether localStorage had saved data (used to decide if server restore is needed)
    const hadLocalData = (() => {
        try { return !!localStorage.getItem('naukriFormData'); } catch { return false; }
    })();

    // Initialize state from localStorage or default with robust merge
    const [formData, setFormData] = useState(() => {
        try {
            const savedData = localStorage.getItem('naukriFormData');
            return savedData ? { ...initialFormData, ...JSON.parse(savedData) } : initialFormData;
        } catch (e) {
            console.error("Failed to load form data", e);
            return initialFormData;
        }
    });

    const [profileRestored, setProfileRestored] = useState(false);

    const [jobStats, setJobStats] = useState({ scraped: 0, applied: 0 });

    // Initialize logs from localStorage to persist across tab switches
    const [log, setLog] = useState(() => {
        try {
            const savedLogs = localStorage.getItem('naukriLogs');
            return savedLogs ? JSON.parse(savedLogs) : [];
        } catch (e) {
            return [];
        }
    });

    const [loading, setLoading] = useState(false);
    const [apiMessage, setApiMessage] = useState({ type: '', text: '' });
    const wsRef = useRef(null);
    
    // Auto Apply & Pause States
    const [autoApplyCountdown, setAutoApplyCountdown] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const countdownRef = useRef(null);
    const pendingAutoApplyRef = useRef(false); // Ref for WS closure

    // Save to localStorage whenever formData changes
    useEffect(() => {
        localStorage.setItem('naukriFormData', JSON.stringify(formData));
    }, [formData]);

    // On mount: if no local data (new device / incognito), restore from server profile
    useEffect(() => {
        if (hadLocalData) return; // Already have local data — skip server restore

        const token = localStorage.getItem('token');
        if (!token) return;

        const restoreFromServer = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.data?.has_data) return;

                const sc = res.data.scrape_config || {};
                const rd = res.data.resume_data || {};

                setFormData(prev => ({
                    ...prev,
                    // Credentials
                    username: prev.username === initialFormData.username ? (res.data.username || prev.username) : prev.username,
                    password: res.data.naukri_password || prev.password,
                    // Search params
                    location:               sc.location        || prev.location,
                    experience:             sc.experience       ?? prev.experience,
                    roles:                  Array.isArray(sc.roles) ? sc.roles.join(', ') : (sc.roles || prev.roles),
                    techKeywords:           Array.isArray(sc.tech_keywords) ? sc.tech_keywords.join(', ') : (sc.tech_keywords || prev.techKeywords),
                    applyTechFilter:        sc.apply_tech_filter ?? prev.applyTechFilter,
                    minScore:               sc.min_score        ?? prev.minScore,
                    userExperience:         sc.user_exp_raw     || prev.userExperience,
                    // Resume / common answers
                    postalCode:             rd.POSTAL_CODE      || prev.postalCode,
                    totalExpYears:          rd.TOTAL_EXP_YEARS  || prev.totalExpYears,
                    linkedinUrl:            rd.LINKEDIN         || prev.linkedinUrl,
                    noticePeriod:           rd.NOTICE_PERIOD    || prev.noticePeriod,
                    currentCtc:             rd.CURRENT_CTC  ? parseFloat(rd.CURRENT_CTC) / 100000  : prev.currentCtc,
                    expectedCtc:            rd.EXPECTED_CTC ? parseFloat(rd.EXPECTED_CTC) / 100000 : prev.expectedCtc,
                }));
                setProfileRestored(true);
            } catch (err) {
                console.error('Could not restore profile from server:', err);
            }
        };

        restoreFromServer();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const togglePause = async () => {
        if (!formData.username) return;
        const endpoint = isPaused ? `/resume_task/${formData.username}` : `/pause_task/${formData.username}`;
        try {
            await axios.post(BACKEND_URL + endpoint, {}, { headers: getAuthHeaders() });
            setIsPaused(!isPaused);
            logMessage(`Task ${isPaused ? 'Resumed' : 'Paused'} by user.`);
        } catch (error) {
            logMessage(`[ERROR] Failed to toggle pause state.`, true);
        }
    };

    const stopTask = async () => {
        if (!formData.username) return;
        try {
            await axios.post(`${BACKEND_URL}/stop_task/${formData.username}`, {}, { headers: getAuthHeaders() });
            setLoading(false);
            setIsPaused(false);
            setAutoApplyCountdown(null);
            pendingAutoApplyRef.current = false;
            logMessage(`[SYSTEM] Task forcibly stopped by user.`);
            setApiMessage({ type: 'error', text: 'Process stopped.' });
        } catch (error) {
            logMessage(`[ERROR] Failed to stop task.`, true);
        }
    };

    // Countdown Effect
    useEffect(() => {
        if (autoApplyCountdown === null) return;
        
        if (autoApplyCountdown > 0) {
            countdownRef.current = setTimeout(() => {
                setAutoApplyCountdown(prev => prev - 1);
            }, 1000);
        } else if (autoApplyCountdown === 0) {
            setAutoApplyCountdown(null);
            pendingAutoApplyRef.current = false;
            handleJobTrigger('/start_apply', 'Apply Only Job (Auto)');
        }
        
        return () => clearTimeout(countdownRef.current);
    }, [autoApplyCountdown]);

    // Save logs to localStorage whenever they change (limit to 100)
    useEffect(() => {
        localStorage.setItem('naukriLogs', JSON.stringify(log.slice(0, 100)));
    }, [log]);

    const fetchStats = async () => {
        // Use website login email (from JWT), NOT Naukri email
        const siteEmail = localStorage.getItem('email');
        const token = localStorage.getItem('token');
        if (!siteEmail || !token) return;
        try {
            const response = await axios.get(`${BACKEND_URL}/dashboard_stats/${siteEmail}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.stats?.overview) {
                setJobStats({
                    scraped: response.data.stats.overview.total_scraped || 0,
                    applied: response.data.stats.overview.total_applied || 0
                });
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const checkTaskStatus = async () => {
        const siteEmail = localStorage.getItem('email');
        const token = localStorage.getItem('token');
        if (!siteEmail || !token) return;
        try {
            const response = await axios.get(`${BACKEND_URL}/task_status/${siteEmail}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.is_running) {
                if (loading === false) {
                    setLoading(response.data.status);
                }
                setIsPaused(response.data.is_paused);
                setLog(prev => {
                    if (prev.length > 0 && typeof prev[0] === 'string' && prev[0].includes("Resuming")) return prev;
                    if (prev.length > 0 && typeof prev[0] === 'string' && prev[0].includes(response.data.status)) return prev;
                    return prev;
                });
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Failed to check task status:", error);
        }
    };

    // Polling Effect: Check status every 3 seconds if loading
    useEffect(() => {
        let intervalId;
        if (loading) {
            intervalId = setInterval(() => {
                checkTaskStatus();
                // Also refresh stats periodically while running
                fetchStats();
            }, 3000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [loading, formData.username]);

    // WebSocket Connection
    useEffect(() => {
        if (!formData.username) return;

        // Use WS_URL from config
        const wsUrl = `${WS_URL}/ws/logs/${encodeURIComponent(formData.username)}`;

        console.log("Connecting to WebSocket:", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket Connected");
            // Check status on connect
            checkTaskStatus();
            fetchStats();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const timestamp = new Date().toLocaleTimeString();

                // Handle structured log
                if (data.type === 'log' || data.message) {
                    const entry = data.message || JSON.stringify(data);
                    setLog(prev => [`[${timestamp}] ${entry}`, ...prev].slice(0, 100));
                }

                // Handle completion events
                if (data.action === 'scrape_complete' || data.action === 'apply_complete') {
                    setLoading(false);
                    setApiMessage({ type: 'success', text: data.message });
                    fetchStats();

                    if (data.action === 'scrape_complete') {
                        if (pendingAutoApplyRef.current) {
                            setLog(prev => [`[${timestamp}] [SUCCESS] Scraping Done. Auto-applying in 30 seconds...`, ...prev].slice(0, 100));
                            setAutoApplyCountdown(30);
                        } else {
                            setLoading(false);
                            setLog(prev => [`[${timestamp}] [SUCCESS] Scraping Done. You can now start the Application process.`, ...prev].slice(0, 100));
                        }
                    } else if (data.action === 'apply_complete') {
                        setLoading(false);
                        pendingAutoApplyRef.current = false;
                        setLog(prev => [`[${timestamp}] [SUCCESS] Application process finished.`, ...prev].slice(0, 100));
                    }
                }

            } catch (e) {
                // Handle plain text log
                const timestamp = new Date().toLocaleTimeString();
                setLog(prev => [`[${timestamp}] ${event.data}`, ...prev].slice(0, 100));
            }
        };

        ws.onclose = () => console.log("WebSocket Disconnected");
        ws.onerror = (error) => console.error("WebSocket Error:", error);

        return () => {
            if (ws.readyState === 1) ws.close();
        };
    }, [formData.username]);

    const logMessage = (msg, isError = false) => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = isError ? `[ERROR] ${msg}` : msg;
        setLog(prev => [`[${timestamp}] ${entry}`, ...prev].slice(0, 100));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                (name === 'currentCtc' || name === 'expectedCtc' || name === 'experience' || name === 'minScore')
                    ? (value === '' ? '' : parseFloat(value))
                    : value,
        }));
    };

    const buildPayload = () => ({
        username: formData.username,
        password: formData.password,
        continue_session: formData.continueSession,

        location: formData.location,
        experience: parseInt(formData.experience) || 0,
        roles: formData.roles.split(/,|\n/).map(r => r.trim()).filter(r => r.length > 0),
        postal_code: formData.postalCode || initialFormData.postalCode,
        total_exp_years: formData.totalExpYears || initialFormData.totalExpYears.toString(),
        tech_keywords: formData.techKeywords.split(',').map(t => t.trim()).filter(t => t.length > 0),

        apply_tech_filter: formData.applyTechFilter,
        apply_min_score: formData.applyMinScore,
        min_score: parseFloat(formData.minScore) || 0,

        user_exp_raw: formData.userExperience,
        include_user_experience: formData.includeUserExperience,
        include_common_answers: formData.includeCommonAnswers,
        common_answers: {
            notice_period: formData.noticePeriod,
            current_ctc: (formData.currentCtc * 100000).toString(),
            expected_ctc: (formData.expectedCtc * 100000).toString(),
            linkedin: formData.linkedinUrl,
            face_to_face: formData.faceToFace
        },
    });

    const handleJobTrigger = async (endpoint, buttonLabel) => {
        if (loading) {
            const confirmStop = window.confirm(`A task (${loading}) is currently running. Do you want to stop it and start "${buttonLabel}" instead?`);
            if (!confirmStop) return;
            
            // Stop current task
            await stopTask();
            // Give backend a moment to clean up resources
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        if (endpoint === '/run_full_automation') {
            pendingAutoApplyRef.current = true;
            endpoint = '/start_scrape';
        } else if (endpoint === '/start_apply') {
            setAutoApplyCountdown(null);
            pendingAutoApplyRef.current = false;
        } else {
            pendingAutoApplyRef.current = false;
        }

        if (!formData.username || !formData.password) {
            setApiMessage({ type: 'error', text: "Naukri credentials are required." });
            return;
        }

        setLoading(buttonLabel);
        setApiMessage({ type: '', text: '' });
        logMessage(`Initiating: ${buttonLabel}...`);

        const payload = buildPayload();

        try {
            const response = await axios.post(BACKEND_URL + endpoint, payload, { headers: getAuthHeaders() });
            if (response.status === 200) {
                const result = response.data;
                setApiMessage({ type: 'success', text: result.status || `${buttonLabel} initiated successfully!` });
                logMessage(`Success! Job Status: ${result.status}`);
                fetchStats(); // Refresh stats after triggering
            }
        } catch (error) {
            let errorMessage = 'Failed to connect to the backend server. Please ensure it is running.';
            if (error.response) {
                errorMessage = `Backend Error (${error.response.status}): ${error.response.data.detail || error.response.data}`;
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            setApiMessage({ type: 'error', text: errorMessage });
            logMessage(`[ERROR] ${errorMessage}`, true);
            setLoading(false); // Reset loading on error
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

                {/* Header */}
                <header className="text-center space-y-3 sm:space-y-4 mb-8 md:mb-12">
                    <div className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-white rounded-2xl shadow-xl shadow-blue-100 mb-2 sm:mb-4">
                        <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                        Job<span className="text-blue-600">Agent</span> Configuration
                    </h1>
                    <p className="text-xs sm:text-base text-gray-500 max-w-2xl mx-auto">
                        Configure your autonomous agent to scrape, filter, and apply to jobs on Naukri.com with precision.
                    </p>
                </header>

                {/* Profile Restored Banner */}
                {profileRestored && (
                    <div className="p-4 rounded-xl flex items-center gap-3 shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <div className="p-2 rounded-full bg-emerald-100">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <span className="font-medium">✅ Your saved profile has been restored from the server. All fields are pre-filled.</span>
                    </div>
                )}

                {/* API Message Alert */}
                {apiMessage.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg animate-fade-in-up ${apiMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <div className={`p-2 rounded-full ${apiMessage.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {apiMessage.type === 'success' ? <Zap className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
                        </div>
                        <span className="font-medium">{apiMessage.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Configuration Forms */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Section 1: Credentials */}
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                            <SectionHeader icon={Key} title="Authentication" subtitle="Secure credentials for Naukri login." />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Email / User ID" id="username" name="username" value={formData.username} onChange={handleChange} required />
                                <InputField label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                            </div>
                            <div className="mt-6">
                                <ToggleSwitch id="continueSession" name="continueSession" checked={formData.continueSession} onChange={handleChange} label="Continue Existing Session (Debug Mode)" />
                            </div>
                        </section>

                        {/* Section 2: Search Parameters */}
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                            <SectionHeader icon={Settings} title="Search Parameters" subtitle="Define what jobs to look for." />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <InputField label="Target Location" id="location" name="location" icon={MapPin} value={formData.location} onChange={handleChange} required />
                                <InputField label="Min Experience (Years)" id="experience" name="experience" type="number" icon={Briefcase} value={formData.experience} onChange={handleChange} required />
                                <InputField label="Total Experience (Years)" id="totalExpYears" name="totalExpYears" icon={Clock} value={formData.totalExpYears} onChange={handleChange} />
                                <InputField label="Postal Code" id="postalCode" name="postalCode" icon={Hash} value={formData.postalCode} onChange={handleChange} />
                            </div>
                            <TextAreaField label="Target Job Roles (Comma Separated)" id="roles" name="roles" rows="3" value={formData.roles} onChange={handleChange} required />
                        </section>

                        {/* Section 3: Tech Filters */}
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                            <SectionHeader icon={Zap} title="Smart Filters" subtitle="AI-powered relevance matching." />
                            <InputField label="Required Tech Keywords" id="techKeywords" name="techKeywords" value={formData.techKeywords} onChange={handleChange} placeholder="e.g. React, Node.js, AWS" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <ToggleSwitch id="applyTechFilter" name="applyTechFilter" checked={formData.applyTechFilter} onChange={handleChange} label="Enforce Tech Keywords" />
                                <ToggleSwitch id="applyMinScore" name="applyMinScore" checked={formData.applyMinScore} onChange={handleChange} label="Enforce Min Match Score" />
                            </div>

                            <div className={`mt-6 transition-all duration-300 ${formData.applyMinScore ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Minimum Match Score: {formData.minScore}%</label>
                                </div>
                                <input
                                    type="range"
                                    id="minScore"
                                    name="minScore"
                                    min="0"
                                    max="100"
                                    value={formData.minScore}
                                    onChange={handleChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </section>

                        {/* Section 4: Experience & Answers */}
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                            <SectionHeader icon={FileText} title="Application Details" subtitle="Auto-fill data for applications." />

                            <div className="mb-6">
                                <TextAreaField label="Detailed Experience Breakdown" id="userExperience" name="userExperience" rows="3" value={formData.userExperience} onChange={handleChange} placeholder="Java 3Y, Python 2Y..." />
                                <div className="mt-4">
                                    <ToggleSwitch id="includeUserExperience" name="includeUserExperience" checked={formData.includeUserExperience} onChange={handleChange} label="Use Custom Experience Data" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Notice Period" id="noticePeriod" name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} />
                                <InputField label="Current CTC (Lakhs)" id="currentCtc" name="currentCtc" type="number" value={formData.currentCtc} onChange={handleChange} />
                                <InputField label="Expected CTC (Lakhs)" id="expectedCtc" name="expectedCtc" type="number" value={formData.expectedCtc} onChange={handleChange} />

                                <div className="group">
                                    <label htmlFor="faceToFace" className="block text-sm font-medium text-gray-700 mb-1.5">F2F Availability</label>
                                    <div className="relative">
                                        <select id="faceToFace" name="faceToFace" value={formData.faceToFace} onChange={handleChange} className="block w-full rounded-xl border-gray-200 bg-gray-50 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-all duration-200 sm:text-sm py-3 pl-4 pr-10 appearance-none">
                                            <option>Yes</option>
                                            <option>No</option>
                                            <option>Preferred</option>
                                            <option>Flexible</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <InputField label="LinkedIn URL" id="linkedinUrl" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} />
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Actions & Logs */}
                    <div className="space-y-8">

                        {/* Action Panel */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-500/10 border border-blue-100 sticky top-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Control Center
                            </h3>

                            {autoApplyCountdown !== null && (
                                <div className="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center animate-pulse shadow-sm">
                                    <p className="text-indigo-800 font-bold text-lg">Auto-Applying in {autoApplyCountdown}s...</p>
                                    <p className="text-xs text-indigo-600 mt-1">Click "Start Application Only" to apply instantly</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <ActionButton
                                    onClick={() => handleJobTrigger('/start_scrape', 'Scrape Only Job')}
                                    
                                    loading={loading === 'Scrape Only Job'}
                                    icon={Layers}
                                    label="Start Scraping Only"
                                    colorClass="bg-gradient-to-r from-blue-600 to-blue-700"
                                />
                                <ActionButton
                                    onClick={() => handleJobTrigger('/start_apply', 'Apply Only Job')}
                                    
                                    loading={loading === 'Apply Only Job'}
                                    icon={Send}
                                    label="Start Application Only"
                                    colorClass="bg-gradient-to-r from-amber-500 to-orange-600"
                                />
                                <ActionButton
                                    onClick={() => handleJobTrigger('/run_full_automation', 'Full Auto Sequence')}
                                    
                                    loading={loading === 'Full Auto Sequence'}
                                    icon={RefreshCw}
                                    label="Run Full Automation"
                                    colorClass="bg-gradient-to-r from-emerald-500 to-teal-600"
                                />
                            </div>

                            {loading && (
                                <div className="mt-4 pt-4 border-t border-blue-50 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={togglePause}
                                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                                            isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'
                                        }`}
                                    >
                                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                                    </button>
                                    <button
                                        onClick={stopTask}
                                        className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition-all duration-300 hover:-translate-y-1"
                                    >
                                        🛑 Stop
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-gray-400" />
                                        Progress Dashboard
                                    </h4>
                                    {loading ? (
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full animate-pulse">Running</span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Idle</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Jobs Scraped</p>
                                        <p className="text-3xl font-black text-blue-600">
                                            {jobStats.scraped}
                                        </p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Jobs Applied</p>
                                        <p className="text-3xl font-black text-amber-600">
                                            {jobStats.applied}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-900 rounded-xl p-4 h-[200px] overflow-y-auto font-mono text-xs shadow-inner custom-scrollbar">
                                    {log.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                                            <Loader2 className="w-6 h-6 animate-spin opacity-20" />
                                            <p>Waiting for tasks...</p>
                                        </div>
                                    ) : (
                                        log.map((msg, index) => (
                                            <div key={index} className={`mb-2 break-words ${typeof msg === 'string' && msg.includes('[ERROR]') ? 'text-red-400 border-l-2 border-red-500 pl-2' :
                                                typeof msg === 'string' && msg.includes('Initiating') ? 'text-blue-400' :
                                                    typeof msg === 'string' && msg.includes('Success') ? 'text-green-400' :
                                                        'text-gray-300'
                                                }`}>
                                                {typeof msg === 'object' ? (msg.message || JSON.stringify(msg)) : msg}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NaukriScraperPage;