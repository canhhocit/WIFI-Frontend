import React, { useEffect, useState, useMemo } from 'react';
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
  Users,
  RefreshCw,
  Star,
  AlertTriangle,
  LifeBuoy,
} from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { PortalInitResponse } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';
import { VietnamFlag } from '../../components/VietnamFlag';
import { ReportIssueModal } from '../../components/ReportIssueModal';
import { CitizenDigitalMediaModal } from '../../components/CitizenDigitalMediaModal';
import { Play, Tv, Video, Eye, Share2, FileText, Image as ImageIcon } from 'lucide-react';

const getOrCreateLocalClientMac = () => {
  try {
    let mac = localStorage.getItem('wifi_client_device_mac');
    if (!mac || !/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(mac)) {
      const randomHex = Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, '0')
      ).join(':');
      mac = `02:${randomHex}`.toLowerCase();
      localStorage.setItem('wifi_client_device_mac', mac);
    }
    return mac;
  } catch {
    return '02:42:ac:11:00:01';
  }
};

export const PortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const previewToken = searchParams.get('previewToken') || undefined;
  const isEmbeddedPreview = searchParams.get('previewMode') === 'embedded';
  const isPreviewMode = Boolean(previewToken || isEmbeddedPreview);

  const [portalData, setPortalData] = useState<PortalInitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [connectedSession, setConnectedSession] = useState<any | null>(null);

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

  // Báo lỗi Wi-Fi modal state
  const [showReportModal, setShowReportModal] = useState(false);
  // Modal hiển thị truyền thông số chi tiết (Video clip / Hình ảnh / Văn bản chỉ đạo)
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Ver 1 Mode: Advanced Auth / Survey Collapsible Toggle
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

  // Survey State
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [missingQuestionId, setMissingQuestionId] = useState<number | null>(null);
  const visibleSurveyQuestions = useMemo(() => {
    const questions = portalData?.activeSurvey?.questions || [];
    if (!questions.some((question) => question.branchingRules?.length)) return questions;

    const questionsById = new Map(questions.filter((question) => question.id != null).map((question) => [question.id as number, question]));
    const visible: typeof questions = [];
    const visited = new Set<number>();
    let current: (typeof questions)[number] | undefined = questions[0];

    while (current && visible.length <= questions.length) {
      if (current.id == null || visited.has(current.id)) break;
      visited.add(current.id);
      visible.push(current);

      const answer = surveyAnswers[current.id.toString()];
      const answerValues = Array.isArray(answer) ? answer.map(String) : answer == null || answer === '' ? [] : [String(answer)];
      const matchingRule = current.branchingRules?.find((rule) => answerValues.includes(rule.conditionValue));
      if (matchingRule?.terminateSurvey) break;

      if (matchingRule?.nextQuestionId != null) {
        current = questionsById.get(matchingRule.nextQuestionId);
      } else {
        const currentIndex = questions.findIndex((question) => question.id === current?.id);
        current = questions[currentIndex + 1];
      }
    }

    return visible;
  }, [portalData?.activeSurvey?.questions, surveyAnswers]);

  // Normalize search query string to handle multiple '?' appended by captive routers
  const normalizedParams = useMemo(() => {
    const rawSearch = window.location.search || '';
    const norm = rawSearch.startsWith('?') ? rawSearch.slice(1).replace(/\?/g, '&') : rawSearch.replace(/\?/g, '&');
    return new URLSearchParams(norm);
  }, []);

  const locationParam = normalizedParams.get('location') || searchParams.get('location') || undefined;
  const apMacParam = normalizedParams.get('ap_mac') || normalizedParams.get('apmac') || normalizedParams.get('gw_mac') || searchParams.get('ap_mac') || undefined;

  // Strict disambiguation: prioritize explicit client MAC parameters
  const explicitClientMac =
    normalizedParams.get('client_mac') ||
    normalizedParams.get('clientMac') ||
    normalizedParams.get('usermac') ||
    normalizedParams.get('u_mac') ||
    searchParams.get('client_mac') ||
    undefined;

  // Fallback 'mac' parameter ONLY if it does not match the AP / Gateway MAC
  const generalMac = normalizedParams.get('mac') || searchParams.get('mac') || undefined;
  const rawMac =
    explicitClientMac ||
    (generalMac && apMacParam && generalMac.toLowerCase() !== apMacParam.toLowerCase() ? generalMac : (!apMacParam ? generalMac : undefined));

  const effectiveClientMac = useMemo(() => {
    if (rawMac) return rawMac.toLowerCase();
    return getOrCreateLocalClientMac();
  }, [rawMac]);

  const rawIp = normalizedParams.get('client_ip') || normalizedParams.get('ip') || searchParams.get('client_ip') || undefined;
  const targetUrlParam = normalizedParams.get('url') || normalizedParams.get('target') || searchParams.get('url') || undefined;
  const rawLoginUrl = normalizedParams.get('login_url') || normalizedParams.get('loginurl') || searchParams.get('login_url') || undefined;

  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);

  const targetDestination = useMemo(() => {
    if (targetUrlParam && !targetUrlParam.includes('/portal')) {
      return targetUrlParam;
    }
    return 'https://dichvucong.haiphong.gov.vn/';
  }, [targetUrlParam]);

  const buildExcapUrl = (sessionToken?: string) => {
    const finalDest = targetDestination;
    const baseLogin = rawLoginUrl || 'http://cwp.gwnportal.cloud:8080/gwn_login';
    const sep = baseLogin.includes('?') ? '&' : '?';
    const cleanMac = (effectiveClientMac || macAddress || '0242ac110001').replace(/[:-]/g, '').toLowerCase();
    const token = sessionToken || (connectedSession ? connectedSession.sessionToken : '') || 'guest';
    return `${baseLogin}${sep}username=${encodeURIComponent(cleanMac + '@gwn')}&password=${encodeURIComponent(token)}&redirect=${encodeURIComponent(finalDest)}`;
  };

  useEffect(() => {
    if (!connectedSession) return;
    if (redirectCountdown <= 0) {
      if (rawLoginUrl) {
        window.location.replace(buildExcapUrl(connectedSession.sessionToken));
      } else {
        window.location.replace(targetDestination);
      }
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [connectedSession, redirectCountdown, targetDestination, rawLoginUrl]);

  useEffect(() => {
    if (isEmbeddedPreview) {
      setLoading(true);
      setError(null);
      return;
    }
    if (previewToken) {
      loadPreview(previewToken);
      return;
    }
    loadPortal();
  }, [locationParam, rawMac, apMacParam, effectiveClientMac, previewToken, isEmbeddedPreview]);

  useEffect(() => {
    if (!isEmbeddedPreview) return;

    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== 'WIFI_PORTAL_PREVIEW_UPDATE') return;
      if (!event.data.previewData?.location) {
        setPortalData(null);
        setLoading(true);
        setError(null);
        return;
      }

      setPortalData(event.data.previewData as PortalInitResponse);
      setMacAddress('preview');
      setError(null);
      setLoading(false);
    };

    window.addEventListener('message', handlePreviewMessage);
    window.parent.postMessage({ type: 'WIFI_PORTAL_PREVIEW_READY' }, window.location.origin);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, [isEmbeddedPreview]);

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
    setError(null);
    const slug = overrideSlug !== undefined ? overrideSlug : locationParam;
    const cacheKey = `wifi_portal_init_${slug || 'default'}_${effectiveClientMac || 'guest'}`;

    // Fast local memory cache: if citizen opened portal recently, display immediately without spinner
    if (!isEmbeddedPreview && !previewToken) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.data && (Date.now() - parsed.timestamp < 300000)) { // 5 mins TTL
            setPortalData(parsed.data);
            setMacAddress(effectiveClientMac);
            if (parsed.data.macRemembered) {
              setOtpVerified(true);
            }
          }
        }
      } catch (_) {}
    }

    if (!portalData) {
      setLoading(true);
    }

    try {
      const data = await portalApi.init(slug, apMacParam, effectiveClientMac);
      setPortalData(data);
      setMacAddress(effectiveClientMac);
      if (data.macRemembered) {
        setOtpVerified(true);
      }
      if (!isEmbeddedPreview && !previewToken) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (_) {}
      }
    } catch (err: any) {
      if (!portalData) {
        setError(err?.message || 'Không thể kết nối tới cổng dịch vụ Wi-Fi Nhà văn hóa.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await portalApi.getPreview(token);
      setPortalData({
        ...response.previewData,
        macRemembered: false,
        otpRequired: false,
      });
      setMacAddress('preview');
    } catch (err: any) {
      setError(err?.message || 'Liên kết xem trước không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (isPreviewMode) {
      setError('Đây là bản xem trước. Hệ thống không gửi mã OTP.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại để nhận mã xác thực OTP.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await portalApi.sendOtp({
        phoneNumber: phoneNumber.trim(),
        clientMac: effectiveClientMac,
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
    if (isPreviewMode) {
      setError('Đây là bản xem trước. Hệ thống không xác thực mã OTP.');
      return;
    }
    if (!otpCode.trim()) {
      setError('Vui lòng nhập mã OTP đã nhận.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await portalApi.verifyOtp({
        phoneNumber: phoneNumber.trim(),
        clientMac: effectiveClientMac,
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
    if (isPreviewMode) {
      setError('Đây là bản xem trước. Nút kết nối không gửi yêu cầu tới hệ thống.');
      return;
    }
    if (!portalData) return;

    if (!consentGiven) {
      setError('Vui lòng đánh dấu đồng ý với Quy chế sử dụng mạng để tiếp tục.');
      return;
    }

    // In Ver 1: 1-click connect without mandatory OTP by default.
    // If the user explicitly opened advanced verification, require OTP ONLY if they entered a phone number and haven't verified.
    if (showAdvancedAuth && portalData.otpRequired && !otpVerified && !portalData.macRemembered) {
      if (phoneNumber.trim().length > 0 && !otpCode.trim()) {
        setError('Quý vị đang nhập số điện thoại nhưng chưa xác thực mã OTP. Vui lòng hoàn thành OTP hoặc xóa số điện thoại để kết nối nhanh.');
        return;
      }
    }

    // Validate required survey questions if active survey is present
    if (visibleSurveyQuestions.length) {
      for (const q of visibleSurveyQuestions) {
        if (q.required) {
          const qKey = q.id?.toString() || '';
          const ans = surveyAnswers[qKey];
          const isEmpty =
            ans === undefined ||
            ans === null ||
            ans === '' ||
            (Array.isArray(ans) && ans.length === 0);
          if (isEmpty) {
            setMissingQuestionId(q.id || null);
            setError(`Vui lòng hoàn thành câu hỏi khảo sát bắt buộc: "${q.questionText}"`);
            const el = document.getElementById(`survey-q-${q.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          }
        }
      }
    }
    setMissingQuestionId(null);

    setSubmitting(true);
    setError(null);
    setSuccessInfo(null);

    try {
      // If survey answers exist and submitted, send in background
      const visibleQuestionIds = new Set(visibleSurveyQuestions.map((question) => question.id?.toString()).filter(Boolean));
      const submittedSurveyAnswers = Object.fromEntries(
        Object.entries(surveyAnswers).filter(([questionId]) => visibleQuestionIds.has(questionId)),
      );
      if (portalData.activeSurvey && Object.keys(submittedSurveyAnswers).length > 0 && !surveySubmitted) {
        try {
          await portalApi.submitSurvey(portalData.activeSurvey.id, {
            locationId: portalData.location.id,
            clientMac: effectiveClientMac,
            answers: submittedSurveyAnswers,
          });
          setSurveySubmitted(true);
        } catch (_) {}
      }

      const session = await portalApi.login({
        locationSlug: portalData.location.slug,
        macAddress: effectiveClientMac,
        guestName: guestName.trim() || undefined,
        guestContact: phoneNumber.trim() || undefined,
        consentGiven: true,
      });

      // Background beacon EXCAP login_url if available from router
      if (rawLoginUrl) {
        try {
          const authUrl = buildExcapUrl(session.sessionToken);
          fetch(authUrl, { mode: 'no-cors' }).catch(() => {});
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
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Đang tự động chuyển tiếp đến Dịch vụ công ({redirectCountdown}s)...</span>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.replace(buildExcapUrl(connectedSession.sessionToken))}
              className="w-full py-3.5 px-4 rounded-xl bg-[#a81c1c] text-white font-bold text-sm tracking-wide shadow-lg hover:bg-[#8b1414] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Landmark className="w-4 h-4 text-yellow-300" />
              <span>VÀO DỊCH VỤ CÔNG HẢI PHÒNG ({redirectCountdown}s)</span>
            </button>
            
            <button
              type="button"
              onClick={() => window.location.replace('https://www.google.com')}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
            >
              <span>🌐 Tiếp tục lướt web (Google)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-50 text-amber-900 font-semibold text-xs hover:bg-amber-100 transition flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Gặp sự cố kết nối? Báo lỗi kỹ thuật</span>
            </button>
          </div>
        </div>

        <ReportIssueModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          locationName={portalData?.location.name}
          locationId={portalData?.location.id}
          locationSlug={portalData?.location.slug || locationParam}
          clientMac={effectiveClientMac}
          clientIp={portalData?.clientIp || rawIp}
        />
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
          <div className="relative mb-5 flex items-center justify-center">
            <VietnamFlag width={72} height={48} className="rounded-sm shadow-2xl border border-yellow-400/60" animate />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-yellow-300 mb-2" />
          <p className="text-xs text-slate-100 font-medium tracking-wide">Đang tải Cổng Wi-Fi Hải Phòng...</p>
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
            onClick={() => (previewToken ? loadPreview(previewToken) : loadPortal())}
            className="w-full py-2 px-3 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-semibold transition cursor-pointer"
          >
            Thử lại kết nối
          </button>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-full mt-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Báo lỗi sự cố điểm này</span>
          </button>
        </div>

        <ReportIssueModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          locationSlug={locationParam}
          clientMac={effectiveClientMac}
          clientIp={rawIp}
          previewMode={isPreviewMode}
        />
      </div>
    );
  }

  const handleSwitchDemoLocation = (slug: string) => {
    navigate(`/portal?location=${slug}`);
    loadPortal(slug);
  };

  const template = portalData?.portalTemplate;
  const survey = portalData?.activeSurvey;

  const activeCampaign = portalData?.activeCampaign;

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
      {isPreviewMode && !isEmbeddedPreview && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-1rem)] rounded-full bg-slate-950/90 px-3 py-1.5 text-center text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/20">
          Bản xem trước · Các thao tác kết nối, OTP và gửi phản ánh đã tắt
        </div>
      )}
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
              <div className="flex justify-center mb-2">
                <VietnamFlag width={48} height={32} className="rounded-xs shadow-sm border border-yellow-400/50" />
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
              {template?.title || 'Cổng Thông Tin Wi-Fi'}
            </h1>
          </div>

          {/* Location & Speed Meta Strip */}
          <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-700 gap-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold truncate mr-2">
              <MapPin className="w-3.5 h-3.5 text-[#a81c1c] flex-shrink-0" />
              <span className="truncate">{portalData?.location.name || 'Nhà văn hóa thôn, tổ dân phố Hải Phòng'}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10.5px] text-slate-600">
              <span>{portalData?.location.sessionDurationMinutes || 120} phút</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{portalData?.location.maxBandwidthMbps || 20} Mbps</span>
              <span>•</span>
              <span className={`font-semibold flex items-center gap-1 ${portalData?.capacityReached ? 'text-rose-600' : 'text-indigo-700'}`}>
                <Users className="w-3 h-3" />
                {portalData?.currentActiveUsers ?? 0}/{portalData?.maxConcurrentUsers || portalData?.location.maxConcurrentUsers || 50}
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                disabled={isPreviewMode}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-sans font-bold text-[10.5px] transition shadow-2xs cursor-pointer"
                title="Báo lỗi hoặc phản ánh chất lượng mạng Wi-Fi tại điểm này"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <span>Báo lỗi Wi-Fi</span>
              </button>
            </div>
          </div>

          {/* Digital Broadcast News Ticker (Dòng tin tức truyền thông số Hải Phòng) */}
          {activeCampaign && (
          <div className="bg-[#881313] text-white px-3.5 py-1.5 flex items-center gap-2 text-[11px] font-medium overflow-hidden border-b border-red-950/40 shadow-inner">
            <div className="flex items-center gap-1 bg-yellow-400 text-red-950 font-black px-1.5 py-0.5 rounded-xs text-[9.5px] uppercase tracking-wider flex-shrink-0 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              TIN TRUYỀN THÔNG SỐ
            </div>
            <div className="truncate flex-1 text-yellow-100 font-sans">
              <span className="font-bold text-white uppercase">{activeCampaign.title}</span> — <span>{activeCampaign.description?.slice(0, 95)}...</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMediaModal(true)}
              className="text-[10px] font-bold text-yellow-300 hover:text-white underline flex-shrink-0 cursor-pointer"
            >
              Chi tiết
            </button>
          </div>
          )}

          {/* Scrollable Content Body on Desktop */}
          <div className="p-4 sm:p-5 space-y-4 flex-1">
            {/* Lời chào mừng chính thức của điểm phát */}
            <div>
              
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {portalData?.location.welcomeMessage || template?.welcomeText || `Chào mừng Nhân dân đến với ${portalData?.location.name || 'Nhà văn hóa'}`}
              </h2>
              <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#a81c1c] flex-shrink-0" />
                <span>{portalData?.location.address || 'Thành phố Hải Phòng'}</span>
              </p>
            </div>

            {/* Bảng tin tuyên truyền & Chuyển đổi số địa phương */}
            {(portalData?.location.promoTitle || portalData?.location.promoContent || portalData?.location.promoActionUrl) && (
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
                {/^https?:\/\//i.test(portalData.location.promoActionUrl || '') && (
                  <a
                    href={portalData.location.promoActionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004b87] hover:underline"
                  >
                    Mở cổng thông tin địa phương <ExternalLink className="w-3 h-3" />
                  </a>
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
                alt={portalData?.location.name || 'Wifi công cộng Hải Phòng'}
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

                  <span>Băng thông: <strong className="text-emerald-300">{portalData?.location.maxBandwidthMbps || 20} Mbps</strong></span>
                  <span>•</span>
                  <span>Mã trạm: <strong className="text-slate-200">{portalData?.location.locationCode || 'LOC-HP'}</strong></span>
                </div>
              </div>
            </div>

            {/* ================= KHÔNG GIAN BẢN TIN TUYÊN TRUYỀN TP. HẢI PHÒNG ================= */}
            {activeCampaign && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5 transition hover:shadow-md">
              {/* Header: Huy hiệu Bản tin tuyên truyền số */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#a81c1c] text-white text-[11px] font-bold tracking-wide shadow-2xs">
                  <Megaphone className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
                  <span>BẢN TIN TUYÊN TRUYỀN SỐ</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">UBND TP. Hải Phòng</span>
              </div>

              {/* Tiêu đề thông điệp tuyên truyền */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
                  {activeCampaign.title}
                </h3>
              </div>

              {/* Media Visual Card Showcase */}
              <div 
                onClick={() => setShowMediaModal(true)}
                className="relative rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-slate-900 cursor-pointer group aspect-[16/9] w-full"
                title="Chạm để xem bản tin chi tiết"
              >
                <img
                  src={activeCampaign.bannerUrl || '/banners/haiphong_city_bg.jpg'}
                  alt={activeCampaign.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                  }}
                />

                {/* Subtle scrim overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white transition-opacity" />

                {/* Floating Media Badges / Controls */}
                {activeCampaign.galleryUrls && activeCampaign.galleryUrls.length > 1 && (
                  <div className="absolute top-2.5 right-2.5 z-10 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-white/10">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{activeCampaign.galleryUrls.length} ảnh</span>
                  </div>
                )}

                {/* Center Play Button for Video */}
                {activeCampaign.videoUrl ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-[#a81c1c] flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 group-hover:bg-[#a81c1c] group-hover:text-white transition-all duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                ) : null}

                {/* Bottom Label overlay */}
                <div className="absolute bottom-2.5 inset-x-3.5 z-10 flex items-center justify-between text-white text-xs">
                  <span className="font-medium text-slate-100 flex items-center gap-1.5 drop-shadow-sm">
                    {activeCampaign.videoUrl ? (
                      <span>Video bản tin tuyên truyền</span>
                    ) : (
                      <span>Xem ảnh & toàn văn bản tin</span>
                    )}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md font-medium border border-white/15">
                    Chạm để mở
                  </span>
                </div>
              </div>

              {/* Tóm tắt nội dung */}
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans line-clamp-3">
                {activeCampaign.description}
              </p>

              {/* Bộ nút hành động Truyền thông số */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#a81c1c] hover:bg-[#8f1818] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {activeCampaign.videoUrl ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Xem Video & Chi Tiết Bản Tin</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Chi Tiết Bản Tin</span>
                    </>
                  )}
                </button>

                {activeCampaign.actionUrl && (
                  <a
                    href={activeCampaign.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Cổng Dịch Vụ Công TP. Hải Phòng</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                )}
              </div>
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

            {/* 4 Quick Telemetry Metric Tiles */}
            <div className="grid grid-cols-4 gap-2 text-center">
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
                <div className="text-[10px] text-slate-300">Tải kết nối</div>
                <div className={`text-xs font-extrabold font-mono ${portalData?.capacityReached ? 'text-rose-300' : 'text-cyan-200'}`}>
                  {portalData?.currentActiveUsers ?? 0}/{portalData?.maxConcurrentUsers || portalData?.location.maxConcurrentUsers || 50}
                </div>
              </div>
              <div className="p-2 rounded bg-white/10 border border-white/15">
                <div className="text-[10px] text-slate-300">Chi phí</div>
                <div className="text-xs font-extrabold text-white">Miễn phí</div>
              </div>
            </div>
          </div>

          {/* Connect Action Form Container */}
          <form onSubmit={handleConnect} className="p-4 sm:p-6 space-y-4 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {error && <AlertBanner type="error" message={error} />}
              {successInfo && <AlertBanner type="success" message={successInfo} />}

              {/* Capacity Limit Reached Warning Alert */}
              {portalData?.capacityReached && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Users className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>Điểm phát sóng hiện đã đạt giới hạn tối đa</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-amber-800">
                    Hiện có <strong>{portalData.currentActiveUsers}</strong>/{portalData.maxConcurrentUsers} thiết bị đang truy cập mạng. Quý vị vui lòng thử lại sau giây lát khi có người rời đi để đảm bảo chất lượng đường truyền.
                  </p>
                  <button
                    type="button"
                    onClick={() => (previewToken ? loadPreview(previewToken) : loadPortal())}
                    disabled={isPreviewMode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-bold transition shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Thử kiểm tra lại tải mạng</span>
                  </button>
                </div>
              )}

              {/* Smart Citizen Survey Block (Khảo sát ý kiến công dân trực tiếp) */}
              {survey && visibleSurveyQuestions.length > 0 && (
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

                  <div className="space-y-3 pt-0.5">
                    {visibleSurveyQuestions.map((q, idx) => {
                      let options: string[] = [];
                      try {
                        if (q.optionsJson) options = JSON.parse(q.optionsJson);
                      } catch (_) {}

                      const qKey = q.id?.toString() || `q_${idx}`;
                      const currentVal = surveyAnswers[qKey];
                      const isMissing = missingQuestionId === q.id;

                      return (
                        <div
                          id={`survey-q-${q.id}`}
                          key={q.id || idx}
                          className={`p-3 bg-white rounded-lg border shadow-xs space-y-2 transition-all duration-300 ${
                            isMissing ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20' : 'border-slate-200/90'
                          }`}
                        >
                          <p className="font-semibold text-slate-800 text-[11.5px] leading-snug">
                            <span className="text-[#004b87] font-bold mr-1">Câu {idx + 1}:</span>
                            {q.questionText} {q.required ? (
                              <span className="text-rose-600 font-bold ml-1 text-[10px] bg-rose-50 border border-rose-200 px-1 py-0.5 rounded">Bắt buộc</span>
                            ) : (
                              <span className="text-slate-400 font-normal ml-1 text-[10px] italic">(Tùy chọn)</span>
                            )}
                          </p>

                          {/* TYPE: RATING */}
                          {q.questionType === 'RATING' && (
                            <div className="space-y-1.5 pt-0.5">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const ratingNum = typeof currentVal === 'number' ? currentVal : parseInt(currentVal, 10);
                                  const isFilled = !isNaN(ratingNum) && ratingNum >= star;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setSurveyAnswers({ ...surveyAnswers, [qKey]: star })}
                                      className="p-1 rounded hover:scale-110 transition cursor-pointer focus:outline-none"
                                      title={`${star} sao`}
                                    >
                                      <Star
                                        className={`w-6 h-6 transition-colors ${
                                          isFilled
                                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                            : 'text-slate-300 hover:text-amber-300'
                                        }`}
                                      />
                                    </button>
                                  );
                                })}
                                {currentVal && (
                                  <span className="text-[11px] font-bold text-amber-700 ml-1">
                                    {currentVal === 5 ? '5/5 - Rất hài lòng' :
                                     currentVal === 4 ? '4/5 - Hài lòng' :
                                     currentVal === 3 ? '3/5 - Bình thường' :
                                     currentVal === 2 ? '2/5 - Chưa hài lòng' :
                                     '1/5 - Kém'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* TYPE: MULTI_CHOICE */}
                          {q.questionType === 'MULTI_CHOICE' && options.length > 0 && (
                            <div className="space-y-1.5 pt-0.5">
                              {options.map((opt, oIdx) => {
                                const selectedList: string[] = Array.isArray(currentVal) ? currentVal : [];
                                const isChecked = selectedList.includes(opt);
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => {
                                      const next = isChecked
                                        ? selectedList.filter((x) => x !== opt)
                                        : [...selectedList, opt];
                                      setSurveyAnswers({ ...surveyAnswers, [qKey]: next });
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded text-[11px] border text-left transition cursor-pointer flex items-center justify-between ${
                                      isChecked
                                        ? 'bg-blue-50 text-[#004b87] border-[#004b87] font-semibold shadow-xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] font-bold ${
                                        isChecked ? 'bg-[#004b87] border-[#004b87] text-white' : 'border-slate-400 bg-white'
                                      }`}>
                                        {isChecked && '✓'}
                                      </div>
                                      <span>{opt}</span>
                                    </div>
                                    {isChecked && <span className="text-[9.5px] text-[#004b87] font-bold">Đã chọn</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* TYPE: SINGLE_CHOICE */}
                          {(q.questionType === 'SINGLE_CHOICE' || (!q.questionType && options.length > 0)) && options.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                              {options.map((opt, oIdx) => {
                                const isSelected = currentVal === opt;
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() =>
                                      setSurveyAnswers({ ...surveyAnswers, [qKey]: opt })
                                    }
                                    className={`px-2.5 py-1.5 rounded text-[11px] border text-left transition cursor-pointer flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-[#004b87] text-white border-[#004b87] font-bold shadow-xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span className="truncate">{opt}</span>
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0 ml-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* TYPE: TEXT */}
                          {(q.questionType === 'TEXT' || (!options.length && q.questionType !== 'RATING')) && (
                            <div className="space-y-1 pt-0.5">
                              <textarea
                                rows={2}
                                maxLength={300}
                                placeholder="Nhập ý kiến đóng góp của quý vị..."
                                value={typeof currentVal === 'string' ? currentVal : ''}
                                onChange={(e) =>
                                  setSurveyAnswers({ ...surveyAnswers, [qKey]: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#004b87] bg-white font-sans resize-none"
                              />
                              <div className="flex justify-end text-[10px] text-slate-400 font-mono">
                                {typeof currentVal === 'string' ? currentVal.length : 0}/300
                              </div>
                            </div>
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

              {/* Secondary Inline Error Callout right above submit button for mobile view */}
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs flex items-start gap-2 shadow-xs">
                  <span className="font-bold text-rose-700 flex-shrink-0">⚠️ Lưu ý:</span>
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {/* Primary Action Button (Bấm vào kết nối 1-chạm) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || Boolean(portalData?.capacityReached)}
                  className={`w-full py-3.5 px-4 rounded-lg text-white font-extrabold text-sm sm:text-base tracking-wide uppercase transition flex items-center justify-center gap-2 shadow-lg ${
                    portalData?.capacityReached
                      ? 'bg-slate-400 cursor-not-allowed opacity-80'
                      : 'cursor-pointer hover:brightness-105 active:scale-[0.99] disabled:opacity-50'
                  }`}
                  style={{
                    backgroundColor: portalData?.capacityReached
                      ? undefined
                      : template?.themeColor || '#004b87',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />
                      <span>Đang cấp quyền kết nối Internet...</span>
                    </>
                  ) : portalData?.capacityReached ? (
                    <>
                      <Users className="w-5 h-5 text-amber-200" />
                      <span>ĐIỂM PHÁT ĐÃ ĐẦY TẢI ({portalData?.currentActiveUsers ?? 0}/{portalData?.maxConcurrentUsers ?? 50})</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-5 h-5 text-yellow-300" />
                      <span>{template?.buttonText || 'KẾT NỐI WI-FI MIỄN PHÍ'}</span>
                    </>
                  )}
                </button>
                <p className="text-[10.5px] text-slate-500 text-center mt-2 font-medium">
                  Tốc độ: <strong>{portalData?.location.maxBandwidthMbps || 20} Mbps</strong> • Thời lượng phiên: <strong>{portalData?.location.sessionDurationMinutes || 120} phút</strong> • Giới hạn: <strong>{portalData?.maxConcurrentUsers || portalData?.location.maxConcurrentUsers || 50} kết nối đồng thời</strong>
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
                              disabled={submitting || isPreviewMode}
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
                                disabled={submitting || isPreviewMode}
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
              <div className="flex items-center justify-between">
                
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer underline decoration-amber-400/80"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Báo sự cố Wi-Fi</span>
                </button>
              </div>
            </div>
          </form>

       
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

      {/* Floating "Báo lỗi Wi-Fi" Button (Always accessible) */}
      <button
        type="button"
        onClick={() => setShowReportModal(true)}
        className="fixed bottom-3 right-3 z-40 bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-300/90 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-bold transition hover:scale-105 cursor-pointer backdrop-blur-xs"
        title="Báo lỗi hoặc phản ánh chất lượng Wi-Fi"
      >
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <span className="hidden sm:inline">Báo lỗi Wi-Fi</span>
        <span className="sm:hidden">Báo lỗi</span>
      </button>

      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        locationName={portalData?.location.name}
        locationId={portalData?.location.id}
        locationSlug={portalData?.location.slug || locationParam}
        clientMac={effectiveClientMac}
        clientIp={portalData?.clientIp || rawIp}
        previewMode={isPreviewMode}
      />

      {/* Citizen Digital Media Modal (Trình chiếu Video & Toàn văn truyền thông số) */}
      {activeCampaign && (
        <CitizenDigitalMediaModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          campaign={activeCampaign}
        />
      )}
    </div>
  );
};
