import React from 'react';
import { Search, Phone, MessageCircle, Calendar, CheckCircle, Clock, MoreHorizontal } from 'lucide-react';

const mockLeads = [
    { id: 1, name: "Rahul Kumar", phone: "+91 98765 43210", vehicle: "Yamaha R15 V3", date: "Today, 10:30 AM", status: "New", source: "WhatsApp" },
    { id: 2, name: "Sneha Reddy", phone: "+91 87654 32109", vehicle: "Honda City VX", date: "Yesterday, 4:15 PM", status: "Follow Up", source: "Website" },
    { id: 3, name: "Arjun Singh", phone: "+91 76543 21098", vehicle: "Royal Enfield Classic", date: "2 days ago", status: "Closed", source: "WhatsApp" },
    { id: 4, name: "Priya Sharma", phone: "+91 65432 10987", vehicle: "Hyundai Creta", date: "3 days ago", status: "New", source: "Call" },
];

const StatusBadge = ({ status }) => {
    const styles = {
        'New': 'bg-blue-100 text-blue-700',
        'Follow Up': 'bg-orange-100 text-orange-700',
        'Closed': 'bg-green-100 text-green-700',
        'Lost': 'bg-red-100 text-red-700'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

export default function Leads() {
    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
                    <p className="text-sm text-gray-500">Manage your potential customers</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium bg-white transition-colors">
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-gray-900"
                        />
                    </div>
                    <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none text-gray-900">
                        <option>All Status</option>
                        <option>New</option>
                        <option>Follow Up</option>
                        <option>Closed</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Vehicle Interest</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{lead.name}</div>
                                        <div className="text-gray-500">{lead.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {lead.vehicle}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {lead.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-gray-600">
                                            {lead.source === 'WhatsApp' ? <MessageCircle className="w-4 h-4 text-green-500" /> : <Phone className="w-4 h-4 text-blue-500" />}
                                            {lead.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-green-100 text-green-600 rounded transition-colors">
                                                <MessageCircle className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors">
                                                <Phone className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 text-gray-600 rounded transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
                    <span>Showing 4 of 124 leads</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors bg-white font-medium" disabled>Previous</button>
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors bg-white font-medium">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
