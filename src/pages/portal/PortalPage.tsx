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
  KeyRound,
  ClipboardList,
  Check,
  Send,
  Sparkles
} from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { PortalInitResponse, SurveyQuestionDto } from '../../types/models';
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

  const loadPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalApi.init(locationParam);
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
      setError('Vui lòng đánh dấu đồng ý với Điều khoản để tiếp tục.');
      return;
    }

    // If OTP is required and not yet verified or remembered
    if (portalData.otpRequired && !otpVerified && !portalData.macRemembered) {
      setError('Vui lòng xác thực số điện thoại qua OTP trước khi truy cập mạng.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // If active survey present and not submitted yet, submit survey answers
      if (portalData.activeSurvey && !surveySubmitted && Object.keys(surveyAnswers).length > 0) {
        try {
          await portalApi.submitSurvey(portalData.activeSurvey.id, {
            locationId: portalData.location.id,
            clientMac: macAddress || portalData.clientMacHint,
            answers: surveyAnswers,
          });
          setSurveySubmitted(true);
        } catch (_) {
          // Non-blocking survey submission
        }
      }

      const resp = await portalApi.login({
        locationSlug: portalData.location.slug,
        macAddress: macAddress || portalData.clientMacHint,
        guestName: guestName.trim() || undefined,
        guestContact: phoneNumber.trim() || undefined,
        consentGiven: true,
      });

      if (resp.status === 'AUTHORIZED') {
        // Trigger gateway physical unblock hook if running under MyPublicWiFi
        try {
          fetch(`http://${window.location.hostname}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: '_action=TOCLogin',
            mode: 'no-cors',
          }).catch(() => {});
        } catch (_) {}

        navigate(`/portal/status/${resp.sessionToken}`);
      } else {
        setError(resp.message || 'Cổng chuyển tiếp chưa cấp quyền truy cập. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err?.message || 'Kết nối mạng thất bại. Vui lòng kiểm tra lại thiết bị.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-xs w-full shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang tải cổng chào Wi-Fi...</p>
        </div>
      </div>
    );
  }

  if (error && !portalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-sm w-full shadow-sm">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wifi className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Không thể tải Cổng Wi-Fi</h2>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={loadPortal}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const tmpl = portalData?.portalTemplate;
  const themeColor = tmpl?.themeColor || '#0284c7';
  const bgColor = tmpl?.backgroundColor || '#f8fafc';
  const campaign = portalData?.activeCampaign;
  const survey = portalData?.activeSurvey;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl max-w-md w-full overflow-hidden">
        {/* Dynamic Header */}
        <div className="p-6 pb-4 border-b border-slate-100 text-center relative">
          {tmpl?.logoUrl ? (
            <img src={tmpl.logoUrl} alt="Logo" className="h-12 mx-auto mb-3 object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-md font-bold text-lg"
              style={{ backgroundColor: themeColor }}
            >
              <Wifi className="w-6 h-6" />
            </div>
          )}

          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-snug">
            {tmpl?.title || 'Cổng Thông Tin Wi-Fi Nhà Văn Hóa'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {tmpl?.welcomeText || portalData?.location.welcomeMessage || 'Chào mừng quý khách đến với mạng Wi-Fi công cộng'}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600">
            {portalData?.location.name && (
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg font-medium text-slate-700">
                <MapPin className="w-3 h-3 text-slate-500" />
                {portalData.location.name}
              </span>
            )}
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
              Phiên: <strong>{portalData?.location.sessionDurationMinutes || 120} phút</strong>
            </span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
              Tốc độ: <strong>{portalData?.location.maxBandwidthMbps || 20} Mbps</strong>
            </span>
          </div>
        </div>

        {/* Active Policy / Media Campaign Banner */}
        {campaign && (
          <div className="border-b border-slate-100 bg-amber-50/60 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5 text-amber-600" /> Bản Tin & Tuyên Truyền Chính Sách Số
            </div>
            {campaign.bannerUrl && (
              <div className="rounded-xl overflow-hidden border border-amber-200/60 shadow-xs max-h-36 bg-white">
                <img src={campaign.bannerUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="text-xs font-bold text-slate-900">{campaign.title}</h3>
            {campaign.description && (
              <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">{campaign.description}</p>
            )}
            {campaign.actionUrl && (
              <a
                href={campaign.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition shadow-xs"
              >
                <span>Xem chi tiết cổng dịch vụ</span>
                <ExternalLink className="w-3 h-3 text-amber-600" />
              </a>
            )}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleConnect} className="p-5 space-y-4 text-xs">
          {error && <AlertBanner type="error" message={error} />}
          {successInfo && <AlertBanner type="success" message={successInfo} />}

          {/* Device & MAC Network Info */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Địa chỉ IP:</span>
              <span className="font-mono text-slate-800 font-semibold">{portalData?.clientIp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Địa chỉ MAC:</span>
              <span className="font-mono text-slate-800 font-semibold">{macAddress || portalData?.clientMacHint}</span>
            </div>
          </div>

          {/* OTP / 30-Day Remember Section (Screen B02, B03) */}
          {portalData?.macRemembered || otpVerified ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-[11px] font-semibold">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span>Thiết bị của bạn đã được xác thực an toàn (Ghi nhớ đăng nhập 30 ngày).</span>
                <span className="block text-[10px] text-emerald-600 font-normal mt-0.5">
                  Không cần nhập lại mã OTP cho các lần kết nối tiếp theo.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-600" /> Xác Thực Số Điện Thoại (OTP)
                </span>
                <span className="text-[10px] text-slate-400">Quy định TP Hải Phòng</span>
              </div>

              {!otpSent ? (
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={submitting}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Gửi OTP
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Nhập mã 6 chữ số"
                      className="flex-1 px-3 py-2 text-xs font-mono tracking-widest text-center bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={submitting}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      Xác thực
                    </button>
                  </div>
                  {otpHint && (
                    <div className="text-[10px] font-mono text-sky-700 bg-sky-50 p-1.5 rounded-lg border border-sky-100">
                      💡 Mã xác thực mô phỏng dùng thử nghiệm: <strong>{otpHint}</strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Mã có hiệu lực trong 5 phút</span>
                    {otpTimer > 0 ? (
                      <span>Gửi lại sau {otpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-sky-600 font-bold hover:underline cursor-pointer"
                      >
                        Gửi lại mã mới
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Smart Survey Section (Screen B06, B07) */}
          {survey && survey.questions && survey.questions.length > 0 && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-purple-600" /> {survey.title}
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  Khảo sát nhanh
                </span>
              </div>

              {survey.questions.map((q) => {
                let options: string[] = [];
                try {
                  if (q.optionsJson) options = JSON.parse(q.optionsJson);
                } catch (_) {}

                return (
                  <div key={q.id} className="p-2.5 bg-white rounded-lg border border-purple-100 space-y-1.5">
                    <p className="font-semibold text-slate-800 text-[11px]">{q.questionText}</p>
                    {options.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() =>
                              setSurveyAnswers({ ...surveyAnswers, [q.id?.toString() || oIdx]: opt })
                            }
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border text-left transition cursor-pointer ${
                              surveyAnswers[q.id?.toString() || oIdx] === opt
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Nhập ý kiến của bạn..."
                        value={surveyAnswers[q.id?.toString() || ''] || ''}
                        onChange={(e) =>
                          setSurveyAnswers({ ...surveyAnswers, [q.id?.toString() || '']: e.target.value })
                        }
                        className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Guest Name (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Họ tên công dân / Tên thiết bị <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
            />
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] text-slate-600 pt-1">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
            />
            <span className="leading-relaxed">
              Tôi cam kết tuân thủ quy tắc ứng xử trên không gian mạng và Quy định sử dụng Wi-Fi công cộng TP Hải Phòng.
            </span>
          </label>

          {/* Connect Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/20 disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối vào mạng Wi-Fi...</span>
              </>
            ) : (
              <span>{tmpl?.buttonText || 'Bắt Đầu Kết Nối Wi-Fi'}</span>
            )}
          </button>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Hệ thống Quản lý Wi-Fi Công cộng TP. Hải Phòng • 1.584 Điểm phát
        </div>
      </div>
    </div>
  );
};