import React, { useState } from 'react';
import Skeleton from '../../components/Common/Skeleton';
import {
    Search,
    Plus,
    MoreVertical,
    MapPin,
    Calendar,
    Gauge,
    Fuel,
    Bike,
    Car,
    Loader2,
    LayoutGrid,
    LayoutList,
    Edit,
    Trash2,
    QrCode,
    X,
    Download,
    Printer,
    Eye,
    EyeOff,
    AlertCircle,
    Settings,
    Tag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useVehicles } from '../../hooks/useVehicles';
import { Vehicle } from '../../services/vehicle.service';
import { leadsService } from '../../services/leads.service';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface VehicleCardProps {
    vehicle: Vehicle;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onToggleDelist: (id: string) => void;
    onGetQR: (carCode: string, name: string) => void;
}


const VehicleCard = ({ vehicle, onDelete, onToggleDelist, onGetQR }: VehicleCardProps) => {
    const navigate = useNavigate();
    const attr = (key: string) => vehicle.attributes?.[key] || 'N/A';
    
    const price = Number(attr('price')) || vehicle.price || 0;
    const year = attr('year_of_manufacture') || vehicle.year || 'N/A';
    const km = attr('km') || vehicle.km_driven || 0;
    const name = `${attr('brand') || vehicle.name || ''} ${attr('model') || ''}`.trim() || 'Untitled Vehicle';
    const carCode = vehicle.attributes?.car_code || vehicle._id?.slice(-6).toUpperCase() || 'NA';

    return (
        <div className="group bg-white rounded-[2rem] p-4 border border-slate-200/60 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-indigo-200/40 hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <div 
                onClick={() => navigate(ROUTES.VEHICLES.DETAIL(vehicle._id || ''))}
                className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-slate-50 cursor-pointer shadow-inner shadow-slate-100"
            >
                {vehicle.images?.[0] ? (
                    <>
                        <img
                            src={vehicle.images[0]}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/5 to-transparent opacity-60"></div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/50 group-hover:bg-indigo-50/50 transition-colors duration-500">
                        <Car className="w-16 h-16 text-slate-200 group-hover:text-indigo-200" />
                    </div>
                )}
                
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg flex items-center gap-1.5 border",
                        vehicle.status === 'available' ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/20' :
                        vehicle.status === 'sold' ? 'bg-slate-800/90 text-white border-slate-700/50 shadow-slate-900/20' : 
                        vehicle.status === 'booked' ? 'bg-amber-500/90 text-white border-amber-400/50 shadow-amber-500/20' :
                        'bg-slate-400/90 text-white border-slate-300/50'
                    )}>
                        <div className={`w-1.5 h-1.5 rounded-full ${vehicle.status === 'sold' ? 'bg-slate-400' : 'bg-white animate-pulse'}`}></div>
                        {vehicle.status === 'booked' ? 'Booked' : vehicle.status}
                    </span>
                    {vehicle.isDelisted && (
                        <span className="px-3 py-1.5 rounded-full bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg border border-rose-400/50 flex items-center gap-1.5">
                            <EyeOff size={10} />
                            Delisted
                        </span>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-widest drop-shadow-md">STOCK ID: {carCode}</p>
                    </div>
                </div>
            </div>

            <div className="pt-5 px-2 flex-1 flex flex-col">
                <div className="flex flex-col mb-4">
                    <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-xl leading-tight">
                        {name}
                    </h3>
                </div>

                <div className="flex items-end gap-1 mb-5">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">₹{price.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-6 mt-auto">
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50/50 border border-slate-100 p-2 rounded-xl">
                        <Calendar size={14} className="text-indigo-400 flex-shrink-0" />
                        <span className="font-bold text-[10px] uppercase tracking-wider truncate">{year}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50/50 border border-slate-100 p-2 rounded-xl">
                        <Gauge size={14} className="text-indigo-400 flex-shrink-0" />
                        <span className="font-bold text-[10px] uppercase tracking-wider truncate">{Number(km).toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50/50 border border-slate-100 p-2 rounded-xl">
                        <Fuel size={14} className="text-indigo-400 flex-shrink-0" />
                        <span className="font-bold text-[10px] uppercase tracking-wider truncate">{attr('fuel_type') || attr('fuel') || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50/50 border border-slate-100 p-2 rounded-xl">
                        <Settings size={14} className="text-indigo-400 flex-shrink-0" />
                        <span className="font-bold text-[10px] uppercase tracking-wider truncate">{attr('transmission') || 'N/A'}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onGetQR(carCode, name); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                    >
                        <QrCode size={14} />
                        Sticker
                    </button>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link 
                            to={`${ROUTES.VEHICLES.BASE}/edit/${vehicle._id || vehicle.id}`}
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-sky-500 hover:text-white hover:shadow-lg hover:shadow-sky-200 transition-all"
                        >
                            <Edit size={16} />
                        </Link>
                        <button 
                            onClick={(e) => onDelete(vehicle._id || vehicle.id!, e)}
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-200 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleDelist(vehicle._id || vehicle.id!); }}
                            title={vehicle.isDelisted ? "List on Bot" : "Delist from Bot"}
                            className={cn(
                                "p-3 rounded-xl transition-all shadow-sm",
                                vehicle.isDelisted 
                                    ? "bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white shadow-amber-100" 
                                    : "bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white shadow-indigo-100"
                            )}
                        >
                            {vehicle.isDelisted ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function VehicleList() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [brandFilter, setBrandFilter] = useState('All');
    const [qrData, setQrData] = useState<{ src: string, code: string, name: string } | null>(null);
    const [generatingQr, setGeneratingQr] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
    const { vehicles, loading, deleteVehicle, toggleDelist } = useVehicles();

    const handleGetQR = async (carCode: string, vehicleName: string) => {
        setGeneratingQr(true);
        try {
            const dataUrl = await leadsService.getQRCode(carCode);
            setQrData({ src: dataUrl, code: carCode, name: vehicleName });
        } catch (error) {
            toast.error("Failed to generate QR sticker");
        } finally {
            setGeneratingQr(false);
        }
    };

    const uniqueBrands = Array.from(new Set(Array.isArray(vehicles) ? vehicles.map(v => v.attributes?.brand || 'Other') : [])).filter(Boolean);

    const filteredVehicles = Array.isArray(vehicles) ? vehicles.filter(v => {
        const carCode = v.attributes?.car_code || '';
        const name = `${v.attributes?.brand || ''} ${v.attributes?.model || ''} ${carCode}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase()) || 
                           (v.attributes?.variant || '').toLowerCase().includes(search.toLowerCase());
        
        let matchStatus = false;
        if (statusFilter === 'All') {
            matchStatus = true;
        } else if (statusFilter === 'delisted') {
            matchStatus = !!v.isDelisted;
        } else {
            matchStatus = v.status === statusFilter && !v.isDelisted;
        }
        
        const matchBrand = brandFilter === 'All' || (v.attributes?.brand || 'Other') === brandFilter;

        return matchSearch && matchStatus && matchBrand;
    }).sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) : [];

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setVehicleToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!vehicleToDelete) return;
        await deleteVehicle(vehicleToDelete);
        setDeleteModalOpen(false);
        setVehicleToDelete(null);
    };

    const downloadCustomQR = (src: string, code: string, name: string) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const padding = 40;
            const textHeight = 80;
            canvas.width = img.width + padding * 2;
            canvas.height = img.height + padding * 2 + textHeight;

            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, padding, padding);

                ctx.fillStyle = '#0f172a'; // slate-900
                ctx.textAlign = 'center';
                
                // Draw Vehicle Name
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText(name, canvas.width / 2, canvas.height - 60);
                
                // Draw Car Code
                ctx.fillStyle = '#64748b'; // slate-500
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(`STOCK ID: ${code}`, canvas.width / 2, canvas.height - 30);

                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `${code}_${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                link.href = dataUrl;
                link.click();
            }
        };
        img.src = src;
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-card p-8 rounded-[2.5rem] border-white/50 text-center sm:text-left">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Showroom <span className="premium-gradient-text">Inventory</span></h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">Manage listings and generate Smart Stickers</p>
                </div>
                <Link 
                    to={ROUTES.VEHICLES.ADD} 
                    className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Vehicle
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="relative glass-card p-1 flex-1 rounded-3xl border-white/40 focus-within:border-indigo-400 transition-all group shadow-sm">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Brand, Model, Variant, or exact Stock Code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 bg-transparent text-slate-900 font-bold placeholder:text-slate-400 outline-none"
                    />
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-6 py-4 bg-white/50 backdrop-blur-md rounded-3xl border border-white/40 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none shadow-sm min-w-[150px]"
                    >
                        <option value="All">All Statuses</option>
                        <option value="available">🟢 Available</option>
                        <option value="booked">🟠 Booked</option>
                        <option value="sold">🔵 Sold</option>
                        <option value="delisted">⛔ Delisted</option>
                    </select>

                    <select 
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="px-6 py-4 bg-white/50 backdrop-blur-md rounded-3xl border border-white/40 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none shadow-sm min-w-[150px]"
                    >
                        <option value="All">All Brands</option>
                        {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>

            <ConfirmModal 
                isOpen={deleteModalOpen}
                title="Delete Vehicle"
                message="Are you sure you want to delete this vehicle? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setVehicleToDelete(null);
                }}
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-card rounded-[2rem] overflow-hidden border-white/40">
                            <Skeleton height="200px" />
                            <div className="p-6 space-y-4">
                                <Skeleton height="24px" width="70%" />
                                <Skeleton height="16px" width="40%" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton height="40px" />
                                    <Skeleton height="40px" />
                                </div>
                                <div className="pt-4 flex justify-between">
                                    <Skeleton height="35px" width="120px" />
                                    <Skeleton height="35px" width="80px" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredVehicles.map(vehicle => (
                        <VehicleCard 
                            key={vehicle._id || vehicle.id} 
                            vehicle={vehicle} 
                            onDelete={handleDeleteClick}
                            onToggleDelist={toggleDelist}
                            onGetQR={handleGetQR}
                        />
                    ))}
                </div>
            )}

            {/* QR Sticker Modal */}
            {(qrData || generatingQr) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900">Smart Sticker Generator</h3>
                            <button onClick={() => setQrData(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-10 flex flex-col items-center text-center">
                            {generatingQr ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Generating Secure Link...</p>
                                </div>
                            ) : qrData && (
                                <>
                                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-8 relative group">
                                        <img src={qrData.src} alt="QR Code" className="w-56 h-56 mix-blend-multiply" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Ready to Print</p>
                                        </div>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900">{qrData.name}</h4>
                                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest italic">STOCK ID: {qrData.code}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 w-full mt-10">
                                        <button 
                                            onClick={() => window.print()}
                                            className="flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                                        >
                                            <Printer size={18} />
                                            Print Sticker
                                        </button>
                                        <button 
                                            onClick={() => downloadCustomQR(qrData.src, qrData.code, qrData.name)}
                                            className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                                        >
                                            <Download size={18} />
                                            Download
                                        </button>
                                    </div>
                                    <p className="mt-6 text-[10px] font-bold text-slate-400 max-w-xs leading-relaxed">
                                        Paste this QR on your car window. Customers scanning this will see all specs and added to your CRM as a hot lead.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
