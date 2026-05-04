import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Share2,
    MessageCircle,
    Edit,
    Trash2,
    MapPin,
    Calendar,
    Gauge,
    Fuel,
    Settings,
    User,
    Loader2,
    CheckCircle,
    IndianRupee,
    TrendingUp,
    History,
    ShieldAlert,
    Clock,
    Info,
    RotateCw,
    Maximize2,
    X as CloseIcon
} from 'lucide-react';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import { leadsService, Lead } from '../../services/leads.service';
import { campaignsService } from '../../services/campaigns.service';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';
import SpinViewer from '../../components/Vehicles/SpinViewer';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function VehicleDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [is360Active, setIs360Active] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);

    const fetchVehicleData = async () => {
        if (!id) return;
        try {
            const [vData, lData] = await Promise.all([
                vehicleService.getById(id),
                leadsService.getLeadsByVehicle(id)
            ]);
            setVehicle(vData);
            setLeads(lData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load vehicle details');
            navigate(ROUTES.VEHICLES.BASE);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicleData();
    }, [id]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowFullscreen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleStatusUpdate = async (newStatus: Vehicle['status'], details?: string) => {
        if (!id || !vehicle) return;
        try {
            setActionLoading(true);
            const payload: any = { status: newStatus };
            
            if (details !== undefined) {
                payload.bookingDetails = details;
            } else if (newStatus !== 'booked') {
                payload.bookingDetails = ''; // Clear if not booked
            }

            await vehicleService.update(id, payload);
            toast.success(`Vehicle marked as ${newStatus}`);
            setIsBookModalOpen(false);
            await fetchVehicleData();
        } catch (error: any) {
            console.error('Status update failed:', error);
            toast.error(`Failed to update status: ${error.message || 'Unknown error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBroadcast = async () => {
        if (!vehicle) return;
        try {
            setActionLoading(true);
            const name = `${attr('brand') || ''} ${attr('model') || ''} ${attr('variant') || ''}`.trim() || vehicle.name;
            await campaignsService.createCampaign({
                name: `Broadcast: ${name}`,
                type: 'whatsapp',
                audience: 'all',
                message: `🔥 NEW ARRIVAL: ${name}\n\n💰 Price: ₹${price.toLocaleString('en-IN')}\n🛣️ KM: ${Number(km).toLocaleString()}\n⛽ Fuel: ${fuel}\n\nInterested? Click below to chat with us!`,
                vehicleId: vehicle._id || vehicle.id,
                status: 'draft'
            });
            toast.success('Campaign draft created! Redirecting...');
            setTimeout(() => navigate(ROUTES.MARKETING.CAMPAIGNS), 1500);
        } catch (error: any) {
            console.error('Broadcast trigger failed:', error);
            toast.error('Failed to trigger broadcast draft');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!id) return;

        try {
            setActionLoading(true);
            await vehicleService.delete(id);
            toast.success('Listing deleted successfully');
            navigate(ROUTES.VEHICLES.BASE);
        } catch (error) {
            toast.error('Failed to delete listing');
            setActionLoading(false);
        }
    };


    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: vehicleName,
                text: `Check out this ${vehicleName} on CarBot`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading vehicle details...</p>
            </div>
        );
    }

    if (!vehicle) return null;

    const handleToggleDelist = async () => {
        if (!id || !vehicle) return;
        try {
            setActionLoading(true);
            await vehicleService.toggleDelist(id);
            toast.success(`Vehicle ${vehicle.isDelisted ? 'listed on' : 'hidden from'} bot`);
            await fetchVehicleData();
        } catch (error: any) {
            console.error('Delist toggle failed:', error);
            toast.error('Failed to update bot visibility');
        } finally {
            setActionLoading(false);
        }
    };

    // Helper to get attribute safely
    const attr = (key: string) => vehicle.attributes?.[key];
    const spinImages = vehicle.spin_images?.length ? vehicle.spin_images : (attr('spin_images') || attr('Spin Images') || []);
    
    const vehicleName = `${attr('brand') || ''} ${attr('model') || ''}`.trim() || vehicle.name || 'Untitled Vehicle';
    const price = Number(attr('price')) || vehicle.price || 0;
    const year = attr('year_of_manufacture') || attr('manufacturing_year') || vehicle.year || 'N/A';
    const km = attr('km') || attr('kilometers') || vehicle.km_driven || 0;
    const fuel = attr('fuel_type') || vehicle.fuel || 'N/A';
    const transmission = attr('transmission') || vehicle.transmission || 'N/A';
    const ownership = attr('ownership') || vehicle.ownership || 'N/A';
    const city = attr('city') || vehicle.city;
    const area = attr('area') || vehicle.area;
    const location = area ? `${area}, ${city}` : city || 'Not specified';

    // Financial calculations
    const purchasePrice = Number(vehicle.purchasePrice) || 0;
    const refurbishmentCost = Number(vehicle.refurbishmentCost) || 0;
    const otherExpenses = Number(vehicle.otherExpenses) || 0;
    const totalCost = purchasePrice + refurbishmentCost + otherExpenses;
    const profit = price - totalCost;
    const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    // Aging calculation
    const daysInStock = differenceInDays(new Date(), new Date(vehicle.createdAt || new Date()));
    const insuranceExpiry = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null;
    const isInsuranceExpired = insuranceExpiry ? insuranceExpiry < new Date() : false;
    const insuranceDaysLeft = insuranceExpiry ? differenceInDays(insuranceExpiry, new Date()) : null;

    const rcExpiry = vehicle.rcExpiry ? new Date(vehicle.rcExpiry) : null;
    const isRCExpired = rcExpiry ? rcExpiry < new Date() : false;
    const rcDaysLeft = rcExpiry ? differenceInDays(rcExpiry, new Date()) : null;

    // List of keys to exclude from "Advanced Specifications" (because they have dedicated large sections)
    const displayedKeys = [
        'name', 'images', 'spin_images', 'service_history', 'bookingDetails', 'car_code'
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate(ROUTES.VEHICLES.BASE)} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{vehicleName}</h1>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest border border-indigo-100">
                                {attr('car_code') || 'STOCK-NA'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                            <span className="uppercase tracking-widest">{attr('body_type') || vehicle.type || 'Vehicle'}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            <span>Added {format(new Date(vehicle.createdAt || new Date()), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleShare} className="p-4 bg-white border border-slate-100 shadow-sm text-slate-600 rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => navigate(`${ROUTES.VEHICLES.BASE}/edit/${vehicle._id || vehicle.id}`)}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Listing
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Content: Gallery & status */}
                <div className="lg:col-span-8 space-y-8">
                    {/* View Switcher Overlay (Floating) */}
                    {spinImages.length > 0 && (
                        <div className="flex justify-center -mb-4 relative z-10">
                            <div className="bg-white/80 backdrop-blur-xl border border-slate-100 p-1.5 rounded-2xl shadow-2xl flex gap-1">
                                <button 
                                    onClick={() => setIs360Active(false)}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                        !is360Active ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                                    )}
                                >
                                    Gallery
                                </button>
                                <button 
                                    onClick={() => {
                                        setIs360Active(true);
                                        toast.success('360° View Ready! Drag to spin.', { icon: '🔄', duration: 2000 });
                                    }}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                                        is360Active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 hover:text-indigo-600"
                                    )}
                                >
                                    <RotateCw size={12} className={is360Active ? "animate-spin-slow" : ""} />
                                    360° Spin
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Image Gallery / 360 Viewer */}
                    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 relative group">
                        <button 
                            onClick={() => setShowFullscreen(true)}
                            className="absolute top-6 right-6 z-20 p-4 bg-white/20 backdrop-blur-xl rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 shadow-2xl"
                        >
                            <Maximize2 size={20} />
                        </button>

                        {is360Active && spinImages.length > 0 ? (
                            <SpinViewer images={spinImages} className="aspect-[16/9]" />
                        ) : (
                            <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                                <img
                                    src={vehicle.images?.[selectedImageIndex] || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&crop=80'}
                                    alt={vehicleName}
                                    onClick={() => setShowFullscreen(true)}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
                                />
                                <div className="absolute top-6 left-6 flex gap-2">
                                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-xl border ${
                                        vehicle.status === 'available' ? 'bg-emerald-500/90 text-white border-emerald-400' :
                                        vehicle.status === 'sold' ? 'bg-slate-900/90 text-white border-slate-700' : 
                                        vehicle.status === 'booked' ? 'bg-amber-500/90 text-white border-amber-400' :
                                        'bg-slate-400/90 text-white border-slate-300'
                                    }`}>
                                        {vehicle.status === 'booked' ? 'Booked' : vehicle.status}
                                    </span>
                                    {daysInStock > 30 && (
                                        <span className="px-4 py-2 bg-rose-500/90 text-white border border-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-xl flex items-center gap-2">
                                            <Clock size={12} />
                                            High Aging: {daysInStock} Days
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {!is360Active && vehicle.images && vehicle.images.length > 0 && (
                            <div className="p-6 flex gap-4 overflow-x-auto custom-scrollbar bg-slate-50/50">
                                {vehicle.images.map((imgUrl, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedImageIndex(i)}
                                        className={`w-24 h-24 flex-shrink-0 rounded-[1.25rem] overflow-hidden border-4 transition-all duration-300 ${
                                            i === selectedImageIndex 
                                            ? 'border-indigo-600 scale-105 shadow-xl' 
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={imgUrl} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>


                    {/* Operations & Documents Overview */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lifecycle & Documents</h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Details</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] flex items-center gap-1.5"><History size={12} /> Age in Stock</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">{daysInStock} d</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] flex items-center gap-1.5"><Calendar size={12} /> Reg Year</p>
                                <p className="text-xl font-black text-slate-900 mt-1 break-all leading-tight">{attr('registration_year') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] flex items-center gap-1.5"><ShieldAlert size={12} /> Insurance</p>
                                <p className={`text-xl font-black mt-1 ${isInsuranceExpired ? 'text-rose-500' : 'text-slate-900'}`}>
                                    {insuranceExpiry ? format(insuranceExpiry, 'dd MMM yyyy') : 'N/A'}
                                </p>
                                {insuranceDaysLeft !== null && (
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${insuranceDaysLeft < 0 ? 'text-rose-500' : insuranceDaysLeft < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {insuranceDaysLeft < 0 ? 'Expired' : `${insuranceDaysLeft} d`}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] flex items-center gap-1.5"><CheckCircle size={12} /> RC Expiry</p>
                                <p className={`text-xl font-black mt-1 ${isRCExpired ? 'text-rose-500' : 'text-slate-900'}`}>
                                    {rcExpiry ? format(rcExpiry, 'dd MMM yyyy') : 'N/A'}
                                </p>
                                {rcDaysLeft !== null && (
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${rcDaysLeft < 0 ? 'text-rose-500' : rcDaysLeft < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {rcDaysLeft < 0 ? 'Expired' : `${rcDaysLeft} d`}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] flex items-center gap-1.5"><TrendingUp size={12} /> Profit Projection</p>
                                <p className={`text-2xl font-black mt-1 ${profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    ₹{Math.abs(Math.round(profit/1000))}k
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details Card (Conditional) */}
                    {vehicle.status === 'booked' && (
                        <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-10 relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <Info size={120} className="text-amber-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                            <Info size={20} />
                                        </div>
                                        Active Booking Details
                                    </h2>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsBookModalOpen(true)}
                                            className="px-6 py-3 bg-white text-amber-600 border border-amber-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <Edit size={14} />
                                            {vehicle.bookingDetails ? 'Edit' : 'Add Details'}
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate('available', '')}
                                            className="px-6 py-3 bg-white text-rose-500 border border-amber-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                            Release
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 bg-white/60 backdrop-blur-md rounded-[2rem] border border-amber-200/50 shadow-sm">
                                    {vehicle.bookingDetails ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Booking Notes & Customer Info</p>
                                            <p className="text-2xl font-bold text-amber-900 leading-tight">
                                                {vehicle.bookingDetails}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-sm font-bold text-amber-600/60 uppercase tracking-widest mb-4">No booking details recorded yet</p>
                                            <button 
                                                onClick={() => setIsBookModalOpen(true)}
                                                className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95"
                                            >
                                                Add Booking Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-4 text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] px-2">
                                    Note: This vehicle is still visible on the bot but marked as booked.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Specifications */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Technical Overview</h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Details</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Car ID</p>
                                <p className="text-lg font-bold text-slate-900">{attr('car_code') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Brand/Make</p>
                                <p className="text-lg font-bold text-slate-900">{attr('brand') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Model</p>
                                <p className="text-lg font-bold text-slate-900">{attr('model') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Variant/Trim</p>
                                <p className="text-lg font-bold text-slate-900">{attr('variant') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Make Year</p>
                                <p className="text-lg font-bold text-slate-900">{year}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Reg Year</p>
                                <p className="text-lg font-bold text-slate-900">{attr('registration_year') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Fuel Type</p>
                                <p className="text-lg font-bold text-slate-900">{fuel}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Transmission</p>
                                <p className="text-lg font-bold text-slate-900">{transmission}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Kilometers Driven</p>
                                <p className="text-lg font-bold text-slate-900">{Number(km).toLocaleString()} KM</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Ownership</p>
                                <p className="text-lg font-bold text-slate-900">{ownership}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Exterior Color</p>
                                <p className="text-lg font-bold text-slate-900">{attr('exterior_color') || attr('color') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Engine (cc)</p>
                                <p className="text-lg font-bold text-slate-900">{attr('engine_cc') || attr('engine') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Location</p>
                                <p className="text-lg font-bold text-slate-900 truncate">{location}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Plate Number</p>
                                <p className="text-lg font-bold text-slate-900">{attr('plate_number') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">RC Number</p>
                                <p className="text-lg font-bold text-slate-900 break-all line-clamp-1">{vehicle.rcNumber || attr('rc_number') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Price Negotiable?</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {attr('price_negotiable') === 'Yes' || attr('price_negotiable') === true ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>

                        {/* Service History Section */}
                        <div className="mt-12 pt-10 border-t border-slate-100">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <History size={14} />
                                Structured Service History
                            </h3>
                            
                            {vehicle.service_history && vehicle.service_history.length > 0 ? (
                                <div className="space-y-4">
                                    {vehicle.service_history.map((record, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                                                    <Settings className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{record.type}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{format(new Date(record.date), 'dd MMM yyyy')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">₹{record.cost.toLocaleString('en-IN')}</p>
                                                {record.notes && <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{record.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No service records added yet</p>
                                </div>
                            )}
                        </div>

                        {/* Internal Financial Records */}
                        <div className="mt-12 pt-10 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Purchase & Internal Costs</h3>
                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase tracking-widest">Internal Only</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Price</p>
                                    <p className="text-lg font-bold text-slate-900">₹{purchasePrice.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Refurbishment</p>
                                    <p className="text-lg font-bold text-slate-900">₹{refurbishmentCost.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Other Expenses</p>
                                    <p className="text-lg font-bold text-slate-900">₹{otherExpenses.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Landing Cost</p>
                                    <p className="text-lg font-bold text-emerald-600">₹{totalCost.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Attributes */}
                        {vehicle.attributes && Object.keys(vehicle.attributes).length > 0 && (
                            <div className="mt-12 pt-10 border-t border-slate-100 bg-slate-50/30 -mx-10 px-10">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Advanced Specifications</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-8">
                                    {Object.entries(vehicle.attributes)
                                        .filter(([key]) => !displayedKeys.includes(key))
                                        .map(([key, value]) => {
                                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <div key={key}>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{formattedKey}</p>
                                                <p className="text-slate-700 font-bold">{String(value)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Financials & Enquiries */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Valuation Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200">
                        <div className="flex items-center justify-between mb-10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showroom Listing</span>
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                <TrendingUp size={20} className="text-emerald-400" />
                            </div>
                        </div>
                        
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Selling Price</p>
                        <h2 className="text-4xl font-black mb-10 tracking-tight">₹{price.toLocaleString('en-IN')}</h2>

                        <div className="space-y-6 pt-8 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400">Inventory Cost</span>
                                <span className="text-sm font-black">₹{totalCost.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400">Refurbishment</span>
                                <span className="text-sm font-black text-rose-400">₹{refurbishmentCost.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Expected Margin</span>
                                <span className="text-lg font-black text-emerald-400">{Math.round(margin)}%</span>
                            </div>
                        </div>
                        
                        {vehicle.status === 'booked' && vehicle.bookingDetails && (
                            <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl relative group/booking">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Info size={16} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Booking Information</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/booking:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setIsBookModalOpen(true)}
                                            className="p-1.5 hover:bg-amber-500/20 rounded-lg text-amber-600 transition-all"
                                            title="Edit Booking Details"
                                        >
                                            <Edit size={12} />
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate('available', '')}
                                            className="p-1.5 hover:bg-amber-500/20 rounded-lg text-rose-500 transition-all"
                                            title="Clear Booking & Mark Available"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-amber-700 leading-relaxed italic">
                                    "{vehicle.bookingDetails}"
                                </p>
                            </div>
                        )}

                        <div className="mt-10 space-y-4">
                            <button 
                                onClick={handleBroadcast}
                                disabled={actionLoading}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                                Trigger Broadcast
                            </button>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleStatusUpdate(vehicle.status === 'sold' ? 'available' : 'sold')}
                                    disabled={actionLoading}
                                    className={`w-full py-5 border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                                        vehicle.status === 'sold' 
                                        ? 'border-emerald-500 text-emerald-500' 
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {actionLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 
                                     vehicle.status === 'sold' ? 'Mark as Available' : 'Mark as Sold'}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (vehicle.status === 'booked') {
                                            handleStatusUpdate('available');
                                        } else {
                                            setIsBookModalOpen(true);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    className={`w-full py-5 border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                                        vehicle.status === 'booked' 
                                        ? 'border-amber-500 text-amber-500' 
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {actionLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 
                                     vehicle.status === 'booked' ? 'Mark as Available' : 'Mark as Booked'}
                                </button>
                            </div>
                            <button 
                                onClick={handleToggleDelist}
                                disabled={actionLoading}
                                className={`w-full py-5 border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                                    vehicle.isDelisted 
                                    ? 'border-rose-500 text-rose-500 hover:bg-rose-50' 
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 
                                 vehicle.isDelisted ? 'List on WhatsApp Bot' : 'Delist from WhatsApp Bot'}
                            </button>
                        </div>
                    </div>

                    {/* Enquiries Card */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Leads</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{leads.length} Enquiries for this car</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <User size={20} className="text-indigo-600" />
                            </div>
                        </div>

                        <div className="space-y-8">
                            {leads.slice(0, 5).map((lead) => (
                                <div key={lead._id} className="flex items-start gap-4 group cursor-pointer">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all group-hover:scale-110 ${
                                        lead.priority === 'Hot' ? 'bg-rose-50 text-rose-600' :
                                        lead.priority === 'Warm' ? 'bg-amber-50 text-amber-600' :
                                        'bg-slate-50 text-slate-400'
                                    }`}>
                                        {lead.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-black text-slate-900 truncate">{lead.name}</p>
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{format(new Date(lead.createdAt || new Date()), 'dd MMM')}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5">{lead.phone}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[9px] font-black text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                {lead.stage}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {leads.length === 0 && (
                                <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No enquiries yet</p>
                                </div>
                            )}
                        </div>

                        {leads.length > 5 && (
                            <button className="w-full mt-10 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                                View all {leads.length} Leads
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={handleDeleteClick}
                        disabled={actionLoading}
                        className="w-full py-4 text-xs font-black text-rose-400 uppercase tracking-[0.2em] hover:text-rose-600 transition-all flex items-center justify-center gap-3"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Permanently
                    </button>
                </div>
            </div>

            <ConfirmModal 
                isOpen={deleteModalOpen}
                title="Delete Listing"
                message="Are you sure you want to delete this listing? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModalOpen(false)}
                isLoading={actionLoading}
            />

            {/* Fullscreen Overlay Modal */}
            {showFullscreen && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="flex items-center justify-between p-8 text-white">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">{vehicleName}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{is360Active ? '360° Interactive View' : `Photo ${selectedImageIndex + 1} of ${vehicle.images?.length}`}</p>
                        </div>
                        <button 
                            onClick={() => setShowFullscreen(false)}
                            className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                        >
                            <CloseIcon size={24} />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-4 sm:p-12 overflow-hidden">
                        {is360Active ? (
                            <SpinViewer images={spinImages} className="w-full max-w-6xl aspect-[16/9] shadow-2xl scale-110" />
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center group">
                                <img 
                                    src={vehicle.images?.[selectedImageIndex]} 
                                    className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-500"
                                />
                                
                                <div className="absolute inset-x-0 flex justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => setSelectedImageIndex(prev => (prev - 1 + (vehicle.images?.length || 0)) % (vehicle.images?.length || 1))}
                                        className="p-6 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-slate-900 transition-all"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedImageIndex(prev => (prev + 1) % (vehicle.images?.length || 1))}
                                        className="p-6 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-slate-900 transition-all rotate-180"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {!is360Active && (
                        <div className="p-12 flex gap-4 overflow-x-auto justify-center bg-black/20">
                            {vehicle.images?.map((imgUrl, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setSelectedImageIndex(i)}
                                    className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-4 transition-all ${
                                        i === selectedImageIndex ? 'border-indigo-500 scale-110' : 'border-transparent opacity-40 hover:opacity-100'
                                    }`}
                                >
                                    <img src={imgUrl} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <ConfirmModal 
                isOpen={isBookModalOpen}
                title="Booking Details"
                message="Please enter the customer name and booking amount details below."
                confirmText="Confirm Booking"
                onConfirm={(val) => handleStatusUpdate('booked', val)}
                onCancel={() => setIsBookModalOpen(false)}
                showInput={true}
                initialInputValue={vehicle?.bookingDetails || ''}
                inputPlaceholder="e.g. Rahul Sharma, ₹10k deposit, expected delivery next week"
                variant="primary"
            />
        </div>
    );
}
