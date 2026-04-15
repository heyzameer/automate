import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    User, 
    Phone, 
    Car, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Search,
    Loader2,
    TrendingUp,
    MoreVertical,
    History
} from 'lucide-react';
import { leadsService, Lead } from '../../services/leads.service';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import { format, isPast, isToday } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function TestDrives() {
    const [bookings, setBookings] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [vehiclesMap, setVehiclesMap] = useState<Record<string, Vehicle>>({});
    const [selectedBooking, setSelectedBooking] = useState<Lead | null>(null);

    const fetchData = async () => {
        try {
            const [leadsData, vehiclesData] = await Promise.all([
                leadsService.getLeads(),
                vehicleService.getAll().catch(() => [])
            ]);
            
            // Filter only leads that have a preferred date time (Bookings)
            const bookingsData = leadsData.filter(l => l.preferredDateTime && l.status !== 'cancelled');
            
            const vMap: Record<string, Vehicle> = {};
            vehiclesData.forEach((v: Vehicle) => {
                if (v._id) vMap[v._id] = v;
                if (v.id) vMap[v.id] = v;
            });
            
            setVehiclesMap(vMap);
            setBookings(bookingsData);
        } catch (err) {
            toast.error("Failed to load test drives");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const updated = await leadsService.updateLead(id, { status });
            setBookings(prev => prev.map(b => (b._id || b.id) === id ? updated : b));
            if (selectedBooking && (selectedBooking._id || selectedBooking.id) === id) {
                setSelectedBooking(updated);
            }
            toast.success(`Booking ${status}`);
        } catch {
            toast.error("Status update failed");
        }
    };

    const isOverdue = (dateStr?: string) => {
        if (!dateStr) return false;
        // Basic check: if it contains a day name from the past, or if we can parse it
        // Since Gemini returns localized strings, we'll try a fuzzy approach or simple date check
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return false; 
            return isPast(date) && !isToday(date);
        } catch { return false; }
    };

    const filteredBookings = bookings.filter(b => {
        const vehicle = b.vehicleId ? vehiclesMap[b.vehicleId] : null;
        const vehicleInfo = vehicle ? `${vehicle.attributes.brand} ${vehicle.attributes.model} ${vehicle.attributes.car_code}`.toLowerCase() : '';
        const searchTerm = search.toLowerCase();
        
        return (
            b.name?.toLowerCase().includes(searchTerm) || 
            b.phone?.includes(searchTerm) ||
            vehicleInfo.includes(searchTerm)
        );
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Fetching Schedule...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Test Drive Board
                        <span className="bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full uppercase">
                            {bookings.length} Active
                        </span>
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Manage showroom appointments and test drives</p>
                </div>

                <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 transition-colors group-focus-within:text-indigo-600" />
                    <input 
                        type="text"
                        placeholder="Search by customer or car..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {filteredBookings.length === 0 ? (
                        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                             <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No bookings found</p>
                        </div>
                    ) : (
                        filteredBookings.map((booking) => {
                            const vehicle = booking.vehicleId ? vehiclesMap[booking.vehicleId] : null;
                            const isSelected = selectedBooking?._id === booking._id;

                            return (
                                <div 
                                    key={booking._id}
                                    onClick={() => setSelectedBooking(booking)}
                                    className={cn(
                                        "bg-white rounded-3xl p-6 border transition-all cursor-pointer group hover:shadow-xl hover:shadow-slate-200/50 flex items-start gap-6",
                                        isSelected ? "border-indigo-600 ring-2 ring-indigo-50" : "border-slate-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg",
                                        booking.status === 'rescheduled' ? "bg-amber-500 shadow-amber-100" : "bg-indigo-600 shadow-indigo-100"
                                    )}>
                                        <Calendar size={28} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase truncate">
                                                {booking.name || booking.phone}
                                            </h3>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                                booking.status === 'rescheduled' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                            )}>
                                                {booking.status === 'rescheduled' ? 'Rescheduled' : 'Confirmed'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                            <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                {booking.preferredDateTime}
                                            </p>
                                            <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                                <Car size={14} className="text-slate-400" />
                                                {vehicle ? `${vehicle.attributes.brand} ${vehicle.attributes.model}` : 'Loading...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Side Panel / Detail Section */}
                <div className="sticky top-28 h-fit">
                    {selectedBooking ? (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                                    <User size={40} className="text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                    {selectedBooking.name || 'Unknown Prospect'}
                                </h2>
                                <p className="text-slate-400 font-bold text-xs flex items-center justify-center gap-2 mt-1">
                                    <Phone size={12} />
                                    {selectedBooking.phone}
                                </p>
                            </div>

                            <div className="bg-slate-50/50 rounded-3xl p-6 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Interested In</label>
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                            <Car size={24} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 uppercase text-sm">
                                                {selectedBooking.vehicleId ? 
                                                    (vehiclesMap[selectedBooking.vehicleId]?.attributes?.brand && vehiclesMap[selectedBooking.vehicleId]?.attributes?.model ? 
                                                        `${vehiclesMap[selectedBooking.vehicleId].attributes.brand} ${vehiclesMap[selectedBooking.vehicleId].attributes.model}` : 
                                                        'N/A') 
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                ID: {selectedBooking.vehicleId ? vehiclesMap[selectedBooking.vehicleId]?.attributes?.car_code || 'N/A' : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Scheduled Time</label>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="font-black text-indigo-600 text-lg tracking-tight">
                                            {selectedBooking.preferredDateTime}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pb-4">
                                <button 
                                    onClick={() => handleUpdateStatus(selectedBooking._id || selectedBooking.id, 'completed')}
                                    className="flex flex-col items-center gap-2 p-6 bg-emerald-50 text-emerald-600 rounded-[2rem] hover:bg-emerald-600 hover:text-white transition-all group active:scale-95"
                                >
                                    <CheckCircle2 size={24} className="group-hover:scale-125 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Complete</span>
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(selectedBooking._id || selectedBooking.id, 'noshow')}
                                    className="flex flex-col items-center gap-2 p-6 bg-slate-50 text-slate-600 rounded-[2rem] hover:bg-slate-900 hover:text-white transition-all group active:scale-95"
                                >
                                    <XCircle size={24} className="group-hover:scale-125 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">No Show</span>
                                </button>
                            </div>

                            <button
                                onClick={() => handleUpdateStatus(selectedBooking._id || selectedBooking.id, 'cancelled')}
                                className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                            >
                                Cancel Booking
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100 flex flex-col items-center justify-center h-full min-h-[400px]">
                            <TrendingUp className="text-slate-200 mb-6" size={64} />
                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Select Appointment</h3>
                            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest leading-relaxed">Click any card on the left to manage the test drive session</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
