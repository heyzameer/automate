import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bike, Car, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [step, setStep] = useState('phone'); // phone, otp, details
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep('otp');
        }, 1500);
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep('details');
        }, 1500);
    };

    const handleCompleteSetup = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate('/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center gap-2 mb-6">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Bike className="w-8 h-8 text-white" />
                    </div>
                    <div className="bg-orange-500 p-2 rounded-lg">
                        <Car className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Vendor Partner
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Manage your vehicle inventory and leads
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    {step === 'phone' && (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                            onSubmit={handleSendOTP}
                        >
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Mobile Number
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">+91</span>
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 sm:text-sm border-gray-300 rounded-md p-3 border bg-white text-gray-900"
                                        placeholder="98765 43210"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get OTP"}
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {step === 'otp' && (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                            onSubmit={handleVerifyOTP}
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Enter OTP sent to mobile
                                </label>
                                <div className="flex gap-2 justify-center">
                                    {[1, 2, 3, 4].map((_, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            className="w-12 h-12 text-center text-xl border-gray-300 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                                </button>
                            </div>
                            <div className="text-center">
                                <button type="button" onClick={() => setStep('phone')} className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                                    Change Number
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {step === 'details' && (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                            onSubmit={handleCompleteSetup}
                        >
                            <div>
                                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                                    Shop Name
                                </label>
                                <input
                                    type="text"
                                    name="shopName"
                                    id="shopName"
                                    required
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-3 border bg-white text-gray-900"
                                />
                            </div>

                            <div>
                                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                                    Owner Name
                                </label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    id="ownerName"
                                    required
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-3 border bg-white text-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        id="city"
                                        required
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-3 border bg-white text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                                        Area
                                    </label>
                                    <input
                                        type="text"
                                        name="area"
                                        id="area"
                                        required
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-3 border bg-white text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            Complete Setup <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </div>
            </div>
        </div>
    );
}
