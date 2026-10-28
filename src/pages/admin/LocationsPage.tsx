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
  Loader2,
  RefreshCw,
  ExternalLink,
  Signal,
  Download,
  Upload,
  Globe2
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { LocationDto, CreateLocationRequest, UpdateLocationRequest, AdminUnitDto } from '../../types/models';
import { Modal } from '../../components/Modal';
import { AlertBanner } from '../../components/AlertBanner';
import { ExcelImportModal } from '../../components/ExcelImportModal';

export const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Excel Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

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
    adminUnitId: '' as string | number,
    latitude: '' as string | number,
    longitude: '' as string | number,
    ispProvider: 'VNPT',
    circuitId: '',
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
    loadAdminUnits();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getLocations({ query: search.trim() || undefined, size: 100 });
      setLocations(resp.content);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách điểm phát Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUnits = async () => {
    try {
      const units = await adminApi.getAdminByLevel(3);
      setAdminUnits(units);
    } catch {
      // Silently fail or keep empty if no admin units yet
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      slug: '',
      name: '',
      address: '',
      description: '',
      adminUnitId: '',
      latitude: '20.8449',
      longitude: '106.6881',
      ispProvider: 'VNPT',
      circuitId: '',
      sessionDurationMinutes: 120,
      maxBandwidthMbps: 20,
      welcomeMessage: 'Chào mừng quý khách đến với mạng Wi-Fi Nhà văn hóa',
      termsAndConditions: 'Bằng việc kết nối vào mạng Wi-Fi này, quý khách cam kết tuân thủ chính sách sử dụng mạng hợp lý và an toàn thông tin theo quy định của UBND TP Hải Phòng.',
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
      adminUnitId: loc.adminUnitId || '',
      latitude: loc.latitude !== undefined && loc.latitude !== null ? loc.latitude : '',
      longitude: loc.longitude !== undefined && loc.longitude !== null ? loc.longitude : '',
      ispProvider: loc.ispName || 'VNPT',
      circuitId: loc.circuitCode || '',
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
        adminUnitId: formData.adminUnitId ? Number(formData.adminUnitId) : undefined,
        latitude: formData.latitude !== '' ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : undefined,
        ispName: formData.ispProvider.trim() || undefined,
        circuitCode: formData.circuitId.trim() || undefined,
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
        adminUnitId: formData.adminUnitId ? Number(formData.adminUnitId) : undefined,
        latitude: formData.latitude !== '' ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : undefined,
        ispName: formData.ispProvider.trim() || undefined,
        circuitCode: formData.circuitId.trim() || undefined,
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

  const filteredLocations = locations.filter((loc) => {
    if (selectedAdminUnit && loc.adminUnitId !== Number(selectedAdminUnit)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hệ Thống 1.584 Điểm Phát Wi-Fi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý mạng lưới Nhà văn hóa, cấu hình băng thông, định vị tọa độ GPS và địa bàn hành chính TP Hải Phòng.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.open(adminApi.getExcelExportUrl(), '_blank')}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
            title="Xuất toàn bộ 1.584 điểm phát ra file Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Xuất Excel
          </button>
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-600/20 cursor-pointer"
            title="Nhập hàng loạt điểm phát từ file Excel"
          >
            <Upload className="w-3.5 h-3.5" /> Nhập Excel 1.584 điểm
          </button>
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
            <Plus className="w-4 h-4" /> Thêm điểm phát
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Search & Admin Unit Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLocations()}
            placeholder="Tìm theo tên điểm phát, địa chỉ, mã đường truyền hoặc slug..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>
        {adminUnits.length > 0 && (
          <div className="w-full md:w-64">
            <select
              value={selectedAdminUnit}
              onChange={(e) => setSelectedAdminUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">-- Tất cả Xã / Phường / Thị trấn --</option>
              {adminUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={loadLocations}
          className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
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
                <th className="py-3.5 px-4">Địa chỉ & Tọa độ GPS</th>
                <th className="py-3.5 px-4">Nhà mạng & Mã cáp</th>
                <th className="py-3.5 px-4">Thời lượng & Băng thông</th>
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
              ) : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy điểm phát nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{loc.name}</span>
                          <span className="text-[11px] font-mono text-slate-400 block">/portal?location={loc.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <div className="truncate font-medium">{loc.address || <span className="text-slate-400 italic">Chưa có địa chỉ</span>}</div>
                      {loc.latitude && loc.longitude ? (
                        <span className="text-[10px] font-mono text-sky-600 flex items-center gap-1 mt-0.5">
                          <Globe2 className="w-3 h-3" /> {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-500 italic">Chưa gán GPS</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-bold text-slate-800">{loc.ispName || 'VNPT'}</div>
                      <div className="text-[11px] font-mono text-slate-400">{loc.circuitCode || 'Chưa gán mã'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {loc.sessionDurationMinutes} phút
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-0.5">
                        <Signal className="w-3 h-3" /> {loc.maxBandwidthMbps} Mbps
                      </div>
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
                        title="Mở Cổng khách của điểm này"
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
        title="Thêm Điểm Phát Wi-Fi Nhà Văn Hóa Mới"
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
                placeholder="Ví dụ: Nhà văn hóa Thôn Lập Lễ"
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
                placeholder="Ví dụ: nvh-thon-lap-le"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ chi tiết</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ví dụ: Thôn Lập Lễ, Xã Lập Lễ, Huyện Thủy Nguyên, Hải Phòng"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Xã / Phường trực thuộc</label>
              <select
                value={formData.adminUnitId}
                onChange={(e) => setFormData({ ...formData, adminUnitId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
              >
                <option value="">-- Chưa gán địa bàn --</option>
                {adminUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vĩ độ (Latitude) Hải Phòng</label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="20.50 - 21.15"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kinh độ (Longitude) Hải Phòng</label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="106.40 - 107.15"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nhà mạng (ISP)</label>
              <select
                value={formData.ispProvider}
                onChange={(e) => setFormData({ ...formData, ispProvider: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
              >
                <option value="VNPT">VNPT</option>
                <option value="Viettel">Viettel</option>
                <option value="FPT">FPT Telecom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã đường truyền / Hợp đồng cáp</label>
              <input
                type="text"
                value={formData.circuitId}
                onChange={(e) => setFormData({ ...formData, circuitId: e.target.value })}
                placeholder="Ví dụ: HP-HBG-00129"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ chi tiết</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Xã / Phường trực thuộc</label>
              <select
                value={formData.adminUnitId}
                onChange={(e) => setFormData({ ...formData, adminUnitId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
              >
                <option value="">-- Chưa gán địa bàn --</option>
                {adminUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vĩ độ GPS</label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kinh độ GPS</label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nhà mạng (ISP)</label>
              <select
                value={formData.ispProvider}
                onChange={(e) => setFormData({ ...formData, ispProvider: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
              >
                <option value="VNPT">VNPT</option>
                <option value="Viettel">Viettel</option>
                <option value="FPT">FPT Telecom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã đường truyền cáp</label>
              <input
                type="text"
                value={formData.circuitId}
                onChange={(e) => setFormData({ ...formData, circuitId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
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

      {/* Modal 4: Excel Import Wizard (Screen C08, C09) */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          loadLocations();
        }}
      />
    </div>
  );
};