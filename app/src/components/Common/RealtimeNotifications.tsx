import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { socketClient } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

const RealtimeNotifications: React.FC = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (user?.tenantId) {
            socketClient.connect(user.tenantId);
            const socket = socketClient.socket;

            if (socket) {
                socket.on('notification', (data: any) => {
                    const { title, message, type } = data;
                    
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'} max-w-md w-full glass-card rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-white/40 shadow-2xl`}>
                            <div className="flex-1 w-0 p-1">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        {type === 'error' ? <AlertTriangle className="h-10 w-10 text-rose-500 bg-rose-50 p-2 rounded-xl" /> :
                                         type === 'success' ? <CheckCircle className="h-10 w-10 text-emerald-500 bg-emerald-50 p-2 rounded-xl" /> :
                                         <Bell className="h-10 w-10 text-indigo-500 bg-indigo-50 p-2 rounded-xl" />}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-black text-slate-900 tracking-tight">
                                            {title}
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="bg-white/50 rounded-lg p-2 flex items-center justify-center text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ), { duration: 5000 });
                });
            }

            return () => {
                socketClient.disconnect();
            };
        }
    }, [user]);

    return null;
};

export default RealtimeNotifications;
