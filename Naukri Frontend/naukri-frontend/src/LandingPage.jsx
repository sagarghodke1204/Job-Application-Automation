import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Zap, BarChart3, Shield, ArrowRight, CheckCircle, Globe, Search, FileText, Check, Loader2 } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">

            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-xl">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">JobAgent<span className="text-blue-600">.ai</span></span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                Log in
                            </Link>
                            <Link to="/register" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
                {/* Premium Background: Grid + Spotlight */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px] animate-blob"></div>
                    <div className="absolute right-0 top-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-400 opacity-20 blur-[100px] animate-blob animation-delay-2000"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Now with Advanced Analytics
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight animate-fade-in-up">
                        Automate Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-text-shimmer bg-[length:200%_auto]">
                            Job Search Journey
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl font-medium text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed tracking-wide animate-fade-in-up [animation-delay:200ms] fill-mode-forwards">
                        Stop manually applying. Our intelligent agent scrapes, filters, and applies to jobs on <span className="font-bold text-gray-900">Naukri.com</span> while you sleep. Visualize your success with real-time dashboards.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
                        <Link to="/register" className="relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2 overflow-hidden group animate-float animate-button-glow">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-[150%] h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer rotate-12"></div>
                            </div>
                            <span className="relative z-10 flex items-center gap-2">Start Automating <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                        </Link>

                        <Link to="/login" className="relative w-full sm:w-auto px-1 py-1 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:-translate-y-1 transition-all shadow-lg shadow-gray-200/50 hover:shadow-purple-500/20 group">
                            <div className="w-full h-full bg-white rounded-[14px] px-7 py-3 flex items-center justify-center transition-colors group-hover:bg-gray-50">
                                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                                    View Demo
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Stats Preview */}
                    {/* Premium 3D Glass Card */}
                    {/* Premium 3D Glass Card - Dynamic Process Simulation */}
                    <div className="mt-24 relative mx-auto max-w-4xl perspective-1000 animate-fade-in-up [animation-delay:600ms] fill-mode-forwards">
                        {/* Glow effect behind card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-image-glow"></div>

                        <div className="relative bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-2 overflow-hidden transform transition-transform hover:scale-[1.01] duration-500">
                            <div className="bg-white/50 rounded-2xl p-6 md:p-10 border border-white/60">
                                <div className="flex flex-col gap-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Zap className="w-5 h-5 text-blue-600 animate-pulse" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-gray-900">Auto-Apply Agent</h3>
                                                <p className="text-xs text-gray-500">Live Activity</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-xs font-medium text-green-600">Active</span>
                                        </div>
                                    </div>

                                    {/* Dynamic Steps */}
                                    <div className="space-y-4">
                                        <ProcessStep
                                            icon={Search}
                                            label="Scanning Job Board"
                                            subLabel="Found: Senior React Developer"
                                            status="completed"
                                            delay={0}
                                        />
                                        <ProcessStep
                                            icon={FileText}
                                            label="Analyzing Requirements"
                                            subLabel="Match Score: 98% (High)"
                                            status="completed"
                                            delay={1500}
                                        />
                                        <ProcessStep
                                            icon={ArrowRight}
                                            label="Submitting Application"
                                            subLabel="Auto-filling experience & skills..."
                                            status="active"
                                            delay={3000}
                                        />
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                                            <span>Application Progress</span>
                                            <span className="text-blue-600">75%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[75%] animate-shimmer bg-[length:200%_100%]"></div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Simulation */}
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center gap-2 opacity-50">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-bold text-green-700">Success</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm font-bold">Processing Next...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Supported Platforms Section */}
            <section className="py-24 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Supported Platforms</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">We are constantly expanding our reach. Currently optimized for Naukri.com, with more platforms coming soon.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Naukri.com - Active */}
                        <PlatformCard
                            name="Naukri.com"
                            status="Active"
                            statusColor="bg-green-100 text-green-700"
                            icon={<img src="/logo/naukri_gnb_logo.svg" alt="Naukri" className="h-8 w-auto object-contain" />}
                            description="Full automation support: Scraping, Filtering, and One-click Apply."
                            isActive={true}
                        />

                        {/* LinkedIn - Coming Soon */}
                        <PlatformCard
                            name="LinkedIn"
                            status="Coming Soon"
                            statusColor="bg-blue-50 text-blue-600"
                            icon={<Globe className="w-8 h-8 text-blue-700" />}
                            description="Advanced networking and job application automation."
                            isActive={false}
                        />

                        {/* Glassdoor - Coming Soon */}
                        <PlatformCard
                            name="Glassdoor"
                            status="Coming Soon"
                            statusColor="bg-gray-100 text-gray-600"
                            icon={<Zap className="w-8 h-8 text-green-600" />}
                            description="Company insights and salary-based job targeting."
                            isActive={false}
                        />

                        {/* Hirist.tech - Coming Soon */}
                        <PlatformCard
                            name="Hirist.tech"
                            status="Coming Soon"
                            statusColor="bg-orange-50 text-orange-600"
                            icon={<Layers className="w-8 h-8 text-orange-500" />}
                            description="Specialized tech job automation for developers."
                            isActive={false}
                        />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to land your dream job</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Powerful tools to streamline your job search process from discovery to application.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-amber-500" />}
                            title="Smart Automation"
                            description="Automatically filter and apply to jobs that match your exact criteria. No more manual clicking."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-8 h-8 text-blue-500" />}
                            title="Visual Analytics"
                            description="Track your application history, success rates, and daily activity with beautiful interactive charts."
                        />
                        <FeatureCard
                            icon={<Shield className="w-8 h-8 text-emerald-500" />}
                            title="Secure & Private"
                            description="Your credentials are encrypted and stored locally. We prioritize your data privacy and security."
                        />
                    </div>
                </div>
            </section>



        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">
            {description}
        </p>
    </div>
);

const PlatformCard = ({ name, status, statusColor, icon, description, isActive }) => (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${isActive ? 'bg-white border-blue-100 shadow-lg shadow-blue-500/5' : 'bg-gray-50 border-gray-100 opacity-80'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${isActive ? 'bg-blue-50' : 'bg-white'}`}>
                {icon}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                {status}
            </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
            {description}
        </p>
    </div>
);

const ProcessStep = ({ icon: Icon, label, subLabel, status, delay }) => {
    const [active, setActive] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setActive(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!active && status !== 'completed') return null;

    const isCompleted = status === 'completed';
    const isActive = status === 'active';

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${isActive ? 'bg-blue-50 border border-blue-100 scale-105 shadow-sm' : 'opacity-60'}`}>
            <div className={`p-2 rounded-full ${isActive ? 'bg-blue-600 text-white' : (isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')}`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <h4 className={`text-sm font-bold ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>{label}</h4>
                    {isActive && <span className="text-xs font-bold text-blue-600 animate-pulse">Processing...</span>}
                </div>
                <p className="text-xs text-gray-500">{subLabel}</p>
            </div>
        </div>
    );
};

export default LandingPage;
