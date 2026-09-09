// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import NaukriScraperPage from './NaukriScraperPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import JobTrackingPage from './JobTrackingPage.jsx';
import ExternalWalkinPage from './ExternalWalkinPage.jsx';
import LandingPage from './LandingPage.jsx';
import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import { LayoutDashboard, Search, Layers, ExternalLink, LogOut, User } from 'lucide-react';

// --- Auth Context / State ---
const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('token');
    });

    const login = () => setIsAuthenticated(true);
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
    };

    return { isAuthenticated, login, logout };
};

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ isAuthenticated, children }) => {
    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }
    return children;
};

// --- Responsive Navigation Component ---
const Navigation = ({ onLogout }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const username = localStorage.getItem('username') || 'User';

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'blue' },
        { path: '/external-walkin', label: 'External', icon: ExternalLink, color: 'amber' },
        { path: '/scraper', label: 'Scraper', icon: Search, color: 'blue' },
        { path: '/tracking', label: 'Tracking', icon: Layers, color: 'indigo' },
    ];

    return (
        <>
            {/* --- MOBILE TOP HEADER (Visible < md) --- */}
            <header className="flex md:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-gray-200/80 z-40 px-4 items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                        N
                    </div>
                    <span className="font-extrabold text-gray-900 tracking-tight text-sm">
                        Naukri<span className="text-blue-600">Auto</span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-100/80 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate max-w-[90px]">{username}</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* --- DESKTOP SIDEBAR (Visible >= md) --- */}
            <nav className="hidden md:flex fixed top-0 left-0 h-screen w-20 bg-white border-r border-gray-200 flex-col items-center py-8 z-50 shadow-sm">
                <div className="mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                        N
                    </div>
                </div>

                <div className="flex flex-col gap-6 w-full px-2 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link key={item.path} to={item.path} className="group relative flex justify-center">
                                <div className={`p-3 rounded-xl transition-all duration-200 ${active ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-auto px-2 w-full">
                    <button onClick={onLogout} className="group relative flex justify-center w-full">
                        <div className="p-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
                            <LogOut className="w-6 h-6" />
                        </div>
                        <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium">
                            Logout
                        </span>
                    </button>
                </div>
            </nav>

            {/* --- MOBILE BOTTOM NAVIGATION BAR (Visible < md) --- */}
            <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 z-50 px-2 justify-around items-center shadow-lg">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all duration-200 ${
                                active ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600 font-medium'
                            }`}
                        >
                            <div className={`p-1.5 rounded-full transition-transform duration-200 ${active ? 'bg-blue-50 scale-110' : ''}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
};

function App() {
    const { isAuthenticated, login, logout } = useAuth();

    return (
        <Router>
            <div className="flex min-h-screen bg-gray-50 text-gray-900">
                {isAuthenticated && <Navigation onLogout={logout} />}

                <main className={`flex-1 ${isAuthenticated ? 'pt-14 md:pt-0 ml-0 md:ml-20 pb-20 md:pb-8' : ''} transition-all duration-300`}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/welcome" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage onLogin={login} />} />
                        <Route path="/register" element={<RegisterPage onLogin={login} />} />

                        {/* Protected Routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/external-walkin"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <ExternalWalkinPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/scraper"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <NaukriScraperPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tracking"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <JobTrackingPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;