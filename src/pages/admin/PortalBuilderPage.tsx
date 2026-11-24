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
  const [globalTab, setGlobalTab] = useState<'DESIGN' | 'MEDIA' | 'TERMS'>('DESIGN');
  const [locationTab, setLocationTab] = useState<'BRANDING' | 'BULLETIN'>('BRANDING');

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

  const normalizeTemplateState = (tpl: PortalTemplateDto): PortalTemplateDto => ({
    ...tpl,
    name: tpl.name || '',
    templateType: tpl.templateType || 'CULTURAL',
    themeColor: tpl.themeColor || '#0284c7',
    backgroundColor: tpl.backgroundColor || '#0c2340',
    backgroundImageUrl: tpl.backgroundImageUrl || '',
    logoUrl: tpl.logoUrl || '',
    bannerUrl: tpl.bannerUrl || '',
    title: tpl.title || '',
    welcomeText: tpl.welcomeText || '',
    buttonText: tpl.buttonText || '',
    termsText: tpl.termsText || '',
    layoutConfig: tpl.layoutConfig || '',
  });

  const parseVersionSnapshot = (snapshotJson?: string): Partial<PortalTemplateDto> | null => {
    if (!snapshotJson) return null;
    try {
      return JSON.parse(snapshotJson) as Partial<PortalTemplateDto>;
    } catch {
      return null;
    }
  };

  const handleRollback = async (versionNumber: number) => {
    if (!template.id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn khôi phục giao diện về phiên bản v${versionNumber}?`)) return;
    setRollingBack(true);
    try {
      const restored = await adminApi.rollbackPortalTemplateVersion(template.id, versionNumber);
      const normalized = normalizeTemplateState(restored);
      setTemplate(normalized);
      setSavedTemplate(normalized);
      setScope('GLOBAL');
      setPortalContentReloadKey((prev) => prev + 1);
      setVersionsModalOpen(false);
      setToast({
        show: true,
        title: 'Khôi phục thành công',
        message: `Đã khôi phục giao diện về phiên bản v${versionNumber} (màu chủ đạo ${normalized.themeColor.toUpperCase()}).`,
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
    { name: 'Bộ 1 (Đỏ Viettel)', themeColor: '#ee0033', bgColor: '#14141e', bgImg: '/banners/haiphong_city_bg.jpg' },
    { name: 'Bộ 2 (Đỏ Đậm)', themeColor: '#c4002b', bgColor: '#1a1a27', bgImg: '/banners/haiphong_culture_house.jpg' },
    { name: 'Bộ 3 (Xanh Lam)', themeColor: '#004b87', bgColor: '#0c2340', bgImg: '/banners/central.jpg' },
    { name: 'Bộ 4 (Xanh Lá)', themeColor: '#065f46', bgColor: '#022c22', bgImg: '/banners/haiphong_culture_house.jpg' },
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
        const normalized = normalizeTemplateState(activeTpl);
        setTemplate(normalized);
        setSavedTemplate(normalized);
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
      const normalized = normalizeTemplateState(saved);
      setTemplate(normalized);
      setSavedTemplate(normalized);
      setPortalContentReloadKey((prev) => prev + 1);
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
    ? { width: 375, height: 730 }
    : previewDevice === 'TABLET'
      ? { width: 768, height: 960 }
      : { width: 1280, height: 740 };
  const previewFrameSize = previewDevice === 'MOBILE'
    ? { width: previewViewport.width + 24, height: previewViewport.height + 56, screenTop: 42, screenLeft: 12 }
    : previewDevice === 'TABLET'
      ? { width: previewViewport.width + 24, height: previewViewport.height + 24, screenTop: 12, screenLeft: 12 }
      : { width: previewViewport.width + 16, height: previewViewport.height + 48, screenTop: 40, screenLeft: 8 };

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return;
    const updateScale = () => {
      if (stage.clientWidth < 120) return;
      const availableWidth = Math.max(240, stage.clientWidth - 32);
      const viewportBudgetHeight = previewExpanded
        ? Math.max(420, (stage.clientHeight || window.innerHeight) - 32)
        : Math.max(520, window.innerHeight - 230);
      const scaleLimit = previewExpanded && previewDevice !== 'DESKTOP' ? 1.1 : 1;
      const computed = Math.min(
        scaleLimit,
        availableWidth / previewFrameSize.width,
        viewportBudgetHeight / previewFrameSize.height,
      );
      setPreviewScale(Math.max(0.35, computed));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(stage);
    window.addEventListener('resize', updateScale);
    updateScale();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [loading, previewExpanded, previewDevice, previewFrameSize.width, previewFrameSize.height]);

  const hasUnsavedChanges = scope === 'GLOBAL'
    ? Boolean(savedTemplate && JSON.stringify(template) !== JSON.stringify(savedTemplate))
    : Boolean(savedLocFormData && JSON.stringify(locFormData) !== JSON.stringify(savedLocFormData));

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Unified Studio Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3 shadow-xs flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#004b87]/10 text-[#004b87] flex items-center justify-center shrink-0">
              <Layout className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Trình Dựng Cổng Chào Wi-Fi
              </h1>
              <p className="text-[11px] text-slate-500">
                {scope === 'GLOBAL'
                  ? 'Thiết lập giao diện mặc định áp dụng toàn thành phố'
                  : 'Tùy biến giao diện & bản tin riêng cho từng điểm phát'}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

          {/* Scope Pill Switcher */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setScope('GLOBAL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                scope === 'GLOBAL'
                  ? 'bg-white text-[#ee0033] shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#ee0033]" />
              <span>Mẫu chung toàn TP</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('LOCATION')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                scope === 'LOCATION'
                  ? 'bg-white text-[#ee0033] shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#ee0033]" />
              <span>Tùy biến riêng từng NVH ({locations.length})</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {scope === 'GLOBAL' && (
            <button
              type="button"
              onClick={openVersionsModal}
              className="inline-flex items-center gap-1.5 h-9 px-3 border border-slate-200 hover:bg-slate-50 bg-white rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
              title="Lịch sử thay đổi giao diện"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lịch sử</span>
            </button>
          )}
          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-1.5 h-9 px-3 border border-slate-200 hover:bg-slate-50 bg-white rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            <Megaphone className="w-3.5 h-3.5 text-[#004b87]" />
            <span>Chiến dịch</span>
          </Link>

          {/* Joined Share Preview Group */}
          <div className="inline-flex items-center rounded-lg border border-[#004b87] overflow-hidden shadow-xs h-9">
            <select
              id="preview-link-duration"
              value={previewLinkMinutes}
              onChange={(event) => setPreviewLinkMinutes(Number(event.target.value))}
              className="h-full bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 border-r border-slate-200 focus:outline-none cursor-pointer"
              title="Thời hạn liên kết xem trước"
              aria-label="Hạn link xem trước"
            >
              <option value={15}>15 phút</option>
              <option value={60}>60 phút</option>
              <option value={120}>120 phút</option>
            </select>
            <button
              type="button"
              onClick={handleCreatePreviewLink}
              disabled={creatingPreviewLink || !previewData}
              className="inline-flex items-center gap-1.5 h-full px-3.5 bg-[#004b87] hover:bg-[#003865] text-white text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {creatingPreviewLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>Chia sẻ xem trước</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadInitialData}
            className="inline-flex items-center justify-center w-9 h-9 border border-slate-200 hover:bg-slate-50 bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
            title="Tải lại toàn bộ dữ liệu"
            aria-label="Tải lại"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {loading ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-[#004b87]" />
          <p className="text-sm font-medium text-slate-600">Đang tải dữ liệu cấu hình...</p>
        </div>
      ) : (
        /* Balanced 50/50 Studio Split Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT PANEL: EDITOR (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-sm flex flex-col lg:h-[calc(100vh-148px)] lg:min-h-[600px] overflow-hidden min-w-0">
            {scope === 'GLOBAL' ? (
              /* FORM 1: GLOBAL CITYWIDE TEMPLATE */
              <form onSubmit={(e) => { e.preventDefault(); handleSaveGlobalTemplate(true); }} className="flex flex-col h-full overflow-hidden text-xs">
                {/* Clear Scope Banner for GLOBAL */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border-b border-red-200 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-[#ee0033] shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-[#ee0033] uppercase text-[11px]">
                          Đang cấu hình: MẪU CHUNG TOÀN THÀNH PHỐ
                        </span>
                        <span className="px-1.5 py-0.2 bg-red-100 text-[#ee0033] rounded text-[9.5px] font-bold">
                          Áp dụng mặc định cho tất cả NVH
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 truncate mt-0.5">
                        Khung điện thoại bên phải đang dùng mô phỏng với: <strong className="text-slate-800">{selectedLocation?.name || 'Nhà văn hóa'}</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScope('LOCATION')}
                    className="ml-2 px-2.5 py-1 bg-white hover:bg-red-50 border border-red-300 rounded-md text-[11px] font-bold text-[#ee0033] whitespace-nowrap shadow-2xs cursor-pointer shrink-0 transition"
                  >
                    Tùy biến riêng từng NVH →
                  </button>
                </div>

                {/* Editor Section Tabs - 3 Equal Columns (Zero Horizontal Scrollbar) */}
                <div className="p-2 bg-slate-100/90 border-b border-slate-200 grid grid-cols-3 gap-1.5 shrink-0">
                  {[
                    { id: 'DESIGN' as const, label: 'Giao diện & Chữ', icon: Palette },
                    { id: 'MEDIA' as const, label: 'Hình ảnh & Logo', icon: Image },
                    { id: 'TERMS' as const, label: 'Điều khoản', icon: ClipboardList },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = globalTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setGlobalTab(tab.id)}
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold truncate transition cursor-pointer ${
                          active
                            ? 'bg-white text-[#004b87] shadow-xs ring-1 ring-slate-200/90'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#004b87]' : 'text-slate-400'}`} />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-5 space-y-4">
                  {globalTab === 'DESIGN' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên bộ mẫu giao diện</label>
                        <input
                          type="text"
                          value={template.name}
                          onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004b87]/20 focus:border-[#004b87]"
                          required
                        />
                      </div>

                      {/* Theme Presets - Clean Single-Line 2x2 Grid */}
                      <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Bộ màu 
                          </span>
                          <span className="text-[11px] text-slate-400">Chọn nhanh</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {colorPresets.map((preset) => {
                            const isSelected = (template.themeColor || '').toLowerCase() === preset.themeColor.toLowerCase();
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
                                className={`px-3 py-2.5 rounded-lg border text-left transition flex items-center gap-2.5 min-w-0 cursor-pointer ${
                                  isSelected
                                    ? 'bg-white border-[#004b87] ring-2 ring-[#004b87]/15 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center -space-x-1 shrink-0">
                                  <span className="w-4 h-4 rounded-full ring-1 ring-white shadow-xs" style={{ backgroundColor: preset.themeColor }} />
                                  <span className="w-4 h-4 rounded-full ring-1 ring-white shadow-xs" style={{ backgroundColor: preset.bgColor }} />
                                </div>
                                <span className="text-[11.5px] font-bold text-slate-800 truncate flex-1">{preset.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#004b87] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Color Pickers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                          <label className="block text-[11.5px] font-bold text-slate-700 truncate">Màu chủ đạo (Nút bấm)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={/^#[0-9a-fA-F]{6}$/.test(template.themeColor || '') ? template.themeColor : '#0284c7'}
                              onChange={(e) => setTemplate({ ...template, themeColor: e.target.value })}
                              className="w-8 h-8 rounded-md border border-slate-200 cursor-pointer p-0.5 shrink-0"
                            />
                            <input
                              type="text"
                              value={template.themeColor || ''}
                              onChange={(e) => setTemplate({ ...template, themeColor: e.target.value })}
                              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md uppercase focus:outline-none focus:border-[#004b87]"
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                          <label className="block text-[11.5px] font-bold text-slate-700 truncate">Màu nền (Background)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={/^#[0-9a-fA-F]{6}$/.test(template.backgroundColor || '') ? template.backgroundColor : '#0c2340'}
                              onChange={(e) => setTemplate({ ...template, backgroundColor: e.target.value })}
                              className="w-8 h-8 rounded-md border border-slate-200 cursor-pointer p-0.5 shrink-0"
                            />
                            <input
                              type="text"
                              value={template.backgroundColor || ''}
                              onChange={(e) => setTemplate({ ...template, backgroundColor: e.target.value })}
                              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md uppercase focus:outline-none focus:border-[#004b87]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Text Content Section */}
                      <div className="pt-2 border-t border-slate-100 space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề Cổng chào (H1)</label>
                            <input
                              type="text"
                              value={template.title}
                              onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                              placeholder="Ví dụ: Cổng Thông Tin Wi-Fi"
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004b87]/20 focus:border-[#004b87] font-semibold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Chữ trên nút kết nối</label>
                            <input
                              type="text"
                              value={template.buttonText}
                              onChange={(e) => setTemplate({ ...template, buttonText: e.target.value })}
                              placeholder="Ví dụ: Bắt Đầu Kết Nối Wi-Fi"
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004b87]/20 focus:border-[#004b87] font-bold"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Lời chào mừng công dân mặc định</label>
                          <textarea
                            rows={2}
                            value={template.welcomeText || ''}
                            onChange={(e) => setTemplate({ ...template, welcomeText: e.target.value })}
                            placeholder="Thông điệp chào mừng hiển thị phía trên nút kết nối..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004b87]/20 focus:border-[#004b87] leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {globalTab === 'MEDIA' && (
                    <div className="space-y-4">
                      {/* 1. Background Wallpaper */}
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                            <span>Hình nền toàn màn hình</span>
                          </div>
                        </div>

                        <ImageUploadInput
                          value={template.backgroundImageUrl || ''}
                          onChange={(url) => setTemplate({ ...template, backgroundImageUrl: url })}
                          label="Tải ảnh nền hoặc dán URL (Khuyến nghị 1920x1080):"
                          helperText="Chọn ảnh từ máy hoặc dán link URL"
                          category="banners"
                        />

                        <div className="pt-1">
                          <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                            Gợi ý nhanh ảnh Hải Phòng:
                          </span>
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {[
                              { label: 'Cầu Hoàng Văn Thụ', url: '/banners/haiphong_city_bg.jpg' },
                              { label: 'Wifi công cộng Hải Phòng', url: '/banners/haiphong_culture_house.jpg' },
                              { label: 'Trung tâm Thành phố', url: '/banners/central.jpg' },
                            ].map((bg) => (
                              <button
                                key={bg.url}
                                type="button"
                                onClick={() => setTemplate({ ...template, backgroundImageUrl: bg.url })}
                                className={`px-3 py-1.5 rounded-lg border transition font-medium cursor-pointer ${
                                  template.backgroundImageUrl === bg.url
                                    ? 'bg-[#004b87] text-white border-[#004b87] shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {bg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 2. Card Header Banner */}
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">2</span>
                          <span>Ảnh Banner đầu thẻ</span>
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
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-[#004b87] text-white flex items-center justify-center text-[11px] font-bold">3</span>
                          <span>Logo nhận diện</span>
                        </div>
                        <ImageUploadInput
                          value={template.logoUrl || ''}
                          onChange={(url) => setTemplate({ ...template, logoUrl: url })}
                          label="Tải logo hoặc dán URL:"
                          helperText="Tải logo từ máy hoặc nhập liên kết ảnh"
                          category="logos"
                          aspectRatio="1:1"
                        />
                      </div>
                    </div>
                  )}

                  {globalTab === 'TERMS' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700">Điều khoản & Quy định an toàn mạng</label>
                      <p className="text-[11px] text-slate-500">
                        Văn bản này hiển thị khi công dân bấm xem quy định sử dụng Wi-Fi công cộng trước khi kết nối.
                      </p>
                      <textarea
                        rows={10}
                        value={template.termsText || ''}
                        onChange={(e) => setTemplate({ ...template, termsText: e.target.value })}
                        className="w-full px-3.5 py-3 text-xs border border-slate-200 rounded-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#004b87]/20 focus:border-[#004b87]"
                      />
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between flex-shrink-0 gap-3">
                  <div className="flex items-center gap-2.5">
                    {template.active ? (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold">Đang áp dụng</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span className="font-semibold">Bản nháp</span>
                      </div>
                    )}

                    {hasUnsavedChanges ? (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Chưa lưu thay đổi
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Đã đồng bộ</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveGlobalTemplate(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      title="Lưu lại cấu hình dưới dạng bản nháp nội bộ"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lưu nháp</span>
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveGlobalTemplate(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
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
                {/* Clear Scope Banner for LOCATION */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-emerald-800 uppercase text-[11px] truncate">
                          Đang cấu hình riêng cho: {selectedLocation ? selectedLocation.name : 'Chưa chọn'}
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9.5px] font-bold">
                          Tùy biến riêng
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 truncate mt-0.5">
                        Thiết lập lời chào, ảnh NVH và bản tin riêng biệt cho điểm này.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScope('GLOBAL')}
                    className="ml-2 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-[11px] font-bold text-slate-700 whitespace-nowrap shadow-2xs cursor-pointer shrink-0 transition"
                  >
                    ← Về mẫu chung TP
                  </button>
                </div>

                {/* Fixed Location Selector & Sub-tabs */}
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/90 space-y-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLocationId || ''}
                      onChange={(e) => handleSelectLocation(Number(e.target.value))}
                      className="flex-1 min-w-0 px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004b87]/20 focus:border-[#004b87]"
                      aria-label="Chọn điểm phát sóng"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          [{loc.locationCode || `ID-${loc.id}`}] {loc.name} {loc.adminUnitName ? `(${loc.adminUnitName})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleResetLocationCustomization}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold cursor-pointer shrink-0"
                      title="Xóa cấu hình riêng để dùng lại ảnh và nội dung mẫu chung toàn thành phố"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dùng mẫu chung</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLocationTab('BRANDING')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        locationTab === 'BRANDING'
                          ? 'bg-white text-[#004b87] shadow-xs ring-1 ring-slate-200/90'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Image className="w-3.5 h-3.5" />
                      <span>Giao diện & Ảnh riêng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationTab('BULLETIN')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        locationTab === 'BULLETIN'
                          ? 'bg-white text-[#004b87] shadow-xs ring-1 ring-slate-200/90'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Bản tin địa phương</span>
                    </button>
                  </div>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-5 space-y-4">
                  {/* Compact Location Meta Card */}
                  {selectedLocation && (
                    <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{selectedLocation.name}</span>
                        <span className="text-slate-500 font-mono text-[10px]">/portal?location={selectedLocation.slug}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10.5px] shrink-0">
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">{selectedLocation.sessionDurationMinutes} phút</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">{selectedLocation.maxBandwidthMbps} Mbps</span>
                      </div>
                    </div>
                  )}

                  {locationTab === 'BRANDING' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Lời chào riêng tại điểm phát</label>
                        <input
                          type="text"
                          value={locFormData.welcomeMessage}
                          onChange={(e) => setLocFormData({ ...locFormData, welcomeMessage: e.target.value })}
                          placeholder={`Ví dụ: Chào mừng Nhân dân đến với ${selectedLocation?.name || 'Nhà văn hóa'}`}
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004b87]/20 focus:border-[#004b87]"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          {locFormData.welcomeMessage.trim()
                            ? 'Đang dùng lời chào riêng cho điểm này.'
                            : `Đang kế thừa mẫu chung: “${template.welcomeText || 'Chào mừng đến với điểm phát Wi-Fi'}”`}
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#004b87]">
                          <Image className="w-4 h-4" />
                          <span>Ảnh Banner riêng</span>
                        </div>
                        <ImageUploadInput
                          value={locFormData.promoBannerUrl}
                          onChange={(url) => setLocFormData({ ...locFormData, promoBannerUrl: url })}
                          label="Tải ảnh hoặc dán URL:"
                          helperText={locFormData.promoBannerUrl ? 'Ảnh riêng của điểm phát.' : 'Đang dùng ảnh banner của mẫu chung.'}
                          category="banners"
                        />
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Palette className="w-4 h-4 text-[#004b87]" />
                          <span>Hình nền riêng (Tùy chọn)</span>
                        </div>
                        <ImageUploadInput
                          value={locFormData.backgroundImageUrl}
                          onChange={(url) => setLocFormData({ ...locFormData, backgroundImageUrl: url })}
                          label="Tải ảnh nền riêng hoặc dán URL:"
                          helperText={locFormData.backgroundImageUrl ? 'Ảnh nền riêng của điểm phát.' : 'Để trống nếu dùng ảnh nền mẫu chung.'}
                          category="banners"
                        />
                      </div>
                    </div>
                  )}

                  {locationTab === 'BULLETIN' && (
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/90 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#a81c1c]">
                        <Megaphone className="w-4 h-4" />
                        <span>Bản tin và liên kết địa phương</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiêu đề bản tin địa phương</label>
                        <input
                          type="text"
                          value={locFormData.promoTitle}
                          onChange={(e) => setLocFormData({ ...locFormData, promoTitle: e.target.value })}
                          placeholder="Ví dụ: Chuyển đổi số cộng đồng - Phường Hoàng Văn Thụ"
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004b87]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Nội dung thông báo</label>
                        <textarea
                          rows={4}
                          value={locFormData.promoContent}
                          onChange={(e) => setLocFormData({ ...locFormData, promoContent: e.target.value })}
                          placeholder="Ví dụ: Đoàn Thanh niên trực hỗ trợ kích hoạt VNeID mức 2 và nộp hồ sơ dịch vụ công từ 8h - 17h..."
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg bg-white leading-relaxed focus:outline-none focus:border-[#004b87]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Đường dẫn Dịch vụ công / Cổng thông tin Phường / Xã</label>
                        <input
                          type="text"
                          value={locFormData.promoActionUrl}
                          onChange={(e) => setLocFormData({ ...locFormData, promoActionUrl: e.target.value })}
                          placeholder="Ví dụ: https://dichvucong.haiphong.gov.vn"
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg bg-white font-mono focus:outline-none focus:border-[#004b87]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      hasUnsavedChanges
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}>
                      {hasUnsavedChanges ? 'Chưa lưu' : 'Đã lưu'}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                      {selectedLocation?.name}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#a81c1c] hover:bg-[#881313] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ml-auto flex-shrink-0 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Lưu điểm phát</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT PANEL: LIVE STUDIO PREVIEW (6 cols) */}
          <div
            className={previewExpanded
              ? 'fixed inset-0 z-[60] flex flex-col overflow-hidden bg-slate-100 p-4'
              : 'lg:col-span-6 lg:h-[calc(100vh-148px)] lg:min-h-[600px] flex flex-col min-w-0 rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden'}
            role={previewExpanded ? 'dialog' : undefined}
            aria-modal={previewExpanded ? true : undefined}
            aria-label={previewExpanded ? 'Xem trước cổng Wi-Fi phóng lớn' : undefined}
          >
            {/* Preview Studio Header Bar - Single Row */}
            <div className="px-3.5 py-2 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {scope === 'LOCATION' ? 'Xem trước cho NVH:' : 'Mô phỏng mẫu chung với:'}
                  </span>
                  <select
                    value={selectedLocationId || ''}
                    onChange={(e) => handleSelectLocation(Number(e.target.value))}
                    className="px-2 py-0.5 rounded border border-slate-300 bg-slate-50 hover:bg-white text-[11px] font-bold text-slate-800 max-w-[170px] sm:max-w-[210px] truncate focus:outline-none focus:border-[#ee0033] cursor-pointer"
                    title="Chọn Nhà văn hóa để xem trước trực quan"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0" role="group" aria-label="Kích thước xem trước">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('MOBILE')}
                  aria-pressed={previewDevice === 'MOBILE'}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                    previewDevice === 'MOBILE' ? 'bg-[#ee0033] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Điện thoại</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('TABLET')}
                  aria-pressed={previewDevice === 'TABLET'}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                    previewDevice === 'TABLET' ? 'bg-[#ee0033] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('DESKTOP')}
                  aria-pressed={previewDevice === 'DESKTOP'}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                    previewDevice === 'DESKTOP' ? 'bg-[#ee0033] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Máy tính</span>
                </button>
                <div className="w-px h-4 bg-slate-200 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setPreviewExpanded((expanded) => !expanded)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-white transition cursor-pointer"
                  aria-label={previewExpanded ? 'Thu nhỏ bản xem trước' : 'Phóng lớn bản xem trước'}
                  title={previewExpanded ? 'Đóng phóng lớn' : 'Phóng lớn'}
                >
                  {previewExpanded ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{previewExpanded ? 'Đóng' : 'Phóng lớn'}</span>
                </button>
              </div>
            </div>

            {/* Center Dot-Grid Stage */}
            <div
              ref={previewStageRef}
              className="flex-1 min-h-[460px] lg:min-h-0 w-full flex items-center justify-center overflow-hidden p-4"
              style={{
                backgroundColor: '#f1f5f9',
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              <div
                className="relative flex-shrink-0"
                style={{ width: previewFrameSize.width * previewScale, height: previewFrameSize.height * previewScale }}
              >
                <div
                  className={"absolute left-0 top-0 origin-top-left overflow-hidden " + (previewDevice === 'MOBILE'
                    ? 'rounded-[48px] border-[3px] border-slate-600/80 bg-slate-950 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.55),0_0_0_2px_rgba(15,23,42,1)]'
                    : previewDevice === 'TABLET'
                      ? 'rounded-[32px] border-[10px] border-slate-800 bg-slate-900 shadow-2xl'
                      : 'rounded-xl border border-slate-500 bg-slate-800 shadow-2xl')}
                  style={{
                    width: previewFrameSize.width,
                    height: previewFrameSize.height,
                    transform: 'scale(' + previewScale + ')',
                    transformOrigin: 'top left',
                  }}
                >
                  {previewDevice === 'MOBILE' && (
                    <div
                      className="absolute inset-x-[12px] top-[10px] z-30 flex h-[32px] items-center justify-between rounded-t-[34px] bg-slate-950 px-5 text-[11px] font-bold text-white select-none"
                    >
                      <span className="tracking-tight">09:41</span>
                      <div className="flex h-[20px] w-[92px] items-center justify-end rounded-full bg-black px-2.5 ring-1 ring-white/10">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-800 ring-1 ring-indigo-500/30" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wifi className="h-3.5 w-3.5 text-white" />
                        <div className="flex items-center">
                          <div className="h-2.5 w-5 rounded-[3px] border border-white/80 p-[1.5px]">
                            <div className="h-full w-full rounded-[1px] bg-emerald-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    onLoad={() => {
                      setPreviewReady(true);
                      if (previewData) {
                        previewFrameRef.current?.contentWindow?.postMessage(
                          { type: 'WIFI_PORTAL_PREVIEW_UPDATE', previewData },
                          window.location.origin,
                        );
                      }
                    }}
                    className="absolute block border-0 bg-white"
                    style={{
                      left: previewFrameSize.screenLeft,
                      top: previewFrameSize.screenTop,
                      width: previewViewport.width,
                      height: previewViewport.height,
                      borderRadius: previewDevice === 'MOBILE' ? '0 0 34px 34px' : previewDevice === 'TABLET' ? 20 : 0,
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
                        borderRadius: previewDevice === 'MOBILE' ? '0 0 34px 34px' : previewDevice === 'TABLET' ? 20 : 0,
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
                    <div className="pointer-events-none absolute bottom-[18px] left-1/2 z-30 h-1 w-28 -translate-x-1/2 rounded-full bg-slate-900/40" />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Live Content Status Bar */}
            {!previewExpanded && (
              <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 text-[11px] shrink-0" aria-live="polite">
                <div className="grid min-w-0 flex-1 grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-slate-500 shrink-0">Truyền thông:</span>
                    <span className="truncate text-slate-800 font-medium" title={livePortalContent?.activeCampaign?.title}>
                      {livePortalContentLoading
                        ? 'Đang tải…'
                        : !selectedLocation?.active
                          ? 'Điểm phát đang tắt'
                          : livePortalContentError
                            ? 'Chưa tải được'
                            : livePortalContent?.activeCampaign?.title || 'Chưa có chiến dịch'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-slate-500 shrink-0">Khảo sát:</span>
                    <span className="truncate text-slate-800 font-medium" title={livePortalContent?.activeSurvey?.title}>
                      {livePortalContentLoading
                        ? 'Đang tải…'
                        : !selectedLocation?.active
                          ? 'Điểm phát đang tắt'
                          : livePortalContentError
                            ? 'Chưa tải được'
                            : livePortalContent?.activeSurvey?.title || 'Chưa có khảo sát'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPortalContentReloadKey((key) => key + 1)}
                  disabled={livePortalContentLoading || !selectedLocation?.slug || !selectedLocation?.active}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  title="Tải lại nội dung truyền thông và khảo sát của điểm này"
                  aria-label="Tải lại nội dung truyền thông và khảo sát"
                >
                  <RefreshCw className={`h-3 w-3 ${livePortalContentLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                </button>
              </div>
            )}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
          onClick={() => setVersionsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <History className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">Lịch sử thay đổi giao diện</h3>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    Xem màu sắc, nội dung từng bản lưu và khôi phục về bất kỳ mốc thời gian nào
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVersionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {loadingVersions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Chưa có lịch sử phiên bản nào được ghi nhận
                </div>
              ) : (
                versions.map((ver, index) => {
                  const snap = parseVersionSnapshot(ver.snapshotJson);
                  const snapTheme = (snap?.themeColor || '').toUpperCase();
                  const snapBg = (snap?.backgroundColor || '').toUpperCase();
                  const isCurrentActive =
                    index === 0 &&
                    savedTemplate != null &&
                    (snap?.themeColor || '').toLowerCase() === (savedTemplate.themeColor || '').toLowerCase() &&
                    (snap?.backgroundColor || '').toLowerCase() === (savedTemplate.backgroundColor || '').toLowerCase() &&
                    (snap?.backgroundImageUrl || '') === (savedTemplate.backgroundImageUrl || '') &&
                    (snap?.title || '') === (savedTemplate.title || '') &&
                    (snap?.buttonText || '') === (savedTemplate.buttonText || '');

                  return (
                    <div
                      key={ver.id}
                      className={`flex items-center justify-between gap-4 p-3.5 border rounded-lg transition ${
                        isCurrentActive
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-[11px] text-slate-800">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-xs text-slate-800 font-semibold truncate">
                            {ver.versionName || 'Bản ghi cấu hình'}
                          </span>
                          {isCurrentActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Đang áp dụng
                            </span>
                          )}
                        </div>

                        {snap && (
                          <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-600">
                            {snapTheme && (
                              <span className="inline-flex items-center gap-1.5 font-mono">
                                <span
                                  className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                                  style={{ backgroundColor: snap.themeColor }}
                                />
                                {snapTheme}
                              </span>
                            )}
                            {snapBg && (
                              <span className="inline-flex items-center gap-1.5 font-mono text-slate-500">
                                <span
                                  className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                                  style={{ backgroundColor: snap.backgroundColor }}
                                />
                                Nền {snapBg}
                              </span>
                            )}
                            {snap.buttonText && (
                              <span className="truncate max-w-[180px] text-slate-500" title={snap.buttonText}>
                                Nút: <strong className="font-medium text-slate-700">{snap.buttonText}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400">
                          Lưu bởi <span className="font-medium text-slate-600">{ver.createdBy}</span> · {new Date(ver.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>

                      {isCurrentActive ? (
                        <span className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg shrink-0">
                          Bản hiện tại
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={rollingBack}
                          onClick={() => handleRollback(ver.versionNumber)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {rollingBack ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          Khôi phục bản này
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
