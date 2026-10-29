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
  activeCampaign?: CampaignDto;
  activeSurvey?: SurveyDto;
  portalTemplate?: PortalTemplateDto;
  macRemembered?: boolean;
  otpRequired?: boolean;
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

export interface CampaignDto {
  id: number;
  title: string;
  description?: string;
  bannerUrl?: string;
  videoUrl?: string;
  actionUrl?: string;
  targetAdminUnitId?: number;
  targetLocationId?: number;
  priority: number;
  startTime: string;
  endTime: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  title: string;
  description?: string;
  bannerUrl?: string;
  videoUrl?: string;
  actionUrl?: string;
  targetAdminUnitId?: number;
  targetLocationId?: number;
  priority?: number;
  startTime: string;
  endTime: string;
}

export interface ApproveCampaignRequest {
  comment?: string;
  rejectReason?: string;
}

export interface SurveyBranchingRuleDto {
  id?: number;
  questionId?: number;
  conditionValue: string;
  nextQuestionId?: number;
  terminateSurvey: boolean;
}

export interface SurveyQuestionDto {
  id?: number;
  surveyId?: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TEXT' | 'RATING';
  optionsJson?: string;
  sortOrder: number;
  required: boolean;
  branchingRules?: SurveyBranchingRuleDto[];
}

export interface SurveyDto {
  id: number;
  campaignId?: number;
  title: string;
  description?: string;
  maxResponsesQuota?: number;
  currentResponsesCount: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  questions?: SurveyQuestionDto[];
}

export interface SurveyResponseSubmitRequest {
  locationId?: number;
  clientMac: string;
  answers: Record<string, any>;
}

export interface SurveyResponseDto {
  id: number;
  surveyId: number;
  locationId?: number;
  clientMac: string;
  answersJson: string;
  submittedAt: string;
}

export interface PortalTemplateDto {
  id?: number;
  name: string;
  templateType: 'DEFAULT' | 'CULTURAL' | 'BANNER_SURVEY' | 'VIDEO_AD';
  themeColor: string;
  backgroundColor: string;
  logoUrl?: string;
  bannerUrl?: string;
  title: string;
  welcomeText?: string;
  buttonText: string;
  termsText?: string;
  layoutConfig?: string;
  active: boolean;
}

export interface OtpRequestDto {
  phoneNumber: string;
  clientMac: string;
}

export interface OtpVerifyRequestDto {
  phoneNumber: string;
  clientMac: string;
  otpCode: string;
}

export interface OtpResultDto {
  success: boolean;
  message: string;
  testCodeHint?: string;
  expiresInSeconds?: number;
  bypassOtpUntil?: string;
}

// ================= Phase 4: Telemetry, Alert Matrix, Incidents & GIS =================

export interface TelemetryMetricDto {
  id: number;
  deviceId: number;
  locationId: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  pingLatencyMs: number;
  packetLossPercent: number;
  connectedClients: number;
  rxBytesDelta: number;
  txBytesDelta: number;
  online: boolean;
  recordedAt: string;
}

export interface IngestTelemetryRequest {
  deviceId: number;
  locationId: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  pingLatencyMs: number;
  packetLossPercent: number;
  connectedClients: number;
  rxBytesDelta: number;
  txBytesDelta: number;
  online: boolean;
}

export interface AlertRuleDto {
  id: number;
  name: string;
  metricType: 'CPU' | 'MEMORY' | 'LATENCY' | 'PACKET_LOSS' | 'OFFLINE';
  thresholdValue: number;
  durationMinutes: number;
  severity: 'WARNING' | 'CRITICAL';
  notificationChannel: 'EMAIL' | 'SMS' | 'TELEGRAM' | 'WEBHOOK';
  recipientTarget?: string;
  enabled: boolean;
}

export type IncidentSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';
export type IncidentStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type RootCauseCategory = 'POWER_OUTAGE' | 'FIBER_CUT' | 'HARDWARE_FAILURE' | 'CONFIG_ERROR' | 'UNKNOWN';

export interface IncidentTicketDto {
  id: number;
  ticketCode: string;
  locationId: number;
  locationName?: string;
  deviceId?: number;
  deviceMac?: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTo?: string;
  assignedGroup?: string;
  reportedAt: string;
  slaDeadline: string;
  resolvedAt?: string;
  resolutionSummary?: string;
  rootCauseCategory?: RootCauseCategory;
  slaBreached: boolean;
  updates?: IncidentUpdateDto[];
}

export interface IncidentUpdateDto {
  id: number;
  ticketId: number;
  updatedBy: string;
  previousStatus?: string;
  newStatus?: string;
  note: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface CreateIncidentRequest {
  locationId: number;
  deviceId?: number;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  assignedTo?: string;
  assignedGroup?: string;
}

export interface AssignIncidentRequest {
  assignedTo: string;
  assignedGroup?: string;
  note?: string;
}

export interface ResolveIncidentRequest {
  resolutionSummary: string;
  rootCauseCategory: RootCauseCategory;
}

export interface SlaMetricsDto {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  slaBreachedCount: number;
  slaComplianceRatePercent: number;
  averageResolutionHours: number;
}

export interface GisLocationPinDto {
  id: number;
  slug: string;
  name: string;
  locationCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  adminUnitId?: number;
  adminUnitName?: string;
  districtName?: string;
  active: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  totalDevices: number;
  onlineDevices: number;
  activeSessionsCount: number;
  openIncidentsCount: number;
}
