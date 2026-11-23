import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { Pagination } from '../../components/Pagination';
import {
  IncidentTicketDto,
  IncidentSeverity,
  IncidentStatus,
  RootCauseCategory,
  CreateIncidentRequest,
  AssignIncidentRequest,
  ResolveIncidentRequest,
  LocationDto,
  CitizenReportDto
} from '../../types/models';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  UserCheck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  MessageSquare,
  ShieldAlert,
  Flame,
  Check,
  Send,
  RotateCcw,
  FileText,
  CheckCheck,
  AlertTriangle,
  Eye,
  History
} from 'lucide-react';

const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '--';
  }
};

const formatTimeOnly = (dateStr?: string | null): string => {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--';
  }
};

const SEVERITY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  CRITICAL: {
    label: 'Khẩn cấp (SLA 4h)',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
  },
  MAJOR: {
    label: 'Nghiêm trọng (SLA 8h)',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
  },
  MINOR: {
    label: 'Bình thường (SLA 24h)',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium'
  }
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  NEW: {
    label: 'Mới tiếp nhận',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium'
  },
  OPEN: {
    label: 'Mới tiếp nhận',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium'
  },
  ASSIGNED: {
    label: 'Đã phân công',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium'
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium'
  },
  RESOLVED: {
    label: 'Đã khắc phục',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
  },
  CLOSED: {
    label: 'Đã đóng phiếu',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300 font-medium'
  }
};

const ROOT_CAUSE_LABELS: Record<string, string> = {
  FIBER_CUT: 'Đứt cáp quang viễn thông',
  POWER_OUTAGE: 'Mất nguồn điện lưới NVH',
  HARDWARE_FAULT: 'Hỏng thiết bị AP / Gateway',
  HARDWARE_FAILURE: 'Hỏng thiết bị phần cứng',
  CONFIG_ERROR: 'Lỗi cấu hình mạng / DNS',
  CONFIGURATION_ERROR: 'Lỗi cấu hình mạng',
  ISP_ISSUE: 'Sự cố đường truyền ISP',
  UNKNOWN: 'Chưa rõ nguyên nhân',
  OTHER: 'Nguyên nhân khác'
};

const CITIZEN_ISSUE_LABELS: Record<string, { text: string; color: string }> = {
  CANNOT_CONNECT: { text: 'Mất kết nối Internet', color: 'bg-red-100 text-red-800' },
  SLOW_CONNECTION: { text: 'Mạng chậm / Chập chờn', color: 'bg-amber-100 text-amber-800' },
  SIGNAL_WEAK: { text: 'Sóng Wi-Fi yếu', color: 'bg-orange-100 text-orange-800' },
  PORTAL_ERROR: { text: 'Lỗi Trang chào Portal', color: 'bg-blue-100 text-blue-800' },
  POWER_OUTAGE: { text: 'Mất điện tại điểm phát', color: 'bg-purple-100 text-purple-800' },
  OTHER: { text: 'Ý kiến khác', color: 'bg-gray-100 text-gray-800' }
};

export const IncidentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedLocationId = searchParams.get('createLocationId');

  const [incidents, setIncidents] = useState<IncidentTicketDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReportDto[]>([]);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'CITIZEN_REPORTS'>('TICKETS');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(!!preselectedLocationId);
  const [selectedIncident, setSelectedIncident] = useState<IncidentTicketDto | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [targetIncidentId, setTargetIncidentId] = useState<number | null>(null);

  // Create form state
  const [createLocationId, setCreateLocationId] = useState<number>(
    preselectedLocationId ? Number(preselectedLocationId) : 1
  );
  const [createTitle, setCreateTitle] = useState<string>('');
  const [createDescription, setCreateDescription] = useState<string>('');
  const [createSeverity, setCreateSeverity] = useState<IncidentSeverity>('MAJOR');
  const [createAssignedTo, setCreateAssignedTo] = useState<string>('');

  // Assign form state
  const [assigneeName, setAssigneeName] = useState<string>('Viettel_KyThuat_01');
  const [assignGroup, setAssignGroup] = useState<string>('Đội Kỹ thuật Viễn thông Hải Phòng');
  const [assignNote, setAssignNote] = useState<string>('');

  // Resolve form state
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [rootCauseCategory, setRootCauseCategory] = useState<RootCauseCategory>('FIBER_CUT');

  // Close & Reopen form state
  const [closeNote, setCloseNote] = useState<string>('');
  const [reopenReason, setReopenReason] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsPage, locsPage, reportsPage] = await Promise.all([
        adminApi.getIncidents({ size: 500 }),
        adminApi.getLocations({ page: 0, size: 500 }),
        adminApi.getCitizenReports({ size: 500 }).catch(() => ({ content: [], totalElements: 0 })),
      ]);
      setIncidents(ticketsPage.content);
      setLocations(locsPage.content);
      setCitizenReports(reportsPage.content || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [citizenStatusFilter, setCitizenStatusFilter] = useState<string>('ALL');

  const filteredIncidents = useMemo(() => {
    return incidents.filter((t) => {
      let matchStatus = true;
      if (selectedStatus === 'OPEN') {
        matchStatus = t.status === 'OPEN' || t.status === 'NEW';
      } else if (selectedStatus !== 'ALL') {
        matchStatus = t.status === selectedStatus;
      }

      const matchSeverity = selectedSeverity === 'ALL' || t.severity === selectedSeverity;
      const matchSearch =
        !searchQuery ||
        t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.locationName && t.locationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSeverity && matchSearch;
    });
  }, [incidents, selectedStatus, selectedSeverity, searchQuery]);

  const filteredCitizenReports = useMemo(() => {
    return citizenReports.filter((r) => {
      const matchStatus = citizenStatusFilter === 'ALL' || r.status === citizenStatusFilter;
      const matchSearch =
        !searchQuery ||
        (r.locationName && r.locationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.issueType && r.issueType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.reporterName && r.reporterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.phoneNumber && r.phoneNumber.includes(searchQuery)) ||
        (r.ticketCode && r.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [citizenReports, citizenStatusFilter, searchQuery]);

  // Pagination states
  const [ticketPage, setTicketPage] = useState(0);
  const [ticketPageSize, setTicketPageSize] = useState(10);

  const [citizenPage, setCitizenPage] = useState(0);
  const [citizenPageSize, setCitizenPageSize] = useState(10);

  useEffect(() => {
    setTicketPage(0);
  }, [selectedStatus, selectedSeverity, searchQuery]);

  useEffect(() => {
    setCitizenPage(0);
  }, [citizenStatusFilter, searchQuery]);

  const paginatedIncidents = useMemo(() => {
    const start = ticketPage * ticketPageSize;
    return filteredIncidents.slice(start, start + ticketPageSize);
  }, [filteredIncidents, ticketPage, ticketPageSize]);

  const paginatedCitizenReports = useMemo(() => {
    const start = citizenPage * citizenPageSize;
    return filteredCitizenReports.slice(start, start + citizenPageSize);
  }, [filteredCitizenReports, citizenPage, citizenPageSize]);

  // Click row to view detailed incident & fetch full updates
  const handleSelectIncident = async (t: IncidentTicketDto) => {
    setSelectedIncident(t);
    try {
      const full = await adminApi.getIncidentById(t.id);
      if (full) {
        setSelectedIncident(full);
      }
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    try {
      const payload: CreateIncidentRequest = {
        locationId: createLocationId,
        title: createTitle,
        description: createDescription,
        severity: createSeverity,
        assignedTo: createAssignedTo || undefined,
        assignedGroup: createAssignedTo ? 'Đội Kỹ thuật Viễn thông Hải Phòng' : undefined,
      };
      const created = await adminApi.createIncident(payload);
      setIncidents((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setCreateTitle('');
      setCreateDescription('');
      await loadData();
    } catch (err) {
      alert('Không thể tạo phiếu sự cố');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIncidentId || !assigneeName.trim()) return;

    try {
      const payload: AssignIncidentRequest = {
        assignedTo: assigneeName,
        assignedGroup: assignGroup,
        note: assignNote,
      };
      const updated = await adminApi.assignIncident(targetIncidentId, payload);
      setIncidents((prev) => prev.map((t) => (t.id === targetIncidentId ? updated : t)));
      setShowAssignModal(false);
      setAssignNote('');
      if (selectedIncident?.id === targetIncidentId) {
        setSelectedIncident(updated);
      }
      await loadData();
    } catch (err) {
      alert('Không thể phân công kỹ thuật viên');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIncidentId || !resolutionSummary.trim()) return;

    try {
      const payload: ResolveIncidentRequest = {
        resolutionSummary,
        rootCauseCategory,
      };
      const updated = await adminApi.resolveIncident(targetIncidentId, payload);
      setIncidents((prev) => prev.map((t) => (t.id === targetIncidentId ? updated : t)));
      setShowResolveModal(false);
      setResolutionSummary('');
      if (selectedIncident?.id === targetIncidentId) {
        setSelectedIncident(updated);
      }
      await loadData();
    } catch (err) {
      alert('Không thể hoàn tất xử lý sự cố');
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIncidentId) return;

    try {
      const updated = await adminApi.closeIncident(targetIncidentId, { note: closeNote });
      setIncidents((prev) => prev.map((t) => (t.id === targetIncidentId ? updated : t)));
      setShowCloseModal(false);
      setCloseNote('');
      if (selectedIncident?.id === targetIncidentId) {
        setSelectedIncident(updated);
      }
      await loadData();
    } catch (err) {
      alert('Không thể đóng phiếu sự cố');
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIncidentId) return;

    try {
      const updated = await adminApi.reopenIncident(targetIncidentId, { reason: reopenReason });
      setIncidents((prev) => prev.map((t) => (t.id === targetIncidentId ? updated : t)));
      setShowReopenModal(false);
      setReopenReason('');
      if (selectedIncident?.id === targetIncidentId) {
        setSelectedIncident(updated);
      }
      await loadData();
    } catch (err) {
      alert('Không thể mở lại phiếu sự cố');
    }
  };

  const calculateRemainingSla = (slaDeadline: string, status: IncidentStatus) => {
    if (status === 'RESOLVED' || status === 'CLOSED') {
      return { text: 'Đã hoàn thành', breached: false, labelColor: 'text-emerald-600 font-semibold' };
    }
    const deadline = new Date(slaDeadline).getTime();
    if (isNaN(deadline)) {
      return { text: 'Theo cam kết SLA', breached: false, labelColor: 'text-gray-500' };
    }
    const now = Date.now();
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return {
        text: `Quá hạn SLA ${Math.abs(Math.round(diffHours))}h`,
        breached: true,
        labelColor: 'text-rose-600 font-bold',
      };
    }
    return {
      text: `Còn lại ${diffHours.toFixed(1)}h`,
      breached: false,
      labelColor: 'text-amber-600 font-medium',
    };
  };

  const getLocationDisplayName = (locationId?: number, locationName?: string) => {
    if (locationName) return locationName;
    if (!locationId) return 'Chưa xác định';
    const loc = locations.find((l) => l.id === locationId);
    return loc ? loc.name : `Nhà văn hóa #${locationId}`;
  };

  const unresolvedCriticalCount = useMemo(() => {
    return incidents.filter(
      (i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    ).length;
  }, [incidents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Quản lý Sự cố Kỹ thuật & Điều Phối Viễn Thông
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi tiến độ khắc phục sự cố mạng tại 1.584 Nhà văn hóa theo quy chuẩn cam kết thời gian SLA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-sm shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Báo cáo sự cố mới
          </button>
        </div>
      </div>

      {/* Incident Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Tổng số phiếu sự cố SLA</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{incidents.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length} đang xử lý
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="text-xs text-emerald-600 font-medium">Đã khắc phục hoàn tất</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length}
          </div>
          <div className="text-xs text-emerald-600/80 mt-0.5">Đã phục hồi Internet</div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className={`text-xs font-medium ${unresolvedCriticalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            Sự cố mức độ Khẩn cấp
          </div>
          <div className={`mt-1 text-2xl font-bold ${unresolvedCriticalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {unresolvedCriticalCount}
          </div>
          <div className={`text-xs mt-0.5 ${unresolvedCriticalCount > 0 ? 'text-rose-600/90' : 'text-emerald-600/80'}`}>
            {unresolvedCriticalCount > 0 ? 'Cần ưu tiên xử lý khẩn cấp' : 'Không có sự cố khẩn cấp tồn đọng'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="text-xs text-amber-700 font-medium">
            <span>Phản ánh người dân</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{citizenReports.length}</div>
          <div className="text-xs text-amber-700/80 mt-0.5">Tự động tạo sự cố từ 3 phản ánh/30p</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('TICKETS')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'TICKETS'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Phiếu sự cố kỹ thuật SLA ({incidents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CITIZEN_REPORTS')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'CITIZEN_REPORTS'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Phản ánh chất lượng từ người dân</span>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-amber-100 text-amber-800 font-mono font-bold">
            {citizenReports.length}
          </span>
        </button>
      </div>

      {activeTab === 'TICKETS' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-3 rounded-sm border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã SC-..., tên sự cố, địa điểm, kỹ thuật viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 bg-white text-gray-700 cursor-pointer"
              >
                <option value="ALL">-- Tất cả trạng thái --</option>
                <option value="OPEN">Mới tiếp nhận</option>
                <option value="ASSIGNED">Đã phân công</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="RESOLVED">Đã khắc phục</option>
                <option value="CLOSED">Đã đóng phiếu</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 bg-white text-gray-700 cursor-pointer"
              >
                <option value="ALL">-- Tất cả mức độ khẩn cấp --</option>
                <option value="CRITICAL">🔴 Khẩn cấp (SLA 4h)</option>
                <option value="MAJOR">🟠 Nghiêm trọng (SLA 8h)</option>
                <option value="MINOR">🟡 Bình thường (SLA 24h)</option>
              </select>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-sm border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Mã vé / Thời gian</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Điểm phát NVH</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Tiêu đề sự cố</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Mức độ</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Kỹ thuật phụ trách</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Hạn cam kết SLA</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                        Không có phiếu sự cố nào phù hợp với bộ lọc tìm kiếm
                      </td>
                    </tr>
                  ) : (
                    paginatedIncidents.map((t) => {
                      const sla = calculateRemainingSla(t.slaDeadline, t.status);
                      const sev = SEVERITY_CONFIG[t.severity] || { label: t.severity, badgeClass: 'bg-gray-100 text-gray-700' };
                      const st = STATUS_CONFIG[t.status] || { label: t.status, badgeClass: 'bg-gray-100 text-gray-700' };
                      const locName = getLocationDisplayName(t.locationId, t.locationName);
                      const timeDisplay = formatDateTime(t.reportedAt || t.createdAt);

                      return (
                        <tr
                          key={t.id}
                          onClick={() => handleSelectIncident(t)}
                          className="hover:bg-blue-50/40 transition cursor-pointer group"
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono font-bold text-gray-900 group-hover:text-blue-600 transition">
                              {t.ticketCode}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {timeDisplay}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {locName}
                          </td>
                          <td className="px-4 py-3 max-w-sm">
                            <div className="font-semibold text-gray-900 truncate" title={t.title}>
                              {t.title}
                            </div>
                            {t.rootCauseCategory && (
                              <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                {ROOT_CAUSE_LABELS[t.rootCauseCategory] || t.rootCauseCategory}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${sev.badgeClass}`}>
                              {sev.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${st.badgeClass}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {t.assignedTo ? (
                              <div>
                                <div className="font-medium text-gray-900">{t.assignedTo}</div>
                                <div className="text-[10px] text-gray-400">{t.assignedGroup || 'Đội Viễn thông'}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Chưa điều phối</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`text-xs ${sla.labelColor}`}>{sla.text}</div>
                            <div className="text-[10px] text-gray-400">
                              {t.status === 'RESOLVED' || t.status === 'CLOSED' ? (
                                `Hoàn tất: ${formatTimeOnly(t.resolvedAt || t.updatedAt)}`
                              ) : (
                                `Hạn: ${formatTimeOnly(t.slaDeadline)}`
                              )}
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 text-right whitespace-nowrap space-x-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Nút Chi tiết */}
                            <button
                              type="button"
                              onClick={() => handleSelectIncident(t)}
                              className="px-2 py-1 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded text-[11px] font-medium transition cursor-pointer"
                              title="Xem chi tiết & nhật ký"
                            >
                              Chi tiết
                            </button>

                            {/* Phân công (khi phiếu mới) */}
                            {(t.status === 'OPEN' || t.status === 'NEW') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetIncidentId(t.id);
                                  setShowAssignModal(true);
                                }}
                                className="px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
                              >
                                Phân công
                              </button>
                            )}

                            {/* Khắc phục & Điều phối lại (khi đang xử lý) */}
                            {(t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetIncidentId(t.id);
                                    setShowResolveModal(true);
                                  }}
                                  className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
                                >
                                  Khắc phục
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetIncidentId(t.id);
                                    if (t.assignedTo) setAssigneeName(t.assignedTo);
                                    setShowAssignModal(true);
                                  }}
                                  className="px-2 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-[11px] font-medium transition cursor-pointer"
                                  title="Đổi kỹ thuật viên phụ trách"
                                >
                                  Đổi KTV
                                </button>
                              </>
                            )}

                            {/* Đóng phiếu & Mở lại (khi đã khắc phục) */}
                            {t.status === 'RESOLVED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetIncidentId(t.id);
                                    setShowCloseModal(true);
                                  }}
                                  className="px-2.5 py-1 text-white bg-slate-700 hover:bg-slate-800 rounded text-[11px] font-semibold transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                                  title="Xác nhận nghiệm thu & đóng phiếu"
                                >
                                  <Check className="w-3 h-3 text-emerald-400" /> Đóng phiếu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetIncidentId(t.id);
                                    setShowReopenModal(true);
                                  }}
                                  className="px-2 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded text-[11px] font-medium transition cursor-pointer inline-flex items-center gap-1"
                                  title="Mở lại phiếu nếu hiện trường còn lỗi"
                                >
                                  <RotateCcw className="w-3 h-3" /> Mở lại
                                </button>
                              </>
                            )}

                            {/* Mở lại khi đã đóng */}
                            {t.status === 'CLOSED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetIncidentId(t.id);
                                  setShowReopenModal(true);
                                }}
                                className="px-2 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded text-[11px] font-medium transition cursor-pointer inline-flex items-center gap-1"
                                title="Mở lại phiếu sự cố"
                              >
                                <RotateCcw className="w-3 h-3" /> Mở lại
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Smart Pagination for Incidents */}
            <Pagination
              currentPage={ticketPage}
              totalPages={Math.ceil(filteredIncidents.length / ticketPageSize)}
              totalElements={filteredIncidents.length}
              pageSize={ticketPageSize}
              pageSizeOptions={[5, 10, 15, 20, 50]}
              onPageChange={setTicketPage}
              onPageSizeChange={(newSize) => {
                setTicketPageSize(newSize);
                setTicketPage(0);
              }}
              itemLabel="phiếu sự cố"
            />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Information Notice for Citizen Reports */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              Khi một điểm tiếp nhận <strong>từ 03 phản ánh trong vòng 30 phút</strong>, hệ thống tự động kích hoạt tạo phiếu sự cố kỹ thuật và áp dụng hạn cam kết SLA 8 giờ.
            </div>
          </div>

          {/* Citizen Reports Filter Bar */}
          <div className="bg-white p-3 rounded-sm border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên điểm, SĐT, loại sự cố, mã SC-..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <select
                value={citizenStatusFilter}
                onChange={(e) => setCitizenStatusFilter(e.target.value)}
                className="text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 bg-white text-gray-700 cursor-pointer"
              >
                <option value="ALL">-- Tất cả trạng thái phản ánh --</option>
                <option value="PENDING">Đang chờ tiếp nhận</option>
                <option value="AGGREGATED_TO_INCIDENT">Đã tự động tạo sự cố SLA</option>
                <option value="RESOLVED">Đã xử lý</option>
              </select>
            </div>
          </div>

          {/* Citizen Reports Table */}
          <div className="bg-white rounded-sm border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Thời gian</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Điểm phát NVH</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Loại phản ánh</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Người gửi & SĐT</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Mô tả sự cố</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Trạng thái / Phiếu sự cố</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCitizenReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                        Chưa có phản ánh nào từ người dân phù hợp
                      </td>
                    </tr>
                  ) : (
                    paginatedCitizenReports.map((r) => {
                      const issueBadge = CITIZEN_ISSUE_LABELS[r.issueType] || {
                        text: r.issueType,
                        color: 'bg-gray-100 text-gray-800'
                      };

                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            <div className="font-mono">{formatTimeOnly(r.createdAt)}</div>
                            <div className="text-[11px] text-gray-400">{formatDateTime(r.createdAt).split(' ')[1] || ''}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {r.locationName}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${issueBadge.color}`}>
                              {issueBadge.text}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div>{r.reporterName || 'Người dân cơ sở'}</div>
                            {r.phoneNumber && (
                              <div className="text-[11px] font-mono text-blue-600 font-semibold">{r.phoneNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                            {r.description || <span className="italic text-gray-400">Không có mô tả</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {r.ticketCode ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <span>{r.ticketCode}</span>
                              </div>
                            ) : r.status === 'PENDING' ? (
                              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">
                                Chờ đủ 3 phản ánh
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                {r.status === 'RESOLVED' ? 'Đã xử lý' : r.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {!r.ticketCode ? (
                              <button
                                onClick={() => {
                                  if (r.locationId) setCreateLocationId(r.locationId);
                                  setCreateTitle(`Sự cố mạng tại ${r.locationName} (từ phản ánh người dân)`);
                                  setCreateDescription(`Phản ánh: ${issueBadge.text} - ${r.description || ''} (${r.phoneNumber || 'Không để lại SĐT'})`);
                                  setShowCreateModal(true);
                                }}
                                className="px-2.5 py-1 text-white bg-rose-600 hover:bg-rose-700 rounded text-[11px] font-medium cursor-pointer"
                              >
                                Tạo phiếu sự cố
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Đã gắn phiếu</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Smart Pagination for Citizen Reports */}
            <Pagination
              currentPage={citizenPage}
              totalPages={Math.ceil(filteredCitizenReports.length / citizenPageSize)}
              totalElements={filteredCitizenReports.length}
              pageSize={citizenPageSize}
              pageSizeOptions={[5, 10, 15, 20, 50]}
              onPageChange={setCitizenPage}
              onPageSizeChange={(newSize) => {
                setCitizenPageSize(newSize);
                setCitizenPage(0);
              }}
              itemLabel="phản ánh dân sinh"
            />
          </div>
        </div>
      )}

      {/* Incident Details & Timeline Drawer */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 animate-in fade-in">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className="font-mono text-xs font-bold text-rose-600">{selectedIncident.ticketCode}</span>
                  <h3 className="font-bold text-gray-900 text-lg mt-0.5">{selectedIncident.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Điểm phát sóng:</span>
                  <span className="font-semibold text-gray-900">
                    {getLocationDisplayName(selectedIncident.locationId, selectedIncident.locationName)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mức độ khẩn cấp:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] ${SEVERITY_CONFIG[selectedIncident.severity]?.badgeClass || ''}`}>
                    {SEVERITY_CONFIG[selectedIncident.severity]?.label || selectedIncident.severity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái hiện tại:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] ${STATUS_CONFIG[selectedIncident.status]?.badgeClass || ''}`}>
                    {STATUS_CONFIG[selectedIncident.status]?.label || selectedIncident.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thời gian tiếp nhận:</span>
                  <span className="font-mono text-gray-800">
                    {formatDateTime(selectedIncident.reportedAt || selectedIncident.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kỹ thuật viên phụ trách:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedIncident.assignedTo ? `${selectedIncident.assignedTo} (${selectedIncident.assignedGroup || 'Đội Viễn thông'})` : 'Chưa điều phối'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hạn cam kết SLA:</span>
                  <span className="font-mono font-medium text-gray-800">
                    {formatDateTime(selectedIncident.slaDeadline)}
                  </span>
                </div>
                {selectedIncident.rootCauseCategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nguyên nhân cốt lõi (RCA):</span>
                    <span className="font-semibold text-rose-700">
                      {ROOT_CAUSE_LABELS[selectedIncident.rootCauseCategory] || selectedIncident.rootCauseCategory}
                    </span>
                  </div>
                )}
                {selectedIncident.description && (
                  <div className="p-3 bg-slate-50 border rounded-sm mt-2">
                    <div className="font-medium text-gray-700 mb-1">Mô tả sự cố ban đầu:</div>
                    <div className="text-gray-600 leading-relaxed">{selectedIncident.description}</div>
                  </div>
                )}
                {(selectedIncident.resolutionSummary || selectedIncident.resolutionNotes) && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-sm mt-2">
                    <div className="font-medium text-emerald-800 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Nội dung đã khắc phục:
                    </div>
                    <div className="text-emerald-900 leading-relaxed">
                      {selectedIncident.resolutionSummary || selectedIncident.resolutionNotes}
                    </div>
                    {selectedIncident.resolvedAt && (
                      <div className="text-[10px] text-emerald-700 mt-1 font-mono">
                        Khắc phục lúc: {formatDateTime(selectedIncident.resolvedAt)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline Updates */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-gray-500" />
                  Nhật ký điều phối & xử lý ({selectedIncident.updates?.length || 0})
                </h4>
                {selectedIncident.updates && selectedIncident.updates.length > 0 ? (
                  <div className="space-y-3 border-l-2 border-gray-200 ml-2 pl-4">
                    {selectedIncident.updates.map((u) => (
                      <div key={u.id} className="relative text-xs">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
                        <div className="font-semibold text-gray-800 flex items-center justify-between">
                          <span className="text-blue-700">{u.updatedBy}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {formatDateTime(u.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-0.5 leading-relaxed">{u.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded">
                    Chưa có nhật ký cập nhật bổ sung nào. Phiếu được ghi nhận từ hệ thống giám sát.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex gap-2">
                {/* Nút tác nghiệp trong drawer */}
                {(selectedIncident.status === 'OPEN' || selectedIncident.status === 'NEW') && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetIncidentId(selectedIncident.id);
                      setShowAssignModal(true);
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm cursor-pointer shadow-xs"
                  >
                    Phân công kỹ thuật viên
                  </button>
                )}

                {(selectedIncident.status === 'ASSIGNED' || selectedIncident.status === 'IN_PROGRESS') && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetIncidentId(selectedIncident.id);
                        setShowResolveModal(true);
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-sm cursor-pointer shadow-xs"
                    >
                      Báo cáo đã khắc phục
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetIncidentId(selectedIncident.id);
                        if (selectedIncident.assignedTo) setAssigneeName(selectedIncident.assignedTo);
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-sm cursor-pointer"
                    >
                      Đổi KTV
                    </button>
                  </>
                )}

                {selectedIncident.status === 'RESOLVED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetIncidentId(selectedIncident.id);
                        setShowCloseModal(true);
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-sm cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-400" /> Nghiệm thu & Đóng phiếu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetIncidentId(selectedIncident.id);
                        setShowReopenModal(true);
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-sm cursor-pointer inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Mở lại
                    </button>
                  </>
                )}

                {selectedIncident.status === 'CLOSED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetIncidentId(selectedIncident.id);
                      setShowReopenModal(true);
                    }}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Mở lại phiếu sự cố
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-sm cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create Incident */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Mở Phiếu Báo Cáo Sự Cố Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Điểm phát Wi-Fi (NVH)</label>
                <select
                  value={createLocationId}
                  onChange={(e) => setCreateLocationId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.locationCode || 'Mã NVH'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Tiêu đề sự cố</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mất hoàn toàn tín hiệu kết nối Internet ONT tại NVH"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả hiện tượng, báo cáo của người dân hoặc kết quả đo kiểm sơ bộ..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Mức độ khẩn cấp (SLA)</label>
                  <select
                    value={createSeverity}
                    onChange={(e: any) => setCreateSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs font-medium cursor-pointer"
                  >
                    <option value="CRITICAL">🔴 Khẩn cấp - SLA 4h (Mất toàn bộ kết nối)</option>
                    <option value="MAJOR">🟠 Nghiêm trọng - SLA 8h (Suy giảm nặng, nghẽn mạng)</option>
                    <option value="MINOR">🟡 Bình thường - SLA 24h (Lỗi nhẹ, chậm chờn)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Kỹ thuật viên tiếp nhận</label>
                  <input
                    type="text"
                    placeholder="Tên kỹ thuật viên (tùy chọn)"
                    value={createAssignedTo}
                    onChange={(e) => setCreateAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-sm hover:bg-rose-700 font-medium shadow-sm cursor-pointer"
                >
                  Phát hành phiếu sự cố
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assign Incident */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Điều Phối Kỹ Thuật Viên Xử Lý
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Kỹ thuật viên phụ trách</label>
                <input
                  type="text"
                  required
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  placeholder="Ví dụ: KTV Nguyễn Văn An"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Đơn vị / Đội công tác</label>
                <input
                  type="text"
                  value={assignGroup}
                  onChange={(e) => setAssignGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  placeholder="Ví dụ: Đội Viễn thông Trung tâm"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Ghi chú chỉ đạo</label>
                <textarea
                  rows={2}
                  placeholder="Yêu cầu kiểm tra ODF quang và nguồn điện NVH trước 12h..."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700 font-semibold cursor-pointer shadow-xs"
                >
                  Xác nhận điều phối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resolve Incident */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Hoàn Tất Khắc Phục Sự Cố
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nguyên nhân cốt lõi</label>
                <select
                  value={rootCauseCategory}
                  onChange={(e: any) => setRootCauseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs font-semibold cursor-pointer"
                >
                  <option value="POWER_OUTAGE">⚡ Mất nguồn điện lưới NVH</option>
                  <option value="FIBER_CUT">✂️ Đứt cáp quang viễn thông</option>
                  <option value="HARDWARE_FAILURE">🔥 Hỏng thiết bị phần cứng AP / Gateway</option>
                  <option value="CONFIG_ERROR">⚙️ Lỗi cấu hình mạng / DNS</option>
                  <option value="ISP_ISSUE">🌐 Sự cố đường truyền nhà mạng</option>
                  <option value="UNKNOWN">❓ Chưa rõ nguyên nhân</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Biện pháp đã xử lý & Kết quả</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Đã hàn nối lại mối cáp quang trụ điện số 12, đo suy hao quang đạt -18dBm, tín hiệu Wi-Fi đã phát ổn định."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 font-semibold cursor-pointer shadow-xs"
                >
                  Xác nhận đã khắc phục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Close Incident (Nghiệm thu) */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                Nghiệm Thu & Đóng Phiếu Sự Cố
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClose} className="mt-4 space-y-3 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Bạn đang xác nhận nghiệm thu kết quả khắc phục sự cố tại điểm phát này. Sau khi đóng phiếu, trạng thái sẽ chuyển thành <strong>Đã đóng phiếu</strong>.
              </p>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Ghi chú nghiệm thu (tùy chọn)</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Đã kiểm tra lại tốc độ truy cập đạt 65Mbps, người dân kết nối bình thường."
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-sm font-semibold cursor-pointer shadow-xs"
                >
                  Xác nhận đóng phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reopen Incident */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                Mở Lại Phiếu Sự Cố Kỹ Thuật
              </h3>
              <button onClick={() => setShowReopenModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReopen} className="mt-4 space-y-3 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Phiếu sự cố sẽ được mở lại với trạng thái <strong>Đang xử lý</strong> để kỹ thuật viên tiếp tục kiểm tra và đo kiểm hiện trường.
              </p>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Lý do mở lại phiếu</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Kiểm tra thực tế điểm phát sóng vẫn suy hao quang cao, chưa vào được mạng."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm font-semibold cursor-pointer shadow-xs"
                >
                  Xác nhận mở lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
