import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ToggleLeft, 
  ToggleRight,
  Calendar,
  CreditCard
} from 'lucide-react';

const TenantList = () => {
  const [tenants, setTenants] = useState([
    { id: 1, name: 'Royal Motors', slug: 'royal-motors', plan: 'Pro', status: 'Active', expiry: '2025-03-12', cars: 124, leads: 450 },
    { id: 2, name: 'Elite Cars', slug: 'elite-cars', plan: 'Basic', status: 'Active', expiry: '2025-01-20', cars: 45, leads: 120 },
    { id: 3, name: 'Z-Cars', slug: 'z-cars', plan: 'Enterprise', status: 'Inactive', expiry: '2024-12-15', cars: 0, leads: 12 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Showrooms</h1>
          <p className="text-gray-500">Manage all registered showrooms and their subscriptions.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={18} />
          Add Showroom
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search showrooms..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>All Plans</option>
            <option>Basic</option>
            <option>Pro</option>
            <option>Enterprise</option>
          </select>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Showroom</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Expiry</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Usage (Cars/Leads)</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-xs text-gray-500">/{tenant.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tenant.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                    tenant.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tenant.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 ${tenant.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                    {tenant.status === 'Active' ? <ToggleRight /> : <ToggleLeft />}
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {tenant.expiry}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {tenant.cars} / {tenant.leads}
                </td>
                <td className="px-6 py-4">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantList;
