import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
    Bike,
    Car,
    Upload,
    X,
    MapPin,
    Info,
    IndianRupee,
    Save,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

const InputGroup = ({ label, children, required }) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export default function AddVehicle() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [vehicleType, setVehicleType] = useState('bike');
    const [files, setFiles] = useState([]);

    const onDrop = (acceptedFiles) => {
        setFiles(prev => [...prev, ...acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }))]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

    const removeFile = (name) => {
        setFiles(files.filter(f => f.name !== name));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            navigate('/vehicles');
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 font-sans">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
                    <p className="text-sm text-gray-500">Fill in the details to list your vehicle</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Basic Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        Basic Details
                    </h2>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setVehicleType('bike')}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all font-medium",
                                vehicleType === 'bike'
                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                            )}
                        >
                            <Bike className="w-5 h-5" /> Bike
                        </button>
                        <button
                            type="button"
                            onClick={() => setVehicleType('car')}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all font-medium",
                                vehicleType === 'car'
                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                            )}
                        >
                            <Car className="w-5 h-5" /> Car
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Vehicle Name" required>
                            <input type="text" placeholder="e.g. Yamaha R15 V3" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
                        </InputGroup>
                        <InputGroup label="Model Year" required>
                            <input type="number" placeholder="2021" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
                        </InputGroup>
                        <InputGroup label="Registration Number" required>
                            <input type="text" placeholder="KA 05 AB 1234" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 uppercase bg-white text-gray-900" />
                        </InputGroup>
                        <InputGroup label="Kilometers Driven" required>
                            <input type="number" placeholder="15000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
                        </InputGroup>
                        <InputGroup label="Fuel Type" required>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                <option>Petrol</option>
                                <option>Diesel</option>
                                <option>Electric</option>
                                <option>CNG</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Transmission" required>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                <option>Manual</option>
                                <option>Automatic</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Ownership" required>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                <option>1st Owner</option>
                                <option>2nd Owner</option>
                                <option>3rd Owner</option>
                            </select>
                        </InputGroup>
                    </div>
                </div>

                {/* 2. Media */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-500" />
                        Vehicle Photos
                    </h2>

                    <div {...getRootProps()} className={cn(
                        "border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition-colors",
                        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    )}>
                        <input {...getInputProps()} />
                        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600">Click to upload</span> <span className="hidden sm:inline">or drag and drop</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>

                    {files.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {files.map((file) => (
                                <div key={file.name} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                                    <img
                                        src={file.preview}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        onLoad={() => { URL.revokeObjectURL(file.preview) }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(file.name)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Pricing & Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-blue-500" />
                        Pricing & Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Expected Price" required>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">₹</span>
                                </div>
                                <input type="number" placeholder="0.00" className="w-full pl-8 p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
                            </div>
                        </InputGroup>
                        <InputGroup label="Status" required>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                <option>Available</option>
                                <option>Reserved</option>
                                <option>Sold</option>
                            </select>
                        </InputGroup>
                        <div className="flex items-center gap-2 pt-2 sm:pt-6">
                            <input type="checkbox" id="negotiable" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white" />
                            <label htmlFor="negotiable" className="text-sm text-gray-700">Price is Negotiable</label>
                        </div>
                    </div>
                </div>

                {/* 4. Location */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        Location
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="City" required>
                            <input type="text" defaultValue="Bangalore" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
                        </InputGroup>
                        <InputGroup label="Area" required>
                            <input type="text" defaultValue="Koramangala" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
                        </InputGroup>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/vehicles')}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium bg-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save & Publish
                    </button>
                </div>
            </form>
        </div>
    );
}
