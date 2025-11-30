import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { Briefcase, Building2, UserCheck, MousePointerClick, TrendingUp, PieChart as PieIcon, User } from 'lucide-react';
import { API_URL } from './config';

const DashboardPage = () => {
    const [data, setData] = useState([]);
    const [username, setUsername] = useState('Guest');
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
        // Load username from local storage if available
        const storedUser = localStorage.getItem('naukriFormData');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.username) setUsername(parsed.username);
            } catch (e) {
                console.error("Error parsing stored user data", e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            if (username === 'Guest') return;

            try {
                const response = await axios.get(`${API_URL}/dashboard_stats/${username}`);

                if (!response.data || !response.data.stats) return;

                const { overview, distribution, daily_stats } = response.data.stats;

                // Process daily_stats for chart
                const chartData = (daily_stats || []).map(day => ({
                    date: day.date,
                    "Naukri Direct": day.applied || 0,
                    "Company Site": 0, // Placeholder
                    "Walk-in": 0,      // Placeholder
                    total: day.total
                }));

                // Map application_notes to categories
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
                        // Default to Naukri Direct (AI Chatbot, Direct Apply, etc.)
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
    }, [username]);

    const pieData = [
        { name: 'Naukri Direct', value: stats.naukriDirect },
        { name: 'Company Site', value: stats.companySite },
        { name: 'Walk-in', value: stats.walkIn },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Application Overview
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Tracking your job search performance over the last 7 days.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Profile Badge */}
                        <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-sm border border-gray-200 transition-all hover:shadow-md">
                            <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Logged in as</span>
                                <span className="text-sm font-bold text-gray-700 leading-tight">{username}</span>
                            </div>
                        </div>

                        {/* Total Count Badge */}
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-600 flex flex-col items-end">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Total Applications</span>
                            <span className="text-blue-600 font-black text-2xl leading-none">{stats.total}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Naukri Direct"
                        value={stats.naukriDirect}
                        subtitle="Applied on Platform"
                        icon={<MousePointerClick className="w-6 h-6 text-white" />}
                        color="bg-blue-500"
                        trend="+12%"
                    />
                    <StatCard
                        title="Company Site"
                        value={stats.companySite}
                        subtitle="External Applications"
                        icon={<Building2 className="w-6 h-6 text-white" />}
                        color="bg-amber-500"
                        trend="+5%"
                    />
                    <StatCard
                        title="Walk-in Drives"
                        value={stats.walkIn}
                        subtitle="Offline / Direct"
                        icon={<UserCheck className="w-6 h-6 text-white" />}
                        color="bg-emerald-500"
                        trend="Stable"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Trend Chart (Takes up 2 columns) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-gray-500" />
                                Daily Application Trends
                            </h2>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    barSize={32}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

                                    <Bar dataKey="Naukri Direct" stackId="a" fill={COLORS.naukriDirect} radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="Company Site" stackId="a" fill={COLORS.companySite} />
                                    <Bar dataKey="Walk-in" stackId="a" fill={COLORS.walkIn} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribution Chart (Takes up 1 column) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                            <PieIcon className="w-5 h-5 text-gray-500" />
                            Distribution
                        </h2>

                        <div className="flex-1 min-h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Text Overlay */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                                <span className="block text-3xl font-bold text-gray-800">{stats.total}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            </div>
            <div className={`p-3 rounded-xl ${color} shadow-lg shadow-opacity-20`}>
                {icon}
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                {trend}
            </span>
            <span className="text-gray-400 ml-2">vs last week</span>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-sm">
                <p className="font-semibold mb-2 border-b border-gray-700 pb-1">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                ></span>
                                <span className="text-gray-300">{entry.name}</span>
                            </div>
                            <span className="font-bold">{entry.value}</span>
                        </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-gray-700 flex justify-between font-bold text-gray-100">
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
