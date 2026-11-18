import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Tablet,
  Check,
  Star,
  Users,
  AlertTriangle,
  ClipboardList,
  History,
  Maximize2,
  X,
  Send,
  Copy,
  Clock3,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { PortalTemplateDto, LocationDto, PortalTemplateVersionDto, PortalInitResponse } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';
import { ImageUploadInput } from '../../components/ImageUploadInput';
import { Toast } from '../../components/Toast';
import { VietnamFlag } from '../../components/VietnamFlag';
import { Modal } from '../../components/Modal';
import { portalApi } from '../../api/portalApi';

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

  // Live preview state
  const [previewDevice, setPreviewDevice] = useState<'MOBILE' | 'TABLET' | 'DESKTOP'>('MOBILE');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [livePortalContent, setLivePortalContent] = useState<PortalInitResponse | null>(null);
  const [livePortalContentLoading, setLivePortalContentLoading] = useState(false);
  const [livePortalContentError, setLivePortalContentError] = useState<string | null>(null);
  const [portalContentReloadKey, setPortalContentReloadKey] = useState(0);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [previewLinkExpiry, setPreviewLinkExpiry] = useState<string | null>(null);
  const [previewLinkMinutes, setPreviewLinkMinutes] = useState(60);
  const [creatingPreviewLink, setCreatingPreviewLink] = useState(false);
  const [copyPreviewLinkSuccess, setCopyPreviewLinkSuccess] = useState(false);

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
  const colorPresets = [
    { name: 'GovTech Hải Phòng', themeColor: '#004b87', bgColor: '#0c2340', bgImg: '/banners/haiphong_city_bg.jpg' },
    { name: 'Cờ Đỏ Chính Quyền', themeColor: '#a81c1c', bgColor: '#450a0a', bgImg: '/banners/haiphong_culture_house.jpg' },
    { name: 'Đô Thị Số Hải Phòng', themeColor: '#0284c7', bgColor: '#082f49', bgImg: '/banners/central.jpg' },
    { name: 'Di Sản & Văn Hóa', themeColor: '#065f46', bgColor: '#022c22', bgImg: '/banners/haiphong_culture_house.jpg' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const locationSlug = selectedLocation?.slug;
    if (!locationSlug || !selectedLocation?.active) {
      setLivePortalContent(null);
      setLivePortalContentLoading(false);
      setLivePortalContentError(locationSlug ? 'Điểm phát đang tắt; chưa thể kiểm tra nội dung thực tế.' : null);
      return;
    }

    let cancelled = false;
    setLivePortalContent(null);
    setLivePortalContentLoading(true);
    setLivePortalContentError(null);

    portalApi.init(locationSlug)
      .then((response) => {
        if (cancelled) return;
        setLivePortalContent(response);
      })
      .catch(() => {
        if (cancelled) return;
        setLivePortalContentError('Không thể tải nội dung đang phát. Hãy kiểm tra kết nối hoặc trạng thái điểm.');
      })
      .finally(() => {
        if (!cancelled) setLivePortalContentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLocation?.slug, selectedLocation?.active, portalContentReloadKey]);

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
          const first = locsRes.content.find((location) => location.active) || locsRes.content[0];
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

  // Preview uses the same PortalPage as citizens. Draft values are sent to the embedded route without saving them.
  const previewData = useMemo<PortalInitResponse | null>(() => {
    if (!selectedLocation || !livePortalContent || livePortalContent.location.slug !== selectedLocation.slug) return null;

    const location: LocationDto = {
      ...livePortalContent.location,
      ...selectedLocation,
      welcomeMessage: scope === 'LOCATION' ? locFormData.welcomeMessage || undefined : undefined,
      promoTitle: scope === 'LOCATION' ? locFormData.promoTitle || undefined : undefined,
      promoContent: scope === 'LOCATION' ? locFormData.promoContent || undefined : undefined,
      promoBannerUrl: scope === 'LOCATION' ? locFormData.promoBannerUrl || undefined : undefined,
      backgroundImageUrl: scope === 'LOCATION' ? locFormData.backgroundImageUrl || undefined : undefined,
      promoActionUrl: scope === 'LOCATION' ? locFormData.promoActionUrl || undefined : undefined,
      termsAndConditions: scope === 'LOCATION' ? selectedLocation.termsAndConditions : template.termsText || '',
    };

    return {
      ...livePortalContent,
      location,
      clientIp: '',
      clientMacHint: '',
      portalTemplate: { ...template },
      macRemembered: false,
      otpRequired: false,
    };
  }, [template, selectedLocation, scope, locFormData, livePortalContent]);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== previewFrameRef.current?.contentWindow) return;
      if (event.data?.type === 'WIFI_PORTAL_PREVIEW_READY') setPreviewReady(true);
    };
    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  useEffect(() => {
    if (!previewReady) return;
    previewFrameRef.current?.contentWindow?.postMessage(
      { type: 'WIFI_PORTAL_PREVIEW_UPDATE', previewData },
      window.location.origin,
    );
  }, [previewReady, previewData]);

  const handleCreatePreviewLink = async () => {
    if (!previewData) return;
    setCreatingPreviewLink(true);
    setCopyPreviewLinkSuccess(false);
    try {
      const result = await adminApi.createPortalPreviewLink(previewData, previewLinkMinutes);
      setPreviewLink(`${window.location.origin}/portal?previewToken=${encodeURIComponent(result.token)}`);
      setPreviewLinkExpiry(result.expiresAt);
    } catch (err: any) {
      setToast({ show: true, title: 'Không thể tạo liên kết', message: err?.message || 'Vui lòng thử lại.', type: 'error' });
    } finally {
      setCreatingPreviewLink(false);
    }
  };

  const handleCopyPreviewLink = async () => {
    if (!previewLink) return;
    try {
      await navigator.clipboard.writeText(previewLink);
      setCopyPreviewLinkSuccess(true);
    } catch {
      setToast({ show: true, title: 'Không thể sao chép', message: 'Hãy chọn và sao chép liên kết trong ô bên dưới.', type: 'warning' });
    }
  };

  const previewViewport = previewDevice === 'MOBILE'
    ? { width: 390, height: 844 }
    : previewDevice === 'TABLET'
      ? { width: 768, height: 1024 }
      : { width: 1366, height: 768 };
  const previewFrameSize = previewDevice === 'MOBILE'
    ? { width: previewViewport.width + 12, height: previewViewport.height + 12, screenTop: 6, screenLeft: 6 }
    : previewDevice === 'TABLET'
      ? { width: previewViewport.width + 20, height: previewViewport.height + 20, screenTop: 10, screenLeft: 10 }
      : { width: previewViewport.width + 16, height: previewViewport.height + 48, screenTop: 40, screenLeft: 8 };

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return;
    const updateScale = () => {
      const availableWidth = Math.max(1, stage.clientWidth - 24);
      const availableHeight = previewExpanded ? Math.max(1, stage.clientHeight - 24) : Number.POSITIVE_INFINITY;
      const scaleLimit = previewExpanded && previewDevice !== 'DESKTOP' ? 1.15 : 1;
      setPreviewScale(Math.min(
        scaleLimit,
        availableWidth / previewFrameSize.width,
        availableHeight / previewFrameSize.height,
      ));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(stage);
    updateScale();
    return () => observer.disconnect();
  }, [previewExpanded, previewDevice, previewFrameSize.width, previewFrameSize.height]);

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
        <div className="flex flex-wrap items-center gap-2">
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
          <label htmlFor="preview-link-duration" className="whitespace-nowrap text-[11px] font-semibold text-slate-600">Hạn link xem trước:</label>
          <select
            id="preview-link-duration"
            value={previewLinkMinutes}
            onChange={(event) => setPreviewLinkMinutes(Number(event.target.value))}
            className="min-h-9 rounded-sm border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
            title="Thời hạn liên kết xem trước"
          >
            <option value={15}>15 phút</option>
            <option value={60}>60 phút</option>
            <option value={120}>120 phút</option>
          </select>
          <button
            type="button"
            onClick={handleCreatePreviewLink}
            disabled={creatingPreviewLink || !previewData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#004b87] bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-semibold transition shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingPreviewLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            Chia sẻ bản xem trước
          </button>
          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs"
          >
            <Megaphone className="w-3.5 h-3.5 text-[#004b87]" />
            Quản lý chiến dịch
          </Link>
          <a
            href={scope === 'LOCATION' && selectedLocation ? `/portal?location=${selectedLocation.slug}` : '/portal'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-600 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Mở cổng đang chạy
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
          <div className="lg:col-span-5 bg-white rounded border border-slate-300 shadow-xs flex flex-col lg:max-h-[calc(100vh-175px)] overflow-hidden">
            {scope === 'GLOBAL' ? (
              /* FORM 1: GLOBAL CITYWIDE TEMPLATE */
              <form onSubmit={(e) => { e.preventDefault(); handleSaveGlobalTemplate(true); }} className="flex flex-col h-full overflow-hidden text-xs">
                
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto overscroll-y-contain p-5 sm:p-6 space-y-5">
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
                <div className="flex-1 overflow-y-auto overscroll-y-contain p-5 sm:p-6 space-y-5">
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
              ? 'fixed inset-0 z-[60] flex flex-col items-center overflow-hidden bg-slate-100 p-3 sm:p-5'
              : 'lg:col-span-7 lg:sticky lg:top-4 lg:self-start flex flex-col items-center justify-start min-w-0 lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white lg:p-4 lg:shadow-sm'}
            role={previewExpanded ? 'dialog' : undefined}
            aria-modal={previewExpanded ? true : undefined}
            aria-label={previewExpanded ? 'Xem trước cổng Wi-Fi phóng lớn' : undefined}
          >
            {/* Live Studio Toolbar */}
            <div className={previewExpanded
              ? 'mb-3 w-full max-w-[1600px] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm'
              : 'mb-2 w-full space-y-2 px-1'}>
              <div className={`flex items-center justify-between ${previewExpanded ? 'gap-4' : ''}`}>
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    {previewDevice === 'MOBILE' ? <Smartphone className="h-4 w-4 text-[#004b87]" /> : previewDevice === 'TABLET' ? <Tablet className="h-4 w-4 text-[#004b87]" /> : <Monitor className="h-4 w-4 text-[#004b87]" />}
                    {previewExpanded ? 'Xem trước cổng chào Wi-Fi' : scope === 'LOCATION' ? 'Xem trước điểm này' : 'Xem trước mẫu chung'}
                  </span>
                  {previewExpanded && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {livePortalContentLoading
                        ? 'Đang tải dữ liệu thật từ điểm phát…'
                        : livePortalContentError
                          ? livePortalContentError
                          : selectedLocation
                            ? `Dữ liệu thực tế · ${selectedLocation.name} · ${previewViewport.width} × ${previewViewport.height} CSS px`
                            : 'Chọn điểm phát đang hoạt động để xem dữ liệu thực tế'}
                    </p>
                  )}
                </div>
                <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Kích thước xem trước">
                  <button type="button" onClick={() => setPreviewDevice('MOBILE')} aria-pressed={previewDevice === 'MOBILE'} className={`rounded-md px-3 py-2 text-xs font-semibold ${previewDevice === 'MOBILE' ? 'bg-[#004b87] text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>Điện thoại</button>
                  <button type="button" onClick={() => setPreviewDevice('TABLET')} aria-pressed={previewDevice === 'TABLET'} className={`rounded-md px-3 py-2 text-xs font-semibold ${previewDevice === 'TABLET' ? 'bg-[#004b87] text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>Máy tính bảng</button>
                  <button type="button" onClick={() => setPreviewDevice('DESKTOP')} aria-pressed={previewDevice === 'DESKTOP'} className={`rounded-md px-3 py-2 text-xs font-semibold ${previewDevice === 'DESKTOP' ? 'bg-[#004b87] text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>Máy tính</button>
                  <button type="button" onClick={() => setPreviewExpanded((expanded) => !expanded)} className={`ml-1 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${previewExpanded ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100' : 'text-slate-700 hover:bg-white'}`} aria-label={previewExpanded ? 'Thu nhỏ bản xem trước' : 'Phóng lớn bản xem trước'}>
                    {previewExpanded ? <X className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    {previewExpanded ? 'Đóng' : 'Phóng lớn'}
                  </button>
                </div>
              </div>

              {!previewExpanded && (
                <>
                  <p className="text-[11px] text-slate-500">
                    Hiển thị giao diện /portal; dữ liệu lấy từ điểm phát đang chọn. Kéo cuộn trong khung để xem toàn trang.
                  </p>

                  <div className="space-y-1.5 rounded border border-slate-200 bg-white p-2.5 text-[10.5px]" aria-live="polite">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="font-bold text-slate-600">Truyền thông</span>
                      <p className="truncate text-slate-800" title={livePortalContent?.activeCampaign?.title}>
                        {livePortalContentLoading
                          ? 'Đang tải nội dung đang phát…'
                          : !selectedLocation?.active
                            ? 'Điểm phát đang tắt'
                            : livePortalContentError
                              ? 'Chưa tải được nội dung'
                            : livePortalContent?.activeCampaign?.title || 'Điểm này chưa có chiến dịch đang phát'}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600">Khảo sát</span>
                      <p className="truncate text-slate-800" title={livePortalContent?.activeSurvey?.title}>
                        {livePortalContentLoading
                          ? 'Đang tải khảo sát…'
                          : !selectedLocation?.active
                            ? 'Điểm phát đang tắt'
                            : livePortalContentError
                              ? 'Chưa tải được khảo sát'
                            : livePortalContent?.activeSurvey?.title || 'Điểm này chưa có khảo sát đang áp dụng'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPortalContentReloadKey((key) => key + 1)}
                    disabled={livePortalContentLoading || !selectedLocation?.slug || !selectedLocation?.active}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Tải lại nội dung truyền thông và khảo sát của điểm này"
                    aria-label="Tải lại nội dung truyền thông và khảo sát"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${livePortalContentLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </button>
                </div>
                {livePortalContentError && (
                  <p role="alert" className="text-amber-800">{livePortalContentError}</p>
                )}
                <div className="border-t border-slate-100 pt-1.5 text-slate-500">
                  Dữ liệu hiển thị được lấy từ điểm phát đang chọn.
                </div>
              </div>
                </>
              )}
            </div>

            {/* The preview runs the real public portal route in an isolated same-origin frame. */}
            <div
              ref={previewStageRef}
              className={previewExpanded
                ? 'flex-1 min-h-0 w-full max-w-[1600px] flex items-center justify-center overflow-auto overscroll-contain rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 p-3'
                : 'w-full flex justify-center overflow-x-auto overscroll-contain pb-3'}
            >
              <div
                className="relative flex-shrink-0"
                style={{ width: previewFrameSize.width * previewScale, height: previewFrameSize.height * previewScale }}
              >
                <div
                  className={"absolute left-0 top-0 origin-top-left overflow-hidden shadow-2xl " + (previewDevice === 'MOBILE'
                    ? 'rounded-[36px] border-[4px] border-slate-950 bg-slate-950'
                    : previewDevice === 'TABLET'
                      ? 'rounded-[28px] border-[10px] border-slate-800 bg-slate-900'
                      : 'rounded-xl border border-slate-500 bg-slate-800')}
                  style={{
                    width: previewFrameSize.width,
                    height: previewFrameSize.height,
                    transform: 'scale(' + previewScale + ')',
                    transformOrigin: 'top left',
                  }}
                >
                  {previewDevice === 'DESKTOP' && (
                    <div className="absolute inset-x-0 top-0 z-20 flex h-10 items-center gap-1.5 border-b border-slate-600 bg-slate-800 px-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <div className="ml-3 flex-1 rounded bg-slate-700 px-3 py-1 text-[10px] text-slate-300">Cổng Wi-Fi Hải Phòng</div>
                    </div>
                  )}
                  <iframe
                    ref={previewFrameRef}
                    src="/portal?previewMode=embedded"
                    title={'Bản xem trước cổng Wi-Fi ' + (previewDevice === 'MOBILE' ? 'điện thoại' : previewDevice === 'TABLET' ? 'máy tính bảng' : 'máy tính')}
                    onLoad={() => setPreviewReady(false)}
                    className="absolute block border-0 bg-white"
                    style={{
                      left: previewFrameSize.screenLeft,
                      top: previewFrameSize.screenTop,
                      width: previewViewport.width,
                      height: previewViewport.height,
                      borderRadius: previewDevice === 'MOBILE' ? 30 : previewDevice === 'TABLET' ? 18 : 0,
                      overscrollBehavior: 'contain',
                    }}
                  />
                  {!previewData && (
                    <div
                      className="absolute z-40 flex items-center justify-center bg-white px-6 text-center text-sm text-slate-600"
                      style={{
                        left: previewFrameSize.screenLeft,
                        top: previewFrameSize.screenTop,
                        width: previewViewport.width,
                        height: previewViewport.height,
                        borderRadius: previewDevice === 'MOBILE' ? 30 : previewDevice === 'TABLET' ? 18 : 0,
                      }}
                      aria-live="polite"
                    >
                      {livePortalContentLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#004b87]" />
                          Đang tải dữ liệu thật từ điểm phát…
                        </span>
                      ) : (
                        <span>{livePortalContentError || (!selectedLocation?.active ? 'Điểm phát đang tắt; chưa có dữ liệu để xem.' : 'Chưa có dữ liệu từ điểm phát để hiển thị.')}</span>
                      )}
                    </div>
                  )}
                  {previewDevice === 'MOBILE' && (
                    <>
                      <div className="absolute left-1/2 top-[12px] z-30 flex h-6 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-slate-950">
                        <span className="mr-2 h-2.5 w-2.5 rounded-full bg-slate-800" />
                        <span className="h-1 w-8 rounded-full bg-slate-800" />
                      </div>
                      <div className="absolute bottom-[13px] left-1/2 z-30 h-1 w-24 -translate-x-1/2 rounded-full bg-slate-900/70" />
                    </>
                  )}
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

      <Modal
        isOpen={Boolean(previewLink)}
        onClose={() => setPreviewLink(null)}
        title="Liên kết xem trước cổng Wi-Fi"
        maxWidth="2xl"
      >
        {previewLink && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-semibold">Liên kết tự hết hạn</div>
                <div className="text-xs mt-1">{previewLinkExpiry ? new Date(previewLinkExpiry).toLocaleString('vi-VN') : `Sau ${previewLinkMinutes} phút`}</div>
              </div>
            </div>
            <div>
              <label htmlFor="portal-preview-link" className="mb-1 block text-xs font-semibold text-slate-700">Đường dẫn xem trước</label>
              <input
                id="portal-preview-link"
                readOnly
                value={previewLink}
                onFocus={(event) => event.currentTarget.select()}
                className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={previewLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" /> Mở bản xem trước
              </a>
              <button
                type="button"
                onClick={handleCopyPreviewLink}
                className="inline-flex min-h-10 items-center gap-2 rounded bg-[#004b87] px-3 text-xs font-semibold text-white hover:bg-[#003865]"
              >
                {copyPreviewLinkSuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copyPreviewLinkSuccess ? 'Đã sao chép' : 'Sao chép liên kết'}
              </button>
            </div>
          </div>
        )}
      </Modal>

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
