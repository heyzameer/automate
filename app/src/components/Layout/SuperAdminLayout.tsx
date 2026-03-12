import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Bell,
    Car,
    CheckSquare,
    MessageSquare,
    ShieldCheck,
    Menu,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface SidebarLinkProps {
    to: string;
    icon: React.ElementType;
    children: React.ReactNode;
    end?: boolean;
    onClick?: () => void;
}

const SidebarLink = ({ to, icon: Icon, children, end, onClick }: SidebarLinkProps) => (
    <NavLink
        to={to}
        end={end}
        onClick={onClick}
        className={({ isActive }) =>
            cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-medium",
                isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )
        }
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="whitespace-nowrap flex-1">{children}</span>
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
);

export default function SuperAdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, getStoredUser } = useAuth();
    
    // We get user directly from localStorage via auth service on each render safely
    const user = getStoredUser();

    useEffect(() => {
        if (user) {
            if (user.role !== 'super_admin') {
                navigate('/dashboard');
            }
        } else {
            navigate('/login');
        }
    }, [navigate, user]);

    const handleLogout = () => {
        logout();
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-100 w-72 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="h-20 flex items-center px-8 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-100 text-white">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            AutoMoto <span className="text-slate-400">SA</span>
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col">
                    <div className="py-8 px-4 space-y-1 flex-1">
                        <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            System
                        </div>
                        <SidebarLink to="/super/dashboard" icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>
                            Overview
                        </SidebarLink>

                        <div className="px-4 mt-10 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Governance
                        </div>
                        <SidebarLink to="/super/showrooms" icon={Users} onClick={() => setSidebarOpen(false)}>
                            Manage Showrooms
                        </SidebarLink>
                        <SidebarLink to="/super/form-builder" icon={CheckSquare} onClick={() => setSidebarOpen(false)}>
                            Global Forms
                        </SidebarLink>

                        <div className="px-4 mt-10 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Automation
                        </div>
                        <SidebarLink to="/super/wa-config" icon={MessageSquare} onClick={() => setSidebarOpen(false)}>
                            WA API Configuration
                        </SidebarLink>

                        <div className="px-4 mt-10 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            System
                        </div>
                        <SidebarLink to="/super/settings" icon={Settings} onClick={() => setSidebarOpen(false)}>
                            Global Settings
                        </SidebarLink>
                    </div>

                    {/* Sidebar Bottom */}
                    <div className="p-6 border-t border-slate-50 space-y-4">
                        <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold">
                                SA
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                                <p className="text-xs text-slate-400 font-medium truncate uppercase tracking-tighter">Super Admin</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-300 transition-colors font-bold text-sm"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 flex items-center justify-between px-8">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400">System Control /</span>
                        <span className="text-sm font-bold text-slate-900 capitalize">
                            {location.pathname.split('/').pop() || 'Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full">Root Access</span>
                        </div>
                        <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-all duration-300">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 lg:p-10">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
