import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DashboardLayout from './components/Layout/DashboardLayout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import DashboardHome from './pages/Dashboard/Home';
import Automation from './pages/Automation/WhatsAppSettings';
import Leads from './pages/Enquiries/Leads';
import VehicleList from './pages/Vehicles/VehicleList';
import AddVehicle from './pages/Vehicles/AddVehicle';
import VehicleDetail from './pages/Vehicles/VehicleDetail';
import TenantList from './pages/SuperAdmin/Tenants';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Super Admin Routes */}
        <Route path="/super" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="/super/dashboard" replace />} />
          <Route path="dashboard" element={<div>Super Admin Dashboard Content</div>} />
          <Route path="showrooms" element={<TenantList />} />
          <Route path="form-builder" element={<div>Form Builder Content</div>} />
          <Route path="wa-config" element={<div>WhatsApp Configuration</div>} />
          <Route path="settings" element={<div>System Settings</div>} />
        </Route>

        {/* Showroom Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="vehicles">
            <Route index element={<VehicleList />} />
            <Route path="add" element={<AddVehicle />} />
            <Route path=":id" element={<VehicleDetail />} />
          </Route>
          <Route path="automation" element={<Automation />} />
          <Route path="leads" element={<Leads />} />
          <Route path="settings" element={<div>Showroom Settings</div>} />
          <Route path="subscription" element={<div>Subscription Status (Read-only)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
