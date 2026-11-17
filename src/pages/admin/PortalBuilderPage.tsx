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
  RotateCcw,
  Landmark,
  Wifi,
  ChevronDown,
  Monitor,
  Check,
  Star,
  Users,
  AlertTriangle,
  ClipboardList,
  History,
  Maximize2,
  X,
  Send,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { PortalTemplateDto, LocationDto, PortalTemplateVersionDto } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';
import { ImageUploadInput } from '../../components/ImageUploadInput';
import { Toast } from '../../components/Toast';
import { VietnamFlag } from '../../components/VietnamFlag';

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
  const [savedTemplate, setSavedTemplate] = useState<PortalTemplateDto | null>(null);

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
  const [savedLocFormData, setSavedLocFormData] = useState<typeof locFormData | null>(null);

  // Live Studio Simulation State
  const [previewDevice, setPreviewDevice] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [simCampaign, setSimCampaign] = useState(false);
  const [simSurvey, setSimSurvey] = useState(false);

  useEffect(() => {
    if (!previewExpanded) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewExpanded(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewExpanded]);

  // Version History Modal State
  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [versions, setVersions] = useState<PortalTemplateVersionDto[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const openVersionsModal = async () => {
    if (!template.id) {
      setToast({
        show: true,
        title: 'Chưa có dữ liệu',
        message: 'Vui lòng lưu mẫu giao diện trước khi xem lịch sử thay đổi',
        type: 'warning',
      });
      return;
    }
    setVersionsModalOpen(true);
    setLoadingVersions(true);
    try {
      const data = await adminApi.getPortalTemplateVersions(template.id);
      setVersions(data);
    } catch (e: any) {
      setToast({
        show: true,
        title: 'Lỗi tải lịch sử',
        message: e?.message || 'Không thể tải lịch sử phiên bản',
        type: 'error',
      });
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    if (!template.id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn khôi phục về phiên bản v${versionNumber}?`)) return;
    setRollingBack(true);
    try {
      const restored = await adminApi.rollbackPortalTemplateVersion(template.id, versionNumber);
      setTemplate(restored);
      setSavedTemplate(restored);
      setVersionsModalOpen(false);
      setToast({
        show: true,
        title: 'Khôi phục thành công',
        message: `Đã khôi phục giao diện về phiên bản v${versionNumber}`,
        type: 'success',
      });
    } catch (e: any) {
      setToast({
        show: true,
        title: 'Lỗi khôi phục',
        message: e?.message || 'Không thể khôi phục phiên bản đã chọn',
        type: 'error',
      });
    } finally {
      setRollingBack(false);
    }
  };
  const [simCapacityFull, setSimCapacityFull] = useState(false);

  const colorPresets = [
    { name: 'GovTech Hải Phòng', themeColor: '#004b87', bgColor: '#0c2340', bgImg: '/banners/haiphong_city_bg.jpg' },
    { name: 'Cờ Đỏ Chính Quyền', themeColor: '#a81c1c', bgColor: '#450a0a', bgImg: '/banners/haiphong_culture_house.jpg' },
    { name: 'Đô Thị Số Hải Phòng', themeColor: '#0284c7', bgColor: '#082f49', bgImg: '/banners/central.jpg' },
    { name: 'Di Sản & Văn Hóa', themeColor: '#065f46', bgColor: '#022c22', bgImg: '/banners/haiphong_culture_house.jpg' },
  ];

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
        setSavedTemplate(activeTpl);
      } else {
        setSavedTemplate(template);
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
          setSavedLocFormData({
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
    if (savedLocFormData && JSON.stringify(locFormData) !== JSON.stringify(savedLocFormData) && !window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và chuyển sang điểm phát khác?')) return;
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
      setSavedLocFormData({
        welcomeMessage: found.welcomeMessage || '',
        promoTitle: found.promoTitle || '',
        promoContent: found.promoContent || '',
        promoBannerUrl: found.promoBannerUrl || '',
        backgroundImageUrl: found.backgroundImageUrl || '',
        promoActionUrl: found.promoActionUrl || '',
      });
    }
  };

  const handleSaveGlobalTemplate = async (isPublish: boolean = true) => {
    setSaving(true);
    setError(null);
    try {
      const templateToSave = { ...template, active: isPublish };
      const saved = await adminApi.savePortalTemplate(templateToSave);
      setTemplate(saved);
      setSavedTemplate(saved);
      setToast({
        show: true,
        title: isPublish ? 'Xuất bản thành công' : 'Lưu bản nháp thành công',
        message: isPublish
          ? 'Giao diện Cổng chào đã được phát hành và áp dụng trên toàn hệ thống.'
          : 'Cấu hình đã được lưu an toàn. Bản nháp chưa hiển thị với người dân.',
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
      const savedLocForm = {
        welcomeMessage: updated.welcomeMessage || '',
        promoTitle: updated.promoTitle || '',
        promoContent: updated.promoContent || '',
        promoBannerUrl: updated.promoBannerUrl || '',
        backgroundImageUrl: updated.backgroundImageUrl || '',
        promoActionUrl: updated.promoActionUrl || '',
      };
      setLocFormData(savedLocForm);
      setSavedLocFormData(savedLocForm);
      setToast({
        show: true,
        title: 'Cập nhật thành công',
        message: `Đã lưu giao diện cho: ${updated.name}`,
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
      ? locFormData.welcomeMessage || template.welcomeText
      : template.welcomeText;

  const currentPreviewPortalLink =
    scope === 'LOCATION' && selectedLocation
      ? `/portal?location=${selectedLocation.slug}`
      : '/portal';

  const hasUnsavedChanges = scope === 'GLOBAL'
    ? Boolean(savedTemplate && JSON.stringify(template) !== JSON.stringify(savedTemplate))
    : Boolean(savedLocFormData && JSON.stringify(locFormData) !== JSON.stringify(savedLocFormData));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trình Dựng & Tùy Biến Cổng Chào Wi-Fi</h1>
        </div>
        <div className="flex items-center gap-2">
          {scope === 'GLOBAL' && (
            <button
              onClick={openVersionsModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
              title="Lịch sử thay đổi giao diện"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              Lịch sử giao diện
            </button>
          )}
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
          <div className="lg:col-span-6 bg-white rounded border border-slate-300 shadow-xs flex flex-col lg:max-h-[calc(100vh-175px)] overflow-hidden">
            {scope === 'GLOBAL' ? (
              /* FORM 1: GLOBAL CITYWIDE TEMPLATE */
              <form onSubmit={(e) => { e.preventDefault(); handleSaveGlobalTemplate(true); }} className="flex flex-col h-full overflow-hidden text-xs">
                
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

                  {/* Theme Presets */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Gợi ý chủ đề màu sắc chuẩn GovTech:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {colorPresets.map((preset) => {
                        const isSelected = template.themeColor === preset.themeColor;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setTemplate({
                                ...template,
                                themeColor: preset.themeColor,
                                backgroundColor: preset.bgColor,
                                backgroundImageUrl: preset.bgImg,
                              });
                            }}
                            className={`p-2 rounded border text-left transition flex flex-col gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-white border-[#004b87] ring-1 ring-[#004b87] shadow-xs'
                                : 'bg-white/80 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: preset.themeColor }} />
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: preset.bgColor }} />
                              {isSelected && <Check className="w-3 h-3 text-[#004b87] ml-auto" />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <details className="group rounded-sm border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-3.5 py-3 font-bold text-sm text-slate-800 flex items-center justify-between">
                      Nội dung và màu sắc
                      <ChevronDown className="w-4 h-4 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="px-3.5 pb-4 space-y-4 border-t border-slate-100 pt-4">
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
                      placeholder="Ví dụ: Cổng Thông Tin Wi-Fi"
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

                    </div>
                  </details>

                  {/* 3 IMAGE SECTIONS WITH DISTINCT NUMBERING */}
                  <details className="group rounded-sm border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-3.5 py-3 font-bold text-sm text-slate-800 flex items-center justify-between">
                      Hình ảnh và nhận diện
                      <ChevronDown className="w-4 h-4 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="px-3.5 pb-4 space-y-4 border-t border-slate-100 pt-4">
                  <div className="space-y-4 pt-1">
                    {/* 1. Background Wallpaper */}
                    <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                        <span>Hình nền </span>
                      </div>
                      
                      <ImageUploadInput
                        value={template.backgroundImageUrl || ''}
                        onChange={(url) => setTemplate({ ...template, backgroundImageUrl: url })}
                        label="Tải ảnh nền hoặc dán URL (Khuyến nghị 1920x1080):"
                        helperText="Chọn ảnh từ máy hoặc dán link URL"
                        category="banners"
                      />
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                          Gợi ý nhanh:
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
                            Cầu Hoàng Văn Thụ 
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
                            Wifi công cộng Hải Phòng
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
                            Trung tâm Thành phố
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. Card Header Banner */}
                    <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">2</span>
                        <span>Ảnh Banner </span>
                      </div>
                      
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
                        <span>Logo</span>
                      </div>
                      
                      <ImageUploadInput
                        value={template.logoUrl || ''}
                        onChange={(url) => setTemplate({ ...template, logoUrl: url })}
                        label="Tải logo hoặc dán URL:"
                        helperText="Tải logo từ máy hoặc nhập liên kết ảnh"
                        category="logos"
                      />
                    </div>
                  </div>

                    </div>
                  </details>

                  <details className="group rounded-sm border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-3.5 py-3 font-bold text-sm text-slate-800 flex items-center justify-between">
                      Điều khoản và quy định
                      <ChevronDown className="w-4 h-4 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="px-3.5 pb-4 border-t border-slate-100 pt-4">
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
                  </details>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between rounded-b flex-shrink-0 gap-3">
                  <div className="flex items-center gap-3">
                    {template.active ? (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold">Đang áp dụng</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span className="font-semibold">Bản nháp</span>
                      </div>
                    )}

                    {hasUnsavedChanges ? (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Chưa lưu thay đổi
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Đã đồng bộ
                      </span>
                    )}
                  </div>
                 
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveGlobalTemplate(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-sm text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                      title="Lưu lại cấu hình dưới dạng bản nháp nội bộ"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lưu nháp</span>
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveGlobalTemplate(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                      title="Xuất bản và phát hành chính thức cho người dân"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      )}
                      <span>Xuất bản</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* FORM 2: PER-LOCATION CUSTOMIZATION */
              <form onSubmit={handleSaveLocation} className="flex flex-col h-full overflow-hidden text-xs">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 font-bold text-slate-800 text-sm flex-shrink-0">
                 
                  <button
                    type="button"
                    onClick={handleResetLocationCustomization}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Xóa cấu hình riêng để dùng lại ảnh và nội dung mẫu chung toàn thành phố"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Dùng lại mẫu chung
                  </button>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                  {/* Location Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chọn điểm phát sóng cần chỉnh sửa:
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
                      Lời chào riêng:
                    </label>
                    <input
                      type="text"
                      value={locFormData.welcomeMessage}
                      onChange={(e) => setLocFormData({ ...locFormData, welcomeMessage: e.target.value })}
                      placeholder={`Ví dụ: Chào mừng Nhân dân đến với ${selectedLocation?.name || 'Nhà văn hóa'}`}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {locFormData.welcomeMessage.trim()
                        ? 'Đang dùng lời chào riêng cho điểm này.'
                        : `Đang kế thừa mẫu chung: “${template.welcomeText || 'Chào mừng đến với điểm phát Wi-Fi'}”`}
                    </p>
                  </div>

                  {/* Banner Photo for this specific location */}
                  <div className="p-3.5 bg-blue-50/60 rounded-sm border border-blue-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#004b87]">
                      <Image className="w-4 h-4" />
                      <span>Ảnh Banner</span>
                    </div>
               
                    <ImageUploadInput
                      value={locFormData.promoBannerUrl}
                      onChange={(url) => setLocFormData({ ...locFormData, promoBannerUrl: url })}
                      label="Tải ảnh hoặc dán URL:"
                      helperText={locFormData.promoBannerUrl ? 'Ảnh riêng của điểm phát.' : 'Đang dùng ảnh banner của mẫu chung.'}
                      category="banners"
                    />
                  </div>

                  {/* Background Wallpaper for this specific location */}
                  <div className="p-3.5 bg-slate-50 rounded-sm border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Palette className="w-4 h-4 text-[#004b87]" />
                      <span>Hình nền riêng (Tùy chọn)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ảnh nền(Để trống nếu muốn dùng nền chung)
                    </p>
                    <ImageUploadInput
                      value={locFormData.backgroundImageUrl}
                      onChange={(url) => setLocFormData({ ...locFormData, backgroundImageUrl: url })}
                      label="Tải ảnh nền riêng hoặc dán URL:"
                      helperText={locFormData.backgroundImageUrl ? 'Ảnh nền riêng của điểm phát.' : 'Đang dùng ảnh nền của mẫu chung.'}
                      category="banners"
                    />
                  </div>

                  {/* Local Bulletin / Community Notice */}
                  <details open className="group p-3.5 bg-amber-50/60 rounded-sm border border-amber-200 space-y-3">
                    <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold text-[#a81c1c]">
                      <span className="flex items-center gap-1.5"><Megaphone className="w-4 h-4" /> Bản tin và liên kết địa phương</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3 pt-2">
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
                        Nội dung thông báo:
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
                  </details>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b flex-shrink-0 gap-3">
                  <span className="text-[11px] text-slate-500 truncate mr-2 hidden sm:inline">
                    Áp dụng riêng cho điểm: <strong>{selectedLocation?.name}</strong>
                  </span>
                  <span className={`text-[11px] font-semibold ${hasUnsavedChanges ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {hasUnsavedChanges ? 'Chưa lưu' : 'Đã lưu'}
                  </span>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#a81c1c] hover:bg-[#881313] text-white rounded-sm text-xs font-bold transition shadow-sm shadow-red-700/20 cursor-pointer ml-auto flex-shrink-0"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Live Preview: Smartphone Mockup (5 cols) - Sticky Centered */}
          <div
            className={previewExpanded
              ? 'fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/80 p-3 sm:p-6'
              : 'lg:col-span-6 lg:sticky lg:top-4 lg:self-start flex flex-col items-center justify-center'}
            role={previewExpanded ? 'dialog' : undefined}
            aria-modal={previewExpanded ? true : undefined}
            aria-label={previewExpanded ? 'Xem trước cổng Wi-Fi phóng lớn' : undefined}
          >
            {/* Live Studio Toolbar */}
              <div className={`${previewExpanded ? 'w-full max-w-[1600px]' : previewDevice === 'MOBILE' ? 'w-full max-w-[500px]' : 'w-full max-w-[900px]'} mb-2 px-1 space-y-1.5`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {previewDevice === 'MOBILE' ? <Smartphone className="w-4 h-4 text-[#004b87]" /> : <Monitor className="w-4 h-4 text-[#004b87]" />}
                  {scope === 'LOCATION' ? 'Xem Trước Điểm Này' : 'Xem Trước Mẫu Chung'}
                </span>
                  <div className="inline-flex rounded-sm border border-slate-200 bg-white p-0.5" role="group" aria-label="Kích thước xem trước">
                    <button type="button" onClick={() => setPreviewDevice('MOBILE')} className={`px-2 py-1 rounded-sm text-[10px] font-semibold ${previewDevice === 'MOBILE' ? 'bg-[#004b87] text-white' : 'text-slate-600'}`}>Điện thoại</button>
                    <button type="button" onClick={() => setPreviewDevice('DESKTOP')} className={`px-2 py-1 rounded-sm text-[10px] font-semibold ${previewDevice === 'DESKTOP' ? 'bg-[#004b87] text-white' : 'text-slate-600'}`}>Máy tính</button>
                    <button type="button" onClick={() => setPreviewExpanded((expanded) => !expanded)} className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-semibold text-slate-700 hover:bg-slate-100" aria-label={previewExpanded ? 'Thu nhỏ bản xem trước' : 'Phóng lớn bản xem trước'}>
                      {previewExpanded ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      {previewExpanded ? 'Đóng' : 'Phóng lớn'}
                    </button>
                  </div>
              </div>

                <p className="text-[10px] text-slate-500">
                  {previewDevice === 'MOBILE'
                    ? 'Cuộn trong màn hình để xem phần kết nối. Chiến dịch và khảo sát là nội dung mô phỏng.'
                    : 'Bố cục máy tính gồm khu vực thông tin và khu vực kết nối như trang khách.'}
                </p>

              {/* Scenario Toggles */}
              <div className="flex items-center justify-between gap-1 bg-white p-1.5 rounded border border-slate-200 text-[10.5px]">
                <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simCampaign}
                    onChange={(e) => setSimCampaign(e.target.checked)}
                    className="rounded text-[#004b87] w-3 h-3"
                  />
                  <span>Chiến dịch</span>
                </label>
                <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simSurvey}
                    onChange={(e) => setSimSurvey(e.target.checked)}
                    className="rounded text-[#004b87] w-3 h-3"
                  />
                  <span>Khảo sát</span>
                </label>
                <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simCapacityFull}
                    onChange={(e) => setSimCapacityFull(e.target.checked)}
                    className="rounded text-[#004b87] w-3 h-3"
                  />
                  <span>Đầy tải</span>
                </label>
              </div>
            </div>

            {/* Phone Bezel */}
            <div
              className={previewDevice === 'MOBILE'
                ? `max-w-full rounded-[48px] xl:rounded-[52px] border-[10px] xl:border-[12px] border-slate-900 bg-white shadow-2xl overflow-hidden flex flex-col relative ${previewExpanded ? '' : 'w-[480px] h-[960px]'}`
                : `w-full rounded-2xl border-8 border-slate-800 bg-white shadow-2xl overflow-hidden flex flex-col relative ${previewExpanded ? 'max-w-[1600px] h-[calc(92dvh-120px)]' : 'max-w-[1100px] h-[700px]'}`}
              style={previewExpanded
                ? previewDevice === 'MOBILE'
                  ? { width: 'min(480px, 92vw, calc((100dvh - 180px) * 0.5))', height: 'min(900px, calc(100dvh - 180px))' }
                  : { height: 'calc(92dvh - 120px)' }
                : undefined}
            >
              {/* Phone Speaker & Camera Notch */}
              {previewDevice === 'MOBILE' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>}

              {/* Dynamic Preview Content */}
              <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${previewDevice === 'MOBILE' ? 'px-2.5 pt-6 pb-2' : 'p-0'} relative`}>
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

                {/* Portal card follows the guest page's mobile content order. */}
                <div className={`relative z-10 bg-white rounded-xl border border-slate-300/80 shadow-xl overflow-hidden space-y-0 text-slate-900 font-sans ${previewDevice === 'DESKTOP' ? 'w-full grid grid-cols-12 items-start rounded-none border-0 shadow-none' : ''}`}>
                  {/* Official Government Header */}
                  <div className={`bg-[#a81c1c] text-white text-center p-4 border-b border-[#881313] relative ${previewDevice === 'DESKTOP' ? 'col-span-7' : ''}`}>
                    {template.logoUrl ? (
                      <div className="flex justify-center mb-1.5">
                        <img
                          src={template.logoUrl}
                          alt="Biểu trưng chính thức"
                          className="h-10 w-auto max-w-[140px] object-contain drop-shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center mb-2">
                        <VietnamFlag width={48} height={32} className="rounded-xs shadow-sm border border-yellow-400/50" />
                      </div>
                    )}
                    <div className="text-[10px] font-bold tracking-widest text-yellow-300 uppercase">
                      Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
                    </div>
                    <div className="text-[10px] text-red-100 italic">
                      Độc lập - Tự do - Hạnh phúc
                    </div>
                    <div className="h-0.5 w-24 bg-yellow-400/60 mx-auto my-2" />
                    <div className="text-[11px] font-bold uppercase tracking-wider text-yellow-300">
                      Ủy Ban Nhân Dân Thành Phố Hải Phòng
                    </div>
                    <h2 className="text-sm font-extrabold uppercase text-white mt-0.5 tracking-tight">
                      {template.title || 'Cổng Truy Cập Wi-Fi'}
                    </h2>
                  </div>

                  {/* Location & Speed Meta Strip */}
                  <div className={`px-3 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-700 gap-y-1.5 ${previewDevice === 'DESKTOP' ? 'col-span-7' : ''}`}>
                    <div className="flex items-center gap-1.5 font-semibold truncate mr-2 max-w-full">
                      <MapPin className="w-3.5 h-3.5 text-[#a81c1c] flex-shrink-0" />
                      <span className="truncate">
                        {scope === 'LOCATION' && selectedLocation
                          ? selectedLocation.name
                          : 'Nhà văn hóa thôn, tổ dân phố Hải Phòng'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px] text-slate-600">
                      <span>{scope === 'LOCATION' && selectedLocation ? selectedLocation.sessionDurationMinutes : 120} phút</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{scope === 'LOCATION' && selectedLocation ? selectedLocation.maxBandwidthMbps : 20} Mbps</span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-700 inline-flex items-center gap-1"><Users className="w-3 h-3" />0/{scope === 'LOCATION' && selectedLocation ? selectedLocation.maxConcurrentUsers || 50 : 50}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-sans font-bold text-[10px]"><AlertTriangle className="w-3 h-3 text-amber-600" />Báo lỗi</span>
                    </div>
                  </div>

                  {/* 1. Content-First Notice Block */}
                  <div className={`p-4 space-y-4 bg-gradient-to-b from-slate-50/70 to-white ${previewDevice === 'DESKTOP' ? 'col-span-7' : ''}`}>
                    <div>
                     
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {previewWelcomeText || 'Chào mừng Nhân dân đến với Nhà văn hóa'}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#a81c1c] flex-shrink-0" />
                        <span>
                          {scope === 'LOCATION' && selectedLocation?.address
                            ? selectedLocation.address
                            : 'Thành phố Hải Phòng'}
                        </span>
                      </p>
                    </div>

                    {/* Local Bulletin / Notice (Megaphone card) */}
                    {(scope === 'LOCATION' && (locFormData.promoTitle || locFormData.promoContent || locFormData.promoActionUrl)) ? (
                      <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-300/80 shadow-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#a81c1c]">
                          <Megaphone className="w-4 h-4 text-[#a81c1c] flex-shrink-0" />
                          <span>{locFormData.promoTitle || 'Bản Tin Chuyển Đổi Số Địa Phương'}</span>
                        </div>
                        {locFormData.promoContent && (
                          <p className="text-xs text-slate-700 leading-relaxed font-sans">
                            {locFormData.promoContent}
                          </p>
                        )}
                        {/^https?:\/\//i.test(locFormData.promoActionUrl.trim()) && (
                          <a href={locFormData.promoActionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#004b87] hover:underline">
                            Mở cổng thông tin địa phương <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : null}

                    {/* Dịch vụ công trực tuyến guide */}
                    <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 flex items-start gap-2.5 text-slate-700">
                      <Landmark className="w-4 h-4 text-[#004b87] flex-shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold text-[#004b87]">Dịch vụ công trực tuyến:</span> Sau khi kết nối Wi-Fi, hệ thống sẽ mở trực tiếp Cổng Dịch vụ công TP Hải Phòng để tra cứu hồ sơ và nộp thủ tục hành chính miễn phí.
                      </div>
                    </div>
                  </div>

                  {/* 2. Banner Photo with Overlay */}
                  <div className={`relative border-b border-slate-200 bg-slate-900 overflow-hidden ${previewDevice === 'DESKTOP' ? 'col-span-7' : ''}`}>
                    <img
                      src={previewBannerUrl}
                      alt="Banner"
                      className="w-full h-40 object-cover opacity-95"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_culture_house.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-3.5 text-white">
                      <div className="text-xs font-bold text-white drop-shadow-sm flex items-center justify-between">
                        <span className="truncate pr-2 font-extrabold">
                          Ảnh thực tế: {scope === 'LOCATION' && selectedLocation ? selectedLocation.name : 'Wifi công cộng Hải Phòng'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-600/90 text-white rounded font-bold flex-shrink-0">
                          Điểm phát trực tuyến
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-200 drop-shadow-xs flex items-center gap-2 mt-1 font-mono">
                        <span>Băng thông: <strong className="text-emerald-300">{scope === 'LOCATION' && selectedLocation ? selectedLocation.maxBandwidthMbps : 20} Mbps</strong></span>
                        <span>•</span>
                        <span>Mã trạm: <strong>{scope === 'LOCATION' && selectedLocation ? selectedLocation.locationCode || selectedLocation.slug : 'LOC-HP'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {simCampaign && (
                    <div className={`mx-4 mb-4 border border-amber-300/80 bg-gradient-to-r from-red-50/95 via-amber-50/90 to-red-50/95 p-3.5 rounded-lg space-y-2 border-l-4 border-l-[#a81c1c] shadow-xs ${previewDevice === 'DESKTOP' ? 'col-span-7' : ''}`}>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#a81c1c] text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
                        <Megaphone className="w-3 h-3" /> Chiến dịch mô phỏng
                      </div>
                      <h4 className="text-xs font-black text-slate-900 leading-snug">Tuyên truyền Dịch vụ công & Kích hoạt VNeID</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">Đây là nội dung minh họa để xem bố cục chiến dịch trên cổng khách.</p>
                    </div>
                  )}

                  {/* 3. Action Form */}
                  <div className={previewDevice === 'DESKTOP' ? 'col-span-5 col-start-8 row-start-1 border-l border-slate-200 bg-white min-h-full' : 'contents'}>
                    {previewDevice === 'DESKTOP' && (
                      <div className="bg-gradient-to-r from-[#0c2340] to-[#004b87] text-white p-5 border-b border-blue-900">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-yellow-300"><Wifi className="w-5 h-5" /></div>
                          <div>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Sóng Wi-Fi sẵn sàng</div>
                            <div className="text-sm font-bold">Kết nối Internet</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 rounded bg-white/10 border border-white/15"><div className="text-[10px] text-slate-300">Tốc độ</div><div className="text-xs font-extrabold text-emerald-300">{scope === 'LOCATION' && selectedLocation ? selectedLocation.maxBandwidthMbps : 20} Mbps</div></div>
                          <div className="p-2 rounded bg-white/10 border border-white/15"><div className="text-[10px] text-slate-300">Thời lượng</div><div className="text-xs font-extrabold text-yellow-300">{scope === 'LOCATION' && selectedLocation ? selectedLocation.sessionDurationMinutes : 120} phút</div></div>
                        </div>
                      </div>
                    )}
                  <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200">
                    {/* Simulated Capacity Limit Warning if toggled */}
                    {simCapacityFull && (
                        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                          <span className="font-bold flex items-center gap-2 text-amber-800">
                          ⚠️ Điểm phát đã đạt giới hạn tối đa
                        </span>
                          <p className="text-[11.5px] leading-relaxed">
                          Hiện có 50/50 thiết bị đang truy cập mạng. Quý vị vui lòng thử lại sau.
                        </p>
                      </div>
                    )}

                    {/* Simulated Survey Card if toggled */}
                    {simSurvey && (
                      <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004b87]">
                            <ClipboardList className="w-2.5 h-2.5" /> Thăm Dò Ý Kiến Nhân Dân
                          </span>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">Khảo sát mô phỏng</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          Đánh giá chất lượng sóng Wi-Fi hôm nay:
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          ))}
                          <span className="text-[10px] text-amber-700 font-bold ml-1">5/5 - Rất tốt</span>
                        </div>
                      </div>
                    )}

                    {/* Legal Checkbox */}
                    <div className="flex items-start gap-2 text-[11px] text-slate-600">
                      <div className="w-4 h-4 rounded border border-slate-300 bg-white mt-0.5 flex-shrink-0 flex items-center justify-center text-[#004b87] text-[9px] font-bold">
                        ✓
                      </div>
                      <span className="leading-tight">
                        {template.termsText ? (
                          <span className="line-clamp-2">{template.termsText}</span>
                        ) : (
                          <>
                            Tôi đồng ý với <strong>Quy chế sử dụng mạng Wi-Fi công cộng</strong> và Nghị định 13/2023/NĐ-CP.
                          </>
                        )}
                      </span>
                    </div>

                    {/* Primary Action Button */}
                    <div>
                      <button
                        type="button"
                        disabled={simCapacityFull}
                        className={`w-full py-3.5 px-4 rounded-lg text-white font-extrabold text-sm tracking-wide uppercase shadow-lg flex items-center justify-center gap-2 transition ${
                          simCapacityFull ? 'bg-slate-400 cursor-not-allowed opacity-75' : ''
                        }`}
                        style={{ backgroundColor: simCapacityFull ? undefined : template.themeColor || '#004b87' }}
                      >
                        <Wifi className="w-5 h-5 text-yellow-300" />
                        <span>{simCapacityFull ? 'ĐIỂM PHÁT ĐÃ ĐẦY TẢI (50/50)' : template.buttonText || 'KẾT NỐI WI-FI MIỄN PHÍ'}</span>
                      </button>
                      <p className="text-[10.5px] text-slate-500 text-center mt-2 font-medium">
                        Tốc độ: <strong>{scope === 'LOCATION' && selectedLocation ? selectedLocation.maxBandwidthMbps : 20} Mbps</strong> • Thời lượng: <strong>{scope === 'LOCATION' && selectedLocation ? selectedLocation.sessionDurationMinutes : 120} phút</strong>
                      </p>
                    </div>

                    {/* Collapsible Advanced Toggle Mock */}
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        Tùy chọn: Định danh số điện thoại & Góp ý kiến
                      </span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                  </div>
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

      {versionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-sm">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lịch sử thay đổi giao diện</h3>
                </div>
              </div>
              <button
                onClick={() => setVersionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {loadingVersions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Chưa có lịch sử phiên bản nào được ghi nhận
                </div>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between p-3.5 border border-slate-200 rounded-sm hover:border-indigo-300 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">v{ver.versionNumber}</span>
                        <span className="text-xs text-slate-700 font-medium">{ver.versionName || 'Bản ghi cấu hình'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Lưu bởi: <span className="font-semibold text-slate-600">{ver.createdBy}</span> · Thời điểm: {new Date(ver.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={rollingBack}
                      onClick={() => handleRollback(ver.versionNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-sm text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Khôi phục bản này
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
