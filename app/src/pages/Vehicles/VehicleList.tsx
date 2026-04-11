import React, { useState } from 'react';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useVehicles } from '../../hooks/useVehicles';
import { Vehicle } from '../../services/vehicle.service';
import { leadsService } from '../../services/leads.service';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface VehicleCardProps {
    vehicle: Vehicle;
    onDelete: (id: string) => void;
    onGetQR: (carCode: string, name: string) => void;
}

const VehicleCard = ({ vehicle, onDelete, onGetQR }: VehicleCardProps) => {
    const navigate = useNavigate();
    const attr = (key: string) => vehicle.attributes?.[key] || 'N/A';
    
    const price = Number(attr('price'));
    const year = attr('year_of_manufacture');
    const km = attr('km');
    const name = `${attr('brand')} ${attr('model')}`.trim() || 'Untitled Vehicle';
    const carCode = (vehicle as any).stock_number || (vehicle as any).car_code || vehicle._id?.slice(-6).toUpperCase() || 'NA';

    return (
        <div className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-100 border border-gray-100 overflow-hidden transition-all duration-500">
            <div 
                onClick={() => navigate(ROUTES.VEHICLES.DETAIL(vehicle._id || ''))}
                className="relative aspect-[16/10] overflow-hidden bg-gray-50 cursor-pointer"
            >
                {vehicle.images?.[0] ? (
                    <img
                        src={vehicle.images[0]}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 group-hover:bg-indigo-50/50 transition-colors duration-500">
                        <Car className="w-16 h-16 text-gray-200 group-hover:text-indigo-200" />
                    </div>
                )}
                
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold tracking-tight backdrop-blur-md shadow-sm border",
                        vehicle.status === 'available' ? 'bg-emerald-500/90 text-white border-emerald-400' :
                        vehicle.status === 'sold' ? 'bg-indigo-600/90 text-white border-indigo-500' : 
                        'bg-amber-500/90 text-white border-amber-400'
                    )}>
                        {vehicle.status?.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="p-6">
                <div className="flex flex-col gap-1 mb-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-xl tracking-tight">
                        {name}
                    </h3>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">STOCK: {carCode}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black text-indigo-600">₹{price.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold">{year}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold">{Number(km).toLocaleString()} km</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onGetQR(carCode, name); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                    >
                        <QrCode size={14} />
                        SMART STICKER
                    </button>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link 
                            to={`${ROUTES.VEHICLES.BASE}/edit/${vehicle._id || vehicle.id}`}
                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-gray-100"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(vehicle._id || vehicle.id!); }}
                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-gray-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function VehicleList() {
    const [search, setSearch] = useState('');
    const [qrData, setQrData] = useState<{ src: string, code: string, name: string } | null>(null);
    const [generatingQr, setGeneratingQr] = useState(false);
    const { vehicles, loading, deleteVehicle } = useVehicles();

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

    const filteredVehicles = Array.isArray(vehicles) ? vehicles.filter(v => {
        const name = `${v.attributes?.brand || ''} ${v.attributes?.model || ''}`.toLowerCase();
        return name.includes(search.toLowerCase()) || 
               (v.attributes?.variant || '').toLowerCase().includes(search.toLowerCase());
    }) : [];

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            await deleteVehicle(id);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center sm:text-left">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Showroom Inventory</h1>
                    <p className="text-gray-500 font-medium">Manage listings and generate Smart Stickers</p>
                </div>
                <Link 
                    to={ROUTES.VEHICLES.ADD} 
                    className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Vehicle
                </Link>
            </div>

            <div className="relative bg-white p-2 rounded-3xl shadow-sm border border-gray-100 focus-within:border-indigo-300 transition-all max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-transparent text-gray-900 font-bold placeholder:text-gray-400 outline-none"
                />
            </div>

            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Inventory...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredVehicles.map(vehicle => (
                        <VehicleCard 
                            key={vehicle._id || vehicle.id} 
                            vehicle={vehicle} 
                            onDelete={handleDelete}
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
                                        <a 
                                            href={qrData.src} 
                                            download={`Sticker_${qrData.code}.png`}
                                            className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                                        >
                                            <Download size={18} />
                                            Download
                                        </a>
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
