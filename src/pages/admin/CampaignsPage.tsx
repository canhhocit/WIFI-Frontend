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
  AlertTriangle
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { CampaignDto, CreateCampaignRequest, AdminUnitDto, LocationDto } from '../../types/models';
import { Modal } from '../../components/Modal';
import { AlertBanner } from '../../components/AlertBanner';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionCampaign, setActionCampaign] = useState<{ c: CampaignDto; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
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
      const resp = await adminApi.getCampaigns({ status: statusFilter || undefined, size: 50 });
      setCampaigns(resp.content);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách chiến dịch truyền thông.');
    } finally {
      setLoading(false);
    }
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
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi tạo chiến dịch');
    } finally {
      setSubmitting(false);
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" /> Bản nháp (DRAFT)
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px]">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Chờ phê duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã phê duyệt phát sóng
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px]">
            <XCircle className="w-3 h-3 text-rose-500" /> Bị từ chối
          </span>
        );
      default:
        return <span className="text-[11px] font-semibold text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chiến Dịch Truyền Thông & Chính Sách Số</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý banner, video tuyên truyền chính quyền điện tử và quy trình phê duyệt 2 bước trước khi phát sóng ra 1.584 điểm phát.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCampaigns}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        {['', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === st ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === ''
              ? 'Tất cả trạng thái'
              : st === 'DRAFT'
              ? 'Bản nháp'
              : st === 'PENDING_APPROVAL'
              ? 'Chờ duyệt (Cần xử lý)'
              : st === 'APPROVED'
              ? 'Đã duyệt'
              : 'Từ chối'}
          </button>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tên chiến dịch & Banner</th>
                <th className="py-3.5 px-4">Thời gian phát sóng</th>
                <th className="py-3.5 px-4">Độ ưu tiên</th>
                <th className="py-3.5 px-4">Trạng thái phê duyệt</th>
                <th className="py-3.5 px-4">Người khởi tạo / Duyệt</th>
                <th className="py-3.5 px-4 text-right">Quy trình duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    Đang tải danh sách chiến dịch...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không có chiến dịch truyền thông nào phù hợp.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {c.bannerUrl ? (
                          <img
                            src={c.bannerUrl}
                            alt=""
                            className="w-12 h-9 rounded-lg object-cover border border-slate-200 shadow-xs flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{c.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{c.description || 'Không có mô tả'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div>Từ: {formatDate(c.startTime)}</div>
                      <div>Đến: {formatDate(c.endTime)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                        Ưu tiên: {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(c.status)}
                      {c.rejectReason && (
                        <span className="text-[10px] text-rose-600 block mt-1 italic">Lý do từ chối: {c.rejectReason}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <div>Tạo bởi: <strong className="text-slate-800">{c.createdBy || 'admin'}</strong></div>
                      {c.approvedBy && (
                        <div className="text-emerald-700 font-semibold">Duyệt: {c.approvedBy}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {(c.status === 'DRAFT' || c.status === 'REJECTED') && (
                        <button
                          onClick={() => handleSubmitForApproval(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="Trình duyệt chiến dịch lên cấp thẩm quyền"
                        >
                          <Send className="w-3.5 h-3.5" /> Gửi duyệt
                        </button>
                      )}

                      {c.status === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            onClick={() => setActionCampaign({ c, action: 'APPROVE' })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Phê duyệt phát sóng"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => setActionCampaign({ c, action: 'REJECT' })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="Từ chối yêu cầu"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create Campaign */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo Chiến Dịch Truyền Thông / Chính Sách Số Mới"
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
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả thông điệp chính sách</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nội dung truyền thông phục vụ công dân khi truy cập mạng..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL Ảnh Banner quảng bá</label>
              <input
                type="text"
                value={formData.bannerUrl || ''}
                onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                placeholder="https://... hoặc /banners/vneid.jpg"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link chuyển hướng khi bấm (Action URL)</label>
              <input
                type="text"
                value={formData.actionUrl || ''}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="Ví dụ: https://dichvucong.gov.vn"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Độ ưu tiên (Priority)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-600/20"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Lưu bản nháp chiến dịch
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Approval / Rejection Dialog */}
      <Modal
        isOpen={!!actionCampaign}
        onClose={() => setActionCampaign(null)}
        title={actionCampaign?.action === 'APPROVE' ? 'Phê Duyệt Chiến Dịch Phát Sóng' : 'Từ Chối Kích Hoạt Chiến Dịch'}
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
                  ? 'Ý kiến phê duyệt ghi vào nhật ký kiểm toán...'
                  : 'Nêu rõ lý do từ chối để bộ phận soạn thảo điều chỉnh...'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              required={actionCampaign?.action === 'REJECT'}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActionCampaign(null)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleApprovalAction}
              disabled={submitting || (actionCampaign?.action === 'REJECT' && !actionComment.trim())}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition text-white shadow-xs cursor-pointer ${
                actionCampaign?.action === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {submitting ? 'Đang xử lý...' : actionCampaign?.action === 'APPROVE' ? 'Xác nhận Duyệt' : 'Xác nhận Từ chối'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
