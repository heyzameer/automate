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
    CheckCircle
} from 'lucide-react';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';

export default function VehicleDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const fetchVehicle = async () => {
        if (!id) return;
        try {
            const data = await vehicleService.getById(id);
            setVehicle(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load vehicle details');
            navigate(ROUTES.VEHICLES.BASE);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicle();
    }, [id]);

    const handleStatusUpdate = async (newStatus: Vehicle['status']) => {
        if (!id || !vehicle) return;
        try {
            setActionLoading(true);
            await vehicleService.update(id, { status: newStatus } as any);
            toast.success(`Vehicle marked as ${newStatus}`);
            await fetchVehicle();
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

        try {
            setActionLoading(true);
            await vehicleService.delete(id);
            toast.success('Listing deleted successfully');
            navigate(ROUTES.VEHICLES.BASE);
        } catch (error) {
            toast.error('Failed to delete listing');
        } finally {
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

    // Helper to get attribute safely
    const attr = (key: string) => vehicle.attributes?.[key];
    
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

    // List of keys already displayed in the main section to avoid redundancy
    const displayedKeys = [
        'brand', 'model', 'price', 'year_of_manufacture', 'manufacturing_year', 
        'km', 'kilometers', 'fuel_type', 'transmission', 'ownership', 
        'city', 'area', 'variant', 'name'
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(ROUTES.VEHICLES.BASE)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vehicleName}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium text-xs uppercase tracking-wide">{attr('body_type') || vehicle.type || 'Vehicle'}</span>
                            <span>•</span>
                            <span>Added on {new Date(vehicle.createdAt || new Date()).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleShare} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    <button 
                        onClick={() => navigate(`${ROUTES.VEHICLES.BASE}/edit/${vehicle._id || vehicle.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20 transition-colors"
                    >
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
                        <div className="aspect-video bg-gray-100 relative group/main">
                            <img
                                src={vehicle.images?.[selectedImageIndex] || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80'}
                                alt={vehicleName}
                                className="w-full h-full object-cover transition-all duration-500 group-hover/main:scale-105"
                            />
                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-md shadow-sm ${vehicle.status === 'available' ? 'bg-green-500/90 text-white' :
                                        vehicle.status === 'sold' ? 'bg-blue-500/90 text-white' : 'bg-orange-500/90 text-white'
                                    } capitalize`}>
                                    {vehicle.status}
                                </span>
                            </div>
                        </div>
                        {vehicle.images && vehicle.images.length > 0 && (
                            <div className="p-4 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                {vehicle.images.map((imgUrl, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedImageIndex(i)}
                                        className={`w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                            i === selectedImageIndex 
                                            ? 'border-blue-600 ring-2 ring-blue-100 scale-95 shadow-lg' 
                                            : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`thumbnail ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Specifications */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Details</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Make Year</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {year}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Kilometers</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Gauge className="w-4 h-4 text-gray-400" />
                                    {Number(km).toLocaleString()} km
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Fuel Type</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Fuel className="w-4 h-4 text-gray-400" />
                                    {fuel}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Transmission</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <Settings className="w-4 h-4 text-gray-400" />
                                    {transmission}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Ownership</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {ownership}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Location</p>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {location}
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Attributes */}
                        {vehicle.attributes && Object.keys(vehicle.attributes).length > 0 && (
                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Additional Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4">
                                    {Object.entries(vehicle.attributes)
                                        .filter(([key]) => !displayedKeys.includes(key))
                                        .map(([key, value]) => {
                                        // Format the key (e.g., "exterior_color" -> "Exterior Color")
                                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <div key={key}>
                                                <p className="text-xs text-gray-500 mb-1">{formattedKey}</p>
                                                <p className="font-medium text-gray-900">{String(value)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Price & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Selling Price</p>
                        <h2 className="text-3xl font-bold text-blue-600 mb-6">₹ {price.toLocaleString('en-IN')}</h2>

                        <div className="space-y-3">
                            <button className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20">
                                <MessageCircle className="w-5 h-5" />
                                Test WhatsApp Auto-Reply
                            </button>
                            {vehicle.status !== 'sold' ? (
                                <button 
                                    onClick={() => handleStatusUpdate('sold')}
                                    disabled={actionLoading}
                                    className="w-full py-3 px-4 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Mark as Sold'}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleStatusUpdate('available')}
                                    disabled={actionLoading}
                                    className="w-full py-3 px-4 bg-blue-50 text-blue-700 rounded-xl font-medium flex items-center justify-center gap-2 border border-blue-100 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-blue-600" />
                                            Sold - Mark Available
                                        </>
                                    )}
                                </button>
                            )}
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

                    <button 
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 p-2 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete Listing
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
