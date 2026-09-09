import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Layers, Search, CheckCircle2, Clock, XCircle, AlertTriangle, 
    Sparkles, RefreshCw, ExternalLink, UserCheck, User, ChevronDown, ChevronUp, Eye, Building2, Briefcase
} from 'lucide-react';
import { API_URL } from './config';

const JobTrackingPage = () => {
    const [scrapedJobs, setScrapedJobs] = useState([]);
    const [loadingScrapedJobs, setLoadingScrapedJobs] = useState(false);
    
    // Filter & Search states
    const [selectedTab, setSelectedTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination / Expand state (Default 20 items)
    const [visibleCount, setVisibleCount] = useState(20);

    const [username, setUsername] = useState('Guest');
    const [email, setEmail] = useState(null);

    useEffect(() => {
        const appUsername = localStorage.getItem('username');
        const appEmail = localStorage.getItem('email');

        if (appUsername) setUsername(appUsername);
        if (appEmail) setEmail(appEmail);
    }, []);

    // Reset visible count to 20 when tab or search filter changes
    useEffect(() => {
        setVisibleCount(20);
    }, [selectedTab, searchTerm]);

    const fetchScrapedJobs = async () => {
        if (!email) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoadingScrapedJobs(true);
        try {
            const response = await axios.get(`${API_URL}/scraped_jobs/${email}?limit=250`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.jobs) {
                setScrapedJobs(response.data.jobs);
            }
        } catch (error) {
            console.error("Failed to fetch scraped jobs:", error);
        } finally {
            setLoadingScrapedJobs(false);
        }
    };

    useEffect(() => {
        fetchScrapedJobs();
    }, [email]);

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

    // Guarantee Latest at Top, Oldest at Bottom
    const sortedJobs = [...scrapedJobs].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
    });

    // Filter scraped jobs based on active tab and search query
    const filteredScrapedJobs = sortedJobs.filter(job => {
        if (selectedTab === 'PENDING') {
            const isPending = job.applied_status === 'PENDING' && (job.kept_by_filter === 'yes' || !job.kept_by_filter);
            if (!isPending) return false;
        } else if (selectedTab === 'APPLIED') {
            if (job.applied_status !== 'APPLIED') return false;
        } else if (selectedTab === 'FILTERED_OUT') {
            if (job.kept_by_filter !== 'no') return false;
        } else if (selectedTab === 'EXTERNAL') {
            if (job.applied_status !== 'EXTERNAL' && job.applied_status !== 'WALK-IN') return false;
        }

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const titleMatch = (job.Title || '').toLowerCase().includes(q);
            const companyMatch = (job.Company || '').toLowerCase().includes(q);
            const roleMatch = (job.Role || '').toLowerCase().includes(q);
            return titleMatch || companyMatch || roleMatch;
        }

        return true;
    });

    const visibleJobs = filteredScrapedJobs.slice(0, visibleCount);

    const getStatusBadge = (job) => {
        if (job.kept_by_filter === 'no') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/60">
                    <XCircle className="w-3.5 h-3.5" />
                    Filtered Out
                </span>
            );
        }
        const status = (job.applied_status || 'PENDING').toUpperCase();
        switch (status) {
            case 'APPLIED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Applied
                    </span>
                );
            case 'EXTERNAL':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Company Site
                    </span>
                );
            case 'WALK-IN':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                        <UserCheck className="w-3.5 h-3.5" />
                        Walk-in Drive
                    </span>
                );
            case 'FAILED':
            case 'ERROR':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {status}
                    </span>
                );
            case 'PENDING':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Clock className="w-3.5 h-3.5 animate-pulse text-blue-600" />
                        Pending Queue
                    </span>
                );
        }
    };

    const getMatchScoreBadge = (score) => {
        if (score === null || score === undefined) return null;
        const num = Math.round(score);
        let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
        if (num >= 75) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
        else if (num >= 50) colorClass = "bg-amber-50 text-amber-700 border-amber-200/60";
        else colorClass = "bg-red-50 text-red-700 border-red-200/60";

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
                <Sparkles className="w-3 h-3 text-amber-500" />
                {num}% Match
            </span>
        );
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    const handleShowAll = () => {
        setVisibleCount(filteredScrapedJobs.length);
    };

    const handleShowLess = () => {
        setVisibleCount(20);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                            <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                            Job Tracking & Live Pipeline
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Real-time tracking of scraped job listings, AI match scores, and direct application status.
                        </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                        {/* User Profile Badge (Hidden on small mobile since it's in top bar) */}
                        <div className="hidden sm:flex items-center gap-2.5 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-xs border border-gray-200">
                            <div className="p-1.5 bg-blue-50 rounded-full text-blue-600">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Logged in as</span>
                                <span className="text-xs font-bold text-gray-700 leading-tight">{username}</span>
                            </div>
                        </div>

                        {/* Total Count Badge */}
                        <div className="bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs border border-gray-200 text-sm font-medium text-gray-600 flex items-center gap-3 sm:flex-col sm:items-end">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Total Scraped</span>
                            <span className="text-blue-600 font-black text-xl sm:text-2xl leading-none">{scrapedJobs.length}</span>
                        </div>
                    </div>
                </div>

                {/* Scraped Jobs Section */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                Live Pipeline
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Discovered positions, match scores, and direct status checks.
                            </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5">
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                                Showing {Math.min(visibleCount, filteredScrapedJobs.length)} of {filteredScrapedJobs.length}
                            </span>
                            <button
                                onClick={fetchScrapedJobs}
                                disabled={loadingScrapedJobs}
                                className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
                                title="Refresh jobs"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingScrapedJobs ? 'animate-spin text-blue-600' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs & Search Bar */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
                        {/* Horizontal Touch Scrollable Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none -mx-1 px-1">
                            {[
                                { id: 'ALL', label: 'All Scraped', count: scrapedJobs.length },
                                { id: 'PENDING', label: 'Pending Queue', count: scrapedJobs.filter(j => j.applied_status === 'PENDING' && (j.kept_by_filter === 'yes' || !j.kept_by_filter)).length },
                                { id: 'APPLIED', label: 'Applied', count: scrapedJobs.filter(j => j.applied_status === 'APPLIED').length },
                                { id: 'FILTERED_OUT', label: 'Filtered Out', count: scrapedJobs.filter(j => j.kept_by_filter === 'no').length },
                                { id: 'EXTERNAL', label: 'Company / Walk-in', count: scrapedJobs.filter(j => j.applied_status === 'EXTERNAL' || j.applied_status === 'WALK-IN').length }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        selectedTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                        selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-[260px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search title, company, role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Loading or Empty State */}
                    {loadingScrapedJobs && scrapedJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Loading scraped jobs pipeline...</p>
                        </div>
                    ) : filteredScrapedJobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                            <Layers className="w-10 h-10 opacity-20 text-gray-400" />
                            <p className="text-sm font-medium text-gray-500">No jobs found matching the selected filter.</p>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-xs text-blue-600 font-semibold hover:underline">
                                    Clear Search Query
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* --- MOBILE CARDS VIEW (Visible < md) --- */}
                            <div className="block md:hidden space-y-3.5">
                                {visibleJobs.map((job) => (
                                    <div 
                                        key={job.id || job.Apply_Link} 
                                        className="bg-gray-50/60 border border-gray-200/70 rounded-xl p-4 flex flex-col gap-3 shadow-2xs hover:border-blue-300 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sm text-gray-900 leading-snug">
                                                    {job.Title || 'Job Role'}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium mt-1">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{job.Company || 'N/A'}</span>
                                                </div>
                                            </div>
                                            {getMatchScoreBadge(job.tech_match_score)}
                                        </div>

                                        <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-gray-200/40">
                                            <div className="flex items-center gap-2">
                                                {job.Role && (
                                                    <span className="text-[10px] font-semibold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                        {job.Role}
                                                    </span>
                                                )}
                                                {job.Posted && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {job.Posted}
                                                    </span>
                                                )}
                                            </div>
                                            {getStatusBadge(job)}
                                        </div>

                                        {job.Apply_Link && (
                                            <a
                                                href={job.Apply_Link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 py-2 rounded-xl transition-all shadow-2xs active:scale-[0.99]"
                                            >
                                                View Job Details
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* --- DESKTOP TABLE VIEW (Visible >= md) --- */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="py-3 px-4">Job Title & Role</th>
                                            <th className="py-3 px-4">Company</th>
                                            <th className="py-3 px-4">Match Score</th>
                                            <th className="py-3 px-4">Date / Posted</th>
                                            <th className="py-3 px-4">Pipeline Status</th>
                                            <th className="py-3 px-4 text-right">Action / Link</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {visibleJobs.map((job) => (
                                            <tr key={job.id || job.Apply_Link} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {job.Title || 'Job Role'}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {job.Role && (
                                                                <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                                    {job.Role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-sm font-medium text-gray-700">
                                                    {job.Company || 'N/A'}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {getMatchScoreBadge(job.tech_match_score)}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">
                                                    <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                        {formatDate(job)}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        {getStatusBadge(job)}
                                                        {job.application_notes && (
                                                            <span className="text-[10px] text-gray-400 truncate max-w-[200px]" title={job.application_notes}>
                                                                {job.application_notes}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    {job.Apply_Link ? (
                                                        <a
                                                            href={job.Apply_Link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            View Job
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Show More / Show Less Controls (Full-width on mobile) */}
                            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-xs font-semibold text-gray-500 text-center sm:text-left">
                                    Showing <span className="text-blue-600 font-bold">{visibleJobs.length}</span> of <span className="text-gray-800 font-bold">{filteredScrapedJobs.length}</span> entries
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                                    {visibleCount < filteredScrapedJobs.length && (
                                        <>
                                            <button
                                                onClick={handleShowMore}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-[0.98]"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                                Show More (+{Math.min(20, filteredScrapedJobs.length - visibleCount)})
                                            </button>
                                            <button
                                                onClick={handleShowAll}
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Show All ({filteredScrapedJobs.length})
                                            </button>
                                        </>
                                    )}

                                    {visibleCount >= filteredScrapedJobs.length && filteredScrapedJobs.length > 20 && (
                                        <button
                                            onClick={handleShowLess}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                            Show Less (First 20)
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

export default JobTrackingPage;
