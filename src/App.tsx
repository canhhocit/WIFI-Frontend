import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalPage } from './pages/portal/PortalPage';
import { PortalStatusPage } from './pages/portal/PortalStatusPage';
import { AdminLayout } from './pages/admin/AdminLayout';

// Public flow loads immediately; Admin pages are code-split & lazy loaded on demand
const LoginPage = React.lazy(() => import('./pages/admin/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SessionsPage = React.lazy(() => import('./pages/admin/SessionsPage').then(m => ({ default: m.SessionsPage })));
const LocationsPage = React.lazy(() => import('./pages/admin/LocationsPage').then(m => ({ default: m.LocationsPage })));
const DevicesPage = React.lazy(() => import('./pages/admin/DevicesPage').then(m => ({ default: m.DevicesPage })));
const AnalyticsPage = React.lazy(() => import('./pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AuditPage = React.lazy(() => import('./pages/admin/AuditPage').then(m => ({ default: m.AuditPage })));
const GatewayPage = React.lazy(() => import('./pages/admin/GatewayPage').then(m => ({ default: m.GatewayPage })));
const PortalBuilderPage = React.lazy(() => import('./pages/admin/PortalBuilderPage').then(m => ({ default: m.PortalBuilderPage })));
const CampaignsPage = React.lazy(() => import('./pages/admin/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const SurveysPage = React.lazy(() => import('./pages/admin/SurveysPage').then(m => ({ default: m.SurveysPage })));
const GisMapPage = React.lazy(() => import('./pages/admin/GisMapPage').then(m => ({ default: m.GisMapPage })));
const IncidentsPage = React.lazy(() => import('./pages/admin/IncidentsPage').then(m => ({ default: m.IncidentsPage })));
const BlacklistPage = React.lazy(() => import('./pages/admin/BlacklistPage').then(m => ({ default: m.BlacklistPage })));
const AccessLogsPage = React.lazy(() => import('./pages/admin/AccessLogsPage').then(m => ({ default: m.AccessLogsPage })));
const GovernmentReportPage = React.lazy(() => import('./pages/admin/GovernmentReportPage').then(m => ({ default: m.GovernmentReportPage })));
const UsersPage = React.lazy(() => import('./pages/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const RolePermissionsPage = React.lazy(() => import('./pages/admin/RolePermissionsPage').then(m => ({ default: m.RolePermissionsPage })));
const DnsFilteringPage = React.lazy(() => import('./pages/admin/DnsFilteringPage').then(m => ({ default: m.DnsFilteringPage })));
const SystemSettingsPage = React.lazy(() => import('./pages/admin/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));

const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] p-8 text-slate-500 text-xs">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      <span>Đang tải phân hệ quản trị...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Captive Portal Flow - High Speed Immediate Render */}
      <Route path="/portal" element={<PortalPage />} />
      <Route path="/portal/status/:sessionToken" element={<PortalStatusPage />} />

      {/* Admin Authentication */}
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <LoginPage />
          </Suspense>
        }
      />

      {/* Admin Dashboard Protected Routes - Code Split / Lazy Loaded */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminLayout />
          </Suspense>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="portal-builder" element={<PortalBuilderPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="gis" element={<GisMapPage />} />
        <Route path="gis-map" element={<Navigate to="/admin/gis" replace />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="blacklist" element={<BlacklistPage />} />
        <Route path="access-logs" element={<AccessLogsPage />} />
        <Route path="government-report" element={<GovernmentReportPage />} />
        <Route path="dns-filtering" element={<DnsFilteringPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="role-permissions" element={<RolePermissionsPage />} />
        <Route path="system-settings" element={<SystemSettingsPage />} />
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
