import React from 'react';
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
    CheckCircle
} from 'lucide-react';
import { vehicles } from '../../lib/data';

export default function VehicleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const vehicle = vehicles.find(v => v.id === parseInt(id)) || vehicles[0]; // Fallback to first vehicle if not found

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/vehicles')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium text-xs uppercase tracking-wide">{vehicle.type}</span>
                            <span>•</span>
                            <span>Added on {new Date(vehicle.date_added).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20 transition-colors">
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit Details</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content: Gallery & status */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="aspect-video bg-gray-100 relative">
                            <img
                                src={vehicle.image}
                                alt={vehicle.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-md shadow-sm ${vehicle.status === 'Available' ? 'bg-green-500/90 text-white' :
                                        vehicle.status === 'Sold' ? 'bg-blue-500/90 text-white' : 'bg-orange-500/90 text-white'
                                    }`}>
                                    {vehicle.status}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 flex gap-2 overflow-x-auto pb-4">
                            {[1, 2, 3, 4].map((_, i) => (
                                <div key={i} className={`w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer ${i === 0 ? 'border-blue-600' : 'border-transparent'}`}>
                                    <img
                                        src={vehicle.image}
                                        alt="thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Details</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Make Year</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {vehicle.year}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Kilometers</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Gauge className="w-4 h-4 text-gray-400" />
                                    {vehicle.km_driven.toLocaleString()} km
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Fuel Type</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Fuel className="w-4 h-4 text-gray-400" />
                                    {vehicle.fuel}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Transmission</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Settings className="w-4 h-4 text-gray-400" />
                                    {vehicle.transmission}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Ownership</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {vehicle.ownership}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Location</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {vehicle.location}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Price & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Selling Price</p>
                        <h2 className="text-3xl font-bold text-blue-600 mb-6">₹ {vehicle.price.toLocaleString('en-IN')}</h2>

                        <div className="space-y-3">
                            <button className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20">
                                <MessageCircle className="w-5 h-5" />
                                Test WhatsApp Auto-Reply
                            </button>
                            <button className="w-full py-3 px-4 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors">
                                Mark as Sold
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Recent Enquiries</h3>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">3 New</span>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                        JD
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">John Doe</p>
                                        <p className="text-xs text-gray-500">Is this available?</p>
                                    </div>
                                    <span className="text-xs text-gray-400 ml-auto">2h</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 text-sm text-blue-600 font-medium hover:text-blue-700">
                            View All Enquiries
                        </button>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 p-2 text-sm font-medium transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Delete Listing
                    </button>
                </div>
            </div>
        </div>
    );
}
