import React, { useEffect, useState } from 'react';
import { 
    Bell, 
    CheckCheck, 
    Calendar, 
    ShieldAlert, 
    FileText, 
    Clock, 
    Zap, 
    Info, 
    Search,
    Filter,
    ArrowLeft,
    Trash2,
    User,
    Car
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAppDispatch, useAppSelector } from '../../store';
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    selectNotifications,
    selectNotificationsLoading,
    selectUnreadCount,
} from '../../store/slices/notificationsSlice';

export default function NotificationsPage() {
    const dispatch = useAppDispatch();
    const notifications = useAppSelector(selectNotifications);
    const loading = useAppSelector(selectNotificationsLoading);
    const unreadCount = useAppSelector(selectUnreadCount);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');
    const navigate = useNavigate();

    useEffect(() => {
        // Condition guard in the thunk skips re-fetch if already cached
        dispatch(fetchNotifications());
    }, [dispatch]);

    const handleMarkAsRead = (id: string) => {
        dispatch(markNotificationRead(id));
    };

    const handleMarkAllAsRead = async () => {
        try {
            await dispatch(markAllNotificationsRead()).unwrap();
            toast.success("All notifications marked as read");
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'lead.scored':
                return { 
                    icon: <Zap size={22} />, 
                    color: 'text-amber-500 bg-amber-50 border-amber-100', 
                    title: 'Hot Lead' 
                };
            case 'lead.qr_scan':
                return { 
                    icon: <Car size={22} />, 
                    color: 'text-emerald-500 bg-emerald-50 border-emerald-100', 
                    title: 'QR Scan' 
                };
            case 'lead.assigned':
                return { 
                    icon: <Info size={22} />, 
                    color: 'text-blue-500 bg-blue-50 border-blue-100', 
                    title: 'Assignment' 
                };
            case 'car.aging_alert':
                return { 
                    icon: <Clock size={22} />, 
                    color: 'text-rose-500 bg-rose-50 border-rose-100', 
                    title: 'Inventory Alert' 
                };
            default:
                return { 
                    icon: <Bell size={22} />, 
                    color: 'text-slate-500 bg-slate-50 border-slate-100', 
                    title: 'Activity' 
                };
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filter === 'unread') return matchesSearch && !n.isRead;
        if (filter === 'alerts') return matchesSearch && (n.type.includes('expiry') || n.type.includes('alert') || n.type.includes('scored'));
        return matchesSearch;
    });

    // Grouping logic
    const sections = [
        { title: 'Today', data: filteredNotifications.filter(n => format(new Date(n.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) },
        { title: 'Yesterday', data: filteredNotifications.filter(n => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return format(new Date(n.createdAt), 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
        }) },
        { title: 'Older', data: filteredNotifications.filter(n => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return new Date(n.createdAt) < yesterday && format(new Date(n.createdAt), 'yyyy-MM-dd') !== format(yesterday, 'yyyy-MM-dd');
        }) }
    ].filter(s => s.data.length > 0);

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 sm:px-0">
                <div className="space-y-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                            Activity Log
                            {unreadCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl shadow-indigo-100 animate-pulse">
                                    {unreadCount} New
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 font-bold text-sm tracking-tight mt-1">
                            Real-time showroom intelligence and inventory alerts.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-4 h-4" />
                        <input 
                            type="text"
                            placeholder="Filter events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold w-full md:w-56 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all shadow-xl shadow-slate-200/40"
                        />
                    </div>
                    <button 
                        onClick={handleMarkAllAsRead}
                        title="Mark all as read"
                        className="p-4 bg-slate-900 text-white rounded-[1.5rem] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-100 active:scale-95"
                    >
                        <CheckCheck size={22} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
                {[
                    { id: 'all', label: 'All Activity' },
                    { id: 'unread', label: 'Unread Only' },
                    { id: 'alerts', label: 'Urgent Only' }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={cn(
                            "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                            filter === f.id 
                                ? "bg-white border-slate-900 text-slate-900 shadow-xl shadow-slate-200/50 -translate-y-1" 
                                : "bg-slate-50/50 border-transparent text-slate-400 hover:bg-white hover:border-slate-100"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-12">
                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hydrating Log...</p>
                    </div>
                ) : sections.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-xl">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                            <Bell className="text-slate-200" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">QUIET DAY</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-3">No activity logs found matching your criteria</p>
                    </div>
                ) : (
                    sections.map((section) => (
                        <div key={section.title} className="space-y-4">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-6">{section.title}</h2>
                            <div className="space-y-4 capitalize">
                                {section.data.map((n) => {
                                    const style = getTypeStyles(n.type);
                                    const leadSearch = n.metadata?.customerName || n.metadata?.phone || '';
                                    
                                    // Safety patch for old notifications with 'Lead undefined'
                                    const cleanMessage = n.message.replace('Lead undefined', `Lead ${n.metadata?.phone || 'New Prospect'}`);

                                    return (
                                        <div 
                                            key={n._id}
                                            className={cn(
                                                "bg-white rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 transition-all border group relative overflow-hidden",
                                                !n.isRead ? "border-indigo-100 shadow-xl shadow-indigo-100/50" : "border-slate-100 opacity-80 hover:opacity-100"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 border transition-transform duration-500 group-hover:scale-110",
                                                style.color
                                            )}>
                                                {style.icon}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className={cn(
                                                            "text-lg font-black tracking-tight",
                                                            !n.isRead ? "text-slate-900" : "text-slate-500"
                                                        )}>
                                                            {n.title}
                                                        </h3>
                                                        {!n.isRead && (
                                                            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                                        <Clock size={12} className="text-slate-400" />
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-600 leading-relaxed mb-6">
                                                    {cleanMessage}
                                                </p>
                                                
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {!n.isRead && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n._id); }}
                                                            className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/50 border border-indigo-100 px-5 py-3 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                        >
                                                            <CheckCheck size={14} />
                                                            Mark as Read
                                                        </button>
                                                    )}
                                                    
                                                    {n.metadata?.leadId || n.metadata?.phone ? (
                                                        <button 
                                                            onClick={() => navigate(`${ROUTES.ENQUIRIES.LEADS}?search=${leadSearch}`)}
                                                            className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                                        >
                                                            <User size={14} />
                                                            View Profile
                                                        </button>
                                                    ) : n.metadata?.vehicleId ? (
                                                        <button 
                                                            onClick={() => navigate(`${ROUTES.VEHICLES.BASE}?search=${n.metadata.carCode || n.metadata.vehicleId}`)}
                                                            className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                                        >
                                                            <Car size={14} />
                                                            Inspect car
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
