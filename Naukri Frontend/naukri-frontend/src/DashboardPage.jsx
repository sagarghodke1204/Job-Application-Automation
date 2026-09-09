import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { 
    Building2, UserCheck, MousePointerClick, TrendingUp, 
    PieChart as PieIcon, User, Layers, ArrowRight
} from 'lucide-react';
import { API_URL } from './config';

const DashboardPage = () => {
    const [data, setData] = useState([]);
    const [username, setUsername] = useState('Guest');
    const [email, setEmail] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        naukriDirect: 0,
        companySite: 0,
        walkIn: 0
    });

    // Colors
    const COLORS = {
        naukriDirect: '#3B82F6', // Blue
        companySite: '#F59E0B',  // Amber
        walkIn: '#10B981'        // Emerald
    };

    const PIE_COLORS = [COLORS.naukriDirect, COLORS.companySite, COLORS.walkIn];

    useEffect(() => {
        const appUsername = localStorage.getItem('username');
        const appEmail = localStorage.getItem('email');

        if (appUsername) setUsername(appUsername);
        if (appEmail) setEmail(appEmail);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            if (!email) return;
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await axios.get(`${API_URL}/dashboard_stats/${email}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.data || !response.data.stats) return;

                const { overview, distribution, daily_breakdown } = response.data.stats;

                const chartDataMap = {};

                const formatDate = (dateStr) => {
                    const d = new Date(dateStr);
                    return d.toISOString().split('T')[0];
                };

                (daily_breakdown || []).forEach(item => {
                    const date = formatDate(item.date);
                    if (!chartDataMap[date]) {
                        chartDataMap[date] = { date: date, "Naukri Direct": 0, "Company Site": 0, "Walk-in": 0, total: 0 };
                    }

                    const note = (item.application_notes || "").toLowerCase();
                    const count = item.count;

                    if (note.includes("walkin") || note.includes("walk-in")) {
                        chartDataMap[date]["Walk-in"] += count;
                    } else if (note.includes("company") || note.includes("external")) {
                        chartDataMap[date]["Company Site"] += count;
                    } else {
                        chartDataMap[date]["Naukri Direct"] += count;
                    }
                    chartDataMap[date].total += count;
                });

                const chartData = Object.values(chartDataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

                let naukriCount = 0;
                let companyCount = 0;
                let walkInCount = 0;

                (distribution || []).forEach(item => {
                    const note = (item.application_notes || "").toLowerCase();
                    const count = item.count;

                    if (note.includes("walkin") || note.includes("walk-in")) {
                        walkInCount += count;
                    } else if (note.includes("company") || note.includes("external")) {
                        companyCount += count;
                    } else {
                        naukriCount += count;
                    }
                });

                setData(chartData);
                setStats({
                    total: overview.total_applied || 0,
                    naukriDirect: naukriCount,
                    companySite: companyCount,
                    walkIn: walkInCount
                });

            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            }
        };

        fetchStats();
    }, [email]);

    const pieData = [
        { name: 'Naukri Direct', value: stats.naukriDirect },
        { name: 'Company Site', value: stats.companySite },
        { name: 'Walk-in', value: stats.walkIn },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Application Overview
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Tracking your job search performance over the last 7 days.
                        </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                        {/* User Profile Badge */}
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
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Total Applied</span>
                            <span className="text-blue-600 font-black text-xl sm:text-2xl leading-none">{stats.total}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <StatCard
                        title="Naukri Direct"
                        value={stats.naukriDirect}
                        subtitle="Applied on Platform"
                        icon={<MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                        color="bg-blue-500"
                        trend="+12%"
                    />
                    <StatCard
                        title="Company Site"
                        value={stats.companySite}
                        subtitle="External Applications"
                        icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                        color="bg-amber-500"
                        trend="+5%"
                    />
                    <StatCard
                        title="Walk-in Drives"
                        value={stats.walkIn}
                        subtitle="Offline / Direct"
                        icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                        color="bg-emerald-500"
                        trend="Stable"
                    />
                </div>

                {/* Tracking Shortcut Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 shadow-sm text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 sm:p-3 bg-white/10 rounded-xl backdrop-blur-xs flex-shrink-0">
                            <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold">Scraped Jobs & Live Pipeline</h3>
                            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Filter by AI match score & track status in real-time.</p>
                        </div>
                    </div>
                    <Link
                        to="/tracking"
                        className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:bg-blue-50 transition-all active:scale-[0.98] whitespace-nowrap"
                    >
                        Open Job Tracking
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                    {/* Main Trend Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-gray-500" />
                                Daily Application Trends
                            </h2>
                        </div>

                        <div className="h-[260px] sm:h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                    barSize={24}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 10 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 10 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />

                                    <Bar dataKey="Naukri Direct" stackId="a" fill={COLORS.naukriDirect} radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="Company Site" stackId="a" fill={COLORS.companySite} />
                                    <Bar dataKey="Walk-in" stackId="a" fill={COLORS.walkIn} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribution Chart */}
                    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6 flex flex-col">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                            <PieIcon className="w-5 h-5 text-gray-500" />
                            Distribution
                        </h2>

                        <div className="flex-1 min-h-[260px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                                <span className="block text-2xl font-bold text-gray-800">{stats.total}</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-gray-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            <div className={`p-2.5 sm:p-3 rounded-xl ${color} shadow-xs`}>
                {icon}
            </div>
        </div>
        <div className="mt-3 flex items-center text-xs">
            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full text-[11px]">
                {trend}
            </span>
            <span className="text-gray-400 ml-2 text-[11px]">vs last week</span>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs">
                <p className="font-semibold mb-1.5 border-b border-gray-700 pb-1">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                ></span>
                                <span className="text-gray-300">{entry.name}</span>
                            </div>
                            <span className="font-bold">{entry.value}</span>
                        </div>
                    ))}
                    <div className="pt-1.5 mt-1.5 border-t border-gray-700 flex justify-between font-bold text-gray-100">
                        <span>Total</span>
                        <span>{payload.reduce((acc, curr) => acc + curr.value, 0)}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default DashboardPage;
