// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import NaukriScraperPage from './NaukriScraperPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import LandingPage from './LandingPage.jsx';
import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import { LayoutDashboard, Search, LogOut } from 'lucide-react';

// --- Auth Context / State ---
// In a real app, use Context API or Redux
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

// --- Navigation Component (Only visible when logged in) ---
const Navigation = ({ onLogout }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 h-screen w-20 bg-white border-r border-gray-200 flex flex-col items-center py-8 z-50 shadow-sm">
            <div className="mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                    N
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full px-2 flex-1">
                <Link to="/" className="group relative flex justify-center">
                    <div className={`p-3 rounded-xl transition-all duration-200 ${isActive('/') ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        Dashboard
                    </span>
                </Link>

                <Link to="/scraper" className="group relative flex justify-center">
                    <div className={`p-3 rounded-xl transition-all duration-200 ${isActive('/scraper') ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                        <Search className="w-6 h-6" />
                    </div>
                    <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        Scraper
                    </span>
                </Link>
            </div>

            <div className="mt-auto px-2 w-full">
                <button onClick={onLogout} className="group relative flex justify-center w-full">
                    <div className="p-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
                        <LogOut className="w-6 h-6" />
                    </div>
                    <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        Logout
                    </span>
                </button>
            </div>
        </nav>
    );
};

function App() {
    const { isAuthenticated, login, logout } = useAuth();

    return (
        <Router>
            <div className="flex min-h-screen bg-gray-50">
                {isAuthenticated && <Navigation onLogout={logout} />}

                <main className={`flex-1 ${isAuthenticated ? 'ml-20' : ''} transition-all duration-300`}>
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
                            path="/scraper"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <NaukriScraperPage />
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