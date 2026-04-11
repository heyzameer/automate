import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, Info, AlertTriangle, Zap, MessageSquare } from 'lucide-react';
import { notificationsService, AppNotification } from '../../services/notifications.service';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDropdown({ tenantId }: { tenantId: string }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        notificationsService.initSocket(tenantId);
        
        const unsubscribe = notificationsService.onNotification((newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
        });

        return () => unsubscribe();
    }, [tenantId]);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsService.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error("Failed to load notifications", err);
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

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'lead.scored': return <Zap className="text-amber-500" size={16} />;
            case 'lead.assigned': return <Info className="text-blue-500" size={16} />;
            case 'car.aging_alert': return <Clock className="text-rose-500" size={16} />;
            default: return <Bell className="text-indigo-500" size={16} />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl relative transition-all duration-300 group"
            >
                <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white ring-2 ring-rose-100">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inbox</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">
                                {unreadCount} New
                            </span>
                        </div>

                        <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="text-slate-200" size={24} />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">All caught up!</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n._id}
                                        onClick={() => handleMarkAsRead(n._id)}
                                        className={`p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        {!n.isRead && <div className="absolute left-6 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-full" />}
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">
                                                {getTypeIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{n.title}</p>
                                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                                    {n.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                            <button 
                                onClick={() => {
                                    setIsOpen(false);
                                    window.location.href = '/notifications';
                                }}
                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                            >
                                View Activity Log
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
