import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './constants/routes';

import Welcome from './pages/Welcome';
import AdminWelcome from './pages/AdminWelcome';
import Login from './pages/Auth/Login';
import AdminLogin from './pages/Auth/AdminLogin';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import DashboardLayout from './components/Layout/DashboardLayout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import DashboardHome from './pages/Dashboard/Home';
import Automation from './pages/Automation/WhatsAppSettings';
import Leads from './pages/Enquiries/Leads';
import TestDrives from './pages/Enquiries/TestDrives';
import Campaigns from './pages/Marketing/Campaigns';
import VehicleList from './pages/Vehicles/VehicleList';
import AddVehicle from './pages/Vehicles/AddVehicle';
import VehicleDetail from './pages/Vehicles/VehicleDetail';
import TenantList from './pages/SuperAdmin/Tenants';
import ShowroomDetail from './pages/SuperAdmin/ShowroomDetail';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import WhatsAppConfig from './pages/SuperAdmin/WhatsAppConfig';
import InventoryConfig from './pages/SuperAdmin/InventoryConfig';
import SuperAdminSettings from './pages/SuperAdmin/Settings';
import SuperAdminBilling from './pages/SuperAdmin/Billing';
import BillingPayments from './pages/SuperAdmin/BillingPayments';
import SuperAdminCampaigns from './pages/SuperAdmin/Campaigns';
import SuperAdminLeads from './pages/SuperAdmin/Leads';
import KioskConfig from './pages/SuperAdmin/KioskConfig';
import UsageAnalytics from './pages/SuperAdmin/UsageAnalytics';
import Subscription from './pages/Dashboard/Subscription';
import ShowroomSettings from './pages/Dashboard/Settings';
import RegistrationSuccess from './pages/Auth/RegistrationSuccess';
import NotificationsPage from './pages/Notifications/NotificationsPage';


function App() {
  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        <Route path={ROUTES.LANDING} element={<Welcome />} />
        <Route path={ROUTES.ADMIN_LANDING} element={<AdminWelcome />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.REGISTER_SUCCESS} element={<RegistrationSuccess />} />

        {/* Super Admin Routes */}
        <Route path={ROUTES.SUPER_ADMIN.BASE} element={<SuperAdminLayout />}>
          <Route index element={<Navigate to={ROUTES.SUPER_ADMIN.DASHBOARD} replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="showrooms" element={<TenantList />} />
          <Route path="showrooms/:id" element={<ShowroomDetail />} />
          <Route path="billing" element={<SuperAdminBilling />} />
          <Route path="payments" element={<BillingPayments />} />
          <Route path="campaigns" element={<SuperAdminCampaigns />} />
          <Route path="wa-config" element={<WhatsAppConfig />} />
          <Route path="inventory-config" element={<InventoryConfig />} />
          <Route path="leads" element={<SuperAdminLeads />} />
          <Route path="kiosk-config" element={<KioskConfig />} />
          <Route path="usage-analytics" element={<UsageAnalytics />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>

        {/* Showroom Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="vehicles">
            <Route index element={<VehicleList />} />
            <Route path="add" element={<AddVehicle />} />
            <Route path="edit/:id" element={<AddVehicle isEdit={true} />} />
            <Route path=":id" element={<VehicleDetail />} />
          </Route>
          <Route path="automation" element={<Automation />} />
          <Route path="leads" element={<Leads />} />
          <Route path="bookings" element={<TestDrives />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="dashboard/settings" element={<ShowroomSettings />} />
          <Route path="dashboard/subscription" element={<Subscription />} />
          <Route path="dashboard/notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
