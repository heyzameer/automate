import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    PlusCircle,
    List,
    MessageSquare,
    Settings,
    Users,
    Menu,
    X,
    LogOut,
    Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const SidebarLink = ({ to, icon: Icon, children, collapsed, end, onClick }) => (
    <NavLink
        to={to}
        end={end}
        onClick={onClick}
        className={({ isActive }) =>
            cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-gray-800/50"
            )
        }
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
            <span className="font-medium whitespace-nowrap">{children}</span>
        )}
    </NavLink>
);

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 w-64 transform transition-transform duration-200 ease-in-out lg:transform-none flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                        AutoVendor
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Overview
                    </div>
                    <SidebarLink to="/dashboard" icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>
                        Dashboard
                    </SidebarLink>

                    <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Inventory
                    </div>
                    <SidebarLink to="/vehicles/add" icon={PlusCircle} onClick={() => setSidebarOpen(false)}>
                        Add Vehicle
                    </SidebarLink>
                    <SidebarLink to="/vehicles" icon={List} end onClick={() => setSidebarOpen(false)}>
                        My Listings
                    </SidebarLink>

                    <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Sales & Leads
                    </div>
                    <SidebarLink to="/leads" icon={Users} onClick={() => setSidebarOpen(false)}>
                        Enquiries
                    </SidebarLink>
                    <SidebarLink to="/automation" icon={MessageSquare} onClick={() => setSidebarOpen(false)}>
                        WhatsApp Check
                    </SidebarLink>

                    <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Settings
                    </div>
                    <SidebarLink to="/settings" icon={Settings} onClick={() => setSidebarOpen(false)}>
                        Settings
                    </SidebarLink>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                AJ
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">Hari Priya</p>
                                <p className="text-xs text-gray-500">Owner</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
