import React, { useState, useEffect } from 'react';
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
    Trash2
} from 'lucide-react';
import { notificationsService, AppNotification } from '../../services/notifications.service';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationsService.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'lead.scored':
                return { 
                    icon: <Zap size={20} />, 
                    color: 'text-amber-500 bg-amber-50', 
                    title: 'Hot Lead' 
                };
            case 'lead.assigned':
                return { 
                    icon: <Info size={20} />, 
                    color: 'text-blue-500 bg-blue-50', 
                    title: 'Assignment' 
                };
            case 'car.aging_alert':
                return { 
                    icon: <Clock size={20} />, 
                    color: 'text-rose-500 bg-rose-50', 
                    title: 'Inventory Alert' 
                };
            case 'insurance.expiring':
                return { 
                    icon: <ShieldAlert size={20} />, 
                    color: 'text-indigo-500 bg-indigo-50', 
                    title: 'Insurance Expiry' 
                };
            case 'rc.expiring':
                return { 
                    icon: <FileText size={20} />, 
                    color: 'text-violet-500 bg-violet-50', 
                    title: 'RC Expiry' 
                };
            default:
                return { 
                    icon: <Bell size={20} />, 
                    color: 'text-slate-500 bg-slate-50', 
                    title: 'System Alert' 
                };
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filter === 'unread') return matchesSearch && !n.isRead;
        if (filter === 'alerts') return matchesSearch && (n.type.includes('expiry') || n.type.includes('alert'));
        return matchesSearch;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                            Activity Log
                            {unreadCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                    {unreadCount} Unread
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                            Operational alerts and system notifications
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text"
                            placeholder="Search activity..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                        <CheckCheck size={20} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'all', label: 'All Activity' },
                    { id: 'unread', label: 'Unread Only' },
                    { id: 'alerts', label: 'Urgent Alerts' }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={cn(
                            "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                            filter === f.id 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Loading history...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <Bell className="text-slate-200" size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No notifications found</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{searchQuery ? 'Try matching another term' : 'Go enjoy some tea ☕'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filteredNotifications.map((n) => {
                            const style = getTypeStyles(n.type);
                            return (
                                <div 
                                    key={n._id}
                                    className={cn(
                                        "p-8 transition-all relative group flex flex-col sm:flex-row gap-6",
                                        !n.isRead ? "bg-indigo-50/20" : "hover:bg-slate-50/50"
                                    )}
                                >
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-r-lg" />
                                    )}
                                    
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50",
                                        style.color
                                    )}>
                                        {style.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border",
                                                    style.color,
                                                    "border-current/20"
                                                )}>
                                                    {style.title}
                                                </span>
                                                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">{n.title}</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                                <Calendar size={12} />
                                                {format(new Date(n.createdAt), 'dd MMM yyyy')}
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
                                            {n.message}
                                        </p>
                                        
                                        <div className="flex items-center gap-4">
                                            {!n.isRead && (
                                                <button 
                                                    onClick={() => handleMarkAsRead(n._id)}
                                                    className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white border border-slate-100 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <CheckCheck size={14} />
                                                    Mark as Read
                                                </button>
                                            )}
                                            {n.metadata?.vehicleId && (
                                                <button 
                                                    onClick={() => navigate(`${ROUTES.VEHICLES.BASE}/${n.metadata.vehicleId}`)}
                                                    className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white border border-slate-100 px-4 py-2 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                >
                                                    View Details
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {n.isRead && (
                                        <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all self-start">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
