import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Loader2,
  RefreshCw,
  ExternalLink,
  Signal
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { LocationDto, CreateLocationRequest, UpdateLocationRequest } from '../../types/models';
import { Modal } from '../../components/Modal';
import { AlertBanner } from '../../components/AlertBanner';

export const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDto | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<LocationDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    address: '',
    description: '',
    sessionDurationMinutes: 120,
    maxBandwidthMbps: 20,
    welcomeMessage: 'Chào mừng quý khách đến với mạng Wi-Fi miễn phí',
    termsAndConditions: 'Bằng việc kết nối vào mạng Wi-Fi này, quý khách cam kết tuân thủ chính sách sử dụng hợp lý, không thực hiện các hành vi gây hại hoặc vi phạm pháp luật.',
    promoTitle: '',
    promoContent: '',
    promoBannerUrl: '',
    promoActionUrl: '',
    active: true,
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getLocations({ query: search.trim() || undefined, size: 50 });
      setLocations(resp.content);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách điểm phát Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      slug: '',
      name: '',
      address: '',
      description: '',
      sessionDurationMinutes: 120,
      maxBandwidthMbps: 20,
      welcomeMessage: 'Chào mừng quý khách đến với mạng Wi-Fi miễn phí',
      termsAndConditions: 'Bằng việc kết nối vào mạng Wi-Fi này, quý khách cam kết tuân thủ chính sách sử dụng mạng hợp lý và an toàn thông tin.',
      promoTitle: '',
      promoContent: '',
      promoBannerUrl: '',
      promoActionUrl: '',
      active: true,
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (loc: LocationDto) => {
    setEditingLocation(loc);
    setFormData({
      slug: loc.slug,
      name: loc.name,
      address: loc.address || '',
      description: loc.description || '',
      sessionDurationMinutes: loc.sessionDurationMinutes,
      maxBandwidthMbps: loc.maxBandwidthMbps,
      welcomeMessage: loc.welcomeMessage || '',
      termsAndConditions: loc.termsAndConditions,
      promoTitle: loc.promoTitle || '',
      promoContent: loc.promoContent || '',
      promoBannerUrl: loc.promoBannerUrl || '',
      promoActionUrl: loc.promoActionUrl || '',
      active: loc.active,
    });
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const payload: CreateLocationRequest = {
        slug: formData.slug.trim(),
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        description: formData.description.trim() || undefined,
        sessionDurationMinutes: Number(formData.sessionDurationMinutes),
        maxBandwidthMbps: Number(formData.maxBandwidthMbps),
        welcomeMessage: formData.welcomeMessage.trim() || undefined,
        termsAndConditions: formData.termsAndConditions.trim(),
        promoTitle: formData.promoTitle.trim() || undefined,
        promoContent: formData.promoContent.trim() || undefined,
        promoBannerUrl: formData.promoBannerUrl.trim() || undefined,
        promoActionUrl: formData.promoActionUrl.trim() || undefined,
        active: formData.active,
      };

      await adminApi.createLocation(payload);
      setIsCreateOpen(false);
      loadLocations();
    } catch (err: any) {
      setFormError(err?.message || 'Không thể tạo điểm phát Wi-Fi mới.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    setSaving(true);
    setFormError(null);

    try {
      const payload: UpdateLocationRequest = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        description: formData.description.trim() || undefined,
        sessionDurationMinutes: Number(formData.sessionDurationMinutes),
        maxBandwidthMbps: Number(formData.maxBandwidthMbps),
        welcomeMessage: formData.welcomeMessage.trim() || undefined,
        termsAndConditions: formData.termsAndConditions.trim(),
        promoTitle: formData.promoTitle.trim() || undefined,
        promoContent: formData.promoContent.trim() || undefined,
        promoBannerUrl: formData.promoBannerUrl.trim() || undefined,
        promoActionUrl: formData.promoActionUrl.trim() || undefined,
        active: formData.active,
      };

      await adminApi.updateLocation(editingLocation.id, payload);
      setEditingLocation(null);
      loadLocations();
    } catch (err: any) {
      setFormError(err?.message || 'Không thể cập nhật thông tin điểm phát Wi-Fi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;
    setSaving(true);
    try {
      await adminApi.deleteLocation(deletingLocation.id);
      setDeletingLocation(null);
      loadLocations();
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa điểm phát Wi-Fi này.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Điểm Phát Wi-Fi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các chi nhánh cửa hàng, thời lượng phiên truy cập, giới hạn băng thông và lời chào mừng.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLocations}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm điểm phát mới
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLocations()}
            placeholder="Tìm theo tên điểm phát, địa chỉ hoặc mã slug..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>
        <button
          onClick={loadLocations}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tên điểm phát & Slug</th>
                <th className="py-3.5 px-4">Địa chỉ</th>
                <th className="py-3.5 px-4">Thời lượng phiên</th>
                <th className="py-3.5 px-4">Băng thông</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    Đang tải danh sách điểm phát Wi-Fi...
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chưa có điểm phát Wi-Fi nào. Hãy bấm "Thêm điểm phát mới".
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {loc.promoBannerUrl ? (
                          <img
                            src={loc.promoBannerUrl}
                            alt=""
                            className="w-10 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0 shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{loc.name}</span>
                          <span className="text-[11px] font-mono text-slate-400 block">/portal?location={loc.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {loc.address || <span className="text-slate-400 italic">Chưa cập nhật địa chỉ</span>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {loc.sessionDurationMinutes} phút
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Signal className="w-3.5 h-3.5 text-emerald-600" />
                        {loc.maxBandwidthMbps} Mbps
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {loc.active ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px]">
                          <XCircle className="w-3 h-3 text-slate-400" /> Tạm dừng
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <a
                        href={`/portal?location=${loc.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg inline-block transition"
                        title="Mở thử Cổng khách của điểm phát này"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingLocation(loc)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa điểm phát"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create Location */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm Điểm Phát Wi-Fi Mới"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && <AlertBanner type="error" message={formError} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên điểm phát <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Circle K - Ga Trung Tâm"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã Slug (URL duy nhất) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="Ví dụ: circle-k-central"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ chi nhánh</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ví dụ: 102 Đại lộ Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng tối đa (phút)</label>
              <input
                type="number"
                min="1"
                max="1440"
                value={formData.sessionDurationMinutes}
                onChange={(e) => setFormData({ ...formData, sessionDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giới hạn băng thông (Mbps)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.maxBandwidthMbps}
                onChange={(e) => setFormData({ ...formData, maxBandwidthMbps: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lời chào mừng hiển thị trên Cổng</label>
            <input
              type="text"
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Promotional / Survey Marketing Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <span className="text-xs font-bold text-slate-800 block">
              Chiến dịch quảng cáo / Khảo sát (Tùy chọn cho chi nhánh này)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tiêu đề bài viết / Khảo sát</label>
                <input
                  type="text"
                  value={formData.promoTitle}
                  onChange={(e) => setFormData({ ...formData, promoTitle: e.target.value })}
                  placeholder="VD: Khảo sát nhận voucher 20%"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Link hành động / Link khảo sát</label>
                <input
                  type="text"
                  value={formData.promoActionUrl}
                  onChange={(e) => setFormData({ ...formData, promoActionUrl: e.target.value })}
                  placeholder="VD: https://forms.gle/... hoặc link web"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Link ảnh Banner quảng cáo</label>
              <input
                type="text"
                value={formData.promoBannerUrl}
                onChange={(e) => setFormData({ ...formData, promoBannerUrl: e.target.value })}
                placeholder="VD: /banners/central.jpg hoặc https://..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
              />
              {formData.promoBannerUrl && (
                <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 relative">
                  <img
                    src={formData.promoBannerUrl}
                    alt="Xem trước banner"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Nội dung giới thiệu / Khảo sát</label>
              <textarea
                rows={2}
                value={formData.promoContent}
                onChange={(e) => setFormData({ ...formData, promoContent: e.target.value })}
                placeholder="Nội dung tóm tắt bài báo, thông điệp quảng cáo hoặc hướng dẫn khảo sát..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Điều khoản & Quy định sử dụng dịch vụ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="createActive"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="createActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Kích hoạt điểm phát Wi-Fi này ngay
            </label>
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
              disabled={saving}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-600/20"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Lưu điểm phát
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Location */}
      <Modal
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title={`Chỉnh Sửa Điểm Phát: ${editingLocation?.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && <AlertBanner type="error" message={formError} />}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên điểm phát <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ chi nhánh</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng phiên (phút)</label>
              <input
                type="number"
                min="1"
                max="1440"
                value={formData.sessionDurationMinutes}
                onChange={(e) => setFormData({ ...formData, sessionDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giới hạn băng thông (Mbps)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.maxBandwidthMbps}
                onChange={(e) => setFormData({ ...formData, maxBandwidthMbps: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lời chào mừng hiển thị</label>
            <input
              type="text"
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Promotional / Survey Marketing Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <span className="text-xs font-bold text-slate-800 block">
              Chiến dịch quảng cáo / Khảo sát (Tùy chọn cho chi nhánh này)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tiêu đề bài viết / Khảo sát</label>
                <input
                  type="text"
                  value={formData.promoTitle}
                  onChange={(e) => setFormData({ ...formData, promoTitle: e.target.value })}
                  placeholder="VD: Khảo sát nhận voucher 20%"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Link hành động / Link khảo sát</label>
                <input
                  type="text"
                  value={formData.promoActionUrl}
                  onChange={(e) => setFormData({ ...formData, promoActionUrl: e.target.value })}
                  placeholder="VD: https://forms.gle/... hoặc link web"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Link ảnh Banner quảng cáo</label>
              <input
                type="text"
                value={formData.promoBannerUrl}
                onChange={(e) => setFormData({ ...formData, promoBannerUrl: e.target.value })}
                placeholder="VD: /banners/central.jpg hoặc https://..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
              />
              {formData.promoBannerUrl && (
                <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 relative">
                  <img
                    src={formData.promoBannerUrl}
                    alt="Xem trước banner"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Nội dung giới thiệu / Khảo sát</label>
              <textarea
                rows={2}
                value={formData.promoContent}
                onChange={(e) => setFormData({ ...formData, promoContent: e.target.value })}
                placeholder="Nội dung tóm tắt bài báo, thông điệp quảng cáo hoặc hướng dẫn khảo sát..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Điều khoản dịch vụ</label>
            <textarea
              rows={3}
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="editActive"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="editActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Đang hoạt động (Kích hoạt cho khách truy cập)
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingLocation(null)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-600/20"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Cập nhật thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Confirm Delete */}
      <Modal
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        title="Xác Nhận Xóa Điểm Phát Wi-Fi"
        maxWidth="sm"
      >
        {deletingLocation && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa điểm phát sóng <strong className="text-slate-900 font-bold">{deletingLocation.name}</strong> không? Các phiên truy cập trong quá khứ vẫn sẽ được lưu trữ trong nhật ký.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingLocation(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteLocation}
                disabled={saving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-rose-600/20"
              >
                {saving ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
