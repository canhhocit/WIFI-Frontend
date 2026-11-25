import { request } from './client';
import {
  DashboardOverviewDto,
  HourlyTrendDto,
  AuthFunnelStep,
  PageResponse,
  GuestSessionDto,
  SessionSyncSummaryDto,
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
  LocationGroupDto,
  CreateLocationGroupRequest,
  NetworkDeviceDto,
  MeshApSnapshotDto,
  NetworkDeviceImportResultDto,
  NetworkDeviceUpsertRequest,
  AssignDeviceLocationRequest,
  DeviceSwapRequest,
  DeviceSyncSummaryDto,
  GwnClientDto,
  GwnUpgradeResult,
  ExcelImportSummaryDto,
  CampaignDto,
  CreateCampaignRequest,
  ApproveCampaignRequest,
  SurveyDto,
  SurveyResponseDto,
  SurveyAnalyticsDto,
  PortalTemplateDto,
  PortalTemplateVersionDto,
  PortalInitResponse,
  PortalPreviewLinkResponse,
  IncidentTicketDto,
  CreateIncidentRequest,
  AssignIncidentRequest,
  IncidentAssigneeDto,
  ResolveIncidentRequest,
  CitizenReportDto,
  GisLocationPinDto,
  MacBlacklistDto,
  CreateBlacklistRequest,
  AccessLogRetentionDto,
  GovernmentReportDto,
  GovernmentReportHistoryDto,
  SubmitReportRequest,
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
  getAuthFunnel: () => {
    return request<AuthFunnelStep[]>('/admin/analytics/funnel');
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

  syncSessionsWithCloud: () => {
    return request<SessionSyncSummaryDto>('/admin/sessions/sync-cloud', {
      method: 'POST',
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

  // Location Groups
  getLocationGroups: () => {
    return request<LocationGroupDto[]>('/v1/admin/location-groups');
  },

  createLocationGroup: (data: CreateLocationGroupRequest) => {
    return request<LocationGroupDto>('/v1/admin/location-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteLocationGroup: (id: number) => {
    return request<void>(`/v1/admin/location-groups/${id}`, {
      method: 'DELETE',
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

  togglePortalBypass: (active: boolean, reason?: string) => {
    return request<GatewayStatusDto>(`/admin/gateway/portal-bypass?active=${active}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`, {
      method: 'POST',
    });
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

  getNetworkDevicesByLocation: (locationId: number) => {
    return request<NetworkDeviceDto[]>(`/v1/admin/network-devices/location/${locationId}`);
  },

  getUnassignedNetworkDevices: () => {
    return request<NetworkDeviceDto[]>('/v1/admin/network-devices/unassigned');
  },

  createNetworkDevice: (data: NetworkDeviceUpsertRequest) => {
    return request<NetworkDeviceDto>('/v1/admin/network-devices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateNetworkDevice: (id: number, data: NetworkDeviceUpsertRequest) => {
    return request<NetworkDeviceDto>(`/v1/admin/network-devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  assignNetworkDeviceLocation: (id: number, data: AssignDeviceLocationRequest) => {
    return request<NetworkDeviceDto>(`/v1/admin/network-devices/${id}/assign-location`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
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

  // Làm mới NGAY trạng thái on/off của mesh từ GWN Cloud (link cổng LAN), không chờ chu kỳ tự động.
  refreshMeshStatus: () => {
    return request<number>('/v1/admin/network-devices/mesh/refresh-status', {
      method: 'POST',
    });
  },

  // "AP theo cổng GWN": on/off từng cổng LAN của GWN (biết đúng AP cổng nào chết, không cần MAC).
  getGwnPortStatus: () => {
    return request<{
      apiReachable: boolean;
      gwnName?: string | null;
      siteName?: string | null;
      ports: { port: string; label: string; status: string; meshName?: string | null; meshMac?: string | null; meshIp?: string | null }[];
    }>('/v1/admin/network-devices/gwn-ports');
  },

  rebootNetworkDevice: (id: number) => {
    return request<NetworkDeviceDto>(`/v1/admin/network-devices/${id}/reboot`, {
      method: 'POST',
    });
  },

  // Lấy danh sách client & RSSI từ GWN Cloud
  getConnectedClientsFromCloud: (deviceId: number) => {
    return request<GwnClientDto[]>(`/v1/admin/network-devices/${deviceId}/clients`);
  },

  // Import danh sách thiết bị bàn giao (MAC + S/N); dryRun=true chỉ kiểm tra
  importNetworkDevices: async (file: File, dryRun: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('admin_token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    const res = await fetch(`${API_BASE_URL}/v1/admin/network-devices/import?dryRun=${dryRun}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Lỗi import (${res.status})`);
    return json.data as NetworkDeviceImportResultDto;
  },

  downloadNetworkDeviceTemplate: async () => {
    const token = localStorage.getItem('admin_token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    const res = await fetch(`${API_BASE_URL}/v1/admin/network-devices/import/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Không thể tải file mẫu (' + res.status + ')');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Danh_sach_thiet_bi_ban_giao.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Đọc trực tiếp mesh AP (SSID, kênh, client, RSSI, uptime) qua API của thiết bị
  getMeshApSnapshot: (deviceId: number, refresh = true) => {
    return request<MeshApSnapshotDto>(`/v1/admin/network-devices/${deviceId}/mesh?refresh=${refresh}`);
  },

  // Nâng cấp firmware hàng loạt
  upgradeFirmwareOnCloud: (deviceIds: number[], targetFirmware: string) => {
    return request<GwnUpgradeResult>('/v1/admin/network-devices/upgrade-firmware', {
      method: 'POST',
      body: JSON.stringify({ deviceIds, targetFirmware }),
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

  downloadExcelTemplate: async () => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/admin/locations/import/template', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể tải file mẫu Excel (' + res.status + ')');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '1584_Diem_WiFi_HaiPhong_Template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  getExcelErrorsUrl: (sessionId: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${API_BASE_URL}/admin/locations/import/errors/${sessionId}`;
  },

  downloadExcelErrors: async (sessionId: string) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/admin/locations/import/errors/${sessionId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể tải danh sách dòng lỗi (' + res.status + ')');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Danh_sach_dong_loi.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  getExcelExportUrl: () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${API_BASE_URL}/admin/locations/export`;
  },

  exportLocationsExcel: async () => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/admin/locations/export', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể xuất dữ liệu điểm phát sóng (' + res.status + ')');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Danh_sach_1584_Diem_WiFi.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  exportSurveyResponsesExcel: async (id: number, title?: string) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/v1/admin/surveys/${id}/export/excel`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể xuất báo cáo Excel kết quả khảo sát');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (title || `Khao_Sat_${id}`).replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]/g, '_');
    const today = new Date().toISOString().slice(0, 10);
    a.download = `Bao_Cao_Khao_Sat_${safeName}_${today}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  getSurveyAnalytics: (id: number) => {
    return request<SurveyAnalyticsDto>(`/v1/admin/surveys/${id}/analytics`);
  },

  getSurveyResponses: (id: number, locationId?: number, page = 0, size = 20) => {
    const sp = new URLSearchParams();
    sp.append('page', page.toString());
    sp.append('size', size.toString());
    if (locationId) sp.append('locationId', locationId.toString());
    return request<PageResponse<SurveyResponseDto>>(`/v1/admin/surveys/${id}/responses?${sp.toString()}`);
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

  getPortalTemplateVersions: (templateId: number) => {
    return request<PortalTemplateVersionDto[]>(`/v1/admin/portal-templates/${templateId}/versions`);
  },

  rollbackPortalTemplateVersion: (templateId: number, versionNumber: number) => {
    return request<PortalTemplateDto>(`/v1/admin/portal-templates/${templateId}/rollback/${versionNumber}`, {
      method: 'POST',
    });
  },

  createPortalPreviewLink: (previewData: PortalInitResponse, expiresInMinutes = 60) => {
    return request<PortalPreviewLinkResponse>('/v1/admin/portal-templates/preview-links', {
      method: 'POST',
      body: JSON.stringify({ previewData, expiresInMinutes }),
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

  getIncidentAssignees: () => {
    return request<IncidentAssigneeDto[]>('/v1/admin/incidents/assignees');
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
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  closeIncident: (id: number, data?: { note?: string }) => {
    return request<IncidentTicketDto>(`/v1/admin/incidents/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  reopenIncident: (id: number, data?: { reason?: string }) => {
    return request<IncidentTicketDto>(`/v1/admin/incidents/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Quản lý danh sách phản ánh người dân
  getCitizenReports: (params: { locationId?: number; status?: string; page?: number; size?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.locationId) sp.append('locationId', params.locationId.toString());
    if (params.status) sp.append('status', params.status);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());
    return request<PageResponse<CitizenReportDto>>(`/v1/admin/incidents/citizen-reports?${sp.toString()}`);
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

  getGovernmentReportHistory: () => {
    return request<GovernmentReportHistoryDto[]>('/v1/admin/reports/government/history');
  },

  submitGovernmentReport: (data: SubmitReportRequest) => {
    return request<GovernmentReportHistoryDto>('/v1/admin/reports/government/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  exportGovernmentReportCsv: async (period = 'MONTH') => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/v1/admin/reports/government/export/csv?period=${encodeURIComponent(period)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể xuất báo cáo hành chính UBND / Sở KH&CN');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_UBND_So_KHCN_Hai_Phong_${period}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  exportGovernmentReportPdf: async (period = 'MONTH') => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/v1/admin/reports/government/export/pdf?period=${encodeURIComponent(period)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Không thể xuất báo cáo hành chính định dạng PDF chính thức');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_UBND_Hai_Phong_Chinh_Thuc_${period}.pdf`;
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
