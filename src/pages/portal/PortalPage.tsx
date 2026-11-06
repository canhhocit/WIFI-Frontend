import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wifi,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Megaphone,
  MapPin,
  Smartphone,
  ClipboardList,
  Send,
  Lock,
  ChevronDown,
  ChevronUp,
  Landmark,
  Sparkles,
  Shield,
  Clock,
  Gauge,
  HelpCircle,
} from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { PortalInitResponse } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';

export const PortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [portalData, setPortalData] = useState<PortalInitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [connectedSession, setConnectedSession] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [macAddress, setMacAddress] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  // Ver 1 Mode: Advanced Auth / Survey Collapsible Toggle
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

  // Survey State
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  // Helper to extract query parameters robustly even when routers concatenate with multiple '?'
  const getParam = (paramName: string): string | undefined => {
    const standardVal = searchParams.get(paramName);
    if (standardVal) {
      if (standardVal.includes('?')) {
        return standardVal.split('?')[0];
      }
      return standardVal;
    }
    const fullSearch = window.location.search || window.location.href;
    const regex = new RegExp(`[?&]${paramName}=([^&?#]+)`, 'i');
    const match = fullSearch.match(regex);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return undefined;
  };

  const locationParam = getParam('location');
  const rawMac = getParam('client_mac') || getParam('mac') || getParam('clientMac');
  const rawIp = getParam('client_ip') || getParam('ip');
  const apMacParam = getParam('ap_mac') || getParam('apmac') || getParam('gw_mac');
  const targetUrlParam = getParam('url') || getParam('target');
  const rawLoginUrl = getParam('login_url') || getParam('loginurl');

  useEffect(() => {
    loadPortal();
  }, [locationParam, rawMac, apMacParam]);

  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    if (!connectedSession) return;
    const targetDestination = targetUrlParam || 'https://dichvucong.haiphong.gov.vn/';
    if (countdown <= 0) {
      window.location.href = targetDestination;
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [connectedSession, countdown]);

  const loadPortal = async (overrideSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const slug = overrideSlug !== undefined ? overrideSlug : locationParam;
      const data = await portalApi.init(slug, apMacParam);
      setPortalData(data);
      if (rawMac) {
        setMacAddress(rawMac);
      } else if (data.clientMacHint) {
        setMacAddress(data.clientMacHint);
      }
      if (data.macRemembered) {
        setOtpVerified(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối tới cổng dịch vụ Wi-Fi Nhà văn hóa.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại để nhận mã xác thực OTP.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await portalApi.sendOtp({
        phoneNumber: phoneNumber.trim(),
        clientMac: macAddress || portalData?.clientMacHint || '02:42:ac:11:00:01',
      });
      setOtpSent(true);
      setOtpTimer(60);
      setOtpHint(res.testCodeHint || null);
      setSuccessInfo(res.message);
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi mã OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('Vui lòng nhập mã OTP đã nhận.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await portalApi.verifyOtp({
        phoneNumber: phoneNumber.trim(),
        clientMac: macAddress || portalData?.clientMacHint || '02:42:ac:11:00:01',
        otpCode: otpCode.trim(),
      });
      setOtpVerified(true);
      setSuccessInfo(res.message);
    } catch (err: any) {
      setError(err?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData) return;

    if (!consentGiven) {
      setError('Vui lòng đánh dấu đồng ý với Quy chế sử dụng mạng để tiếp tục.');
      return;
    }

    // In Ver 1: 1-click connect without mandatory OTP by default.
    // If the user explicitly opened advanced verification, require OTP.
    if (showAdvancedAuth && portalData.otpRequired && !otpVerified && !portalData.macRemembered) {
      setError('Vui lòng xác thực số điện thoại qua OTP hoặc thu gọn tùy chọn nâng cao để kết nối nhanh.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessInfo(null);

    try {
      // If survey answers exist and submitted, send in background
      if (portalData.activeSurvey && Object.keys(surveyAnswers).length > 0 && !surveySubmitted) {
        try {
          await portalApi.submitSurvey(portalData.activeSurvey.id, {
            locationId: portalData.location.id,
            clientMac: macAddress || portalData.clientMacHint || '02:42:ac:11:00:01',
            answers: surveyAnswers,
          });
          setSurveySubmitted(true);
        } catch (_) {}
      }

      const session = await portalApi.login({
        locationSlug: portalData.location.slug,
        macAddress: macAddress || portalData.clientMacHint || '02:42:ac:11:00:01',
        guestName: guestName.trim() || undefined,
        guestContact: phoneNumber.trim() || undefined,
        consentGiven: true,
      });

      // Background ping EXCAP login_url if available
      if (rawLoginUrl) {
        try {
          fetch(rawLoginUrl, { mode: 'no-cors' }).catch(() => {});
        } catch (_) {}
      }

      setConnectedSession(session);
      setSuccessInfo('Kết nối thành công! Đã cấp quyền truy cập Internet.');
    } catch (err: any) {
      setError(err?.message || 'Xác thực truy cập không thành công. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (connectedSession) {
    const targetDestination = targetUrlParam || 'https://dichvucong.haiphong.gov.vn/';
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">KẾT NỐI THÀNH CÔNG!</h2>
            <p className="text-sm text-slate-600 mt-2">
              Chào mừng quý công dân đến với <strong>{connectedSession.locationName || portalData?.location.name || 'Nhà văn hóa'}</strong>
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2 text-left">
            <div className="flex justify-between font-bold">
              <span>Trạng thái mạng:</span>
              <span className="text-emerald-700">Đã mở kết nối Internet</span>
            </div>
            <div className="flex justify-between">
              <span>Thời lượng phiên:</span>
              <span className="font-semibold">{connectedSession.durationMinutes || 120} phút</span>
            </div>
            <div className="flex justify-between">
              <span>Băng thông tốc độ cao:</span>
              <span className="font-semibold">{portalData?.location.maxBandwidthMbps || 20} Mbps</span>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <a
              href={targetDestination}
              className="w-full py-3.5 px-4 rounded-xl bg-[#a81c1c] text-white font-bold text-sm tracking-wide shadow-lg hover:bg-[#8b1414] transition flex items-center justify-center gap-2"
            >
              <Landmark className="w-4 h-4 text-yellow-300" />
              <span>VÀO DỊCH VỤ CÔNG HẢI PHÒNG ({countdown}s)</span>
            </a>
            <a
              href="https://www.google.com"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-2 border border-slate-300"
            >
              <span>🌐 Tiếp tục lướt web (Google)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 text-white font-sans">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/banners/haiphong_city_bg.jpg')" }}
        />
        <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-sm bg-[#a81c1c] text-yellow-300 font-bold flex items-center justify-center text-xl shadow-lg mb-4 border border-yellow-400/30">
            ★
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-amber-300 mb-2" />
          <p className="text-xs text-slate-200 font-medium tracking-wide">Đang tải Cổng Wi-Fi Nhà văn hóa Hải Phòng...</p>
        </div>
      </div>
    );
  }

  if (error && !portalData) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 font-sans">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/banners/haiphong_city_bg.jpg')" }}
        />
        <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[2px]" />
        <div className="relative z-10 bg-white p-6 rounded-lg border border-slate-300/80 text-center max-w-sm w-full shadow-2xl">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded flex items-center justify-center mx-auto mb-3">
            <Wifi className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Không thể tải Cổng Wi-Fi</h2>
          <p className="text-xs text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => loadPortal()}
            className="w-full py-2 px-3 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-semibold transition cursor-pointer"
          >
            Thử lại kết nối
          </button>
        </div>
      </div>
    );
  }

  const handleSwitchDemoLocation = (slug: string) => {
    navigate(`/portal?location=${slug}`);
    loadPortal(slug);
  };

  const template = portalData?.portalTemplate;
  const campaign = portalData?.activeCampaign;
  const survey = portalData?.activeSurvey;

  // Background Wallpaper Priority:
  const backgroundWallpaperUrl =
    (portalData?.location.backgroundImageUrl &&
     portalData.location.backgroundImageUrl !== '/banners/haiphong_city_bg.jpg'
      ? portalData.location.backgroundImageUrl
      : template?.backgroundImageUrl) ||
    template?.backgroundImageUrl ||
    portalData?.location.backgroundImageUrl ||
    '/banners/haiphong_city_bg.jpg';

  // Banner Photo Priority: Always show the location's own actual culture house photo
  const localBannerUrl =
    portalData?.location.promoBannerUrl ||
    template?.bannerUrl ||
    '/banners/haiphong_culture_house.jpg';

  const demoLocations = [
    { slug: 'hp-hb-nvh01', name: 'Hồng Bàng', sub: 'TDP số 1' },
    { slug: 'hp-nq-nvh02', name: 'Ngô Quyền', sub: 'KDC Máy Tơ' },
    { slug: 'hp-ch-nvh03', name: 'Cát Hải', sub: 'TT Cát Bà' },
    { slug: 'hp-tn-nvh04', name: 'Thủy Nguyên', sub: 'TT Núi Đèo' },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-3 sm:p-5 lg:p-6 text-slate-900 font-sans">
      {/* Official City Architectural Wallpaper Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url('${backgroundWallpaperUrl}')` }}
      />
      {/* GovTech Dark Overlay with Restrained Glassmorphism */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/75 to-slate-950/85 backdrop-blur-[2px]" />

      {/* Main Responsive Container: Mobile = Single Column max-w-md, Laptop = Full Screen 2-Column Split max-w-6xl */}
      <div className="relative z-10 bg-white rounded-xl lg:rounded-2xl border border-slate-300/80 shadow-2xl max-w-md lg:max-w-5xl xl:max-w-6xl w-full overflow-hidden lg:grid lg:grid-cols-12">
        
        {/* ================= LEFT COLUMN: CITIZEN INFORMATION & CITY CAMPAIGN (lg:col-span-7) ================= */}
        <div className="lg:col-span-7 flex flex-col bg-gradient-to-b from-slate-50/70 to-white border-b lg:border-b-0 lg:border-r border-slate-200">
          
          {/* Official Government Header */}
          <div className="bg-[#a81c1c] text-white text-center p-4 sm:p-5 border-b border-[#881313] relative">
            {template?.logoUrl ? (
              <div className="flex justify-center mb-1.5">
                <img
                  src={template.logoUrl}
                  alt="Biểu trưng chính thức"
                  className="h-10 sm:h-12 w-auto max-w-[140px] object-contain drop-shadow-sm"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-8 h-8 aspect-square rounded-sm bg-red-800 text-yellow-300 font-bold text-sm mb-1.5 border border-amber-300/40 shadow-xs">
                ★
              </div>
            )}
            <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-yellow-300 uppercase">
              Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
            </div>
            <div className="text-[10px] sm:text-[11px] text-red-100 italic">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="h-0.5 w-24 bg-yellow-400/60 mx-auto my-2" />
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-yellow-300">
              Ủy Ban Nhân Dân Thành Phố Hải Phòng
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight mt-0.5 uppercase text-white">
              {template?.title || 'Cổng Thông Tin Wi-Fi Nhà Văn Hóa'}
            </h1>
          </div>

          {/* Location & Speed Meta Strip */}
          <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5 font-semibold truncate mr-2">
              <MapPin className="w-3.5 h-3.5 text-[#a81c1c] flex-shrink-0" />
              <span className="truncate">{portalData?.location.name || 'Nhà văn hóa thôn, tổ dân phố Hải Phòng'}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10.5px] text-slate-600">
              <span>{portalData?.location.sessionDurationMinutes || 120} phút</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{portalData?.location.maxBandwidthMbps || 20} Mbps</span>
            </div>
          </div>

          {/* Scrollable Content Body on Desktop */}
          <div className="p-4 sm:p-5 space-y-4 flex-1">
            {/* Lời chào mừng chính thức của điểm phát */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#a81c1c] text-yellow-300 text-[10px] font-bold uppercase tracking-wider mb-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3" />
                <span>Chính quyền số cơ sở</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {portalData?.location.welcomeMessage || template?.welcomeText || `Chào mừng Nhân dân đến với ${portalData?.location.name || 'Nhà văn hóa'}`}
              </h2>
              <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#a81c1c] flex-shrink-0" />
                <span>{portalData?.location.address || 'Thành phố Hải Phòng'}</span>
              </p>
            </div>

            {/* Bảng tin tuyên truyền & Chuyển đổi số địa phương */}
            {(portalData?.location.promoTitle || portalData?.location.promoContent) && (
              <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-300/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#a81c1c]">
                  <Megaphone className="w-4 h-4 text-[#a81c1c] flex-shrink-0" />
                  <span>{portalData.location.promoTitle || 'Bản Tin Chuyển Đổi Số Địa Phương'}</span>
                </div>
                {portalData.location.promoContent && (
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {portalData.location.promoContent}
                  </p>
                )}
              </div>
            )}

            {/* Hướng dẫn Dịch vụ hành chính công Thành phố */}
            <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 flex items-start gap-2.5 text-slate-700">
              <Landmark className="w-4 h-4 text-[#004b87] flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-[#004b87]">Dịch vụ công trực tuyến:</span> Sau khi kết nối Wi-Fi, hệ thống sẽ mở trực tiếp <strong>Cổng Dịch vụ công TP Hải Phòng</strong> để bà con tra cứu hồ sơ và nộp thủ tục hành chính miễn phí.
              </div>
            </div>

            {/* Ảnh minh họa Nhà văn hóa thực tế của từng điểm phát */}
            <div className="relative rounded-lg border border-slate-200 bg-slate-900 overflow-hidden shadow-sm">
              <img
                src={localBannerUrl}
                alt={portalData?.location.name || 'Nhà văn hóa Hải Phòng'}
                className="w-full h-40 sm:h-48 lg:h-52 object-cover opacity-95 transition hover:scale-101 duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_culture_house.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-3.5 text-white">
                <div className="text-xs sm:text-sm font-bold text-white drop-shadow-sm flex items-center justify-between">
                  <span className="truncate pr-2 font-extrabold flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-amber-300 flex-shrink-0" />
                    <span>Ảnh thực tế: {portalData?.location.name || 'Nhà văn hóa'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-600/90 text-white rounded font-bold flex-shrink-0 shadow-2xs">
                    Điểm phát trực tuyến
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-200 drop-shadow-xs flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 font-mono">
                  <span>Nhà mạng: <strong className="text-yellow-300">{portalData?.location.ispName || 'Viettel'}</strong></span>
                  <span>•</span>
                  <span>Băng thông: <strong className="text-emerald-300">{portalData?.location.maxBandwidthMbps || 20} Mbps</strong></span>
                  <span>•</span>
                  <span>Mã trạm: <strong className="text-slate-200">{portalData?.location.locationCode || 'LOC-HP'}</strong></span>
                </div>
              </div>
            </div>

            {/* Campaign Policy Notice (if configured) */}
            {campaign && (
              <div className="border border-amber-300/80 bg-gradient-to-r from-red-50/95 via-amber-50/90 to-red-50/95 p-3.5 rounded-lg space-y-2 border-l-4 border-l-[#a81c1c] shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#a81c1c] text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
                    <Megaphone className="w-3 h-3 text-yellow-300 flex-shrink-0" />
                    <span>Chiến Dịch Tuyên Truyền TP. Hải Phòng</span>
                  </div>
                  <span className="text-[9.5px] font-bold text-red-800 bg-red-100/90 px-1.5 py-0.5 rounded border border-red-200">
                    Chính sách trọng điểm
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug uppercase">
                  {campaign.title}
                </h3>

                {campaign.description && (
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {campaign.description}
                  </p>
                )}

                {campaign.actionUrl && (
                  <div className="pt-1">
                    <a
                      href={campaign.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#a81c1c] hover:bg-[#881313] text-white rounded text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>Xem Chi Tiết Kế Hoạch / Văn Bản Chỉ Đạo</span>
                      <ExternalLink className="w-3 h-3 text-yellow-300" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Desktop-only: Demo Location Switcher inside Left Column */}
            <div className="hidden lg:block pt-2">
              <div className="p-3 bg-slate-900/95 rounded-lg border border-slate-700 text-white shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-300" /> Trải nghiệm hình ảnh & thông tin từng điểm:
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {demoLocations.map((item) => {
                    const isActive =
                      portalData?.location.slug === item.slug ||
                      (!locationParam && item.slug === 'hp-hb-nvh01');
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => handleSwitchDemoLocation(item.slug)}
                        className={`px-2 py-1.5 rounded text-center transition cursor-pointer flex flex-col items-center justify-center border ${
                          isActive
                            ? 'bg-[#004b87] text-white border-blue-400 font-bold shadow-md ring-1 ring-blue-300'
                            : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10 hover:border-white/25 text-[11px]'
                        }`}
                      >
                        <span className="text-xs font-semibold leading-tight">{item.name}</span>
                        <span className="text-[9.5px] opacity-80">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTERNET ACCESS FORM & VERIFICATION (lg:col-span-5) ================= */}
        <div className="lg:col-span-5 flex flex-col bg-white">
          
          {/* Laptop Top Banner / Telemetry Status Card (Visible on lg screens) */}
          <div className="hidden lg:block bg-gradient-to-r from-[#0c2340] to-[#004b87] text-white p-5 border-b border-blue-900 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-yellow-300 shadow-inner">
                <Wifi className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 flex items-center gap-1.5">
                  {/* <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> */}
                  Sóng Wi-Fi Sẵn Sàng
                </div>
                <div className="text-sm font-bold text-white">Kết Nối Internet</div>
              </div>
            </div>

            {/* 3 Quick Telemetry Metric Tiles */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-white/10 border border-white/15">
                <div className="text-[10px] text-slate-300">Tốc độ</div>
                <div className="text-xs font-extrabold text-emerald-300 font-mono">
                  {portalData?.location.maxBandwidthMbps || 20} Mbps
                </div>
              </div>
              <div className="p-2 rounded bg-white/10 border border-white/15">
                <div className="text-[10px] text-slate-300">Thời lượng</div>
                <div className="text-xs font-extrabold text-yellow-300 font-mono">
                  {portalData?.location.sessionDurationMinutes || 120} phút
                </div>
              </div>
              <div className="p-2 rounded bg-white/10 border border-white/15">
                <div className="text-[10px] text-slate-300">Chi phí</div>
                <div className="text-xs font-extrabold text-white">Miễn phí 100%</div>
              </div>
            </div>
          </div>

          {/* Connect Action Form Container */}
          <form onSubmit={handleConnect} className="p-4 sm:p-6 space-y-4 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {error && <AlertBanner type="error" message={error} />}
              {successInfo && <AlertBanner type="success" message={successInfo} />}

              {/* Smart Citizen Survey Block (Khảo sát ý kiến công dân trực tiếp) */}
              {survey && survey.questions && survey.questions.length > 0 && (
                <div className="p-3.5 bg-gradient-to-b from-sky-50/90 to-blue-50/60 rounded-lg border border-sky-200/90 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#004b87]">
                      <ClipboardList className="w-4 h-4 text-[#004b87] flex-shrink-0" />
                      <span>{survey.title}</span>
                    </div>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold uppercase tracking-wider">
                      Khảo sát ý kiến
                    </span>
                  </div>
                  {survey.description && (
                    <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans">{survey.description}</p>
                  )}

                  <div className="space-y-2 pt-0.5">
                    {survey.questions.map((q) => {
                      let options: string[] = [];
                      try {
                        if (q.optionsJson) options = JSON.parse(q.optionsJson);
                      } catch (_) {}

                      return (
                        <div key={q.id} className="p-2.5 bg-white rounded border border-slate-200 shadow-xs space-y-1.5">
                          <p className="font-semibold text-slate-800 text-[11px] leading-snug">
                            {q.questionText} {q.required && <span className="text-red-500 font-bold">*</span>}
                          </p>
                          {options.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              {options.map((opt, oIdx) => {
                                const isSelected = surveyAnswers[q.id?.toString() || oIdx] === opt;
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() =>
                                      setSurveyAnswers({ ...surveyAnswers, [q.id?.toString() || oIdx]: opt })
                                    }
                                    className={`px-2.5 py-1.5 rounded text-[10.5px] border text-left transition cursor-pointer flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-[#004b87] text-white border-[#004b87] font-bold shadow-xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span className="truncate">{opt}</span>
                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-yellow-300 flex-shrink-0 ml-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Nhập ý kiến đóng góp của quý vị..."
                              value={surveyAnswers[q.id?.toString() || ''] || ''}
                              onChange={(e) =>
                                setSurveyAnswers({ ...surveyAnswers, [q.id?.toString() || '']: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#004b87] bg-white font-sans"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legal Compliance Checkbox */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11.5px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded-xs border-slate-300 text-[#004b87] focus:ring-[#004b87] w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <span className="leading-relaxed">
                    {template?.termsText ? (
                      template.termsText
                    ) : (
                      <>
                        Tôi đồng ý với <strong>Quy chế sử dụng mạng Wi-Fi công cộng</strong> và tuân thủ các quy định bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.
                      </>
                    )}
                  </span>
                </label>
              </div>

              {/* Primary Action Button (Bấm vào kết nối 1-chạm) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-lg text-white font-extrabold text-sm sm:text-base tracking-wide uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  style={{ backgroundColor: template?.themeColor || '#004b87' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />
                      <span>Đang cấp quyền kết nối Internet...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-5 h-5 text-yellow-300" />
                      <span>{template?.buttonText || 'KẾT NỐI WI-FI MIỄN PHÍ'}</span>
                    </>
                  )}
                </button>
                <p className="text-[10.5px] text-slate-500 text-center mt-2 font-medium">
                  Tốc độ: <strong>20 Mbps</strong> • Thời lượng phiên: <strong>120 phút</strong> • Băng thông ổn định
                </p>
              </div>

              {/* Collapsible Advanced Authentication (Optional SĐT / OTP & Tùy chọn) */}
              <div className="border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    Tùy chọn: Định danh số điện thoại & Nhớ thiết bị
                  </span>
                  {showAdvancedAuth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedAuth && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    {/* OTP Section */}
                    {portalData?.macRemembered || otpVerified ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-emerald-800 text-[11px]">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <div>
                          <span className="font-bold">Thiết bị đã ghi nhớ 30 ngày.</span>
                          <span className="block text-[10px] text-emerald-600">
                            Lần sau đến Nhà văn hóa không cần xác thực lại.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-[#004b87]" /> Xác thực SĐT (Nhớ thiết bị 30 ngày):
                        </span>
                        {!otpSent ? (
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="Nhập số điện thoại"
                              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004b87] font-mono"
                            />
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={submitting}
                              className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Gửi OTP
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Nhập 6 số OTP"
                                className="flex-1 px-3 py-1.5 text-xs font-mono text-center bg-white border border-slate-300 rounded"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={submitting}
                                className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-semibold transition"
                              >
                                Xác nhận
                              </button>
                            </div>
                            {otpHint && (
                              <div className="text-[10px] font-mono text-slate-700 bg-white p-1 rounded border border-slate-200">
                                Mã OTP mô phỏng: <strong>{otpHint}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Citizen Name Field */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Họ và tên công dân (tùy chọn):
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="vd: Nguyễn Văn A"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004b87]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Support hotline & legal note */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-600">Đường dây nóng DVC Hải Phòng:</span>
                <span className="font-mono font-bold text-[#004b87]">0225.1022</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Hệ thống bảo vệ an toàn thông tin & dữ liệu công dân.</span>
              </div>
            </div>
          </form>

          {/* Right Column Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center text-[10.5px] text-slate-500 space-y-0.5">
            <div className="font-bold text-slate-700">Sở Thông tin và Truyền thông Thành phố Hải Phòng</div>
            <div>Hạ tầng viễn thông phối hợp vận hành cùng Viettel & VNPT</div>
          </div>
        </div>

      </div>

      {/* Demo Location Switcher for Mobile (Hidden on laptop/lg:hidden) */}
      <div className="lg:hidden relative z-10 mt-3 max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-lg p-2.5 border border-white/20 text-white shadow-xl">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10.5px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-300" /> Trải nghiệm hình ảnh & thông tin từng điểm:
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {demoLocations.map((item) => {
            const isActive =
              portalData?.location.slug === item.slug ||
              (!locationParam && item.slug === 'hp-hb-nvh01');
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => handleSwitchDemoLocation(item.slug)}
                className={`px-2 py-1.5 rounded text-center transition cursor-pointer flex flex-col items-center justify-center border ${
                  isActive
                    ? 'bg-[#004b87] text-white border-blue-400 font-bold shadow-md ring-1 ring-blue-300'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10 hover:border-white/25 text-[11px]'
                }`}
              >
                <span className="text-xs font-semibold leading-tight">{item.name}</span>
                <span className="text-[9px] opacity-75">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
