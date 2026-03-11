import React, { useState } from 'react';
import {
    Search,
    Filter,
    Plus,
    MoreVertical,
    MapPin,
    Calendar,
    Gauge,
    Fuel,
    Bike,
    Car
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { vehicles } from '../../lib/data';

const VehicleCard = ({ vehicle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
            <img
                src={vehicle.image}
                alt={vehicle.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${vehicle.status === 'Available' ? 'bg-green-500/90 text-white' :
                        vehicle.status === 'Sold' ? 'bg-blue-500/90 text-white' : 'bg-orange-500/90 text-white'
                    }`}>
                    {vehicle.status}
                </span>
            </div>
            <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 right-3">
                <span className="px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                    {vehicle.type === 'Bike' ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                    {vehicle.type}
                </span>
            </div>
        </div>

        <div className="p-4">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 line-clamp-1 text-lg">{vehicle.name}</h3>
            </div>
            <p className="text-xl font-bold text-blue-600 mb-4">₹ {vehicle.price.toLocaleString('en-IN')}</p>

            <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {vehicle.year}
                </div>
                <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    {vehicle.km_driven.toLocaleString()} km
                </div>
                <div className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5" />
                    {vehicle.fuel}
                </div>
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {vehicle.ownership} Owner
                </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Added {new Date(vehicle.date_added).toLocaleDateString()}</span>
                <span className="text-blue-600 font-medium">{vehicle.enquiries} Enquiries</span>
            </div>
        </div>
    </div>
);

export default function VehicleList() {
    const [filterType, setFilterType] = useState('all');

    const filteredVehicles = filterType === 'all'
        ? vehicles
        : vehicles.filter(v => v.type.toLowerCase() === filterType);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                    <p className="text-sm text-gray-500">Manage your vehicle inventory</p>
                </div>
                <Link to="/vehicles/add" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Vehicle
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, model..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilterType('all')} className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition-colors ${filterType === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>All</button>
                    <button onClick={() => setFilterType('bike')} className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition-colors ${filterType === 'bike' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Bikes</button>
                    <button onClick={() => setFilterType('car')} className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition-colors ${filterType === 'car' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Cars</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
            </div>
        </div>
    );
}
