import React from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, CheckCircle, MessageCircle, TrendingUp, ArrowUpRight, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 flex items-center font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                {trend}
            </span>
            <span className="text-gray-400 ml-2">vs last month</span>
        </div>
    </div>
);

const ActivityItem = ({ title, time, type }) => (
    <div className="flex items-start gap-4 py-4 border-b border-gray-50 last:border-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'lead' ? 'bg-green-100 text-green-600' :
                type === 'sold' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
            {type === 'lead' ? <MessageCircle className="w-5 h-5" /> :
                type === 'sold' ? <CheckCircle className="w-5 h-5" /> : <Car className="w-5 h-5" />}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{time}</p>
        </div>
    </div>
)

export default function DashboardHome() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back, get up to date with your inventory.</p>
                </div>
                <Link to="/vehicles/add" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Vehicle
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Listed"
                    value="42"
                    icon={Car}
                    color="bg-blue-500"
                    trend="+12%"
                />
                <StatCard
                    title="Available"
                    value="28"
                    icon={CheckCircle}
                    color="bg-green-500"
                    trend="+5%"
                />
                <StatCard
                    title="Sold (This Month)"
                    value="14"
                    icon={TrendingUp}
                    color="bg-indigo-500"
                    trend="+18%"
                />
                <StatCard
                    title="Active Leads"
                    value="8"
                    icon={MessageCircle}
                    color="bg-orange-500"
                    trend="+4 New"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                            View All <ArrowUpRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <ActivityItem title="New enquiry for Yamaha R15 via WhatsApp" time="2 mins ago" type="lead" />
                        <ActivityItem title="Honda City 2020 marked as Sold" time="2 hours ago" type="sold" />
                        <ActivityItem title="Added new listing: Royal Enfield Classic 350" time="5 hours ago" type="listing" />
                        <ActivityItem title="Price updated for Hyundai Creta" time="1 day ago" type="listing" />
                        <ActivityItem title="New enquiry for Maruti Swift via WhatsApp" time="1 day ago" type="lead" />
                    </div>
                </div>

                {/* Quick Actions & Tips */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
                        <h3 className="font-bold text-lg mb-2">WhatsApp Automation</h3>
                        <p className="text-blue-100 text-sm mb-4">You have 3 new enquiries that need manual attention.</p>
                        <Link to="/automation" className="inline-flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition backdrop-blur-sm border border-white/20">
                            Check Settings <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Inventory Status</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Bikes</span>
                                    <span className="font-medium">65%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-[65%] rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Cars</span>
                                    <span className="font-medium">35%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[35%] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
