import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    PlusCircle,
    List,
    MessageSquare,
    Settings,
    Users,
    Menu,
    LogOut,
    Bell,
    Car,
    CreditCard,
    Megaphone,
    ShieldAlert,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import NotificationDropdown from '../Dashboard/NotificationDropdown';

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
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )
        }
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="whitespace-nowrap">{children}</span>
    </NavLink>
);

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<{ fullName: string; role: string; tenantId?: string } | null>(null);
    const [tenant, setTenant] = useState<{ plan?: string; verificationStatus?: string; name?: string; isActive?: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const fetchTenantData = async () => {
        try {
            const data = await authService.getMyTenant();
            if (data?.tenant) {
                setTenant(data.tenant);
                // Redirect if deactivated or pending
                if (!data.tenant.isActive || data.tenant.verificationStatus === 'pending') {
                    navigate(ROUTES.DEACTIVATED);
                }
            }
        } catch (error) {
            console.error("Failed to fetch tenant info in layout", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
            if (storedUser.role === 'super_admin') {
                navigate(ROUTES.SUPER_ADMIN.DASHBOARD);
            } else {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser(storedUser);
                if (!tenant) fetchTenantData();
            }
        } else {
            navigate(ROUTES.LOGIN);
        }
    }, [navigate, location.pathname]);

    const handleLogout = () => {
        logout();
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    if (!user || isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full pointer-events-none opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 blur-[100px] rounded-full animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600 blur-[100px] rounded-full animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 180, 360]
                        }}
                        transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut" 
                        }}
                        className="w-16 h-16 mb-8 relative"
                    >
                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-2xl"></div>
                        <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-2xl"></div>
                        <div className="flex items-center justify-center h-full">
                            <Car className="text-white w-6 h-6" />
                        </div>
                    </motion.div>
                    
                    <h3 className="text-white font-black text-xl tracking-tight mb-2">Syncing your showroom</h3>
                    <p className="text-slate-500 font-medium text-sm">Verifying partnership credentials...</p>
                </div>
            </div>
        );
    }

    const initials = user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

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
                            Orbix
                        </span>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto flex flex-col scrollbar-hide">
                    {/* User Profile - Brought Up */}
                    <div className="p-6 pb-2">
                        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100/50">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">{user.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2 px-4 space-y-1">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Menu
                        </div>
                        <SidebarLink to={ROUTES.DASHBOARD.HOME} icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>
                            Dashboard
                        </SidebarLink>

                        <div className="px-4 mt-6 mb-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Inventory
                        </div>
                        <SidebarLink to={ROUTES.VEHICLES.ADD} icon={PlusCircle} onClick={() => setSidebarOpen(false)}>
                            Add Vehicle
                        </SidebarLink>
                        <SidebarLink to={ROUTES.VEHICLES.BASE} icon={List} end onClick={() => setSidebarOpen(false)}>
                            My Listings
                        </SidebarLink>

                        <div className="px-4 mt-6 mb-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Acquisition
                        </div>
                        <SidebarLink to={ROUTES.ENQUIRIES.LEADS} icon={Users} onClick={() => setSidebarOpen(false)}>
                            Enquiries
                        </SidebarLink>
                        <SidebarLink to={ROUTES.ENQUIRIES.BOOKINGS} icon={Bell} onClick={() => setSidebarOpen(false)}>
                            Test Drives
                        </SidebarLink>
                        <SidebarLink to={ROUTES.AUTOMATION.WHATSAPP} icon={MessageSquare} onClick={() => setSidebarOpen(false)}>
                            WhatsApp Bot
                        </SidebarLink>

                        <div className="px-4 mt-6 mb-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Marketing
                        </div>
                        <SidebarLink to={ROUTES.MARKETING.CAMPAIGNS} icon={Megaphone} onClick={() => setSidebarOpen(false)}>
                            Campaigns
                        </SidebarLink>

                        <div className="px-4 mt-6 mb-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Account
                        </div>
                        <SidebarLink to={ROUTES.DASHBOARD.SUBSCRIPTION} icon={CreditCard} onClick={() => setSidebarOpen(false)}>
                            Plan & Billing
                        </SidebarLink>
                        <SidebarLink to={ROUTES.DASHBOARD.SETTINGS} icon={Settings} onClick={() => setSidebarOpen(false)}>
                            Store Settings
                        </SidebarLink>

                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-300 font-medium text-left"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className="whitespace-nowrap">Sign Out</span>
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
                        <Car className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-400">/</span>
                        <span className="text-sm font-bold text-slate-900 capitalize">
                            {(() => {
                                const parts = location.pathname.split('/').filter(Boolean);
                                const lastPart = parts[parts.length - 1];
                                
                                // If it looks like a MongoDB ID (24 hex chars)
                                if (lastPart && /^[0-9a-fA-F]{24}$/.test(lastPart)) {
                                    if (parts.includes('vehicles')) return 'Vehicle Detail';
                                    if (parts.includes('leads')) return 'Lead Detail';
                                    if (parts.includes('bookings')) return 'Booking Detail';
                                    return 'Detail View';
                                }
                                
                                return lastPart?.replace('-', ' ') || 'Overview';
                            })()}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {tenant && (
                            <div className="hidden lg:flex flex-col items-end mr-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">
                                    {tenant.plan || 'BASIC'} PLAN
                                </span>
                            </div>
                        )}
                        
                        <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
                        
                        <NotificationDropdown tenantId={user.tenantId!} />
                        
                        {/* Quick Action Profile for mobile/tablet top header */}
                        <div className="md:hidden w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">
                             {initials}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#fbfcfd] relative">
                    <div className="max-w-7xl mx-auto">
                        {tenant?.verificationStatus === 'pending' ? (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Clock className="w-10 h-10 text-amber-500" />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 mb-4">Verification Pending</h1>
                                <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                                    Welcome to CarBot, <span className="font-bold text-slate-900">{tenant.name}</span>! 
                                    Our administrative team is currently reviewing your showroom registration. 
                                    You will receive an email once your account is activated.
                                </p>
                                <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl text-slate-600 font-medium border border-slate-100">
                                    <ShieldAlert className="w-5 h-5 text-indigo-500" />
                                    Estimated review time: 12-24 hours
                                </div>
                            </div>
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
