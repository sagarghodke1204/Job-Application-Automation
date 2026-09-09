import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    ExternalLink, UserCheck, Search, RefreshCw, User, Building2, Sparkles, 
    CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Eye, Check
} from 'lucide-react';
import { API_URL } from './config';

const ExternalWalkinPage = () => {
    const [externalJobs, setExternalJobs] = useState([]);
    const [walkinJobs, setWalkinJobs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Search & Tab filters
    const [externalSearch, setExternalSearch] = useState('');
    const [walkinSearch, setWalkinSearch] = useState('');
    const [externalTab, setExternalTab] = useState('PENDING'); // PENDING, APPLIED, ALL

    // Applied External Job IDs (Stored in localStorage)
    const [appliedExternalIds, setAppliedExternalIds] = useState(() => {
        try {
            const saved = localStorage.getItem('applied_external_job_ids');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [username, setUsername] = useState('Guest');
    const [email, setEmail] = useState(null);

    // Responsive Viewport Detection (Mobile < 768px -> 5 items, Laptop/PC >= 768px -> 10 items)
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const initialLimit = isMobile ? 5 : 10;
    const stepCount = isMobile ? 5 : 10;

    const [externalVisibleCount, setExternalVisibleCount] = useState(initialLimit);
    const [walkinVisibleCount, setWalkinVisibleCount] = useState(initialLimit);

    useEffect(() => {
        const appUsername = localStorage.getItem('username');
        const appEmail = localStorage.getItem('email');

        if (appUsername) setUsername(appUsername);
        if (appEmail) setEmail(appEmail);
    }, []);

    // Save applied IDs to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem('applied_external_job_ids', JSON.stringify(appliedExternalIds));
        } catch (e) {
            console.error("Failed to save applied IDs:", e);
        }
    }, [appliedExternalIds]);

    // Reset pagination when search or tab changes
    useEffect(() => {
        setExternalVisibleCount(isMobile ? 5 : 10);
    }, [externalSearch, externalTab, isMobile]);

    useEffect(() => {
        setWalkinVisibleCount(isMobile ? 5 : 10);
    }, [walkinSearch, isMobile]);

    const fetchJobs = async () => {
        if (!email) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            const [extRes, walkRes] = await Promise.all([
                axios.get(`${API_URL}/external_jobs/${email}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/walkin_jobs/${email}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (extRes.data && extRes.data.jobs) {
                setExternalJobs(extRes.data.jobs);
            }
            if (walkRes.data && walkRes.data.jobs) {
                setWalkinJobs(walkRes.data.jobs);
            }
        } catch (error) {
            console.error("Failed to fetch external or walk-in jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [email]);

    // --- Helper: Calculate Job Age in Days & Expiration ---
    const getJobAgeDays = (job) => {
        const dateStr = job.created_at || job.Scraped_Date || job.date || job.scraped_at;
        if (dateStr) {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
                const diffMs = Date.now() - parsedDate.getTime();
                return Math.floor(diffMs / (1000 * 60 * 60 * 24));
            }
        }
        const posted = (job.Posted || '').toLowerCase();
        const matchDays = posted.match(/(\d+)\+?\s*day/);
        if (matchDays && matchDays[1]) {
            return parseInt(matchDays[1], 10);
        }
        if (posted.includes('month') || posted.includes('30+')) {
            return 30;
        }
        return 0; // Default fresh
    };

    // Expiration checks: 10 days for Walk-in, 15 days for External links
    const isWalkinExpired = (job) => getJobAgeDays(job) > 10;
    const isExternalExpired = (job) => getJobAgeDays(job) > 15;

    // Toggle "Mark as Applied" for External Job Links
    const toggleMarkApplied = (jobId) => {
        setAppliedExternalIds(prev => {
            if (prev.includes(jobId)) {
                return prev.filter(id => id !== jobId);
            } else {
                return [...prev, jobId];
            }
        });
    };

    const formatDate = (job) => {
        if (job.timestamp) {
            try {
                const d = new Date(job.timestamp);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                }
            } catch (e) {}
        }
        return job.Posted || 'N/A';
    };

    // Sort Latest at Top, Oldest at Bottom
    const sortedExternalJobs = [...externalJobs].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
    });

    const sortedWalkinJobs = [...walkinJobs].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
    });

    // --- Filtered External Jobs (Max 15 days, Tab, Search) ---
    const activeExternalJobs = sortedExternalJobs.filter(job => !isExternalExpired(job));

    const filteredExternalJobs = activeExternalJobs.filter(job => {
        const jobId = job.id || job.Apply_Link;
        const isApplied = appliedExternalIds.includes(jobId) || job.user_applied || job.applied_status === 'APPLIED';

        if (externalTab === 'PENDING' && isApplied) return false;
        if (externalTab === 'APPLIED' && !isApplied) return false;

        if (!externalSearch.trim()) return true;
        const q = externalSearch.toLowerCase();
        return (job.Title || '').toLowerCase().includes(q) || (job.Company || '').toLowerCase().includes(q);
    });

    const visibleExternalJobs = filteredExternalJobs.slice(0, externalVisibleCount);

    // --- Filtered Walk-in Jobs (Max 10 days, Search) ---
    const activeWalkinJobs = sortedWalkinJobs.filter(job => !isWalkinExpired(job));

    const filteredWalkinJobs = activeWalkinJobs.filter(job => {
        if (!walkinSearch.trim()) return true;
        const q = walkinSearch.toLowerCase();
        return (job.Title || '').toLowerCase().includes(q) || (job.Company || '').toLowerCase().includes(q);
    });

    const visibleWalkinJobs = filteredWalkinJobs.slice(0, walkinVisibleCount);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                            <ExternalLink className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
                            External & Walk-ins
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Direct links for official hiring portals (15-day active window) and walk-in drives (10-day active window).
                        </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="hidden sm:flex items-center gap-2.5 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-xs border border-gray-200">
                            <div className="p-1.5 bg-amber-50 rounded-full text-amber-600">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Logged in as</span>
                                <span className="text-xs font-bold text-gray-700 leading-tight">{username}</span>
                            </div>
                        </div>

                        <button
                            onClick={fetchJobs}
                            disabled={loading}
                            className="p-2 sm:p-2.5 text-gray-500 hover:text-amber-600 bg-white hover:bg-amber-50 rounded-xl border border-gray-200 shadow-xs transition-colors disabled:opacity-50"
                            title="Refresh links"
                        >
                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 flex-shrink-0">
                            <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Active Company Links (&lt; 15 days)</p>
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5">{activeExternalJobs.length}</h3>
                            <p className="text-[11px] text-amber-600 font-medium">
                                {activeExternalJobs.filter(j => !appliedExternalIds.includes(j.id || j.Apply_Link)).length} Pending Action
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 flex-shrink-0">
                            <UserCheck className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Active Walk-in Drives (&lt; 10 days)</p>
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5">{activeWalkinJobs.length}</h3>
                            <p className="text-[11px] text-emerald-600 font-medium">Direct venue attendance</p>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* External Applications Section */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-amber-500" />
                                External Company Applications
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Position links directing to official hiring portals (Auto-expires after 15 days).
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-100">
                                Showing {Math.min(externalVisibleCount, filteredExternalJobs.length)} of {filteredExternalJobs.length}
                            </span>
                        </div>
                    </div>

                    {/* Tabs & Search */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                            {[
                                { id: 'PENDING', label: 'Pending Action', count: activeExternalJobs.filter(j => !appliedExternalIds.includes(j.id || j.Apply_Link)).length },
                                { id: 'APPLIED', label: 'Marked Applied', count: activeExternalJobs.filter(j => appliedExternalIds.includes(j.id || j.Apply_Link)).length },
                                { id: 'ALL', label: 'All Active Links', count: activeExternalJobs.length }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setExternalTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        externalTab === tab.id
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                        externalTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-[240px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search title, company..."
                                value={externalSearch}
                                onChange={(e) => setExternalSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {loading && externalJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                            <p className="text-sm font-medium">Loading external links...</p>
                        </div>
                    ) : filteredExternalJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                            <Building2 className="w-8 h-8 opacity-20 text-gray-400" />
                            <p className="text-sm font-medium text-gray-500">No external applications matching current filter.</p>
                        </div>
                    ) : (
                        <div>
                            {/* --- MOBILE CARDS (< md) --- */}
                            <div className="block md:hidden space-y-3">
                                {visibleExternalJobs.map((job) => {
                                    const jobId = job.id || job.Apply_Link;
                                    const isApplied = appliedExternalIds.includes(jobId);
                                    return (
                                        <div key={jobId} className="bg-gray-50/70 border border-gray-200/70 rounded-xl p-4 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-bold text-sm text-gray-900 leading-snug">{job.Title || 'Job Title'}</h3>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{job.Company || 'N/A'}</p>
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                            <Clock className="w-3 h-3 text-amber-500" />
                                                            {formatDate(job)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isApplied && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <Check className="w-3 h-3" />
                                                        Applied
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200/40">
                                                <a 
                                                    href={job.Apply_Link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2 rounded-xl transition-all shadow-2xs active:scale-[0.99]"
                                                >
                                                    Apply on Site
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button
                                                    onClick={() => toggleMarkApplied(jobId)}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                                                        isApplied 
                                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                    title={isApplied ? 'Mark as Unapplied' : 'Mark as Applied'}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    {isApplied ? 'Applied' : 'Mark Applied'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* --- DESKTOP TABLE (>= md) --- */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="py-3 px-4">Job Title</th>
                                            <th className="py-3 px-4">Company</th>
                                            <th className="py-3 px-4">Date / Posted</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {visibleExternalJobs.map((job) => {
                                            const jobId = job.id || job.Apply_Link;
                                            const isApplied = appliedExternalIds.includes(jobId);
                                            return (
                                                <tr key={jobId} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="py-4 px-4 font-bold text-sm text-gray-900 group-hover:text-amber-600 transition-colors">
                                                        {job.Title || 'Job Title'}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-medium text-gray-700">
                                                        {job.Company || 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-4 text-xs font-semibold text-gray-600">
                                                        <span className="inline-flex items-center gap-1 bg-amber-50/70 border border-amber-200/70 text-amber-800 px-2.5 py-1 rounded-lg">
                                                            <Clock className="w-3 h-3 text-amber-500" />
                                                            {formatDate(job)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {isApplied ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <Check className="w-3.5 h-3.5" />
                                                                Marked Applied
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                Pending Action
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => toggleMarkApplied(jobId)}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 border ${
                                                                    isApplied
                                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                                                }`}
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                {isApplied ? 'Applied ✓' : 'Mark Applied'}
                                                            </button>
                                                            <a 
                                                                href={job.Apply_Link} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                                                            >
                                                                Apply on Site
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Responsive Show More / Show All / Show Less Pagination Controls */}
                            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-xs font-semibold text-gray-500 text-center sm:text-left">
                                    Showing <span className="text-amber-600 font-bold">{visibleExternalJobs.length}</span> of <span className="text-gray-800 font-bold">{filteredExternalJobs.length}</span> entries (Default limit: {initialLimit})
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                                    {externalVisibleCount < filteredExternalJobs.length && (
                                        <>
                                            <button
                                                onClick={() => setExternalVisibleCount(prev => prev + stepCount)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all active:scale-[0.98]"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                                Show More (+{Math.min(stepCount, filteredExternalJobs.length - externalVisibleCount)})
                                            </button>
                                            <button
                                                onClick={() => setExternalVisibleCount(filteredExternalJobs.length)}
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Show All ({filteredExternalJobs.length})
                                            </button>
                                        </>
                                    )}

                                    {externalVisibleCount >= filteredExternalJobs.length && filteredExternalJobs.length > initialLimit && (
                                        <button
                                            onClick={() => setExternalVisibleCount(initialLimit)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                            Show Less ({initialLimit})
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* Walk-in Drives Section */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-emerald-500" />
                                Walk-in Interview Drives
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Walk-in opportunities requiring direct venue attendance (Auto-expires after 10 days).
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
                                Showing {Math.min(walkinVisibleCount, filteredWalkinJobs.length)} of {filteredWalkinJobs.length}
                            </span>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="flex justify-end mb-5 pb-4 border-b border-gray-100">
                        <div className="relative w-full sm:w-[260px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search title, company..."
                                value={walkinSearch}
                                onChange={(e) => setWalkinSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {loading && walkinJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                            <p className="text-sm font-medium">Loading walk-in drive details...</p>
                        </div>
                    ) : filteredWalkinJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                            <UserCheck className="w-8 h-8 opacity-20 text-gray-400" />
                            <p className="text-sm font-medium text-gray-500">No active walk-in drives found within 10 days.</p>
                        </div>
                    ) : (
                        <div>
                            {/* --- MOBILE CARDS (< md) --- */}
                            <div className="block md:hidden space-y-3">
                                {visibleWalkinJobs.map((job) => (
                                    <div key={job.id || job.Apply_Link} className="bg-gray-50/70 border border-gray-200/70 rounded-xl p-4 flex flex-col gap-2.5">
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-900 leading-snug">{job.Title || 'Walk-in Job Title'}</h3>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">{job.Company || 'N/A'}</p>
                                            <div className="mt-1">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    <Clock className="w-3 h-3 text-emerald-500" />
                                                    {formatDate(job)}
                                                </span>
                                            </div>
                                        </div>
                                        <a 
                                            href={job.Apply_Link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 rounded-xl transition-all shadow-2xs active:scale-[0.99]"
                                        >
                                            View Drive Details
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                ))}
                            </div>

                            {/* --- DESKTOP TABLE (>= md) --- */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="py-3 px-4">Job Title & Drive</th>
                                            <th className="py-3 px-4">Company</th>
                                            <th className="py-3 px-4">Date / Posted</th>
                                            <th className="py-3 px-4 text-right">Venue & Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {visibleWalkinJobs.map((job) => (
                                            <tr key={job.id || job.Apply_Link} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="py-4 px-4 font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">
                                                    {job.Title || 'Walk-in Job Title'}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-medium text-gray-700">
                                                    {job.Company || 'N/A'}
                                                </td>
                                                <td className="py-4 px-4 text-xs font-semibold text-gray-600">
                                                    <span className="inline-flex items-center gap-1 bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 px-2.5 py-1 rounded-lg">
                                                        <Clock className="w-3 h-3 text-emerald-500" />
                                                        {formatDate(job)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <a 
                                                        href={job.Apply_Link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                                                    >
                                                        View Drive Details
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Responsive Show More / Show All / Show Less Pagination Controls */}
                            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-xs font-semibold text-gray-500 text-center sm:text-left">
                                    Showing <span className="text-emerald-600 font-bold">{visibleWalkinJobs.length}</span> of <span className="text-gray-800 font-bold">{filteredWalkinJobs.length}</span> entries (Default limit: {initialLimit})
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                                    {walkinVisibleCount < filteredWalkinJobs.length && (
                                        <>
                                            <button
                                                onClick={() => setWalkinVisibleCount(prev => prev + stepCount)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98]"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                                Show More (+{Math.min(stepCount, filteredWalkinJobs.length - walkinVisibleCount)})
                                            </button>
                                            <button
                                                onClick={() => setWalkinVisibleCount(filteredWalkinJobs.length)}
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Show All ({filteredWalkinJobs.length})
                                            </button>
                                        </>
                                    )}

                                    {walkinVisibleCount >= filteredWalkinJobs.length && filteredWalkinJobs.length > initialLimit && (
                                        <button
                                            onClick={() => setWalkinVisibleCount(initialLimit)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                            Show Less ({initialLimit})
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ExternalWalkinPage;
