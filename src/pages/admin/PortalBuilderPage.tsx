import React, { useEffect, useState } from 'react';
import {
  Palette,
  Eye,
  Save,
  CheckCircle2,
  Smartphone,
  Loader2,
  RefreshCw,
  Image,
  Type,
  Layout,
  ExternalLink,
  Globe,
  MapPin,
  Megaphone,
  Sparkles,
  Building2,
  Info,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { PortalTemplateDto, LocationDto } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';
import { ImageUploadInput } from '../../components/ImageUploadInput';
import { Toast } from '../../components/Toast';

export const PortalBuilderPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bottom-Right Corner Toast Notification State
  const [toast, setToast] = useState<{
    show: boolean;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
  }>({
    show: false,
    title: undefined,
    message: '',
    type: 'success',
  });

  // Scope: 'GLOBAL' (Toàn thành phố) or 'LOCATION' (Từng Nhà văn hóa cụ thể)
  const [scope, setScope] = useState<'GLOBAL' | 'LOCATION'>('GLOBAL');

  // Global Template State
  const [template, setTemplate] = useState<PortalTemplateDto>({
    name: 'Giao diện Nhà văn hóa Tiêu chuẩn',
    templateType: 'CULTURAL',
    themeColor: '#0284c7',
    backgroundColor: '#0c2340',
    backgroundImageUrl: '/banners/haiphong_city_bg.jpg',
    logoUrl: '',
    bannerUrl: '',
    title: 'Cổng Thông Tin Wi-Fi',
    welcomeText: 'Chào mừng quý công dân và du khách đến với Nhà văn hóa. Vui lòng bấm Kết nối để sử dụng mạng Internet công cộng tốc độ cao.',
    buttonText: 'Bắt Đầu Kết Nối Wi-Fi',
    termsText: 'Bằng việc truy cập mạng Wi-Fi công cộng này, quý vị đồng ý tuân thủ quy tắc ứng xử trên không gian mạng và các quy định pháp luật hiện hành.',
    active: true,
  });

  // Per-Location Customization State
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);
  const [locFormData, setLocFormData] = useState({
    welcomeMessage: '',
    promoTitle: '',
    promoContent: '',
    promoBannerUrl: '',
    backgroundImageUrl: '',
    promoActionUrl: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [activeTpl, locsRes] = await Promise.all([
        adminApi.getActivePortalTemplate(),
        adminApi.getLocations({ size: 100 }),
      ]);

      if (activeTpl) {
        setTemplate(activeTpl);
      }

      if (locsRes?.content) {
        setLocations(locsRes.content);
        if (locsRes.content.length > 0 && !selectedLocationId) {
          const first = locsRes.content[0];
          setSelectedLocationId(first.id);
          setSelectedLocation(first);
          setLocFormData({
            welcomeMessage: first.welcomeMessage || '',
            promoTitle: first.promoTitle || '',
            promoContent: first.promoContent || '',
            promoBannerUrl: first.promoBannerUrl || '',
            backgroundImageUrl: first.backgroundImageUrl || '',
            promoActionUrl: first.promoActionUrl || '',
          });
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải cấu hình giao diện Cổng chào.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (locId: number) => {
    setSelectedLocationId(locId);
    const found = locations.find((l) => l.id === locId);
    if (found) {
      setSelectedLocation(found);
      setLocFormData({
        welcomeMessage: found.welcomeMessage || '',
        promoTitle: found.promoTitle || '',
        promoContent: found.promoContent || '',
        promoBannerUrl: found.promoBannerUrl || '',
        backgroundImageUrl: found.backgroundImageUrl || '',
        promoActionUrl: found.promoActionUrl || '',
      });
    }
  };

  const handleSaveGlobalTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await adminApi.savePortalTemplate(template);
      setTemplate(saved);
      setToast({
        show: true,
        title: 'Lưu thành công',
        message: 'Đã lưu giao diện Cổng chào toàn thành phố',
        type: 'success',
      });
    } catch (err: any) {
      const msg = err?.message || 'Không thể lưu cấu hình giao diện.';
      setError(msg);
      setToast({
        show: true,
        title: 'Lỗi lưu cấu hình',
        message: msg,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateLocation(selectedLocation.id, {
        name: selectedLocation.name,
        address: selectedLocation.address,
        description: selectedLocation.description,
        adminUnitId: selectedLocation.adminUnitId,
        locationCode: selectedLocation.locationCode,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        ispName: selectedLocation.ispName,
        circuitCode: selectedLocation.circuitCode,
        sessionDurationMinutes: selectedLocation.sessionDurationMinutes,
        maxBandwidthMbps: selectedLocation.maxBandwidthMbps,
        termsAndConditions: selectedLocation.termsAndConditions,
        welcomeMessage: locFormData.welcomeMessage.trim() || undefined,
        promoTitle: locFormData.promoTitle.trim() || undefined,
        promoContent: locFormData.promoContent.trim() || undefined,
        promoBannerUrl: locFormData.promoBannerUrl.trim() || undefined,
        backgroundImageUrl: locFormData.backgroundImageUrl.trim() || undefined,
        promoActionUrl: locFormData.promoActionUrl.trim() || undefined,
        active: selectedLocation.active,
      });

      setSelectedLocation(updated);
      setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setToast({
        show: true,
        title: 'Cập nhật thành công',
        message: `Đã lưu tùy biến giao diện cho điểm: ${updated.name}`,
        type: 'success',
      });
    } catch (err: any) {
      const msg = err?.message || 'Không thể lưu tùy biến điểm phát sóng.';
      setError(msg);
      setToast({
        show: true,
        title: 'Lỗi lưu tùy biến',
        message: msg,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetLocationCustomization = () => {
    setLocFormData({
      welcomeMessage: '',
      promoTitle: '',
      promoContent: '',
      promoBannerUrl: '',
      backgroundImageUrl: '',
      promoActionUrl: '',
    });
    setToast({
      show: true,
      title: 'Đã hoàn tác cấu hình riêng',
      message: 'Đã xóa thiết lập riêng. Vui lòng bấm Lưu để điểm này dùng mẫu chung TP.',
      type: 'info',
    });
  };

  // Preview Calculations
  const previewWallpaperUrl =
    scope === 'LOCATION'
      ? (locFormData.backgroundImageUrl && locFormData.backgroundImageUrl !== '/banners/haiphong_city_bg.jpg'
          ? locFormData.backgroundImageUrl
          : template.backgroundImageUrl) || '/banners/haiphong_city_bg.jpg'
      : template.backgroundImageUrl || '/banners/haiphong_city_bg.jpg';

  const previewBannerUrl =
    scope === 'LOCATION'
      ? (locFormData.promoBannerUrl && locFormData.promoBannerUrl !== '/banners/haiphong_culture_house.jpg'
          ? locFormData.promoBannerUrl
          : template.bannerUrl) || template.bannerUrl || '/banners/haiphong_culture_house.jpg'
      : template.bannerUrl || '/banners/haiphong_culture_house.jpg';

  const previewWelcomeText =
    scope === 'LOCATION'
      ? locFormData.welcomeMessage || selectedLocation?.welcomeMessage || template.welcomeText
      : template.welcomeText;

  const currentPreviewPortalLink =
    scope === 'LOCATION' && selectedLocation
      ? `/portal?location=${selectedLocation.slug}`
      : '/portal';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trình Dựng & Tùy Biến Cổng Chào Wi-Fi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết kế giao diện Cổng chào chung toàn thành phố hoặc cá nhân hóa hình ảnh, lời chào, bản tin cho từng Nhà văn hóa / khu vực.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={currentPreviewPortalLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#004b87]" />
            {scope === 'LOCATION' && selectedLocation ? `Xem Cổng: ${selectedLocation.name}` : 'Xem trực tiếp Cổng khách'}
          </a>
          <button
            onClick={loadInitialData}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tải lại
          </button>
        </div>
      </div>

      {/* Scope Mode Switcher (Tab chọn phạm vi áp dụng) */}
      <div className="bg-white p-3 rounded border border-slate-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Phạm vi thiết lập:</span>
          <div className="inline-flex rounded-sm bg-slate-100 p-1 border border-slate-200 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setScope('GLOBAL')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded font-bold transition cursor-pointer ${
                scope === 'GLOBAL'
                  ? 'bg-[#004b87] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Chung</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('LOCATION')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded font-bold transition cursor-pointer ${
                scope === 'LOCATION'
                  ? 'bg-[#004b87] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Từng khu vực ({locations.length})</span>
            </button>
          </div>
        </div>

        {/* Guidance Note */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#004b87] flex-shrink-0" />
          <span>
            {scope === 'GLOBAL'
              ? 'Áp dụng làm mẫu mặc định cho tất cả các điểm'
              : 'Áp dụng cho từng điểm cụ thể'}
          </span>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {loading ? (
        <div className="bg-white p-12 rounded border border-slate-200 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
          Đang tải dữ liệu cấu hình...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form (7 cols) - Independent Scrollable Pane */}
          <div className="lg:col-span-7 bg-white rounded border border-slate-300 shadow-xs flex flex-col lg:max-h-[calc(100vh-175px)] overflow-hidden">
            {scope === 'GLOBAL' ? (
              /* FORM 1: GLOBAL CITYWIDE TEMPLATE */
              <form onSubmit={handleSaveGlobalTemplate} className="flex flex-col h-full overflow-hidden text-xs">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 font-bold text-slate-800 text-sm flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#004b87]" />
                    <span>Mẫu Nhận Diện Toàn Thành Phố</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Đang kích hoạt
                  </span>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tên bộ mẫu giao diện</label>
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Màu chủ đạo (Theme Color nút bấm)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={template.themeColor}
                          onChange={(e) => setTemplate({ ...template, themeColor: e.target.value })}
                          className="w-9 h-9 rounded-sm border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={template.themeColor}
                          onChange={(e) => setTemplate({ ...template, themeColor: e.target.value })}
                          className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Màu nền dự phòng (Background)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={template.backgroundColor}
                          onChange={(e) => setTemplate({ ...template, backgroundColor: e.target.value })}
                          className="w-9 h-9 rounded-sm border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={template.backgroundColor}
                          onChange={(e) => setTemplate({ ...template, backgroundColor: e.target.value })}
                          className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề Cổng chào chính (H1)</label>
                    <input
                      type="text"
                      value={template.title}
                      onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                      placeholder="Ví dụ: Cổng Thông Tin Wi-Fi Nhà Văn Hóa"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lời chào mừng công dân mặc định</label>
                    <textarea
                      rows={2}
                      value={template.welcomeText || ''}
                      onChange={(e) => setTemplate({ ...template, welcomeText: e.target.value })}
                      placeholder="Thông điệp chào mừng hiển thị phía trên nút kết nối..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dòng chữ nút kết nối chính</label>
                    <input
                      type="text"
                      value={template.buttonText}
                      onChange={(e) => setTemplate({ ...template, buttonText: e.target.value })}
                      placeholder="Ví dụ: Bắt Đầu Kết Nối Wi-Fi"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] font-bold"
                      required
                    />
                  </div>

                  {/* 3 IMAGE SECTIONS WITH DISTINCT NUMBERING */}
                  <div className="space-y-4 pt-1">
                    {/* 1. Background Wallpaper */}
                    <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                        <span>Hình nền lớn toàn màn hình (Background Wallpaper)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Bao phủ toàn bộ không gian phía sau khung đăng nhập (ảnh phong cảnh Cầu Hoàng Văn Thụ, trung tâm TP...).
                      </p>
                      <ImageUploadInput
                        value={template.backgroundImageUrl || ''}
                        onChange={(url) => setTemplate({ ...template, backgroundImageUrl: url })}
                        label="Tải ảnh nền hoặc dán URL (Khuyến nghị 1920x1080):"
                        helperText="Chọn ảnh từ máy hoặc dán link URL"
                        category="banners"
                      />
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                          Gợi ý hình nền biểu tượng Hải Phòng:
                        </span>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setTemplate({ ...template, backgroundImageUrl: '/banners/haiphong_city_bg.jpg' })}
                            className={`px-2.5 py-1 rounded border transition font-medium cursor-pointer ${
                              template.backgroundImageUrl === '/banners/haiphong_city_bg.jpg'
                                ? 'bg-[#004b87] text-white border-[#004b87]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            🌉 Cầu Hoàng Văn Thụ (Đêm)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemplate({ ...template, backgroundImageUrl: '/banners/haiphong_culture_house.jpg' })}
                            className={`px-2.5 py-1 rounded border transition font-medium cursor-pointer ${
                              template.backgroundImageUrl === '/banners/haiphong_culture_house.jpg'
                                ? 'bg-[#004b87] text-white border-[#004b87]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            🏛️ Nhà văn hóa Hải Phòng
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemplate({ ...template, backgroundImageUrl: '/banners/central.jpg' })}
                            className={`px-2.5 py-1 rounded border transition font-medium cursor-pointer ${
                              template.backgroundImageUrl === '/banners/central.jpg'
                                ? 'bg-[#004b87] text-white border-[#004b87]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            🏙️ Trung tâm Thành phố
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. Card Header Banner */}
                    <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">2</span>
                        <span>Ảnh Banner minh họa (Nằm trong thẻ chào mừng)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Ảnh chữ nhật hiển thị ở giữa thẻ thông tin phía trên nút kết nối (ảnh cổng Nhà văn hóa, biểu ngữ tuyên truyền...).
                      </p>
                      <ImageUploadInput
                        value={template.bannerUrl || ''}
                        onChange={(url) => setTemplate({ ...template, bannerUrl: url })}
                        label="Tải ảnh banner hoặc dán URL:"
                        helperText="Tải banner từ máy tính hoặc nhập liên kết ảnh"
                        category="banners"
                      />
                    </div>

                    {/* 3. Official Logo */}
                    <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">3</span>
                        <span>Biểu trưng chính thức / Logo (Huy hiệu TP hoặc cơ quan)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Logo đặt ở đầu tiêu đề Cổng chào (khuyến nghị dùng ảnh PNG tách nền trong suốt).
                      </p>
                      <ImageUploadInput
                        value={template.logoUrl || ''}
                        onChange={(url) => setTemplate({ ...template, logoUrl: url })}
                        label="Tải logo hoặc dán URL:"
                        helperText="Tải logo từ máy tính hoặc nhập liên kết ảnh"
                        category="logos"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Điều khoản & Quy định an toàn mạng</label>
                    <textarea
                      rows={3}
                      value={template.termsText || ''}
                      onChange={(e) => setTemplate({ ...template, termsText: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm leading-relaxed"
                    />
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b flex-shrink-0">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Cập nhật áp dụng cho các điểm phát Wi-Fi chung toàn TP
                  </span>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition shadow-sm shadow-sky-600/20 cursor-pointer ml-auto"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu & Xuất Bản Toàn Hệ Thống
                  </button>
                </div>
              </form>
            ) : (
              /* FORM 2: PER-LOCATION CUSTOMIZATION */
              <form onSubmit={handleSaveLocation} className="flex flex-col h-full overflow-hidden text-xs">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 font-bold text-slate-800 text-sm flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#a81c1c]" />
                    <span>Tùy Biến Cổng Chào Theo Nhà Văn Hóa</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetLocationCustomization}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Xóa cấu hình riêng để dùng lại ảnh và nội dung mẫu chung toàn thành phố"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Dùng lại mẫu chung TP
                  </button>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                  {/* Location Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chọn Nhà văn hóa / Điểm phát sóng cần chỉnh sửa:
                    </label>
                    <select
                      value={selectedLocationId || ''}
                      onChange={(e) => handleSelectLocation(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          [{loc.locationCode || `ID-${loc.id}`}] {loc.name} {loc.adminUnitName ? `(${loc.adminUnitName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Meta Card */}
                  {selectedLocation && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-start justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-slate-900 block">{selectedLocation.name}</span>
                        <span className="text-slate-500 block mt-0.5">{selectedLocation.address || 'TP Hải Phòng'}</span>
                        <span className="text-slate-400 font-mono text-[10px] mt-0.5 block">
                          Đường dẫn truy cập: <code className="text-[#004b87]">/portal?location={selectedLocation.slug}</code>
                        </span>
                      </div>
                      <div className="text-right text-[10.5px] font-mono text-slate-600 flex-shrink-0">
                        <div>Thời lượng: <strong className="text-slate-800">{selectedLocation.sessionDurationMinutes} phút</strong></div>
                        <div>Băng thông: <strong className="text-emerald-700">{selectedLocation.maxBandwidthMbps} Mbps</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Welcome Message for this location */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lời chào mừng riêng của Nhà văn hóa này:
                    </label>
                    <input
                      type="text"
                      value={locFormData.welcomeMessage}
                      onChange={(e) => setLocFormData({ ...locFormData, welcomeMessage: e.target.value })}
                      placeholder={`Ví dụ: Chào mừng Nhân dân đến với ${selectedLocation?.name || 'Nhà văn hóa'}`}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">Để trống nếu muốn dùng câu chào mừng chung của Thành phố.</p>
                  </div>

                  {/* Banner Photo for this specific location */}
                  <div className="p-3.5 bg-blue-50/60 rounded-sm border border-blue-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#004b87]">
                      <Image className="w-4 h-4" />
                      <span>Ảnh Banner thực tế riêng của Nhà văn hóa này</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ảnh chụp cổng chính hoặc hội trường Nhà văn hóa thôn / tổ dân phố để công dân dễ nhận biết.
                    </p>
                    <ImageUploadInput
                      value={locFormData.promoBannerUrl}
                      onChange={(url) => setLocFormData({ ...locFormData, promoBannerUrl: url })}
                      label="Tải ảnh thực tế Nhà văn hóa hoặc dán URL:"
                      helperText="Tải từ máy tính hoặc để trống để kế thừa Banner chung toàn TP"
                      category="banners"
                    />
                  </div>

                  {/* Background Wallpaper for this specific location */}
                  <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Palette className="w-4 h-4 text-[#004b87]" />
                      <span>Hình nền Cổng chào riêng của điểm này (Tùy chọn)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ảnh nền lớn bao quanh màn hình riêng cho điểm này (Để trống nếu muốn dùng nền chung toàn TP).
                    </p>
                    <ImageUploadInput
                      value={locFormData.backgroundImageUrl}
                      onChange={(url) => setLocFormData({ ...locFormData, backgroundImageUrl: url })}
                      label="Tải ảnh nền riêng hoặc dán URL:"
                      helperText="Khuyên dùng ảnh phong cảnh địa phương (hoặc để trống)"
                      category="banners"
                    />
                  </div>

                  {/* Local Bulletin / Community Notice */}
                  <div className="p-3.5 bg-amber-50/60 rounded-sm border border-amber-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#a81c1c]">
                      <Megaphone className="w-4 h-4" />
                      <span>Bản Tin Chuyển Đổi Số & Lịch Sinh Hoạt Riêng Của Thôn / TDP</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tiêu đề bản tin địa phương:
                      </label>
                      <input
                        type="text"
                        value={locFormData.promoTitle}
                        onChange={(e) => setLocFormData({ ...locFormData, promoTitle: e.target.value })}
                        placeholder="Ví dụ: Chuyển đổi số cộng đồng - Phường Hoàng Văn Thụ"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nội dung thông báo cho bà con:
                      </label>
                      <textarea
                        rows={2}
                        value={locFormData.promoContent}
                        onChange={(e) => setLocFormData({ ...locFormData, promoContent: e.target.value })}
                        placeholder="Ví dụ: Đoàn Thanh niên trực hỗ trợ kích hoạt VNeID mức 2 và nộp hồ sơ dịch vụ công từ 8h - 17h..."
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-sm bg-white leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Đường dẫn Dịch vụ công / Cổng thông tin của Phường / Xã:
                      </label>
                      <input
                        type="text"
                        value={locFormData.promoActionUrl}
                        onChange={(e) => setLocFormData({ ...locFormData, promoActionUrl: e.target.value })}
                        placeholder="Ví dụ: https://dichvucong.haiphong.gov.vn"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-sm bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b flex-shrink-0">
                  <span className="text-[11px] text-slate-500 truncate mr-2 hidden sm:inline">
                    Áp dụng riêng cho điểm: <strong>{selectedLocation?.name}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#a81c1c] hover:bg-[#881313] text-white rounded-sm text-xs font-bold transition shadow-sm shadow-red-700/20 cursor-pointer ml-auto flex-shrink-0"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu Tùy Biến Cho Nhà Văn Hóa Này
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Live Preview: Smartphone Mockup (5 cols) - Sticky Centered */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 lg:self-start flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full max-w-[340px] mb-2 px-1">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-[#004b87]" />
                {scope === 'LOCATION' ? 'Xem Trước Điểm Này' : 'Xem Trước Mẫu Chung'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">375 x 667 px</span>
            </div>

            {/* Phone Bezel */}
            <div className="w-[320px] sm:w-[340px] h-[580px] xl:h-[620px] rounded-[36px] xl:rounded-[40px] border-[8px] xl:border-[10px] border-slate-900 bg-white shadow-2xl overflow-hidden flex flex-col relative">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Dynamic Preview Content */}
              <div className="flex-1 overflow-y-auto p-3 pt-7 flex flex-col justify-between relative">
                {/* Background Wallpaper Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                  style={{
                    backgroundImage: `url('${previewWallpaperUrl}')`,
                    backgroundColor: template.backgroundColor || '#0c2340',
                  }}
                />
                {/* GovTech dark overlay with slight blur */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/75 to-slate-950/85 backdrop-blur-[1px]" />

                {/* Central Welcome Card */}
                <div className="relative z-10 bg-white rounded-lg border border-slate-300 shadow-2xl overflow-hidden my-auto space-y-0">
                  {/* Card Red Header */}
                  <div className="bg-[#a81c1c] text-white text-center p-3 border-b border-[#881313]">
                    {template.logoUrl ? (
                      <div className="flex justify-center mb-1">
                        <img
                          src={template.logoUrl}
                          alt="Logo"
                          className="h-7 w-auto max-w-[100px] object-contain drop-shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-5 h-5 rounded-xs bg-red-800 text-yellow-300 font-bold text-[10px] mb-1 border border-amber-300/40">
                        ★
                      </div>
                    )}
                    <div className="text-[8.5px] font-bold tracking-widest text-yellow-300 uppercase">
                      UBND THÀNH PHỐ HẢI PHÒNG
                    </div>
                    <h2 className="text-xs font-extrabold uppercase text-white mt-0.5">
                      {template.title}
                    </h2>
                  </div>

                  {/* Location Meta Strip (if location scope) */}
                  {scope === 'LOCATION' && selectedLocation && (
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-700">
                      <div className="flex items-center gap-1 font-semibold truncate mr-2">
                        <MapPin className="w-3 h-3 text-[#a81c1c] flex-shrink-0" />
                        <span className="truncate">{selectedLocation.name}</span>
                      </div>
                      <div className="text-emerald-700 font-bold flex-shrink-0 font-mono">
                        {selectedLocation.maxBandwidthMbps} Mbps
                      </div>
                    </div>
                  )}

                  {/* Banner Photo */}
                  <div className="relative overflow-hidden border-b border-slate-200">
                    <img
                      src={previewBannerUrl}
                      alt="Banner"
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white drop-shadow-xs">
                        {scope === 'LOCATION'
                          ? (locFormData.promoBannerUrl ? 'Ảnh thực tế Nhà văn hóa' : 'Ảnh Banner kế thừa TP')
                          : (template.bannerUrl ? 'Ảnh Banner tùy biến' : 'Ảnh Banner mặc định')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2.5">
                    {/* Welcome Message Card */}
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-sans">
                      {previewWelcomeText}
                    </div>

                    {/* Local Community Notice (Megaphone Card) */}
                    {scope === 'LOCATION' && (locFormData.promoTitle || locFormData.promoContent) && (
                      <div className="p-2 rounded bg-amber-50/70 border border-amber-200 text-[10px] space-y-0.5">
                        <div className="font-bold text-[#a81c1c] flex items-center gap-1">
                          <Megaphone className="w-3 h-3" />
                          <span>{locFormData.promoTitle || 'Bản tin chuyển đổi số TDP'}</span>
                        </div>
                        {locFormData.promoContent && (
                          <p className="text-slate-600 line-clamp-2 leading-tight">
                            {locFormData.promoContent}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Mock Terms Checkbox */}
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                      <div className="w-3 h-3 rounded border border-slate-300 bg-white mt-0.5 flex-shrink-0 flex items-center justify-center text-[#004b87] text-[8px] font-bold">
                        ✓
                      </div>
                      <span className="leading-tight">Đồng ý quy chế truy cập Wi-Fi công cộng TP Hải Phòng.</span>
                    </div>

                    {/* Connect Button */}
                    <button
                      type="button"
                      className="w-full py-2.5 rounded text-white font-bold text-xs shadow-md transition"
                      style={{ backgroundColor: template.themeColor }}
                    >
                      {template.buttonText}
                    </button>
                  </div>
                </div>

                {/* Footer Notice */}
                <div className="relative z-10 text-center pt-2 text-[9px] text-slate-300 drop-shadow-xs font-mono">
                  {scope === 'LOCATION' && selectedLocation
                    ? `Điểm phát: ${selectedLocation.locationCode || selectedLocation.slug}`
                    : 'Hệ thống Quản lý Wi-Fi Công cộng TP. Hải Phòng'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-Right Corner Toast Notification */}
      <Toast
        show={toast.show}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};
