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
  Globe,
} from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { PortalInitResponse } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';
import { VietnamFlag } from '../../components/VietnamFlag';
import { ViettelLogo } from '../../components/ViettelLogo';
import { ReportIssueModal } from '../../components/ReportIssueModal';
import { CitizenDigitalMediaModal } from '../../components/CitizenDigitalMediaModal';
import { Play, Tv, Video, Eye, Share2, FileText, Image as ImageIcon } from 'lucide-react';
import { normalizeMediaUrl, getYouTubeThumbnailUrl } from '../../utils/mediaUrl';

const DEFAULT_FALLBACK_PORTAL_DATA: PortalInitResponse = {
  location: {
    id: 1,
    slug: 'hp-hb-nvh01',
    name: 'Nhà văn hóa Hải Phòng',
    address: 'Thành phố Hải Phòng',
    description: 'Điểm phát sóng Wi-Fi công cộng miễn phí phục vụ Nhân dân và dịch vụ công trực tuyến.',
    sessionDurationMinutes: 120,
    maxBandwidthMbps: 20,
    maxConcurrentUsers: 50,
    active: true,
    welcomeMessage: 'Chào mừng Nhân dân đến với hệ thống Wi-Fi công cộng Thành phố Hải Phòng',
    promoBannerUrl: '/banners/haiphong_culture_house.jpg',
    backgroundImageUrl: '/banners/haiphong_city_bg.jpg',
    termsAndConditions:
      'Bằng việc truy cập mạng Wi-Fi công cộng này, quý vị đồng ý tuân thủ quy tắc ứng xử trên không gian mạng và các quy định pháp luật hiện hành.',
  },
  clientIp: '127.0.0.1',
  clientMacHint: '02:42:ac:11:00:01',
  mockGateway: false,
  gatewayNotice: 'Live Gateway Connected.',
  macRemembered: false,
  otpRequired: false,
  currentActiveUsers: 0,
  maxConcurrentUsers: 50,
  capacityReached: false,
};

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

function parseHexRgb(color?: string | null): [number, number, number] | null {
  if (!color) return null;
  const cleaned = color.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return [
      parseInt(cleaned[0] + cleaned[0], 16),
      parseInt(cleaned[1] + cleaned[1], 16),
      parseInt(cleaned[2] + cleaned[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return [
      parseInt(cleaned.slice(0, 2), 16),
      parseInt(cleaned.slice(2, 4), 16),
      parseInt(cleaned.slice(4, 6), 16),
    ];
  }
  return null;
}

function toRgba(color: string | undefined | null, alpha: number, fallback: string): string {
  const rgb = parseHexRgb(color);
  if (!rgb) return fallback;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function adjustHexBrightness(color: string | undefined | null, factor: number, fallback: string): string {
  const rgb = parseHexRgb(color);
  if (!rgb) return fallback;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${clamp(rgb[0])}, ${clamp(rgb[1])}, ${clamp(rgb[2])})`;
}

function isDarkHex(color: string | undefined | null): boolean {
  const rgb = parseHexRgb(color);
  if (!rgb) return true;
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance < 0.55;
}

export const PortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const previewToken = searchParams.get('previewToken') || undefined;
  const isEmbeddedPreview = searchParams.get('previewMode') === 'embedded';
  const isPreviewMode = Boolean(previewToken || isEmbeddedPreview);

  // Instant shell hydration for iOS Captive Network Assistant (CNA) & Android CaptivePortalLogin:
  // Avoid blocking initial paint on a full-screen spinner when opening /portal on iPhone.
  const [portalData, setPortalData] = useState<PortalInitResponse | null>(() => {
    if (previewToken || isEmbeddedPreview) return null;
    try {
      const rawSearch = window.location.search || '';
      const norm = rawSearch.startsWith('?') ? rawSearch.slice(1).replace(/\?/g, '&') : rawSearch.replace(/\?/g, '&');
      const params = new URLSearchParams(norm);
      const slug = params.get('location') || 'default';
      const saved = sessionStorage.getItem(`wifi_portal_init_shared_${slug}`) || localStorage.getItem(`wifi_portal_init_shared_${slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.data && Date.now() - parsed.timestamp < 600000) {
          return parsed.data as PortalInitResponse;
        }
      }
    } catch (_) {}
    return DEFAULT_FALLBACK_PORTAL_DATA;
  });
  const [loading, setLoading] = useState<boolean>(() => Boolean(previewToken || isEmbeddedPreview));
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
  const targetUrlParam = normalizedParams.get('url') || normalizedParams.get('target') || normalizedParams.get('redir') || searchParams.get('url') || searchParams.get('redir') || undefined;

  // Grandstream GWN sends gw_address + gw_port, or gwn_login, or authaction, or login_url
  const gwAddressParam =
    normalizedParams.get('gw_address') ||
    normalizedParams.get('gwaddress') ||
    normalizedParams.get('gw_addr') ||
    searchParams.get('gw_address') ||
    undefined;

  const gwPortParam =
    normalizedParams.get('gw_port') ||
    normalizedParams.get('gwport') ||
    searchParams.get('gw_port') ||
    undefined;

  const excapDirectUrl =
    normalizedParams.get('gwn_login') ||
    normalizedParams.get('login_url') ||
    normalizedParams.get('loginurl') ||
    normalizedParams.get('authaction') ||
    searchParams.get('gwn_login') ||
    searchParams.get('login_url') ||
    undefined;

  const rawLoginUrl = useMemo(() => {
    if (excapDirectUrl) return excapDirectUrl;
    if (gwAddressParam) {
      const port = gwPortParam || '8080';
      return `http://${gwAddressParam}:${port}/gwn_login`;
    }
    // If router redirected client (has mac, client_mac or ap_mac parameter), fallback to local router gateway
    if (rawMac || apMacParam) {
      return 'http://192.168.80.1:8080/gwn_login';
    }
    return undefined;
  }, [excapDirectUrl, gwAddressParam, gwPortParam, rawMac, apMacParam]);

  const localRouterLoginUrl = useMemo(() => {
    if (gwAddressParam) {
      const port = gwPortParam || '8080';
      return `http://${gwAddressParam}:${port}/gwn_login`;
    }
    return 'http://192.168.80.1:8080/gwn_login';
  }, [gwAddressParam, gwPortParam]);

  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);

  const targetDestination = useMemo(() => {
    const isProbeUrl = (u: string) =>
      u.includes('/portal') ||
      u.includes('gwn_login') ||
      u.includes('generate_204') ||
      u.includes('connectivitycheck') ||
      u.includes('gstatic.com') ||
      u.includes('captive.apple.com') ||
      u.includes('hotspot-detect') ||
      u.includes('msftconnecttest') ||
      u.includes('detectportal') ||
      u.includes('clients3.google.com');

    if (targetUrlParam && !isProbeUrl(targetUrlParam)) {
      return targetUrlParam;
    }
    return 'https://dichvucong.haiphong.gov.vn/';
  }, [targetUrlParam]);

  const buildExcapUrl = (sessionToken?: string, forceLocal = false, overrideDest?: string) => {
    const finalDest = overrideDest || targetDestination;
    let baseLogin = rawLoginUrl || 'http://192.168.80.1:8080/gwn_login';
    if (forceLocal || baseLogin.includes('cwp.gwnportal.cloud')) {
      baseLogin = localRouterLoginUrl;
    }
    const sep = baseLogin.includes('?') ? '&' : '?';
    const cleanMac = (effectiveClientMac || macAddress || '0242ac110001').replace(/[:-]/g, '').toLowerCase();
    const token = sessionToken || (connectedSession ? connectedSession.sessionToken : '') || 'guest';
    return `${baseLogin}${sep}username=${encodeURIComponent(cleanMac + '@gwn')}&password=${encodeURIComponent(token)}&redirect=${encodeURIComponent(finalDest)}`;
  };

  const executePostAuthRedirect = (overrideDest?: string) => {
    const isFromRouter = Boolean(rawLoginUrl || rawMac || gwAddressParam || excapDirectUrl || apMacParam);
    if (isFromRouter) {
      const excapUrl = buildExcapUrl(connectedSession?.sessionToken, false, overrideDest);
      window.location.href = excapUrl;
    } else {
      window.location.href = overrideDest || targetDestination;
    }
  };

  useEffect(() => {
    if (!connectedSession) return;
    if (redirectCountdown <= 0) {
      executePostAuthRedirect();
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [connectedSession, redirectCountdown, targetDestination]);

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
    const sharedCacheKey = `wifi_portal_init_shared_${slug || 'default'}`;

    // Fast local memory cache: if citizen opened portal recently, display immediately without spinner
    if (!isEmbeddedPreview && !previewToken) {
      try {
        const cached = sessionStorage.getItem(cacheKey) || sessionStorage.getItem(sharedCacheKey) || localStorage.getItem(sharedCacheKey);
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

    if (!portalData && (isEmbeddedPreview || previewToken)) {
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
          const payload = JSON.stringify({ data, timestamp: Date.now() });
          sessionStorage.setItem(cacheKey, payload);
          sessionStorage.setItem(sharedCacheKey, payload);
          localStorage.setItem(sharedCacheKey, payload);
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

      // Kích hoạt đồng thời tín hiệu phần cứng mở mạng tới router nội bộ (LAN EXCAP)
      try {
        const cleanMac = (effectiveClientMac || macAddress || '0242ac110001').replace(/[:-]/g, '').toLowerCase();
        const authEndpoints = [
          localRouterLoginUrl,
          ...(rawLoginUrl && !rawLoginUrl.includes('cwp.gwnportal.cloud') ? [rawLoginUrl] : [])
        ];

        authEndpoints.forEach((endpoint) => {
          try {
            const sep = endpoint.includes('?') ? '&' : '?';
            const excapUrl = `${endpoint}${sep}username=${encodeURIComponent(cleanMac + '@gwn')}&password=${encodeURIComponent(session.sessionToken || 'guest')}&redirect=${encodeURIComponent(targetDestination)}`;
            fetch(excapUrl, { mode: 'no-cors' }).catch(() => {});
            const img = new Image();
            img.src = excapUrl;
          } catch (_) {}
        });

        // Tạo dynamic hidden iframe form submit để router GWN7002 mở iptables tức thì
        const hiddenFrameName = 'gwn_auth_frame';
        let frame = document.getElementById(hiddenFrameName) as HTMLIFrameElement;
        if (!frame) {
          frame = document.createElement('iframe');
          frame.id = hiddenFrameName;
          frame.name = hiddenFrameName;
          frame.style.display = 'none';
          document.body.appendChild(frame);
        }
        const form = document.createElement('form');
        form.target = hiddenFrameName;
        form.method = 'POST';
        form.action = localRouterLoginUrl;
        const addHidden = (k: string, v: string) => {
          const inp = document.createElement('input');
          inp.type = 'hidden';
          inp.name = k;
          inp.value = v;
          form.appendChild(inp);
        };
        addHidden('username', `${cleanMac}@gwn`);
        addHidden('password', session.sessionToken || 'guest');
        addHidden('redirect', targetDestination);
        addHidden('redir', targetDestination);
        addHidden('mac', cleanMac);
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => { form.remove(); }, 1500);
      } catch (_) {}

      setConnectedSession(session);
      setSuccessInfo('Kết nối thành công! Đã cấp quyền truy cập Internet.');
    } catch (err: any) {
      setError(err?.message || 'Xác thực truy cập không thành công. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectAndWatchVideo = async (externalVideoUrl?: string) => {
    if (isPreviewMode || !portalData) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await portalApi.login({
        locationSlug: portalData.location.slug,
        macAddress: effectiveClientMac,
        guestName: guestName.trim() || undefined,
        guestContact: phoneNumber.trim() || undefined,
        consentGiven: true,
      });

      const dest = externalVideoUrl || targetDestination;
      try {
        const cleanMac = (effectiveClientMac || macAddress || '0242ac110001').replace(/[:-]/g, '').toLowerCase();
        const authEndpoints = [
          localRouterLoginUrl,
          ...(rawLoginUrl && !rawLoginUrl.includes('cwp.gwnportal.cloud') ? [rawLoginUrl] : []),
        ];
        authEndpoints.forEach((endpoint) => {
          try {
            const sep = endpoint.includes('?') ? '&' : '?';
            const excapUrl = `${endpoint}${sep}username=${encodeURIComponent(cleanMac + '@gwn')}&password=${encodeURIComponent(session.sessionToken || 'guest')}&redirect=${encodeURIComponent(dest)}`;
            fetch(excapUrl, { mode: 'no-cors' }).catch(() => {});
            const img = new Image();
            img.src = excapUrl;
          } catch (_) {}
        });
      } catch (_) {}

      setShowMediaModal(false);
      setConnectedSession(session);
      if (externalVideoUrl) {
        setTimeout(() => {
          executePostAuthRedirect(externalVideoUrl);
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể kích hoạt kết nối Wi-Fi.');
    } finally {
      setSubmitting(false);
    }
  };

  const template = portalData?.portalTemplate;
  const effectiveThemeColor = parseHexRgb(template?.themeColor) ? template!.themeColor! : '#ee0033';
  const themeDark = adjustHexBrightness(effectiveThemeColor, 0.76, '#c4002b');
  const themeSoftBg = toRgba(effectiveThemeColor, 0.09, 'rgba(238, 0, 51, 0.09)');
  const themeBorder = toRgba(effectiveThemeColor, 0.28, 'rgba(238, 0, 51, 0.28)');
  const themeShadow = toRgba(effectiveThemeColor, 0.36, 'rgba(238, 0, 51, 0.36)');
  const hasCustomBgColor = Boolean(parseHexRgb(template?.backgroundColor));
  const effectiveBgColor = hasCustomBgColor ? template!.backgroundColor! : '#0c2340';
  const bgOverlayGradient = hasCustomBgColor
    ? isDarkHex(effectiveBgColor)
      ? `linear-gradient(180deg, ${toRgba(effectiveBgColor, 0.84, 'rgba(2,6,23,0.84)')} 0%, ${adjustHexBrightness(effectiveBgColor, 0.45, '#020617')} 100%)`
      : `linear-gradient(180deg, ${toRgba(effectiveBgColor, 0.72, 'rgba(248,250,252,0.72)')} 0%, ${toRgba(effectiveBgColor, 0.88, 'rgba(248,250,252,0.88)')} 100%)`
    : 'linear-gradient(180deg, rgba(2,6,23,0.8) 0%, rgba(15,23,42,0.75) 50%, rgba(2,6,23,0.88) 100%)';

  if (connectedSession) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
        style={hasCustomBgColor ? { backgroundColor: effectiveBgColor } : undefined}
      >
        <div
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-5 border-t-4 border-[#ee0033]"
          style={{ borderTopColor: effectiveThemeColor }}
        >
          {/* Viettel Co-Branding Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-1">
            <div className="flex items-center gap-1.5 text-left">
              <VietnamFlag width={26} height={17} className="rounded-xs shadow-xs" />
              <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                HẢI PHÒNG SMART
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ViettelLogo height={16} variant="simple" color="red" showTagline={false} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: effectiveThemeColor }}>
                TELECOM
              </span>
            </div>
          </div>

          <div
            className="w-16 h-16 text-white rounded-full flex items-center justify-center mx-auto"
            style={{
              background: `linear-gradient(135deg, ${effectiveThemeColor} 0%, ${themeDark} 100%)`,
              boxShadow: `0 10px 25px -5px ${themeShadow}`,
            }}
          >
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-black uppercase tracking-wider mb-1.5"
              style={{ backgroundColor: themeSoftBg, color: effectiveThemeColor, borderColor: themeBorder }}
            >
              <Wifi className="w-3 h-3" style={{ color: effectiveThemeColor }} />
              Wi-Fi Hải Phòng
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">KẾT NỐI THÀNH CÔNG!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Chào mừng quý công dân đến với <strong>{connectedSession.locationName || portalData?.location.name || 'Nhà văn hóa'}</strong>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2 text-left">
            <div className="flex justify-between items-center font-bold">
              <span>Hạ tầng mạng:</span>
              <span className="font-bold flex items-center gap-1" style={{ color: effectiveThemeColor }}>
                <Sparkles className="w-3.5 h-3.5" /> Viettel Fiber 5G High-Speed
              </span>
            </div>
            <div className="flex justify-between">
              <span>Thời lượng phiên:</span>
              <span className="font-semibold">{connectedSession.durationMinutes || 120} phút</span>
            </div>
            <div className="flex justify-between">
              <span>Băng thông truy cập:</span>
              <span className="font-semibold text-emerald-700 font-mono">{portalData?.location.maxBandwidthMbps || 20} Mbps</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center justify-center gap-2">
            {redirectCountdown > 0 ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Tự động chuyển đến Cổng Dịch vụ công ({redirectCountdown}s)...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-700">Đang chuyển tiếp tới Dịch vụ công Hải Phòng...</span>
              </>
            )}
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => { executePostAuthRedirect('https://dichvucong.haiphong.gov.vn/'); }}
              className="w-full py-3.5 px-4 rounded-xl text-white font-black text-sm tracking-wide active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
              style={{
                background: `linear-gradient(135deg, ${effectiveThemeColor} 0%, ${themeDark} 100%)`,
                boxShadow: `0 10px 22px -6px ${themeShadow}`,
              }}
            >
              <Landmark className="w-4 h-4 text-yellow-300" />
              <span>{redirectCountdown > 0 ? `VÀO DỊCH VỤ CÔNG HẢI PHÒNG (${redirectCountdown}s)` : 'VÀO DỊCH VỤ CÔNG HẢI PHÒNG NGAY'}</span>
            </button>
            
            <button
              type="button"
              onClick={() => { executePostAuthRedirect('https://www.google.com'); }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
            >
              <Globe className="w-4 h-4" style={{ color: effectiveThemeColor }} />
              <span>Tiếp tục lướt web (Google)</span>
            </button>

            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => { executePostAuthRedirect(); }}
                className="text-[11px] text-slate-500 underline transition cursor-pointer bg-transparent border-0"
              >
                Nhấp vào đây nếu trang không tự chuyển tiếp
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>Hỗ trợ kỹ thuật Viettel 24/7:</span>
              <a href="tel:18008119" className="font-bold hover:underline" style={{ color: effectiveThemeColor }}>1800 8119</a>
            </div>
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
            className="w-full py-2 px-3 bg-[#ee0033] hover:bg-[#c4002b] text-white rounded text-xs font-semibold transition cursor-pointer"
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

  const survey = portalData?.activeSurvey;

  const activeCampaign = portalData?.activeCampaign;

  // Background Wallpaper Priority (Normalized to same-origin /uploads/... so iOS CNA never hangs on external bucket timeouts):
  const rawBackgroundWallpaperUrl =
    (portalData?.location.backgroundImageUrl &&
     portalData.location.backgroundImageUrl !== '/banners/haiphong_city_bg.jpg'
      ? portalData.location.backgroundImageUrl
      : template?.backgroundImageUrl) ||
    template?.backgroundImageUrl ||
    portalData?.location.backgroundImageUrl ||
    '/banners/haiphong_city_bg.jpg';
  const backgroundWallpaperUrl = normalizeMediaUrl(rawBackgroundWallpaperUrl) || '/banners/haiphong_city_bg.jpg';

  // Banner Photo Priority: Always show the location's own actual culture house photo
  const rawLocalBannerUrl =
    portalData?.location.promoBannerUrl ||
    template?.bannerUrl ||
    '/banners/haiphong_culture_house.jpg';
  const localBannerUrl = normalizeMediaUrl(rawLocalBannerUrl) || '/banners/haiphong_culture_house.jpg';

  const campaignBannerPreviewUrl =
    normalizeMediaUrl(activeCampaign?.bannerUrl) ||
    getYouTubeThumbnailUrl(activeCampaign?.videoUrl, true) ||
    '/banners/haiphong_city_bg.jpg';

  return (
    <div
      className={`relative min-h-screen flex flex-col items-center justify-center text-slate-900 font-sans ${
        isEmbeddedPreview ? 'p-2 sm:p-4' : 'p-2.5 sm:p-5 lg:p-6'
      }`}
      style={
        template?.backgroundColor
          ? { backgroundColor: template.backgroundColor }
          : undefined
      }
    >
      {isPreviewMode && !isEmbeddedPreview && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-1rem)] rounded-full bg-slate-950/90 px-3 py-1.5 text-center text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/20">
          Bản xem trước · Các thao tác kết nối, OTP và gửi phản ánh đã tắt
        </div>
      )}
      {/* Official City Architectural Wallpaper Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundWallpaperUrl}')` }}
      />
      {/* GovTech Backdrop Overlay tinted by template.backgroundColor (avoid heavy full-screen backdrop-blur on mobile iOS WebKit) */}
      <div
        className="fixed inset-0 sm:backdrop-blur-[2px] transition-colors duration-300"
        style={{ background: bgOverlayGradient }}
      />

      {/* Main Responsive Container: Mobile = Sleek App Card, Laptop = 2-Column Split */}
      <div className="relative z-10 bg-white rounded-2xl border border-white/20 shadow-2xl max-w-md lg:max-w-5xl xl:max-w-6xl w-full overflow-hidden lg:grid lg:grid-cols-12">
        
        {/* ================= LEFT COLUMN: CITIZEN INFORMATION & CITY CAMPAIGN (lg:col-span-7) ================= */}
        <div className="lg:col-span-7 flex flex-col bg-gradient-to-b from-slate-50/70 to-white border-b lg:border-b-0 lg:border-r border-slate-200">
          
          {/* Official Viettel & Government Dual-Branded Header */}
          <div
            className="text-white p-4 sm:p-5 border-b relative shadow-md overflow-hidden transition-colors duration-300"
            style={{
              background: `linear-gradient(135deg, ${effectiveThemeColor} 0%, ${themeDark} 100%)`,
              borderBottomColor: themeDark,
            }}
          >
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            {/* Top Co-Branding Bar: Hai Phong City x Viettel */}
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/20">
              <div className="flex items-center gap-2">
                {template?.logoUrl ? (
                  <img
                    src={normalizeMediaUrl(template.logoUrl)}
                    alt="Biểu trưng chính thức"
                    className="h-7 w-auto max-w-[110px] object-contain drop-shadow-sm"
                  />
                ) : (
                  <VietnamFlag width={36} height={24} className="rounded-xs shadow-sm border border-yellow-400/50 flex-shrink-0" />
                )}
                <div className="text-left">
                  <div className="text-[9.5px] sm:text-[10.5px] font-black tracking-widest text-yellow-300 uppercase leading-tight">
                    UBND TP. HẢI PHÒNG
                  </div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-white/80 font-medium">
                    Chuyển đổi số cộng đồng
                  </div>
                </div>
              </div>

              <div className="h-6 w-px bg-white/30 hidden sm:block" />

              <div className="flex items-center gap-2 text-right">
                <div className="text-right">
                  <div className="text-[9.5px] sm:text-[10.5px] font-black tracking-wider text-white uppercase leading-tight">
                    VIETTEL HẢI PHÒNG
                  </div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-white/80 font-medium">
                    Hạ tầng số viễn thông
                  </div>
                </div>
                <div className="bg-white px-2 py-0.5 rounded shadow-sm flex items-center">
                  <ViettelLogo height={16} variant="simple" color="red" showTagline={false} />
                </div>
              </div>
            </div>

            {/* Central Portal Badge & Title */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-[10.5px] font-bold text-yellow-300 uppercase tracking-wider">
                <Wifi className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>MẠNG WI-FI CÔNG CỘNG MIỄN PHÍ</span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-white drop-shadow-sm">
                {template?.title || portalData?.location.name || 'Cổng Thông Tin Wi-Fi Hải Phòng'}
              </h1>
              <p className="text-[11px] text-white/85 italic">
                Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel) đồng hành cùng Nhân dân
              </p>
            </div>
          </div>

          {/* Location & Speed Meta Strip */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-700 gap-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold truncate mr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: effectiveThemeColor }} />
              <span className="truncate">{portalData?.location.name || 'Nhà văn hóa Hải Phòng'}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10.5px]">
              <span
                className="px-2 py-0.5 rounded-full border font-bold flex items-center gap-1"
                style={{ backgroundColor: themeSoftBg, color: effectiveThemeColor, borderColor: themeBorder }}
              >
                <Sparkles className="w-3 h-3" style={{ color: effectiveThemeColor }} />
                Viettel Fiber 5G
              </span>
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
                <span>Báo lỗi</span>
              </button>
            </div>
          </div>

          {/* Digital Broadcast News Ticker (Dòng tin tức truyền thông số Hải Phòng) */}
          {activeCampaign && (
          <div
            className="text-white px-3.5 py-1.5 flex items-center gap-2 text-[11px] font-medium overflow-hidden border-b border-black/20 shadow-inner transition-colors duration-300"
            style={{ backgroundColor: themeDark }}
          >
            <div className="flex items-center gap-1 bg-yellow-400 text-red-950 font-black px-1.5 py-0.5 rounded-xs text-[9.5px] uppercase tracking-wider flex-shrink-0 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              TIN MỚI
            </div>
            <div className="truncate flex-1 text-slate-100">
              <span className="font-bold text-white">{activeCampaign.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMediaModal(true)}
              className="text-[10px] font-bold text-yellow-300 hover:text-white underline flex-shrink-0 cursor-pointer"
            >
              Xem
            </button>
          </div>
          )}

          {/* Hero Banner with Overlaid Location & Telemetry Pills */}
          <div className="relative h-32 sm:h-44 lg:h-48 bg-slate-900 overflow-hidden border-b border-slate-200">
            <img
              src={localBannerUrl}
              alt={portalData?.location.name || 'Wifi công cộng Hải Phòng'}
              className="w-full h-full object-cover opacity-95"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_culture_house.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-between p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Điểm phát trực tuyến
                </span>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  disabled={isPreviewMode}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xs text-amber-300 border border-white/15 text-[10px] font-semibold transition cursor-pointer"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Báo lỗi</span>
                </button>
              </div>

              <div>
                <div className="text-xs sm:text-sm font-extrabold text-white drop-shadow-xs truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                  <span className="truncate">{portalData?.location.name || 'Nhà văn hóa Hải Phòng'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-xs text-emerald-300 font-bold border border-white/10">
                    {portalData?.location.maxBandwidthMbps || 20} Mbps
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-xs text-white border border-white/10">
                    {portalData?.location.sessionDurationMinutes || 120} phút
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-xs text-sky-200 border border-white/10 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    {portalData?.currentActiveUsers ?? 0}/{portalData?.maxConcurrentUsers || portalData?.location.maxConcurrentUsers || 50}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-3.5 sm:p-5 space-y-3 flex-1">
            {/* Lời chào mừng chính thức của điểm phát */}
            <div>
              <h2 className="text-xs sm:text-base font-bold text-slate-800 leading-snug">
                {portalData?.location.welcomeMessage || template?.welcomeText || `Chào mừng Nhân dân đến với ${portalData?.location.name || 'Nhà văn hóa'}`}
              </h2>
              <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: effectiveThemeColor }} />
                <span className="truncate">{portalData?.location.address || 'Thành phố Hải Phòng'}</span>
              </p>
            </div>

            {/* Bảng tin tuyên truyền & Chuyển đổi số địa phương */}
            {(portalData?.location.promoTitle || portalData?.location.promoContent || portalData?.location.promoActionUrl) && (
              <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-300/80 shadow-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: effectiveThemeColor }}>
                  <Megaphone className="w-4 h-4 flex-shrink-0" style={{ color: effectiveThemeColor }} />
                  <span className="truncate">{portalData.location.promoTitle || 'Bản Tin Chuyển Đổi Số Địa Phương'}</span>
                </div>
                {portalData.location.promoContent && (
                  <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {portalData.location.promoContent}
                  </p>
                )}
                {/^https?:\/\//i.test(portalData.location.promoActionUrl || '') && (
                  <a
                    href={portalData.location.promoActionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                    style={{ color: effectiveThemeColor }}
                  >
                    Mở cổng thông tin địa phương <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Hướng dẫn Dịch vụ hành chính công Thành phố */}
            <div className="hidden sm:flex p-3 bg-blue-50/80 rounded-lg border border-blue-200 items-start gap-2.5 text-slate-700">
              <Landmark className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: effectiveThemeColor }} />
              <div className="text-xs leading-relaxed">
                <span className="font-bold" style={{ color: effectiveThemeColor }}>Dịch vụ công trực tuyến:</span> Sau khi kết nối Wi-Fi, hệ thống sẽ mở trực tiếp <strong>Cổng Dịch vụ công TP Hải Phòng</strong> để bà con tra cứu hồ sơ và nộp thủ tục hành chính miễn phí.
              </div>
            </div>

            {/* ================= KHÔNG GIAN BẢN TIN TUYÊN TRUYỀN TP. HẢI PHÒNG ================= */}
            {activeCampaign && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5 transition hover:shadow-md">
              {/* Header: Huy hiệu Bản tin tuyên truyền số */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-white text-[11px] font-bold tracking-wide shadow-2xs"
                  style={{ backgroundColor: effectiveThemeColor }}
                >
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
                  src={campaignBannerPreviewUrl}
                  alt={activeCampaign.title}
                  loading="lazy"
                  decoding="async"
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
                    <div
                      className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-all duration-300"
                      style={{ color: effectiveThemeColor }}
                    >
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
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer hover:brightness-110"
                  style={{ backgroundColor: effectiveThemeColor }}
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

          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTERNET ACCESS FORM & VERIFICATION (lg:col-span-5) ================= */}
        <div className="lg:col-span-5 flex flex-col bg-white">
          
          {/* Laptop Top Banner / Telemetry Status Card (Visible on lg screens) */}
          <div
            className="hidden lg:block text-white p-5 border-b border-black/20 shadow-sm transition-colors duration-300"
            style={{
              background: `linear-gradient(135deg, #0f172a 0%, ${effectiveThemeColor} 100%)`,
            }}
          >
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
          <form onSubmit={handleConnect} className="p-4 sm:p-6 space-y-4 text-xs flex-1 flex flex-col justify-between animate-fade-in-up">
            <div className="space-y-4">
              {error && (
                <div className="animate-shake">
                  <AlertBanner type="error" message={error} />
                </div>
              )}
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
                    <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: effectiveThemeColor }}>
                      <ClipboardList className="w-4 h-4 flex-shrink-0" style={{ color: effectiveThemeColor }} />
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
                            <span className="font-bold mr-1" style={{ color: effectiveThemeColor }}>Câu {idx + 1}:</span>
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
                                        ? 'font-semibold shadow-xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                    style={isChecked ? { backgroundColor: themeSoftBg, color: effectiveThemeColor, borderColor: effectiveThemeColor } : undefined}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] font-bold ${
                                          isChecked ? 'text-white' : 'border-slate-400 bg-white'
                                        }`}
                                        style={isChecked ? { backgroundColor: effectiveThemeColor, borderColor: effectiveThemeColor } : undefined}
                                      >
                                        {isChecked && '✓'}
                                      </div>
                                      <span>{opt}</span>
                                    </div>
                                    {isChecked && <span className="text-[9.5px] font-bold" style={{ color: effectiveThemeColor }}>Đã chọn</span>}
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
                                        ? 'text-white font-bold shadow-xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                    style={isSelected ? { backgroundColor: effectiveThemeColor, borderColor: themeDark } : undefined}
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
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#ee0033] bg-white font-sans resize-none"
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
                    className="mt-0.5 rounded-xs border-slate-300 w-4 h-4 cursor-pointer flex-shrink-0"
                    style={{ accentColor: effectiveThemeColor }}
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

              {/* Primary Action Button (Bấm vào kết nối 1-chạm đồng bộ theo Theme Color) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || Boolean(portalData?.capacityReached)}
                  className={`w-full py-4 px-4 rounded-xl text-white font-black text-sm sm:text-base tracking-wider uppercase transition flex items-center justify-center gap-2.5 shadow-xl ${
                    portalData?.capacityReached
                      ? 'bg-slate-400 cursor-not-allowed opacity-80'
                      : 'hover:brightness-110 active:scale-[0.99] cursor-pointer'
                  }`}
                  style={
                    !portalData?.capacityReached
                      ? {
                          background: `linear-gradient(135deg, ${effectiveThemeColor} 0%, ${themeDark} 100%)`,
                          boxShadow: `0 12px 24px -6px ${themeShadow}`,
                        }
                      : undefined
                  }
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
                      <Wifi className="w-5 h-5 text-yellow-300 animate-pulse" />
                      <span>{template?.buttonText || 'KẾT NỐI WI-FI VIETTEL MIỄN PHÍ'}</span>
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-2 text-[10.5px] text-slate-500 font-medium">
                  <span className="font-bold" style={{ color: effectiveThemeColor }}>Viettel 5G Fiber</span>
                  <span>•</span>
                  <span>Băng thông: <strong className="text-slate-700">{portalData?.location.maxBandwidthMbps || 20} Mbps</strong></span>
                  <span>•</span>
                  <span>Thời lượng: <strong className="text-slate-700">{portalData?.location.sessionDurationMinutes || 120} phút</strong></span>
                </div>
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
                          <Smartphone className="w-3.5 h-3.5" style={{ color: effectiveThemeColor }} /> Xác thực SĐT (Nhớ thiết bị 30 ngày):
                        </span>
                        {!otpSent ? (
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="Nhập số điện thoại"
                              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={submitting || isPreviewMode}
                              className="px-3.5 py-1.5 text-white rounded text-xs font-semibold transition hover:brightness-110 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              style={{ backgroundColor: effectiveThemeColor }}
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
                                className="px-3.5 py-1.5 text-white rounded text-xs font-semibold transition hover:brightness-110"
                                style={{ backgroundColor: effectiveThemeColor }}
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
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#ee0033]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Viettel Telecom Brand & Support Footer */}
            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/70 border border-red-200/80">
                <div className="flex items-center gap-2">
                  <ViettelLogo height={16} variant="simple" color="red" showTagline={false} />
                  <span className="font-semibold text-slate-700">Hỗ trợ kỹ thuật Viettel:</span>
                </div>
                <a href="tel:18008119" className="font-mono font-black text-[#ee0033] text-xs hover:underline">
                  1800 8119 (Miễn phí 24/7)
                </a>
              </div>
              <div className="flex items-center justify-between px-1 text-[10.5px]">
                <span className="text-slate-500">Tổng đài DVC: <strong className="text-slate-700">0225.1022</strong></span>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-1 text-[10.5px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer underline decoration-amber-400/80"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Báo sự cố Wi-Fi</span>
                </button>
              </div>
            </div>
          </form>

       
        </div>

      </div>

      {/* Floating "Báo lỗi Wi-Fi" Button (Hidden inside embedded studio preview) */}
      {!isEmbeddedPreview && (
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
      )}

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
          onConnectToWatchVideo={isPreviewMode ? undefined : handleConnectAndWatchVideo}
          isConnectingWifi={submitting}
        />
      )}
    </div>
  );
};
