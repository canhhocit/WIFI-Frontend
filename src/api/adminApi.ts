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

  // Audit Events
  getAuditEvents: (params: { action?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params.action) sp.append('action', params.action);
    if (params.page !== undefined) sp.append('page', params.page.toString());
    if (params.size !== undefined) sp.append('size', params.size.toString());

    return request<PageResponse<AuditEventDto>>(`/admin/audit?${sp.toString()}`);
  },
};
