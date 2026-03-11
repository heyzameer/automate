import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  LayoutDashboard, 
  MessageSquare, 
  CheckSquare, 
  LogOut,
  Car
} from 'lucide-react';

const SuperAdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/super/dashboard' },
    { label: 'Showrooms', icon: Users, path: '/super/showrooms' },
    { label: 'Form Builder', icon: CheckSquare, path: '/super/form-builder' },
    { label: 'WA Config', icon: MessageSquare, path: '/super/wa-config' },
    { label: 'Settings', icon: Settings, path: '/super/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold flex items-center gap-2">
          <Car className="text-indigo-400" />
          <span>AutoMoto SA</span>
        </div>
        <nav className="flex-1 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-6 py-4 hover:bg-indigo-800 transition-colors"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="p-6 flex items-center gap-3 hover:bg-indigo-800 transition-colors mt-auto border-t border-indigo-800"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-gray-800">Super Admin Panel</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
