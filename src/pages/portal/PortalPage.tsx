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
  ChevronDown,
  ChevronUp,
  Landmark,
  Sparkles,
  Phone,
  UserCheck,
  Globe,
  Search,
  FileText,
  ShieldAlert,
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

  // Collapsible Advanced Authentication Toggle
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

  // Survey State
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const locationParam = searchParams.get('location') || undefined;
  const macParam = searchParams.get('mac') || undefined;

  useEffect(() => {
    loadPortal();
  }, [locationParam, macParam]);

  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const loadPortal = async (overrideSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const slug = overrideSlug !== undefined ? overrideSlug : locationParam;
      const data = await portalApi.init(slug);
      setPortalData(data);
      if (data.clientMacHint) {
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

  const handleSwitchDemoLocation = (slug: string) => {
    navigate(`/portal?location=${slug}`);
    loadPortal(slug);
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

    if (showAdvancedAuth && portalData.otpRequired && !otpVerified && !portalData.macRemembered) {
      setError('Vui lòng xác thực số điện thoại qua OTP hoặc thu gọn tùy chọn nâng cao để kết nối nhanh.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessInfo(null);

    try {
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

      await portalApi.login({
        locationSlug: portalData.location.slug,
        macAddress: macAddress || portalData.clientMacHint || '02:42:ac:11:00:01',
        guestName: guestName.trim() || undefined,
        guestContact: phoneNumber.trim() || undefined,
        consentGiven: true,
      });

      // Redirect directly to Haiphong Public Service Portal
      window.location.href = 'https://dichvucong.haiphong.gov.vn/';
    } catch (err: any) {
      setError(err?.message || 'Xác thực truy cập không thành công. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const template = portalData?.portalTemplate;
  const campaign = portalData?.activeCampaign;
  const survey = portalData?.activeSurvey;

  // Background Wallpaper
  const backgroundWallpaperUrl =
    portalData?.location.backgroundImageUrl ||
    template?.backgroundImageUrl ||
    '/banners/haiphong_city_bg.jpg';

  // Location Real Photo (Always prioritizes location's actual photo)
  const locationBannerUrl =
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
      {/* City Architectural Wallpaper Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url('${backgroundWallpaperUrl}')` }}
      />
      {/* GovTech Dark Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[2px]" />

      {/* Main Unified Government Portal Container */}
      <div className="relative z-10 bg-white rounded-xl lg:rounded-2xl border border-slate-300/80 shadow-2xl max-w-md lg:max-w-5xl xl:max-w-6xl w-full overflow-hidden flex flex-col">
        
        {/* ================= 1. UNIFIED OFFICIAL NATIONAL HEADER (Trang nghiêm - Toàn bộ chiều ngang) ================= */}
        <header className="bg-gradient-to-r from-[#8b1414] via-[#a81c1c] to-[#8b1414] text-white p-4 sm:p-5 border-b border-[#6e0d0d] shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-900/90 text-yellow-300 font-bold flex items-center justify-center text-xl border-2 border-yellow-400/50 shadow-md flex-shrink-0">
                ★
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-yellow-300 uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[10px] sm:text-[10.5px] text-red-100 italic">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-white mt-0.5">
                  ỦY BAN NHÂN DÂN THÀNH PHỐ HẢI PHÒNG • SỞ THÔNG TIN VÀ TRUYỀN THÔNG
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/25 border border-white/20 text-yellow-300 text-[11px] font-bold uppercase tracking-wider">
                <Wifi className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                MẠNG WI-FI NHÀ VĂN HÓA CÔNG CỘNG
              </span>
              <span className="text-[10px] text-slate-200 mt-1">Phục vụ Nhân dân và Dịch vụ công trực tuyến</span>
            </div>
          </div>
        </header>

        {/* ================= 2. LOCATION & TELEMETRY SUB-NAV STRIP ================= */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200/90 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 truncate">
            <MapPin className="w-4 h-4 text-[#a81c1c] flex-shrink-0" />
            <span className="truncate">{portalData?.location.name || 'Nhà văn hóa Hải Phòng'}</span>
            <span className="hidden md:inline text-slate-400 font-normal">({portalData?.location.address})</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Trực tuyến
            </span>
            <span className="text-slate-600 font-semibold">{portalData?.location.maxBandwidthMbps || 20} Mbps</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-semibold">{portalData?.location.sessionDurationMinutes || 120} phút/phiên</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">Miễn phí 100%</span>
          </div>
        </div>

        {/* ================= 3. TWO-COLUMN SPLIT CONTENT BODY ================= */}
        <div className="lg:grid lg:grid-cols-12 flex-1">
          
          {/* ----- LEFT COLUMN: LOCAL CITIZEN INFORMATION & POLICY (lg:col-span-7) ----- */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4">
            
            {/* Lời chào mừng & Bản tin cơ sở */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 text-[#a81c1c] text-[10.5px] font-bold uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#a81c1c]" />
                <span>Chính quyền số cơ sở</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {portalData?.location.welcomeMessage || `Chào mừng Nhân dân đến với ${portalData?.location.name}`}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Địa chỉ: <strong>{portalData?.location.address || 'Thành phố Hải Phòng'}</strong>
              </p>
            </div>

            {/* Ảnh minh họa thực tế của chính Nhà văn hóa đó */}
            <div className="relative rounded-lg border border-slate-200 bg-slate-950 overflow-hidden shadow-sm group">
              <img
                src={locationBannerUrl}
                alt={portalData?.location.name || 'Nhà văn hóa'}
                className="w-full h-44 sm:h-52 object-cover opacity-90 group-hover:scale-101 transition duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_culture_house.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3.5 text-white">
                <div className="text-xs sm:text-sm font-bold drop-shadow-sm flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Landmark className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span>Ảnh thực tế: {portalData?.location.name}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-700 text-white rounded font-bold shadow-xs">
                    Phát sóng 24/7
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-200 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 font-mono">
                  <span>Nhà mạng: <strong className="text-yellow-300">{portalData?.location.ispName || 'VNPT Hải Phòng'}</strong></span>
                  <span>•</span>
                  <span>Băng thông: <strong className="text-emerald-300">{portalData?.location.maxBandwidthMbps || 20} Mbps</strong></span>
                  <span>•</span>
                  <span>Mã trạm: <strong className="text-slate-100">{portalData?.location.locationCode || 'LOC-HP'}</strong></span>
                </div>
              </div>
            </div>

            {/* Thông tin cán bộ phụ trách & Giờ hỗ trợ chuyển đổi số */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <UserCheck className="w-3.5 h-3.5 text-[#004b87]" />
                  <span>Cán bộ phụ trách trạm Wi-Fi:</span>
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  {portalData?.location.contactName || 'Ban Quản trị Nhà văn hóa'}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#a81c1c]" />
                  <span>Điện thoại: <strong>{portalData?.location.contactPhone || '0225.1022'}</strong></span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#a81c1c]">
                  <Megaphone className="w-3.5 h-3.5 text-[#a81c1c]" />
                  <span>Tổ công nghệ số cộng đồng:</span>
                </div>
                <div className="text-xs text-slate-700">
                  {portalData?.location.promoTitle || 'Hỗ trợ VNeID & Dịch vụ công'}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {portalData?.location.promoContent || 'Túc trực hướng dẫn người dân kích hoạt tài khoản định danh VNeID mức 2 và nộp hồ sơ trực tuyến.'}
                </p>
              </div>
            </div>

            {/* 3 Lối tắt Dịch vụ công thiết yếu cho công dân */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#004b87]" />
                <span>Tiện ích Cổng Dịch vụ công TP. Hải Phòng phục vụ bà con:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <a
                  href="https://dichvucong.haiphong.gov.vn/dichvucong/tracuu"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-blue-50/80 rounded border border-slate-200 hover:border-blue-300 transition group shadow-2xs"
                >
                  <Search className="w-4 h-4 text-[#004b87] mx-auto mb-1 group-hover:scale-110 transition" />
                  <div className="font-bold text-slate-800 text-[11px]">Tra cứu hồ sơ</div>
                  <div className="text-[10px] text-slate-500">Tiến độ Một cửa</div>
                </a>

                <a
                  href="https://dichvucong.haiphong.gov.vn/dichvucong/dichvu"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-blue-50/80 rounded border border-slate-200 hover:border-blue-300 transition group shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-emerald-700 mx-auto mb-1 group-hover:scale-110 transition" />
                  <div className="font-bold text-slate-800 text-[11px]">Nộp trực tuyến</div>
                  <div className="text-[10px] text-slate-500">1.800+ thủ tục</div>
                </a>

                <a
                  href="https://dancuquocgia.gov.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-blue-50/80 rounded border border-slate-200 hover:border-blue-300 transition group shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-[#a81c1c] mx-auto mb-1 group-hover:scale-110 transition" />
                  <div className="font-bold text-slate-800 text-[11px]">Cư trú VNeID</div>
                  <div className="text-[10px] text-slate-500">Hộ tịch & CCCD</div>
                </a>
              </div>
            </div>

            {/* Trải nghiệm chuyển đổi nhanh các điểm phát (Demo Switcher) */}
            <div className="pt-2">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#a81c1c]" /> Trải nghiệm hình ảnh & thông tin từng Nhà văn hóa:
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
                        className={`px-2 py-1.5 rounded text-center transition cursor-pointer flex flex-col items-center justify-center border text-xs ${
                          isActive
                            ? 'bg-[#004b87] text-white border-[#004b87] font-bold shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="font-bold leading-tight">{item.name}</span>
                        <span className="text-[10px] opacity-80">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* ----- RIGHT COLUMN: ACCESS FORM & CITIZEN INTERACTION (lg:col-span-5) ----- */}
          <div className="lg:col-span-5 p-4 sm:p-6 bg-white flex flex-col justify-between space-y-4">
            
            <form onSubmit={handleConnect} className="space-y-4 text-xs">
              
              {/* Tiêu đề Khối Kết Nối */}
              <div className="pb-3 border-b border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#004b87] flex items-center justify-center border border-blue-200 shadow-2xs">
                    <Wifi className="w-4 h-4 text-[#004b87]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                      Đăng Ký Truy Cập Wi-Fi Miễn Phí
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nhấn kết nối để truy cập Internet và mở Cổng Dịch vụ công Hải Phòng
                    </p>
                  </div>
                </div>
              </div>

              {error && <AlertBanner type="error" message={error} />}
              {successInfo && <AlertBanner type="success" message={successInfo} />}

              {/* Khảo sát ý kiến công dân (nếu điểm phát có gắn khảo sát) */}
              {survey && survey.questions && survey.questions.length > 0 && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#004b87]">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-[#004b87]" />
                      <span>{survey.title}</span>
                    </span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-blue-100 text-[#004b87] font-semibold">
                      Khảo sát ý kiến
                    </span>
                  </div>

                  {survey.questions.slice(0, 1).map((q) => {
                    let options: string[] = ['Rất tốt', 'Ổn định', 'Chập chờn', 'Yếu'];
                    try {
                      if (q.optionsJson) options = JSON.parse(q.optionsJson);
                    } catch (_) {}

                    return (
                      <div key={q.id} className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-medium text-slate-700 leading-snug">
                          {q.questionText}
                        </p>
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
                                className={`px-2.5 py-1.5 rounded text-[11px] border text-center transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#004b87] text-white border-[#004b87] font-bold shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Checkbox tuân thủ quy chế an toàn & Nghị định 13 */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11.5px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#004b87] focus:ring-[#004b87] w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <span className="leading-relaxed">
                    Tôi đồng ý với <strong>Quy chế sử dụng mạng Wi-Fi công cộng</strong> và tuân thủ các quy tắc bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.
                  </span>
                </label>
              </div>

              {/* Nút bấm KẾT NỐI WI-FI MIỄN PHÍ - Màu xanh chính quyền uy tín */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-lg bg-[#004b87] hover:bg-[#003865] active:bg-[#002d52] text-white font-extrabold text-sm sm:text-base tracking-wide uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />
                      <span>Đang cấp quyền kết nối Internet...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-5 h-5 text-yellow-300" />
                      <span>KẾT NỐI WI-FI MIỄN PHÍ</span>
                    </>
                  )}
                </button>
                <div className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-2">
                  <span>Tốc độ: <strong>20 Mbps</strong></span>
                  <span>•</span>
                  <span>Thời lượng: <strong>120 phút</strong></span>
                  <span>•</span>
                  <span>Băng thông ổn định</span>
                </div>
              </div>

              {/* Tùy chọn nâng cao: Xác thực số điện thoại & Nhớ thiết bị 30 ngày */}
              <div className="border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    Tùy chọn: Định danh số điện thoại & Nhớ thiết bị
                  </span>
                  {showAdvancedAuth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedAuth && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
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
            </form>

            {/* Thông tin Hỗ trợ Kỹ thuật & Đường dây nóng */}
            <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Đường dây nóng DVC Hải Phòng:</span>
                <span className="font-mono font-bold text-[#004b87]">0225.1022</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Hỗ trợ kỹ thuật viễn thông:</span>
                <span className="font-mono font-bold text-emerald-700">1800.1166</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Mạng Wi-Fi tuân thủ các quy tắc an toàn bảo mật thông tin Nhà nước.</span>
              </div>
            </div>

          </div>

        </div>

        {/* ================= 4. UNIFIED GOVERNMENT FOOTER ================= */}
        <footer className="bg-slate-900 text-slate-400 p-3 sm:p-4 text-center text-xs border-t border-slate-800 space-y-0.5">
          <div className="font-bold text-slate-200">
            ỦY BAN NHÂN DÂN THÀNH PHỐ HẢI PHÒNG • SỞ THÔNG TIN VÀ TRUYỀN THÔNG
          </div>
          <div className="text-[11px] text-slate-400">
            Hạ tầng kết nối mạng Wi-Fi công cộng phục vụ chuyển đổi số và đời sống văn hóa cơ sở
          </div>
        </footer>

      </div>
    </div>
  );
};
