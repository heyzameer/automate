import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Save, Power, Image, FileText, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { vehicles } from '../../lib/data';

export default function Automation() {
    const [enabled, setEnabled] = useState(true);
    const [message, setMessage] = useState("Hi 👋\nThanks for contacting Hari Priya.\nHere are the details you requested:");
    const vehicle = vehicles[0]; // For preview

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 font-sans">
            <div className="space-y-6">
                <div className="px-1 sm:px-0">
                    <h1 className="text-2xl font-bold text-gray-900">Automation Settings</h1>
                    <p className="text-sm text-gray-500">Configure how your WhatsApp bot responds to customers</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Auto-Reply Status</h3>
                            <p className="text-sm text-gray-500">Enable or disable automatic responses</p>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                enabled ? "bg-blue-600" : "bg-gray-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    enabled ? "translate-x-6" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Greeting Message</label>
                        <textarea
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This message will be sent along with vehicle details when a customer enquires.
                        </p>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Include in Reply</h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white" />
                                <span className="text-sm text-gray-700 flex items-center gap-2"><Image className="w-4 h-4 text-gray-400" /> Vehicle Images (Gallery)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white" />
                                <span className="text-sm text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Full Description & Specs</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white" />
                                <span className="text-sm text-gray-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> Shop Location</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20 transition-colors">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-[#e5ddd5] rounded-3xl p-4 shadow-xl border-4 border-gray-800 h-[600px] overflow-hidden flex flex-col relative">
                <div className="absolute top-0 left-0 right-0 h-8 bg-gray-800 rounded-t-2xl z-10 flex justify-center">
                    <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                </div>
                <div className="bg-[#075e54] text-white p-3 pt-10 flex items-center gap-3 shadow-md z-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Hari Priya</p>
                        <p className="text-[10px] text-white/80">online</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white rounded-lg p-2 max-w-[80%] self-start shadow-sm text-xs rounded-tl-none text-gray-900 border border-gray-200">
                        Hi, I'm interested in Yamaha R15
                    </div>

                    <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[85%] self-end shadow-sm text-sm space-y-2 rounded-tr-none ml-auto text-gray-900">
                        <p className="whitespace-pre-wrap">{message}</p>

                        {vehicle && (
                            <>
                                <div className="rounded-lg overflow-hidden mt-2 border border-black/5">
                                    <img src={vehicle.image} alt="Vehicle" className="w-full h-32 object-cover" />
                                </div>

                                <div className="space-y-1">
                                    <p className="font-bold">{vehicle.name}</p>
                                    <p>₹ {vehicle.price.toLocaleString()}</p>
                                    <p className="text-xs text-gray-600">{vehicle.km_driven}km • {vehicle.year}</p>
                                </div>
                            </>
                        )}

                        <div className="pt-2 border-t border-black/5 mt-2">
                            <p className="text-blue-600 text-center font-medium cursor-pointer hover:underline text-xs">View Full Details</p>
                        </div>
                    </div>
                </div>

                <div className="p-2 bg-[#f0f0f0] flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-full h-9 px-4 flex items-center text-gray-400 text-sm border border-gray-200">Type a message</div>
                    <div className="w-9 h-9 bg-[#075e54] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#064e46] transition-colors">
                        <motion.div whileTap={{ scale: 0.9 }}>
                            <MessageSquare className="w-4 h-4 rotate-90" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
