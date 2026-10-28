import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalPage } from './pages/portal/PortalPage';
import { PortalStatusPage } from './pages/portal/PortalStatusPage';
import { LoginPage } from './pages/admin/LoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { SessionsPage } from './pages/admin/SessionsPage';
import { LocationsPage } from './pages/admin/LocationsPage';
import { DevicesPage } from './pages/admin/DevicesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { AuditPage } from './pages/admin/AuditPage';
import { GatewayPage } from './pages/admin/GatewayPage';
import { PortalBuilderPage } from './pages/admin/PortalBuilderPage';
import { CampaignsPage } from './pages/admin/CampaignsPage';
import { SurveysPage } from './pages/admin/SurveysPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Captive Portal Flow */}
      <Route path="/portal" element={<PortalPage />} />
      <Route path="/portal/status/:sessionToken" element={<PortalStatusPage />} />

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Admin Dashboard Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="portal-builder" element={<PortalBuilderPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="gateway" element={<GatewayPage />} />
      </Route>

      {/* Default redirect to Guest Portal */}
      <Route path="/" element={<Navigate to="/portal" replace />} />
      <Route path="*" element={<Navigate to="/portal" replace />} />
    </Routes>
  );
};

export default App;
