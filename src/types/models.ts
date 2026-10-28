export type SessionStatus = 'PENDING' | 'AUTHORIZED' | 'REVOKED' | 'EXPIRED' | 'FAILED';

export interface LocationDto {
  id: number;
  slug: string;
  name: string;
  address?: string;
  description?: string;
  sessionDurationMinutes: number;
  maxBandwidthMbps: number;
  termsAndConditions: string;
  welcomeMessage?: string;
  promoTitle?: string;
  promoContent?: string;
  promoBannerUrl?: string;
  promoActionUrl?: string;
  adminUnitId?: number;
  adminUnitName?: string;
  locationCode?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  statusReason?: string;
  ispName?: string;
  circuitCode?: string;
  contactName?: string;
  contactPhone?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUnitDto {
  id: number;
  parentId?: number;
  parentName?: string;
  code: string;
  name: string;
  level: number;
  path: string;
  status: string;
  notes?: string;
  children?: AdminUnitDto[];
  createdAt?: string;
}

export interface NetworkDeviceDto {
  id: number;
  locationId?: number;
  locationName?: string;
  locationCode?: string;
  adminUnitName?: string;
  deviceType: string;
  serialNumber: string;
  macAddress: string;
  model?: string;
  vendor?: string;
  firmwareVersion?: string;
  ipAddress?: string;
  status: string;
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
  uptimeSeconds?: number;
  lastSeenAt?: string;
  installedAt?: string;
}

export interface DeviceSwapRequest {
  locationId: number;
  oldDeviceId?: number;
  deviceType: string;
  newSerialNumber: string;
  newMacAddress: string;
  newModel?: string;
  newVendor?: string;
  swapReason: string;
}

export interface ExcelImportSummaryDto {
  importSessionId: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rowResults: Array<{
    rowNumber: number;
    code: string;
    name: string;
    valid: boolean;
    errors: string[];
  }>;
}

export interface CreateLocationRequest {
  slug: string;
  name: string;
  address?: string;
  description?: string;
  adminUnitId?: number;
  locationCode?: string;
  latitude?: number;
  longitude?: number;
  ispName?: string;
  circuitCode?: string;
  contactName?: string;
  contactPhone?: string;
  sessionDurationMinutes: number;
  maxBandwidthMbps: number;
  termsAndConditions: string;
  welcomeMessage?: string;
  promoTitle?: string;
  promoContent?: string;
  promoBannerUrl?: string;
  promoActionUrl?: string;
  active: boolean;
}

export interface UpdateLocationRequest {
  name: string;
  address?: string;
  description?: string;
  adminUnitId?: number;
  locationCode?: string;
  latitude?: number;
  longitude?: number;
  ispName?: string;
  circuitCode?: string;
  contactName?: string;
  contactPhone?: string;
  sessionDurationMinutes?: number;
  maxBandwidthMbps?: number;
  termsAndConditions: string;
  welcomeMessage?: string;
  promoTitle?: string;
  promoContent?: string;
  promoBannerUrl?: string;
  promoActionUrl?: string;
  active?: boolean;
}

export interface DeviceDto {
  id: number;
  macAddress: string;
  ipAddress?: string;
  hostname?: string;
  userAgent?: string;
  osType?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  blocked: boolean;
}

export interface GuestSessionDto {
  id: number;
  sessionToken: string;
  locationId: number;
  locationName: string;
  locationSlug: string;
  deviceId?: number;
  macAddress: string;
  ipAddress: string;
  guestName?: string;
  guestContact?: string;
  consentGiven: boolean;
  consentTimestamp: string;
  status: SessionStatus;
  authorizedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  failureReason?: string;
  gatewayReference?: string;
  bytesDownloaded?: number;
  bytesUploaded?: number;
  remainingSeconds?: number;
  createdAt: string;
}

export interface PortalInitResponse {
  location: LocationDto;
  clientIp: string;
  clientMacHint: string;
  mockGateway: boolean;
  gatewayNotice: string;
}

export interface GuestLoginRequest {
  locationSlug: string;
  macAddress?: string;
  guestName?: string;
  guestContact?: string;
  consentGiven: boolean;
}

export interface GuestLoginResponse {
  sessionId: number;
  sessionToken: string;
  status: SessionStatus;
  simulated: boolean;
  simulatedNotice: string;
  expiresAt: string;
  durationMinutes: number;
  locationName: string;
  message: string;
}

export interface GuestSessionStatusResponse {
  sessionToken: string;
  status: SessionStatus;
  simulated: boolean;
  simulatedNotice: string;
  remainingSeconds: number;
  expiresAt?: string;
  authorizedAt?: string;
  locationName: string;
  macAddress: string;
  ipAddress: string;
  maxBandwidthMbps: number;
  revokeReason?: string;
}

export interface AdminUserDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  user: AdminUserDto;
}

export interface GatewayStatusDto {
  adapterType: string;
  healthy: boolean;
  simulated: boolean;
  version: string;
  statusMessage: string;
  totalAuthorizations: number;
  totalRevocations: number;
  failedOperations: number;
  simulateFailures: boolean;
  simulatedLatencyMs: number;
  lastCheckedAt: string;
}

export interface MockGatewayConfigDto {
  simulateFailures?: boolean;
  simulatedLatencyMs?: number;
}

export interface GatewayTransactionDto {
  id: number;
  sessionId?: number;
  operation: string;
  adapterType: string;
  simulated: boolean;
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  rawResponse?: string;
  executionTimeMs?: number;
  createdAt: string;
}

export interface AuditEventDto {
  id: number;
  action: string;
  actorUsername: string;
  clientIp?: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface LocationAnalyticsDto {
  locationName: string;
  sessionCount: number;
  percentage: number;
}

export interface HourlyTrendDto {
  timeLabel: string;
  sessionCount: number;
  uniqueDevices: number;
}

export interface DashboardOverviewDto {
  totalSessions: number;
  activeSessions: number;
  totalLocations: number;
  activeLocations: number;
  todaySessions: number;
  totalDevices: number;
  gatewayStatus: GatewayStatusDto;
  sessionsByStatus: Record<string, number>;
  locationDistribution: LocationAnalyticsDto[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
