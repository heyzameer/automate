import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Bell,
    MessageSquare,
    ShieldCheck,
    Menu,
    ChevronRight,
    CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

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
    
    const user = getStoredUser();

    useEffect(() => {
        if (user) {
            if (user.role !== 'super_admin') {
                navigate(ROUTES.DASHBOARD.HOME);
            }
        } else {
            navigate(ROUTES.LOGIN);
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
                        <img 
                            src="/logo-white.png" 
                            alt="Orbix Logo" 
                            className="w-10 h-10 object-contain drop-shadow-md transition-transform hover:scale-110 duration-500 rounded-lg mix-blend-multiply" 
                        />
                        <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            Orbix <span className="text-slate-400">SA</span>
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col scrollbar-hide">
                    {/* Admin Profile - Brought Up */}
                    <div className="p-6 pb-2">
                        <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-3 shadow-xl shadow-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                                SA
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Root Admin</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2 px-4 space-y-1">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            System
                        </div>
                        <SidebarLink to={ROUTES.SUPER_ADMIN.DASHBOARD} icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>
                            Overview
                        </SidebarLink>

                        <div className="px-4 mt-6 mb-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Governance
                        </div>
                        <SidebarLink to={ROUTES.SUPER_ADMIN.SHOWROOMS} icon={Users} onClick={() => setSidebarOpen(false)}>
                            Manage Showrooms
                        </SidebarLink>
                        <SidebarLink to="/super/payments" icon={CreditCard} onClick={() => setSidebarOpen(false)}>
                            Billing & Payments
                        </SidebarLink>

                        <div className="px-4 mt-6 mb-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Automation
                        </div>
                        <SidebarLink to={ROUTES.SUPER_ADMIN.WA_CONFIG} icon={MessageSquare} onClick={() => setSidebarOpen(false)}>
                            WA API Config
                        </SidebarLink>

                        <div className="px-4 mt-6 mb-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            System
                        </div>
                        <SidebarLink to={ROUTES.SUPER_ADMIN.SETTINGS} icon={Settings} onClick={() => setSidebarOpen(false)}>
                            Global Settings
                        </SidebarLink>

                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-300 font-medium text-left"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className="whitespace-nowrap flex-1">Sign Out</span>
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
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-400">/</span>
                        <span className="text-sm font-bold text-slate-900 capitalize">
                            {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100/50">Root Access</span>
                        </div>
                        <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-all duration-300">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 lg:p-10 bg-[#fbfcfd]">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
