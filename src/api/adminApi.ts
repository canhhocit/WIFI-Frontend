import { request } from './client';
import {
  DashboardOverviewDto,
  HourlyTrendDto,
  PageResponse,
  GuestSessionDto,
  LocationDto,
  CreateLocationRequest,
  UpdateLocationRequest,
  DeviceDto,
  GatewayStatusDto,
  MockGatewayConfigDto,
  GatewayTransactionDto,
  AuditEventDto,
  SessionStatus,
  AdminUnitDto,
  NetworkDeviceDto,
  DeviceSwapRequest,
  DeviceSyncSummaryDto,
  ExcelImportSummaryDto,
  CampaignDto,
  CreateCampaignRequest,
  ApproveCampaignRequest,
  SurveyDto,
  SurveyResponseDto,
  PortalTemplateDto,
  IncidentTicketDto,
  CreateIncidentRequest,
  AssignIncidentRequest,
  ResolveIncidentRequest,
  GisLocationPinDto,
  MacBlacklistDto,
  CreateBlacklistRequest,
  AccessLogRetentionDto,
  GovernmentReportDto,
  DistrictStatDto,
  AdminUserDto,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
  DnsDomainRuleDto,
  CreateDnsDomainRuleRequest,
  SystemSettingDto,
  UpdateSystemSettingRequest,
  RolePermissionDto,
  UpdateRolePermissionRequest,
} from '../types/models';

export const adminApi = {
  // Analytics
  getOverview: () => {
    return request<DashboardOverviewDto>('/admin/analytics/overview');
  },
  getTrends: () => {
    return request<HourlyTrendDto[]>('/admin/analytics/trends');
  },

  // Sessions
  getSessions: (params: {
    locationId?: number;
    status?: SessionStatus;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params.locationId) sp.append('locationId', params.locationId.toString());
    if (params.status) sp.append('status', params.status);
    if (params.search) sp.append('search', params.search);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());
    if (params.sortBy) sp.append('sortBy', params.sortBy);
    if (params.direction) sp.append('direction', params.direction);

    return request<PageResponse<GuestSessionDto>>(`/admin/sessions?${sp.toString()}`);
  },

  getSessionById: (id: number) => {
    return request<GuestSessionDto>(`/admin/sessions/${id}`);
  },

  revokeSession: (id: number, reason: string) => {
    return request<GuestSessionDto>(`/admin/sessions/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Locations
  getLocations: (params: { query?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.query) sp.append('query', params.query);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());

    return request<PageResponse<LocationDto>>(`/admin/locations?${sp.toString()}`);
  },

  getActiveLocations: () => {
    return request<LocationDto[]>('/admin/locations/active');
  },

  getLocationById: (id: number) => {
    return request<LocationDto>(`/admin/locations/${id}`);
  },

  createLocation: (data: CreateLocationRequest) => {
    return request<LocationDto>('/admin/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLocation: (id: number, data: UpdateLocationRequest) => {
    return request<LocationDto>(`/admin/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteLocation: (id: number) => {
    return request<void>(`/admin/locations/${id}`, {
      method: 'DELETE',
    });
  },

  // Devices
  getDevices: (params: { search?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append('search', params.search);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());

    return request<PageResponse<DeviceDto>>(`/admin/devices?${sp.toString()}`);
  },

  toggleBlockDevice: (id: number, blocked: boolean) => {
    return request<DeviceDto>(`/admin/devices/${id}/block?blocked=${blocked}`, {
      method: 'PATCH',
    });
  },

  // Gateway Diagnostics
  getGatewayStatus: () => {
    return request<GatewayStatusDto>('/admin/gateway/status');
  },

  updateGatewayConfig: (config: MockGatewayConfigDto) => {
    return request<GatewayStatusDto>('/admin/gateway/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  getGatewayTransactions: (page = 0, size = 20) => {
    return request<PageResponse<GatewayTransactionDto>>(`/admin/gateway/transactions?page=${page}&size=${size}`);
  },

  // Geography (3-Tier Tree)
  getAdminTree: () => {
    return request<AdminUnitDto[]>('/v1/admin/geography/tree');
  },
  getAdminByLevel: (level: number) => {
    return request<AdminUnitDto[]>(`/v1/admin/geography/level/${level}`);
  },
  getAdminChildren: (parentId: number) => {
    return request<AdminUnitDto[]>(`/v1/admin/geography/parent/${parentId}`);
  },
  mergeAdminUnits: (data: { sourceUnitIds: number[]; targetUnitId: number; notes?: string }) => {
    return request<void>('/v1/admin/geography/merge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Network Infrastructure Devices
  getNetworkDevices: (params: { type?: string; status?: string; adminUnitId?: number; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.type) sp.append('type', params.type);
    if (params.status) sp.append('status', params.status);
    if (params.adminUnitId) sp.append('adminUnitId', params.adminUnitId.toString());
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());

    return request<PageResponse<NetworkDeviceDto>>(`/v1/admin/network-devices?${sp.toString()}`);
  },

  getNetworkDeviceById: (id: number) => {
    return request<NetworkDeviceDto>(`/v1/admin/network-devices/${id}`);
  },

  swapNetworkDevice: (data: DeviceSwapRequest) => {
    return request<NetworkDeviceDto>('/v1/admin/network-devices/swap', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  syncGrandstreamDevices: () => {
    return request<DeviceSyncSummaryDto>('/v1/admin/network-devices/sync-grandstream', {
      method: 'POST',
    });
  },

  rebootNetworkDevice: (id: number) => {
    return request<NetworkDeviceDto>(`/v1/admin/network-devices/${id}/reboot`, {
      method: 'POST',
    });
  },

  validateLocationsExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('admin_token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

    const res = await fetch(`${API_BASE_URL}/admin/locations/import/validate`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi kiểm tra file Excel');
    return json.data as ExcelImportSummaryDto;
  },

  commitLocationsExcel: (sessionId: string) => {
    return request<number>(`/admin/locations/import/commit?sessionId=${sessionId}`, {
      method: 'POST',
    });
  },

  getExcelTemplateUrl: () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${API_BASE_URL}/admin/locations/import/template`;
  },

  getExcelErrorsUrl: (sessionId: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${API_BASE_URL}/admin/locations/import/errors/${sessionId}`;
  },

  getExcelExportUrl: () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${API_BASE_URL}/admin/locations/export`;
  },

  // Audit Events
  getAuditEvents: (params: { action?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.action) sp.append('action', params.action);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());

    return request<PageResponse<AuditEventDto>>(`/admin/audit?${sp.toString()}`);
  },

  // Campaigns (Policy & Media)
  getCampaigns: (params: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.status) sp.append('status', params.status);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());

    return request<PageResponse<CampaignDto>>(`/v1/admin/campaigns?${sp.toString()}`);
  },

  getCampaignById: (id: number) => {
    return request<CampaignDto>(`/v1/admin/campaigns/${id}`);
  },

  createCampaign: (data: CreateCampaignRequest) => {
    return request<CampaignDto>('/v1/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  submitCampaign: (id: number) => {
    return request<CampaignDto>(`/v1/admin/campaigns/${id}/submit`, {
      method: 'POST',
    });
  },

  approveCampaign: (id: number, data?: ApproveCampaignRequest) => {
    return request<CampaignDto>(`/v1/admin/campaigns/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  rejectCampaign: (id: number, data?: ApproveCampaignRequest) => {
    return request<CampaignDto>(`/v1/admin/campaigns/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  updateCampaign: (id: number, data: CreateCampaignRequest) => {
    return request<CampaignDto>(`/v1/admin/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCampaign: (id: number) => {
    return request<void>(`/v1/admin/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  // Surveys
  getSurveys: (params: { active?: boolean; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.active !== undefined) sp.append('active', params.active.toString());
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());

    return request<PageResponse<SurveyDto>>(`/v1/admin/surveys?${sp.toString()}`);
  },

  getSurveyById: (id: number) => {
    return request<SurveyDto>(`/v1/admin/surveys/${id}`);
  },

  createSurvey: (data: SurveyDto) => {
    return request<SurveyDto>('/v1/admin/surveys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  toggleSurvey: (id: number) => {
    return request<SurveyDto>(`/v1/admin/surveys/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  deleteSurvey: (id: number) => {
    return request<void>(`/v1/admin/surveys/${id}`, {
      method: 'DELETE',
    });
  },

  exportSurveyResponsesCsv: async (id: number) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/v1/admin/surveys/${id}/export/csv`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể xuất báo cáo kết quả khảo sát');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ket_qua_khao_sat_${id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  getSurveyResponses: (id: number, page = 0, size = 20) => {
    return request<PageResponse<SurveyResponseDto>>(`/v1/admin/surveys/${id}/responses?page=${page}&size=${size}`);
  },

  // Portal Templates
  getPortalTemplates: () => {
    return request<PortalTemplateDto[]>('/v1/admin/portal-templates');
  },

  getActivePortalTemplate: () => {
    return request<PortalTemplateDto>('/v1/admin/portal-templates/active');
  },

  savePortalTemplate: (data: PortalTemplateDto) => {
    return request<PortalTemplateDto>('/v1/admin/portal-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // GIS Map Pins
  getGisLocations: () => {
    return request<GisLocationPinDto[]>('/v1/admin/gis/locations');
  },

  // Incidents
  getIncidents: (params: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.status) sp.append('status', params.status);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());
    return request<PageResponse<IncidentTicketDto>>(`/v1/admin/incidents?${sp.toString()}`);
  },

  getIncidentById: (id: number) => {
    return request<IncidentTicketDto>(`/v1/admin/incidents/${id}`);
  },

  createIncident: (data: CreateIncidentRequest) => {
    return request<IncidentTicketDto>('/v1/admin/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  assignIncident: (id: number, data: AssignIncidentRequest) => {
    return request<IncidentTicketDto>(`/v1/admin/incidents/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  resolveIncident: (id: number, data: ResolveIncidentRequest) => {
    return request<IncidentTicketDto>(`/v1/admin/incidents/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // MAC Blacklist
  getBlacklist: (params: { active?: boolean; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.active !== undefined) sp.append('active', params.active.toString());
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());
    return request<PageResponse<MacBlacklistDto>>(`/v1/admin/blacklist?${sp.toString()}`);
  },

  addToBlacklist: (data: CreateBlacklistRequest) => {
    return request<MacBlacklistDto>('/v1/admin/blacklist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  unblockMac: (id: number) => {
    return request<MacBlacklistDto>(`/v1/admin/blacklist/${id}/unblock`, {
      method: 'PUT',
    });
  },

  // Legal 12-Month Access Logs
  searchAccessLogs: (params: { clientMac?: string; locationId?: number; startDate?: string; endDate?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.clientMac) sp.append('clientMac', params.clientMac);
    if (params.locationId) sp.append('locationId', params.locationId.toString());
    if (params.startDate) sp.append('startDate', params.startDate);
    if (params.endDate) sp.append('endDate', params.endDate);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());
    return request<PageResponse<AccessLogRetentionDto>>(`/v1/admin/access-logs?${sp.toString()}`);
  },

  // Government Administrative Reports (Sở TT&TT / UBND TP Hải Phòng)
  getGovernmentReportSummary: (period = 'MONTH') => {
    return request<GovernmentReportDto>(`/v1/admin/reports/government/summary?period=${encodeURIComponent(period)}`);
  },

  exportGovernmentReportCsv: async (period = 'MONTH') => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/v1/admin/reports/government/export/csv?period=${encodeURIComponent(period)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể xuất báo cáo hành chính UBND / Sở TT&TT');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_UBND_So_TTTT_Hai_Phong_${period}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  getUsers: (params?: { search?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.page !== undefined) sp.append('page', params.page.toString());
    if (params?.size !== undefined) sp.append('size', params.size.toString());
    return request<PageResponse<AdminUserDto>>(`/v1/admin/users?${sp.toString()}`);
  },

  getUserById: (id: number) => {
    return request<AdminUserDto>(`/v1/admin/users/${id}`);
  },

  createUser: (data: CreateAdminUserRequest) => {
    return request<AdminUserDto>('/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: (id: number, data: UpdateAdminUserRequest) => {
    return request<AdminUserDto>(`/v1/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleUserStatus: (id: number) => {
    return request<AdminUserDto>(`/v1/admin/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  unlockUser: (id: number) => {
    return request<AdminUserDto>(`/v1/admin/users/${id}/unlock`, {
      method: 'PATCH',
    });
  },

  deleteUser: (id: number) => {
    return request<void>(`/v1/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  getDnsRules: (params?: { ruleType?: string; search?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.ruleType) sp.append('ruleType', params.ruleType);
    if (params?.search) sp.append('search', params.search);
    if (params?.page !== undefined) sp.append('page', params.page.toString());
    if (params?.size !== undefined) sp.append('size', params.size.toString());
    return request<PageResponse<DnsDomainRuleDto>>(`/v1/admin/dns-domains?${sp.toString()}`);
  },

  createDnsRule: (data: CreateDnsDomainRuleRequest) => {
    return request<DnsDomainRuleDto>('/v1/admin/dns-domains', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateDnsRule: (id: number, data: CreateDnsDomainRuleRequest) => {
    return request<DnsDomainRuleDto>(`/v1/admin/dns-domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleDnsRule: (id: number) => {
    return request<DnsDomainRuleDto>(`/v1/admin/dns-domains/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  deleteDnsRule: (id: number) => {
    return request<void>(`/v1/admin/dns-domains/${id}`, {
      method: 'DELETE',
    });
  },

  getSystemSettings: () => {
    return request<SystemSettingDto[]>('/v1/admin/system/settings');
  },

  updateSystemSetting: (key: string, data: UpdateSystemSettingRequest) => {
    return request<SystemSettingDto>(`/v1/admin/system/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getRolePermissions: () => {
    return request<RolePermissionDto[]>('/v1/admin/roles/permissions');
  },

  updateRolePermission: (data: UpdateRolePermissionRequest) => {
    return request<RolePermissionDto>('/v1/admin/roles/permissions', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateRolePermissionsBatch: (data: UpdateRolePermissionRequest[]) => {
    return request<RolePermissionDto[]>('/v1/admin/roles/permissions/batch', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Media / Image Upload
  uploadImage: (file: File, category = 'banners') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return request<{ url: string; fileName: string; originalName: string; fileSize: number; contentType: string }>(
      '/admin/uploads',
      {
        method: 'POST',
        body: formData,
      }
    );
  },
};
