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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useVehicles } from '../../hooks/useVehicles';
import { Vehicle } from '../../services/vehicle.service';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface VehicleCardProps {
    vehicle: Vehicle;
    onDelete: (id: string) => void;
}

const VehicleCard = ({ vehicle, onDelete }: VehicleCardProps) => {
    const navigate = useNavigate();
    // Helper to get attribute safely
    const attr = (key: string) => vehicle.attributes?.[key] || 'N/A';
    
    const price = Number(attr('price'));
    const year = attr('year_of_manufacture');
    const km = attr('km');
    const fuel = attr('fuel_type');
    const ownership = attr('ownership');
    const name = `${attr('brand')} ${attr('model')}`.trim() || 'Untitled Vehicle';

    return (
        <div className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-100 border border-gray-100 overflow-hidden transition-all duration-500">
            {/* Image Section */}
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
                        <div className="relative">
                            <Car className="w-16 h-16 text-gray-200 group-hover:text-indigo-200 group-hover:scale-110 transition-all duration-700" />
                            <div className="absolute inset-0 blur-2xl bg-indigo-400/10 group-hover:bg-indigo-400/20 transition-all" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 group-hover:text-indigo-400 mt-4 uppercase tracking-[0.2em] transition-colors">No Gallery Images</span>
                    </div>
                )}
                
                {/* Badge Overlay */}
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

            {/* Content Section */}
            <div className="p-6">
                <div className="flex flex-col gap-1 mb-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-xl tracking-tight">
                        {name}
                    </h3>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">{attr('variant') || 'Standard Variant'}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black text-indigo-600">₹{price.toLocaleString('en-IN')}</span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold">{year}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600">
                        <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold">{Number(km).toLocaleString()} km</span>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {attr('plate_number') || 'PENDING REG'}
                    </div>
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
    const { vehicles, loading, deleteVehicle } = useVehicles();

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
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Inventory</h1>
                    <p className="text-gray-500 font-medium">Manage and monitor your digital showroom</p>
                </div>
                <Link 
                    to={ROUTES.VEHICLES.ADD} 
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200/50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 italic" />
                    <Plus className="w-5 h-5 mr-2" />
                    List New Vehicle
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="relative group/search bg-white p-2 rounded-3xl shadow-sm border border-gray-100 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all duration-300 max-w-2xl">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors">
                    <Search />
                </div>
                <input
                    type="text"
                    placeholder="Search by brand, model or variant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-transparent text-gray-900 font-medium placeholder:text-gray-400 outline-none"
                />
            </div>

            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse rounded-full" />
                    </div>
                    <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Inventory</p>
                </div>
            ) : filteredVehicles.length === 0 ? (
                <div className="bg-white rounded-[3rem] py-32 flex flex-col items-center justify-center text-center px-10 border-2 border-dashed border-gray-100 group">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <LayoutGrid className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Inventory Empty</h2>
                    <p className="text-gray-500 max-w-sm mb-10 font-medium">Ready to sell? Start by adding your first vehicle to your digital showroom today.</p>
                    <Link to={ROUTES.VEHICLES.ADD} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-indigo-200 transition-all">
                        Create Initial Listing
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredVehicles.map(vehicle => (
                        <VehicleCard 
                            key={vehicle._id || vehicle.id} 
                            vehicle={vehicle} 
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
