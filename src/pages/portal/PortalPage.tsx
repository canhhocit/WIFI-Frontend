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
  Info,
  Lock,
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
      setError('Vui lòng đánh dấu đồng ý với Quy chế sử dụng mạng để tiếp tục.');
      return;
    }

    if (portalData.otpRequired && !otpVerified && !portalData.macRemembered) {
      setError('Vui lòng xác thực số điện thoại qua OTP trước khi truy cập mạng.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessInfo(null);

    try {
      // If survey answers exist, submit survey in parallel
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

      navigate(`/portal/status/${session.sessionToken}`);
    } catch (err: any) {
      setError(err?.message || 'Xác thực truy cập không thành công. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 rounded-xl bg-red-700 text-yellow-300 font-bold flex items-center justify-center text-xl shadow-lg mb-4">
          ★
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
        <p className="text-xs text-slate-300 font-medium">Đang kết nối cổng dịch vụ Wi-Fi Nhà văn hóa...</p>
      </div>
    );
  }

  if (error && !portalData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-300 text-center max-w-sm w-full shadow-md">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Wifi className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Không thể tải Cổng Wi-Fi</h2>
          <p className="text-xs text-slate-600 mb-4">{error}</p>
          <button
            onClick={loadPortal}
            className="w-full py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Thử lại kết nối
          </button>
        </div>
      </div>
    );
  }

  const campaign = portalData?.activeCampaign;
  const survey = portalData?.activeSurvey;

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col items-center justify-center p-3 sm:p-5 text-slate-900">
      <div className="bg-white rounded-xl border border-slate-250 shadow-md max-w-md w-full overflow-hidden">
        {/* Official Header */}
        <div className="bg-red-800 text-white text-center p-4 pt-5 border-b border-red-900 relative">
          <div className="text-[10px] font-bold tracking-widest text-yellow-300 uppercase">
            Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
          </div>
          <div className="text-[10px] text-red-100 italic">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="h-px w-20 bg-yellow-400/50 mx-auto my-2" />
          <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">
            Ủy Ban Nhân Dân Thành Phố Hải Phòng
          </div>
          <h1 className="text-sm font-extrabold tracking-tight mt-0.5 uppercase">
            Cổng Truy Cập Wi-Fi Nhà Văn Hóa Cơ Sở
          </h1>
        </div>

        {/* Location & Speed Meta Strip */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5 font-semibold truncate mr-2">
            <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
            <span className="truncate">{portalData?.location.name || 'Nhà văn hóa Hải Phòng'}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px] text-slate-500">
            <span>{portalData?.location.sessionDurationMinutes || 120}p</span>
            <span>•</span>
            <span>{portalData?.location.maxBandwidthMbps || 20} Mbps</span>
          </div>
        </div>

        {/* Media Campaign / Government Notice */}
        {campaign && (
          <div className="border-b border-slate-200 bg-amber-50/50 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 uppercase tracking-wider">
              <Megaphone className="w-3 h-3 text-amber-700" /> Tuyên Truyền Chính Sách Số
            </div>
            {campaign.bannerUrl && (
              <div className="rounded-lg overflow-hidden border border-amber-200 max-h-32 bg-white">
                <img src={campaign.bannerUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-xs font-bold text-slate-900">{campaign.title}</div>
            {campaign.description && (
              <p className="text-[11px] text-slate-600 leading-relaxed">{campaign.description}</p>
            )}
            {campaign.actionUrl && (
              <a
                href={campaign.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded text-[10px] font-bold hover:bg-amber-100 transition shadow-xs"
              >
                <span>Xem Cổng DVC Hải Phòng</span>
                <ExternalLink className="w-3 h-3 text-amber-700" />
              </a>
            )}
          </div>
        )}

        {/* Portal Connect Form */}
        <form onSubmit={handleConnect} className="p-5 space-y-4 text-xs">
          {error && <AlertBanner type="error" message={error} />}
          {successInfo && <AlertBanner type="success" message={successInfo} />}

          {/* OTP Section */}
          {portalData?.macRemembered || otpVerified ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800 text-[11px]">
              <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <div>
                <span className="font-bold">Thiết bị đã xác thực bảo mật (Ghi nhớ 30 ngày).</span>
                <span className="block text-[10px] text-emerald-600">
                  Không cần nhập lại mã OTP cho các lần kết nối tiếp theo.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-700" /> Xác thực số điện thoại
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  SMS Brandname
                </span>
              </div>

              {!otpSent ? (
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Nhập SĐT (VD: 0912345678)"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={submitting}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Gửi mã
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
                      placeholder="Nhập 6 số OTP"
                      className="flex-1 px-3 py-2 text-xs font-mono tracking-widest text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={submitting}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      Xác nhận
                    </button>
                  </div>
                  {otpHint && (
                    <div className="text-[10px] font-mono text-blue-900 bg-blue-50 p-1.5 rounded border border-blue-200">
                      Mã thử nghiệm mô phỏng: <strong>{otpHint}</strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Mã OTP hết hạn sau 5 phút</span>
                    {otpTimer > 0 ? (
                      <span>Gửi lại sau {otpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-blue-700 font-semibold hover:underline cursor-pointer"
                      >
                        Gửi lại mã
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Smart Citizen Survey */}
          {survey && survey.questions && survey.questions.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-700" /> {survey.title}
                </span>
                <span className="text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                  Lấy ý kiến
                </span>
              </div>

              {survey.questions.map((q) => {
                let options: string[] = [];
                try {
                  if (q.optionsJson) options = JSON.parse(q.optionsJson);
                } catch (_) {}

                return (
                  <div key={q.id} className="p-2 bg-white rounded border border-slate-200 space-y-1">
                    <p className="font-medium text-slate-800 text-[11px]">{q.questionText}</p>
                    {options.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1">
                        {options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() =>
                              setSurveyAnswers({ ...surveyAnswers, [q.id?.toString() || oIdx]: opt })
                            }
                            className={`px-2 py-1 rounded text-[10px] border text-left transition cursor-pointer ${
                              surveyAnswers[q.id?.toString() || oIdx] === opt
                                ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Nhập ý kiến..."
                        value={surveyAnswers[q.id?.toString() || ''] || ''}
                        onChange={(e) =>
                          setSurveyAnswers({ ...surveyAnswers, [q.id?.toString() || '']: e.target.value })
                        }
                        className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Citizen Name (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Họ tên công dân <span className="text-slate-400 font-normal lowercase">(không bắt buộc)</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="vd: Nguyễn Văn A"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Legal Compliance Box */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Căn cứ pháp lý & Bảo vệ dữ liệu cá nhân</span>
            </div>
            <p className="leading-relaxed text-slate-500">
              Mạng Wi-Fi công cộng tuân thủ Luật An ninh mạng & Nghị định 13/2023/NĐ-CP. Nghiêm cấm sử dụng mạng cho các mục đích vi phạm pháp luật, phát tán nội dung xấu độc hoặc cờ bạc trực tuyến.
            </p>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-slate-700 pt-0.5">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600 w-4 h-4 cursor-pointer"
            />
            <span className="leading-relaxed">
              Tôi cam kết tuân thủ Quy chế sử dụng mạng Wi-Fi công cộng Thành phố Hải Phòng.
            </span>
          </label>

          {/* Connect Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-lg text-white font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-sm bg-red-700 hover:bg-red-800 active:bg-red-900 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang cấp quyền truy cập Internet...</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>Bắt Đầu Kết Nối Wi-Fi Miễn Phí</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-0.5">
          <div className="font-semibold text-slate-700">Sở Thông tin và Truyền thông Thành phố Hải Phòng</div>
          <div>Hạ tầng viễn thông phối hợp vận hành cùng VNPT Hải Phòng • Hỗ trợ: 1800 1166</div>
        </div>
      </div>
    </div>
  );
};
