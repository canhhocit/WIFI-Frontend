import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Layers,
  MapPin,
  Edit3,
  Trash2,
  Save,
  Play,
  Eye,
  LayoutGrid,
  List,
  Smartphone,
  Monitor,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Globe,
  Radio,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { CampaignDto, CreateCampaignRequest, AdminUnitDto, LocationDto } from '../../types/models';
import { Modal } from '../../components/Modal';
import { AlertBanner } from '../../components/AlertBanner';
import { ImageUploadInput } from '../../components/ImageUploadInput';
import { VietnamFlag } from '../../components/VietnamFlag';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [targetMode, setTargetMode] = useState<'ALL' | 'ADMIN_UNIT' | 'LOCATION'>('ALL');
  const [error, setError] = useState<string | null>(null);

  // View Mode: GRID vs TABLE (Default to GRID as requested)
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Portal Simulator State
  const [simulatingCampaign, setSimulatingCampaign] = useState<CampaignDto | null>(null);
  const [simDevice, setSimDevice] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignDto | null>(null);
  const [actionCampaign, setActionCampaign] = useState<{ c: CampaignDto; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<CreateCampaignRequest>({
    title: '',
    description: '',
    bannerUrl: '',
    videoUrl: '',
    actionUrl: '',
    targetAdminUnitId: undefined,
    targetLocationId: undefined,
    priority: 1,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadCampaigns();
  }, [statusFilter]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const apiStatus = statusFilter === 'ACTIVE_NOW' ? 'APPROVED' : (statusFilter || undefined);
      const [resp, locsResp, adminResp] = await Promise.all([
        adminApi.getCampaigns({ status: apiStatus, size: 100 }),
        adminApi.getLocations({ size: 100 }).catch(() => ({ content: [] })),
        adminApi.getAdminByLevel(2).catch(() => []),
      ]);
      setCampaigns(resp.content || []);
      setLocations(locsResp.content || []);
      setAdminUnits(adminResp || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách chiến dịch truyền thông.');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeThumbnail = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    return null;
  };

  const getEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
    if (url.includes('youtube.com/embed')) return url;
    return null;
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      bannerUrl: '',
      videoUrl: '',
      actionUrl: '',
      targetAdminUnitId: undefined,
      targetLocationId: undefined,
      priority: 1,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
    });
    setTargetMode('ALL');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createCampaign({
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      setIsCreateOpen(false);
      resetFormData();
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi tạo chiến dịch');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c: CampaignDto) => {
    setEditingCampaign(c);
    setTargetMode(c.targetLocationId ? 'LOCATION' : (c.targetAdminUnitId ? 'ADMIN_UNIT' : 'ALL'));
    setFormData({
      title: c.title,
      description: c.description || '',
      bannerUrl: c.bannerUrl || '',
      videoUrl: c.videoUrl || '',
      actionUrl: c.actionUrl || '',
      targetAdminUnitId: c.targetAdminUnitId,
      targetLocationId: c.targetLocationId,
      priority: c.priority || 1,
      startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endTime: c.endTime ? new Date(c.endTime).toISOString().slice(0, 16) : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setSubmitting(true);
    try {
      await adminApi.updateCampaign(editingCampaign.id, {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      setEditingCampaign(null);
      resetFormData();
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi cập nhật chiến dịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chiến dịch này không? Thao tác không thể hoàn tác.')) return;
    try {
      await adminApi.deleteCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa chiến dịch');
    }
  };

  const handleSubmitForApproval = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn gửi trình duyệt chiến dịch này lên cấp có thẩm quyền phê duyệt?')) return;
    try {
      await adminApi.submitCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi gửi phê duyệt');
    }
  };

  const handleApprovalAction = async () => {
    if (!actionCampaign) return;
    setSubmitting(true);
    try {
      if (actionCampaign.action === 'APPROVE') {
        await adminApi.approveCampaign(actionCampaign.c.id, { comment: actionComment.trim() || undefined });
      } else {
        await adminApi.rejectCampaign(actionCampaign.c.id, { rejectReason: actionComment.trim() || 'Nội dung chưa đạt yêu cầu' });
      }
      setActionCampaign(null);
      setActionComment('');
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Thao tác phê duyệt thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const now = new Date();
  const isCampaignLive = (c: CampaignDto): boolean => {
    if (c.status !== 'APPROVED') return false;
    const start = c.startTime ? new Date(c.startTime) : null;
    const end = c.endTime ? new Date(c.endTime) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const activeNowCount = campaigns.filter(isCampaignLive).length;
  const multimediaCount = campaigns.filter((c) => !!c.videoUrl || !!c.bannerUrl).length;
  const pendingCount = campaigns.filter((c) => c.status === 'PENDING_APPROVAL').length;
  const draftCount = campaigns.filter((c) => c.status === 'DRAFT').length;
  const approvedCount = campaigns.filter((c) => c.status === 'APPROVED').length;
  const rejectedCount = campaigns.filter((c) => c.status === 'REJECTED').length;

  const renderStatusBadge = (c: CampaignDto) => {
    const start = c.startTime ? new Date(c.startTime) : null;
    const end = c.endTime ? new Date(c.endTime) : null;

    if (c.status === 'APPROVED') {
      if (end && now > end) {
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-sm text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" /> Đã kết thúc
          </span>
        );
      }
      if (start && now < start) {
        return (
          <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-sm text-[11px]">
            <Clock className="w-3 h-3 text-sky-500" /> Sắp phát sóng
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-sm text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang phát sóng
        </span>
      );
    }

    switch (c.status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" /> Bản nháp
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm text-[11px]">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Chờ duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm text-[11px]">
            <XCircle className="w-3 h-3 text-rose-500" /> Bị từ chối
          </span>
        );
      default:
        return <span className="text-[11px] font-semibold text-slate-500">{c.status}</span>;
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === 'ACTIVE_NOW' && !isCampaignLive(c)) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = c.title.toLowerCase().includes(term);
    const descMatch = c.description && c.description.toLowerCase().includes(term);
    const creatorMatch = c.createdBy && c.createdBy.toLowerCase().includes(term);
    return titleMatch || descMatch || creatorMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header (Follows exact DevicesPage / LocationsPage template) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chiến Dịch Truyền Thông & Chính Sách Số</h1>
         
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadCampaigns}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <a
            href="/portal"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
            title="Mở Cổng chào Người dân để kiểm tra thực tế"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Mở Cổng chào
          </a>
          <button
            onClick={() => {
              resetFormData();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* 2. Stat Summary Cards (Exact IncidentsPage & DevicesPage template) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded border border-slate-300 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tổng số chiến dịch</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{campaigns.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Nội dung tuyên truyền đã khởi tạo</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded border border-slate-300 shadow-xs">
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang phát sóng
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{activeNowCount}</div>
          <div className="text-xs text-emerald-700/80 mt-0.5">Phủ sóng 1.584 Cổng chào NVH</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded border border-slate-300 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Nội dung đa phương tiện</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{multimediaCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Video Clip & Poster đồ họa</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded border border-slate-300 shadow-xs">
          <div className="text-xs text-amber-700 font-medium">Chờ thẩm định duyệt</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{pendingCount}</div>
          <div className="text-xs text-amber-700/80 mt-0.5">Yêu cầu trình duyệt phát sóng</div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar (Exact LocationsPage / DevicesPage template) */}
      <div className="bg-white p-2.5 sm:p-3 rounded border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { id: '', label: `Tất cả (${campaigns.length})` },
            { id: 'ACTIVE_NOW', label: `Đang phát sóng (${activeNowCount})` },
            { id: 'PENDING_APPROVAL', label: `Chờ duyệt (${pendingCount})` },
            { id: 'APPROVED', label: `Đã duyệt (${approvedCount})` },
            { id: 'DRAFT', label: `Bản nháp (${draftCount})` },
            { id: 'REJECTED', label: `Từ chối (${rejectedCount})` },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-[#004b87] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004b87]"
            />
          </div>

          <div className="flex items-center border border-slate-300 rounded-sm p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`px-2.5 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'GRID' ? 'bg-[#004b87] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ truyền thông số"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-[#004b87] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng bảng dữ liệu"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Content Area: Clean Professional Cards or Table */}
      {loading ? (
        <div className="bg-white rounded border border-slate-300 p-12 text-center text-slate-400 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
          Đang tải danh sách chiến dịch...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded border border-slate-300 p-12 text-center text-slate-400 shadow-xs">
          Không có chiến dịch truyền thông nào phù hợp.
        </div>
      ) : viewMode === 'GRID' ? (
        /* ================= CHẾ ĐỘ DẠNG THẺ (GRID) - ĐÚNG CHUẨN DESIGN SYSTEM HIỆN TẠI ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((c) => {
            const ytThumbnail = getYouTubeThumbnail(c.videoUrl);
            const displayBanner = c.bannerUrl || ytThumbnail || '/banners/haiphong_city_bg.jpg';
            const hasVideo = !!c.videoUrl;

            return (
              <div
                key={c.id}
                className="bg-white rounded border border-slate-300 shadow-xs hover:border-slate-400 transition flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Header: Title & Badges */}
                  <div className="p-3.5 border-b border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {renderStatusBadge(c)}
                        {hasVideo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-sm">
                            <Video className="w-3 h-3 text-red-600" /> Video
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-sm">
                            <ImageIcon className="w-3 h-3 text-slate-500" /> Poster
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-200">
                        Ưu tiên: P{c.priority}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1" title={c.title}>
                      {c.title}
                    </h3>
                  </div>

                  {/* Visual Media Thumbnail Area */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden border-b border-slate-200">
                    <img
                      src={displayBanner}
                      alt={c.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                      }}
                    />

                    {/* Play icon overlay for video */}
                    {hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/10 transition">
                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-2 text-xs">
                    <p className="text-slate-600 line-clamp-2 leading-relaxed text-[11.5px]">
                      {c.description || 'Chưa cập nhật mô tả chi tiết cho thông điệp này.'}
                    </p>

                    {/* Target Scope */}
                    <div className="pt-1">
                      {c.targetLocationId ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          Điểm: {locations.find((l) => l.id === c.targetLocationId)?.name || `ID #${c.targetLocationId}`}
                        </span>
                      ) : c.targetAdminUnitId ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          Địa bàn: {adminUnits.find((u) => u.id === c.targetAdminUnitId)?.name || `Cấp #${c.targetAdminUnitId}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                          <Globe className="w-3 h-3 text-slate-500" />
                          Toàn TP Hải Phòng (1.584 NVH)
                        </span>
                      )}
                    </div>

                    {/* Schedule & Metadata */}
                    <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-1 border-t border-slate-100">
                      <div>Từ: {formatDate(c.startTime)}</div>
                      <div>Đến: {formatDate(c.endTime)}</div>
                      {c.actionUrl && (
                        <div className="pt-0.5 font-sans">
                          <a
                            href={c.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#004b87] hover:underline font-semibold text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" /> Liên kết Cổng DVC
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSimulatingCampaign(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#004b87] border border-blue-200 rounded-sm font-semibold transition cursor-pointer"
                      title="Xem trước màn hình Cổng chào người dân"
                    >
                      <Eye className="w-3 h-3" /> Xem trước
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-sm font-semibold transition cursor-pointer"
                      title="Chỉnh sửa chiến dịch"
                    >
                      <Edit3 className="w-3 h-3" /> Sửa
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {(c.status === 'DRAFT' || c.status === 'REJECTED') && (
                      <button
                        onClick={() => handleSubmitForApproval(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#003865] border border-sky-200 rounded-sm font-bold transition cursor-pointer"
                        title="Gửi phê duyệt"
                      >
                        <Send className="w-3 h-3" /> Gửi duyệt
                      </button>
                    )}

                    {c.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => setActionCampaign({ c, action: 'APPROVE' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-bold transition shadow-xs cursor-pointer"
                          title="Phê duyệt phát sóng"
                        >
                          <ThumbsUp className="w-3 h-3" /> Duyệt
                        </button>
                        <button
                          onClick={() => setActionCampaign({ c, action: 'REJECT' })}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-sm font-bold transition cursor-pointer"
                          title="Từ chối yêu cầu"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition cursor-pointer"
                      title="Xóa chiến dịch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= CHẾ ĐỘ BẢNG QUẢN TRỊ (TABLE) ================= */
        <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-300 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Tên chiến dịch</th>
                  <th className="py-3 px-4">Phạm vi tiếp sóng</th>
                  <th className="py-3 px-4">Thời gian phát sóng</th>
                  <th className="py-3 px-4">Độ ưu tiên</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Cán bộ</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {c.bannerUrl || c.videoUrl ? (
                          <div className="relative w-12 h-8 rounded-sm overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-900">
                            <img
                              src={c.bannerUrl || getYouTubeThumbnail(c.videoUrl) || '/banners/haiphong_city_bg.jpg'}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                              }}
                            />
                            {c.videoUrl && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Play className="w-3 h-3 text-white fill-current" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-sm bg-sky-50 text-[#004b87] flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{c.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">{c.description || 'Không có mô tả'}</span>
                          {c.actionUrl && (
                            <a
                              href={c.actionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-[#004b87] hover:underline mt-0.5 font-semibold"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Dịch vụ công liên kết
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {c.targetLocationId ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                          <MapPin className="w-3 h-3" />
                          {locations.find((l) => l.id === c.targetLocationId)?.name || `ID #${c.targetLocationId}`}
                        </span>
                      ) : c.targetAdminUnitId ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                          <MapPin className="w-3 h-3" />
                          {adminUnits.find((u) => u.id === c.targetAdminUnitId)?.name || `Cấp #${c.targetAdminUnitId}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                          <Layers className="w-3 h-3" /> Toàn TP Hải Phòng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div>Từ: {formatDate(c.startTime)}</div>
                      <div>Đến: {formatDate(c.endTime)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm font-mono text-[11px]">
                        P{c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {renderStatusBadge(c)}
                      {c.rejectReason && (
                        <span className="text-[10px] text-rose-600 block mt-1 italic">Lý do: {c.rejectReason}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div>Tạo: <strong>{c.createdBy || 'admin'}</strong></div>
                      {c.approvedBy && (
                        <div className="text-emerald-700 font-semibold">Duyệt: {c.approvedBy}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSimulatingCampaign(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#004b87] border border-blue-200 rounded-sm text-xs font-semibold transition cursor-pointer"
                        title="Xem thử trên Cổng chào"
                      >
                        <Eye className="w-3 h-3" /> Xem trước
                      </button>

                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold transition cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-3 h-3" /> Sửa
                      </button>

                      {(c.status === 'DRAFT' || c.status === 'REJECTED') && (
                        <button
                          onClick={() => handleSubmitForApproval(c.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#003865] border border-sky-200 rounded-sm text-xs font-bold transition cursor-pointer"
                          title="Gửi phê duyệt"
                        >
                          <Send className="w-3 h-3" /> Gửi
                        </button>
                      )}

                      {c.status === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            onClick={() => setActionCampaign({ c, action: 'APPROVE' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Phê duyệt"
                          >
                            <ThumbsUp className="w-3 h-3" /> Duyệt
                          </button>
                          <button
                            onClick={() => setActionCampaign({ c, action: 'REJECT' })}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-sm text-xs font-bold transition cursor-pointer"
                            title="Từ chối"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="inline-flex items-center p-1 text-slate-400 hover:text-rose-600 rounded-sm transition cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: TRÌNH MÔ PHỎNG CỔNG CHÀO (PORTAL SIMULATOR) ================= */}
      {simulatingCampaign && (
        <Modal
          isOpen={!!simulatingCampaign}
          onClose={() => setSimulatingCampaign(null)}
          title={`Xem Trước: ${simulatingCampaign.title}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            {/* Simulator Toolbar */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-300 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Thiết bị mô phỏng:</span>
                <div className="flex items-center border border-slate-300 rounded-sm p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setSimDevice('MOBILE')}
                    className={`px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      simDevice === 'MOBILE' ? 'bg-[#004b87] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Điện thoại (375px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimDevice('DESKTOP')}
                    className={`px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      simDevice === 'DESKTOP' ? 'bg-[#004b87] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Máy tính (640px)
                  </button>
                </div>
              </div>

              <a
                href="/portal"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#004b87] hover:underline font-bold text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Mở trang Cổng chào thật
              </a>
            </div>

            {/* Device Canvas Frame */}
            <div className="p-4 bg-slate-800 rounded border border-slate-700 flex justify-center items-center overflow-x-auto min-h-[460px]">
              <div
                className={`transition-all duration-200 bg-white rounded-lg shadow-xl overflow-hidden border-2 border-slate-600 flex flex-col ${
                  simDevice === 'MOBILE' ? 'w-[375px]' : 'w-[640px]'
                }`}
              >
                {/* Simulated Portal Content */}
                <div className="bg-slate-50 flex-1 overflow-y-auto max-h-[580px] font-sans text-slate-800">
                  {/* Government Red Banner */}
                  <div className="bg-[#a81c1c] text-white p-3 text-center border-b border-red-900">
                    <div className="flex justify-center mb-1">
                      <VietnamFlag width={36} height={24} className="rounded-xs shadow-xs border border-yellow-400/50" />
                    </div>
                    <div className="text-[9px] font-bold tracking-widest text-yellow-300 uppercase">
                      ỦY BAN NHÂN DÂN THÀNH PHỐ HẢI PHÒNG
                    </div>
                    <div className="text-xs font-black uppercase text-white mt-0.5">
                      CỔNG THÔNG TIN WI-FI CÔNG CỘNG
                    </div>
                  </div>

                  {/* Location Meta Strip */}
                  <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
                    <div className="flex items-center gap-1 font-semibold truncate">
                      <MapPin className="w-3 h-3 text-[#a81c1c]" />
                      <span>Nhà văn hóa thôn, tổ dân phố Hải Phòng</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[9.5px]">
                      <span className="text-emerald-700 font-bold">20 Mbps</span>
                      <span>•</span>
                      <span className="text-blue-700">Trực tuyến</span>
                    </div>
                  </div>

                  {/* Ticker */}
                  <div className="bg-[#881313] text-white px-3 py-1 flex items-center gap-1.5 text-[10px] overflow-hidden">
                    <div className="flex items-center gap-1 bg-yellow-400 text-red-950 font-black px-1.5 py-0.2 rounded-xs text-[8.5px] uppercase tracking-wider flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                      TIN PHÁT SÓNG
                    </div>
                    <div className="truncate flex-1 text-yellow-100 font-sans">
                      <span className="font-bold text-white uppercase">{simulatingCampaign.title}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-3">
                    {/* Media Spotlight Card */}
                    <div className="rounded border-2 border-red-200 bg-white p-3 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between gap-1 border-b border-red-100 pb-1.5">
                        <span className="text-[9.5px] font-bold text-[#a81c1c] uppercase flex items-center gap-1">
                          <Megaphone className="w-3 h-3" /> TRUYỀN THÔNG SỐ CHÍNH QUYỀN
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          ĐANG PHÁT SÓNG
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {simulatingCampaign.title}
                      </h4>

                      {/* Video or Image */}
                      {getEmbedUrl(simulatingCampaign.videoUrl) ? (
                        <div className="aspect-video w-full rounded overflow-hidden border border-slate-300 bg-black">
                          <iframe
                            src={getEmbedUrl(simulatingCampaign.videoUrl)!}
                            title={simulatingCampaign.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="aspect-video w-full rounded overflow-hidden border border-slate-200 bg-slate-900">
                          <img
                            src={simulatingCampaign.bannerUrl || getYouTubeThumbnail(simulatingCampaign.videoUrl) || '/banners/haiphong_city_bg.jpg'}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans line-clamp-3">
                        {simulatingCampaign.description || 'Nội dung tuyên truyền phục vụ nhân dân khi sử dụng mạng Wi-Fi công cộng tại Nhà văn hóa.'}
                      </p>

                      {simulatingCampaign.actionUrl && (
                        <a
                          href={simulatingCampaign.actionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1.5 px-3 bg-[#004b87] hover:bg-[#003865] text-white rounded text-[11px] font-bold text-center block transition shadow-xs"
                        >
                          Mở Cổng Dịch Vụ Công Hải Phòng
                        </a>
                      )}
                    </div>

                    {/* 1-Click Wi-Fi Connect Button for Citizens */}
                    <div className="p-3 bg-white rounded border border-slate-300 shadow-xs space-y-2 text-center">
                      <div className="text-[11px] font-bold text-slate-800">
                        Kết nối Internet Wi-Fi Miễn Phí
                      </div>
                      <button
                        type="button"
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ĐĂNG NHẬP KẾT NỐI WI-FI NGAY</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSimulatingCampaign(null)}
                className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer transition"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: TẠO CHIẾN DỊCH MỚI ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo Chiến Dịch Truyền Thông & Chính Sách Số Mới"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề chiến dịch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ví dụ: Tuyên truyền Dịch vụ công trực tuyến VNeID mức 2"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả thông điệp chính sách</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nội dung truyền thông phục vụ công dân khi truy cập mạng Wi-Fi tại Nhà văn hóa..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm"
            />
          </div>

          {/* Banner Upload */}
          <div>
            <ImageUploadInput
              value={formData.bannerUrl || ''}
              onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
              label="Ảnh Banner / Poster chiến dịch"
              helperText="Tải poster từ máy tính hoặc nhập liên kết ảnh"
              category="campaigns"
            />
          </div>

          {/* Video URL & Action URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Video tuyên truyền (YouTube URL)</label>
              <input
                type="text"
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link chuyển hướng khi bấm (Action URL)</label>
              <input
                type="text"
                value={formData.actionUrl || ''}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="https://dichvucong.haiphong.gov.vn"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm"
              />
            </div>
          </div>

          {/* Target Scope Selection */}
          <div className="bg-slate-50 p-3 rounded-sm border border-slate-300 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Phạm vi phát sóng chiến dịch
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetMode('ALL');
                  setFormData({ ...formData, targetAdminUnitId: undefined, targetLocationId: undefined });
                }}
                className={`py-1.5 px-2 rounded-sm text-xs font-semibold border transition cursor-pointer ${
                  targetMode === 'ALL'
                    ? 'bg-[#004b87] text-white border-[#004b87]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Toàn Thành Phố
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetMode('ADMIN_UNIT');
                  setFormData({ ...formData, targetLocationId: undefined });
                }}
                className={`py-1.5 px-2 rounded-sm text-xs font-semibold border transition cursor-pointer ${
                  targetMode === 'ADMIN_UNIT'
                    ? 'bg-[#004b87] text-white border-[#004b87]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Theo Quận / Huyện
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetMode('LOCATION');
                  setFormData({ ...formData, targetAdminUnitId: undefined });
                }}
                className={`py-1.5 px-2 rounded-sm text-xs font-semibold border transition cursor-pointer ${
                  targetMode === 'LOCATION'
                    ? 'bg-[#004b87] text-white border-[#004b87]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Nhà Văn Hóa Cụ Thể
              </button>
            </div>

            {targetMode === 'ADMIN_UNIT' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn Quận / Huyện:</label>
                <select
                  value={formData.targetAdminUnitId || ''}
                  onChange={(e) => setFormData({ ...formData, targetAdminUnitId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm"
                >
                  <option value="">-- Chọn Quận / Huyện phát sóng --</option>
                  {adminUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            {targetMode === 'LOCATION' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn Nhà văn hóa:</label>
                <select
                  value={formData.targetLocationId || ''}
                  onChange={(e) => setFormData({ ...formData, targetLocationId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm"
                >
                  <option value="">-- Chọn Nhà văn hóa phát sóng --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>[{loc.locationCode || loc.slug}] {loc.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Schedule & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Độ ưu tiên (1 - 10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-sm text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Lưu bản nháp chiến dịch
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: CHỈNH SỬA CHIẾN DỊCH ================= */}
      {editingCampaign && (
        <Modal
          isOpen={!!editingCampaign}
          onClose={() => setEditingCampaign(null)}
          title={`Chỉnh Sửa Chiến Dịch: ${editingCampaign?.title}`}
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề chiến dịch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả thông điệp chính sách</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm"
              />
            </div>

            <div>
              <ImageUploadInput
                value={formData.bannerUrl || ''}
                onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
                label="Ảnh Banner / Poster chiến dịch"
                helperText="Tải poster từ máy tính hoặc nhập liên kết ảnh"
                category="campaigns"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Video tuyên truyền (YouTube URL)</label>
                <input
                  type="text"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link chuyển hướng khi bấm (Action URL)</label>
                <input
                  type="text"
                  value={formData.actionUrl || ''}
                  onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                  placeholder="https://dichvucong.haiphong.gov.vn"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm"
                />
              </div>
            </div>

            {/* Target Scope Selection */}
            <div className="bg-slate-50 p-3 rounded-sm border border-slate-300 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Phạm vi phát sóng chiến dịch
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetMode('ALL');
                    setFormData({ ...formData, targetAdminUnitId: undefined, targetLocationId: undefined });
                  }}
                  className={`py-1.5 px-2 rounded-sm text-xs font-semibold border transition cursor-pointer ${
                    targetMode === 'ALL'
                      ? 'bg-[#004b87] text-white border-[#004b87]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Toàn Thành Phố
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetMode('ADMIN_UNIT');
                    setFormData({ ...formData, targetLocationId: undefined });
                  }}
                  className={`py-1.5 px-2 rounded-sm text-xs font-semibold border transition cursor-pointer ${
                    targetMode === 'ADMIN_UNIT'
                      ? 'bg-[#004b87] text-white border-[#004b87]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Theo Quận / Huyện
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetMode('LOCATION');
                    setFormData({ ...formData, targetAdminUnitId: undefined });
                  }}
                  className={`py-1.5 px-2 rounded-sm text-xs font-semibold border transition cursor-pointer ${
                    targetMode === 'LOCATION'
                      ? 'bg-[#004b87] text-white border-[#004b87]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Nhà Văn Hóa Cụ Thể
                </button>
              </div>

              {targetMode === 'ADMIN_UNIT' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn Quận / Huyện:</label>
                  <select
                    value={formData.targetAdminUnitId || ''}
                    onChange={(e) => setFormData({ ...formData, targetAdminUnitId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm"
                  >
                    <option value="">-- Chọn Quận / Huyện phát sóng --</option>
                    {adminUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetMode === 'LOCATION' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn Nhà văn hóa:</label>
                  <select
                    value={formData.targetLocationId || ''}
                    onChange={(e) => setFormData({ ...formData, targetLocationId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm"
                  >
                    <option value="">-- Chọn Nhà văn hóa phát sóng --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>[{loc.locationCode || loc.slug}] {loc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Schedule & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Độ ưu tiên (1 - 10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-sm text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu thay đổi chiến dịch
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: PHÊ DUYỆT / TỪ CHỐI ================= */}
      {actionCampaign && (
        <Modal
          isOpen={!!actionCampaign}
          onClose={() => setActionCampaign(null)}
          title={actionCampaign?.action === 'APPROVE' ? 'Phê Duyệt Chiến Dịch Phát Sóng' : 'Từ Chối Chiến Dịch'}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Chiến dịch: <strong className="text-slate-900 font-bold">{actionCampaign?.c.title}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {actionCampaign?.action === 'APPROVE' ? 'Ý kiến phê duyệt (Tùy chọn)' : 'Lý do từ chối (Bắt buộc)'}
              </label>
              <textarea
                rows={3}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={
                  actionCampaign?.action === 'APPROVE'
                    ? 'Ý kiến ghi vào nhật ký kiểm toán...'
                    : 'Nêu rõ lý do từ chối để bộ phận truyền thông điều chỉnh...'
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                required={actionCampaign?.action === 'REJECT'}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActionCampaign(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-sm text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleApprovalAction}
                disabled={submitting || (actionCampaign?.action === 'REJECT' && !actionComment.trim())}
                className={`px-4 py-2 rounded-sm text-xs font-bold transition text-white shadow-xs cursor-pointer ${
                  actionCampaign?.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? 'Đang xử lý...' : actionCampaign?.action === 'APPROVE' ? 'Xác nhận Duyệt' : 'Xác nhận Từ chối'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
