import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';

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
import SuperAdminBilling from './pages/SuperAdmin/Billing';
import SuperAdminCampaigns from './pages/SuperAdmin/Campaigns';
import SuperAdminLeads from './pages/SuperAdmin/Leads';
import Subscription from './pages/Dashboard/Subscription';
import ShowroomSettings from './pages/Dashboard/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

        {/* Super Admin Routes */}
        <Route path={ROUTES.SUPER_ADMIN.BASE} element={<SuperAdminLayout />}>
          <Route index element={<Navigate to={ROUTES.SUPER_ADMIN.DASHBOARD} replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="showrooms" element={<TenantList />} />
          <Route path="billing" element={<SuperAdminBilling />} />
          <Route path="campaigns" element={<SuperAdminCampaigns />} />
          <Route path="form-builder" element={<FormBuilder />} />
          <Route path="wa-config" element={<WhatsAppConfig />} />
          <Route path="leads" element={<SuperAdminLeads />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>

        {/* Showroom Routes */}
        <Route path={ROUTES.HOME} element={<DashboardLayout />}>
          <Route index element={<Navigate to={ROUTES.DASHBOARD.HOME} replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="vehicles">
            <Route index element={<VehicleList />} />
            <Route path="add" element={<AddVehicle />} />
            <Route path="edit/:id" element={<AddVehicle isEdit={true} />} />
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
