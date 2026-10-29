import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import {
  IncidentTicketDto,
  IncidentSeverity,
  IncidentStatus,
  RootCauseCategory,
  CreateIncidentRequest,
  AssignIncidentRequest,
  ResolveIncidentRequest,
  LocationDto,
  SlaMetricsDto
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
  Send
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedLocationId = searchParams.get('createLocationId');

  const [incidents, setIncidents] = useState<IncidentTicketDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<SlaMetricsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(!!preselectedLocationId);
  const [selectedIncident, setSelectedIncident] = useState<IncidentTicketDto | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
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
  const [assigneeName, setAssigneeName] = useState<string>('VNPT_KyThuat_01');
  const [assignGroup, setAssignGroup] = useState<string>('Trung tâm Viễn thông Hải Phòng');
  const [assignNote, setAssignNote] = useState<string>('');

  // Resolve form state
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [rootCauseCategory, setRootCauseCategory] = useState<RootCauseCategory>('FIBER_CUT');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsPage, locsPage, slaData] = await Promise.all([
        adminApi.getIncidents({ size: 50 }),
        adminApi.getLocations({ page: 0, size: 100 }),
        adminApi.getSlaMetrics(),
      ]);
      setIncidents(ticketsPage.content);
      setLocations(locsPage.content);
      setSlaMetrics(slaData);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((t) => {
      const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
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
        assignedGroup: createAssignedTo ? 'Đội kỹ thuật VNPT Hải Phòng' : undefined,
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
      alert('Không thể phân công kỹ thuật');
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

  const calculateRemainingSla = (slaDeadline: string, status: IncidentStatus) => {
    if (status === 'RESOLVED' || status === 'CLOSED') {
      return { text: 'Đã hoàn thành', breached: false, labelColor: 'text-gray-500' };
    }
    const deadline = new Date(slaDeadline).getTime();
    const now = Date.now();
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return {
        text: `Quá hạn SLA ${Math.abs(Math.round(diffHours))}h`,
        breached: true,
        labelColor: 'text-red-600 font-bold',
      };
    }
    return {
      text: `Còn lại ${diffHours.toFixed(1)}h`,
      breached: false,
      labelColor: 'text-amber-600 font-medium',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-600" />
            Hệ thống Quản lý Sự cố Kỹ thuật & Cam kết SLA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quy trình tiếp nhận, điều phối kỹ thuật viên VNPT/Viettel và tự động phân loại nguyên nhân đứt cáp / mất điện
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Báo cáo sự cố mới
          </button>
        </div>
      </div>

      {/* SLA Metrics Cards */}
      {slaMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 font-medium">Tổng số phiếu sự cố</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{slaMetrics.totalTickets}</div>
            <div className="text-xs text-gray-500 mt-0.5">{slaMetrics.openTickets} đang xử lý</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs text-emerald-600 font-medium">Đã hoàn thành khắc phục</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{slaMetrics.resolvedTickets}</div>
            <div className="text-xs text-emerald-600/80 mt-0.5">Đã phục hồi Internet</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs text-rose-600 font-medium">Vi phạm hạn cam kết SLA</div>
            <div className="mt-1 text-2xl font-bold text-rose-600">{slaMetrics.slaBreachedCount}</div>
            <div className="text-xs text-rose-600/80 mt-0.5">Cần ưu tiên xử lý khẩn cấp</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs text-blue-600 font-medium">Tỷ lệ tuân thủ SLA</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">{slaMetrics.slaComplianceRatePercent}%</div>
            <div className="text-xs text-blue-600/80 mt-0.5">MTTR trung bình: {slaMetrics.averageResolutionHours} giờ</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã SC-..., tên sự cố, địa điểm, kỹ thuật viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="OPEN">Mới tiếp nhận (OPEN)</option>
            <option value="ASSIGNED">Đã phân công (ASSIGNED)</option>
            <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
            <option value="RESOLVED">Đã khắc phục (RESOLVED)</option>
            <option value="CLOSED">Đã đóng (CLOSED)</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="ALL">-- Mức độ khẩn cấp --</option>
            <option value="CRITICAL">🔴 CRITICAL (SLA 4h)</option>
            <option value="MAJOR">🟠 MAJOR (SLA 8h)</option>
            <option value="MINOR">🟡 MINOR (SLA 24h)</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Mã vé / Thời gian</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Điểm phát NVH</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Tiêu đề sự cố</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Mức độ</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Kỹ thuật phụ trách</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Hạn cam kết SLA</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Không có phiếu sự cố nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((t) => {
                  const sla = calculateRemainingSla(t.slaDeadline, t.status);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-gray-900">{t.ticketCode}</div>
                        <div className="text-[11px] text-gray-400">
                          {new Date(t.reportedAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {t.locationName || `NVH #${t.locationId}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 max-w-xs truncate">{t.title}</div>
                        {t.rootCauseCategory && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border">
                            Nguyên nhân: {t.rootCauseCategory}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            t.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : t.severity === 'MAJOR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {t.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            t.status === 'RESOLVED' || t.status === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {t.assignedTo ? (
                          <div>
                            <div className="font-medium text-gray-900">{t.assignedTo}</div>
                            <div className="text-[10px] text-gray-400">{t.assignedGroup}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Chưa điều phối</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-xs ${sla.labelColor}`}>{sla.text}</div>
                        <div className="text-[10px] text-gray-400">
                          Hạn: {new Date(t.slaDeadline).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedIncident(t)}
                          className="px-2 py-1 text-gray-600 hover:text-gray-900 bg-gray-100 rounded text-[11px] font-medium"
                        >
                          Nhật ký
                        </button>

                        {t.status === 'OPEN' && (
                          <button
                            onClick={() => {
                              setTargetIncidentId(t.id);
                              setShowAssignModal(true);
                            }}
                            className="px-2 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded text-[11px] font-medium"
                          >
                            Phân công
                          </button>
                        )}

                        {(t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') && (
                          <button
                            onClick={() => {
                              setTargetIncidentId(t.id);
                              setShowResolveModal(true);
                            }}
                            className="px-2 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded text-[11px] font-medium"
                          >
                            Khắc phục
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
      </div>

      {/* Incident Details & Timeline Drawer */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className="font-mono text-xs font-bold text-rose-600">{selectedIncident.ticketCode}</span>
                  <h3 className="font-bold text-gray-900 text-lg mt-0.5">{selectedIncident.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Điểm phát:</span>
                  <span className="font-medium text-gray-900">{selectedIncident.locationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mức độ sự cố:</span>
                  <span className="font-bold text-gray-900">{selectedIncident.severity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái hiện tại:</span>
                  <span className="font-bold text-blue-600">{selectedIncident.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kỹ thuật viên phụ trách:</span>
                  <span className="font-medium text-gray-900">{selectedIncident.assignedTo || 'Chưa giao'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hạn cam kết SLA:</span>
                  <span className="font-mono text-gray-800">
                    {new Date(selectedIncident.slaDeadline).toLocaleString('vi-VN')}
                  </span>
                </div>
                {selectedIncident.rootCauseCategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nguyên nhân cốt lõi (RCA):</span>
                    <span className="font-semibold text-rose-700">{selectedIncident.rootCauseCategory}</span>
                  </div>
                )}
                {selectedIncident.resolutionSummary && (
                  <div className="p-3 bg-gray-50 border rounded-lg mt-2">
                    <div className="font-medium text-gray-700 mb-1">Nội dung khắc phục:</div>
                    <div className="text-gray-600">{selectedIncident.resolutionSummary}</div>
                  </div>
                )}
              </div>

              {/* Timeline Updates */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-3">
                  Nhật ký điều phối & xử lý ({selectedIncident.updates?.length || 0})
                </h4>
                <div className="space-y-3 border-l-2 border-gray-200 ml-2 pl-4">
                  {selectedIncident.updates?.map((u) => (
                    <div key={u.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <div className="font-semibold text-gray-800 flex items-center justify-between">
                        <span>{u.updatedBy}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {new Date(u.createdAt).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-0.5">{u.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create Incident */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Mở Phiếu Báo Cáo Sự Cố Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Điểm phát Wi-Fi (NVH)</label>
                <select
                  value={createLocationId}
                  onChange={(e) => setCreateLocationId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả hiện tượng, báo cáo của người dân hoặc kết quả đo kiểm sơ bộ..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Mức độ khẩn cấp (SLA)</label>
                  <select
                    value={createSeverity}
                    onChange={(e: any) => setCreateSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium"
                  >
                    <option value="CRITICAL">CRITICAL - SLA 4h (Mất toàn bộ)</option>
                    <option value="MAJOR">MAJOR - SLA 8h (Suy giảm nghiêm trọng)</option>
                    <option value="MINOR">MINOR - SLA 24h (Lỗi nhẹ, chậm chờn)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Kỹ thuật viên tiếp nhận</label>
                  <input
                    type="text"
                    placeholder="Tên kỹ thuật viên (tùy chọn)"
                    value={createAssignedTo}
                    onChange={(e) => setCreateAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium shadow-sm"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Điều Phối Kỹ Thuật Viên Xử Lý
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Đơn vị / Đội công tác</label>
                <input
                  type="text"
                  value={assignGroup}
                  onChange={(e) => setAssignGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Ghi chú chỉ đạo</label>
                <textarea
                  rows={2}
                  placeholder="Yêu cầu kiểm tra ODF quang và nguồn điện NVH trước 12h..."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Hoàn Tất Khắc Phục Sự Cố
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nguyên nhân cốt lõi (Root Cause)</label>
                <select
                  value={rootCauseCategory}
                  onChange={(e: any) => setRootCauseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                >
                  <option value="POWER_OUTAGE">⚡ Mất nguồn điện lưới (POWER_OUTAGE)</option>
                  <option value="FIBER_CUT">✂️ Đứt cáp quang viễn thông (FIBER_CUT)</option>
                  <option value="HARDWARE_FAILURE">🔥 Cháy hỏng thiết bị phần cứng (HARDWARE_FAILURE)</option>
                  <option value="CONFIG_ERROR">⚙️ Lỗi cấu hình mạng (CONFIG_ERROR)</option>
                  <option value="UNKNOWN">❓ Chưa rõ nguyên nhân (UNKNOWN)</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Xác nhận hoàn thành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
