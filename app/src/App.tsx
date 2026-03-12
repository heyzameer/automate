import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import DashboardLayout from './components/Layout/DashboardLayout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import DashboardHome from './pages/Dashboard/Home';
import Automation from './pages/Automation/WhatsAppSettings';
import Leads from './pages/Enquiries/Leads';
import VehicleList from './pages/Vehicles/VehicleList';
import AddVehicle from './pages/Vehicles/AddVehicle';
import VehicleDetail from './pages/Vehicles/VehicleDetail';
import TenantList from './pages/SuperAdmin/Tenants';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import FormBuilder from './pages/SuperAdmin/FormBuilder';
import WhatsAppConfig from './pages/SuperAdmin/WhatsAppConfig';
import SuperAdminSettings from './pages/SuperAdmin/Settings';
import Subscription from './pages/Dashboard/Subscription';
import ShowroomSettings from './pages/Dashboard/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Super Admin Routes */}
        <Route path="/super" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="/super/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="showrooms" element={<TenantList />} />
          <Route path="form-builder" element={<FormBuilder />} />
          <Route path="wa-config" element={<WhatsAppConfig />} />
          <Route path="settings" element={<SuperAdminSettings />} />
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
          <Route path="settings" element={<ShowroomSettings />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
