import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Wifi,
  Clock,
  LogOut,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Search,
  FileText,
  CreditCard,
  Building,
  RefreshCw,
  Globe,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  MapPin,
  Sparkles,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { GuestSessionStatusResponse } from '../../types/models';
import { VietnamFlag } from '../../components/VietnamFlag';

export const PortalStatusPage: React.FC = () => {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<GuestSessionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (sessionToken) {
      loadStatus();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionToken]);

  useEffect(() => {
    if (session?.status === 'AUTHORIZED' && session.remainingSeconds > 0) {
      setRemainingSec(session.remainingSeconds);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setRemainingSec((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            loadStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setRemainingSec(0);
    }
  }, [session]);

  const loadStatus = async () => {
    if (!sessionToken) return;
    try {
      const data = await portalApi.getSessionStatus(sessionToken);
      setSession(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không tìm thấy thông tin phiên kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!sessionToken) return;
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối Wi-Fi?')) return;

    setDisconnecting(true);
    try {
      const updated = await portalApi.disconnectSession(sessionToken);
      setSession(updated);
    } catch (err: any) {
      setError(err?.message || 'Không thể ngắt kết nối.');
    } finally {
      setDisconnecting(false);
    }
  };

  const formatRemainingTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="relative mb-4 flex items-center justify-center">
          <VietnamFlag width={66} height={44} className="rounded-sm shadow-xl border border-yellow-400/50" animate />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
        <p className="text-xs text-slate-300 font-medium">Đang xác minh phiên mạng và mở Cổng Dịch vụ công...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 font-sans">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/banners/haiphong_city_bg.jpg')" }}
        />
        <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[2px]" />
        <div className="relative z-10 bg-white p-6 rounded-lg border border-slate-300 text-center max-w-sm w-full shadow-2xl">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy phiên</h2>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/portal')}
            className="w-full py-2 px-3 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-semibold transition cursor-pointer"
          >
            Quay lại cổng Wi-Fi
          </button>
        </div>
      </div>
    );
  }

  const isAuthorized = session?.status === 'AUTHORIZED';

  // If session is disconnected or expired, show status summary card
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 text-slate-900 font-sans">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/banners/haiphong_city_bg.jpg')" }}
        />
        <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 backdrop-blur-[2px]" />
        <div className="relative z-10 bg-white rounded-lg border border-slate-300 shadow-2xl max-w-sm w-full overflow-hidden">
          <div className="h-1 bg-[#a81c1c] w-full" />
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-yellow-600 uppercase tracking-wider">
                UBND THÀNH PHỐ HẢI PHÒNG
              </div>
              <h1 className="text-base font-extrabold text-slate-900 mt-1">
                {session?.status === 'EXPIRED' ? 'Phiên Wi-Fi Đã Hết Thời Gian' : 'Đã Ngắt Kết Nối Wi-Fi'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Điểm phát sóng: <strong>{session?.locationName || 'Wifi công cộng Hải Phòng'}</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 font-mono text-left space-y-1">
              <div className="flex justify-between">
                <span>Địa chỉ IP:</span>
                <span className="font-bold text-slate-800">{session?.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>Địa chỉ MAC:</span>
                <span className="font-bold text-slate-800">{session?.macAddress}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/portal')}
              className="w-full py-2.5 px-4 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Kết nối lại Wi-Fi Nhà văn hóa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">
      {/* 1. Official Sticky Telemetry Status Bar */}
      <header className="sticky top-0 z-50 bg-[#0c2340] text-white border-b border-[#18365a] shadow-md px-3 sm:px-6 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Emblem and Live Network Status */}
          <div className="flex items-center gap-2.5">
            <VietnamFlag width={33} height={22} className="rounded-xs shadow-xs border border-amber-300/40 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider leading-none">
                  UBND TP. HẢI PHÒNG
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đã kết nối Wi-Fi
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate max-w-[220px] sm:max-w-md mt-0.5">
                {session.locationName || 'Nhà văn hóa thôn, tổ dân phố Hải Phòng'}
              </div>
            </div>
          </div>

          {/* Right: Real-time countdown & Quick actions */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Countdown Badge */}
            <div className="flex items-center gap-1.5 bg-[#13355e] border border-[#234c82] px-2.5 py-1 rounded-xs font-mono text-[11px] text-emerald-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatRemainingTime(remainingSec)}</span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">• 20 Mbps</span>
            </div>

            {/* Open Fullscreen in New Tab */}
            <a
              href="https://dichvucong.haiphong.gov.vn"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#004b87] hover:bg-[#003865] text-white rounded-xs text-[11px] font-semibold border border-blue-400/30 transition shadow-2xs"
              title="Mở Cổng DVC trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Mở tab riêng</span>
            </a>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-red-300 hover:bg-[#18365a] rounded-xs border border-slate-600/40 transition cursor-pointer"
              title="Ngắt kết nối Wi-Fi"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              <span className="hidden md:inline">Ngắt Wi-Fi</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Quick Administrative Action Ribbon (Lối tắt Dịch vụ công thiết yếu) */}
      <nav className="bg-[#091a30] text-slate-300 border-b border-[#18365a] px-3 sm:px-6 py-1.5 overflow-x-auto custom-scrollbar flex items-center justify-between text-[11px] gap-3">
        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0 text-[10.5px]">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wide">Cổng Dịch vụ công Hải Phòng:</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
          <a
            href="https://dichvucong.haiphong.gov.vn/dichvucong/tracuu"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded-xs bg-[#13355e] hover:bg-[#1c4578] text-blue-100 border border-blue-400/20 flex items-center gap-1 transition"
          >
            <Search className="w-3 h-3 text-yellow-300" />
            <span>Tra cứu hồ sơ</span>
          </a>

          <a
            href="https://dichvucong.haiphong.gov.vn/dichvucong/dichvu"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded-xs bg-[#13355e] hover:bg-[#1c4578] text-blue-100 border border-blue-400/20 flex items-center gap-1 transition"
          >
            <FileText className="w-3 h-3 text-blue-300" />
            <span>Nộp hồ sơ trực tuyến</span>
          </a>

          <a
            href="https://dichvucong.dancuquocgia.gov.vn/"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded-xs bg-[#13355e] hover:bg-[#1c4578] text-blue-100 border border-blue-400/20 flex items-center gap-1 transition hidden sm:flex"
          >
            <Building className="w-3 h-3 text-emerald-300" />
            <span>Cư trú & Hộ tịch</span>
          </a>

          <a
            href="https://dichvucong.haiphong.gov.vn/dichvucong/thanhtoan"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded-xs bg-[#13355e] hover:bg-[#1c4578] text-blue-100 border border-blue-400/20 flex items-center gap-1 transition hidden md:flex"
          >
            <CreditCard className="w-3 h-3 text-amber-300" />
            <span>Thanh toán trực tuyến</span>
          </a>
        </div>
      </nav>

      {/* 3. Main Post-Connection GovTech Citizen Hub */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Success & Session Telemetry Card */}
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-[#004b87] to-blue-600" />
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide uppercase mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đã cấp quyền truy cập Internet thành công
                  </div>
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    Chào mừng Nhân dân đến với Wi-Fi Công cộng TP. Hải Phòng
                  </h1>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#a81c1c] flex-shrink-0" />
                    <span>Điểm phát sóng: <strong>{session.locationName || 'Nhà văn hóa thôn, tổ dân phố Hải Phòng'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Countdown & Speed pill */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded border sm:border-0 border-slate-200">
                <div className="text-left sm:text-right">
                  <span className="text-[10.5px] font-medium text-slate-400 block">Thời gian phiên mạng còn:</span>
                  <span className="text-base sm:text-lg font-mono font-extrabold text-[#004b87]">
                    {formatRemainingTime(remainingSec)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {session.maxBandwidthMbps || 20} Mbps
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                <span>IP: <strong className="text-slate-700">{session.ipAddress}</strong></span>
                <span>•</span>
                <span>MAC: <strong className="text-slate-700">{session.macAddress}</strong></span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://dichvucong.haiphong.gov.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-yellow-300" />
                  <span>Mở Cổng Dịch Vụ Công Hải Phòng</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                </a>

              </div>
            </div>
          </div>
        </div>

        {/* Active City Campaign Highlight (Chiến dịch Truyền thông TP đang phát sóng) */}
        {session.activeCampaign && (
          <div className="bg-gradient-to-r from-red-950 via-[#7a1212] to-[#0c2340] rounded-lg border border-red-700/80 text-white shadow-md overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {session.activeCampaign.bannerUrl && (
                <div className="md:w-5/12 relative min-h-[170px] md:min-h-full bg-slate-950 overflow-hidden flex-shrink-0">
                  <img
                    src={session.activeCampaign.bannerUrl}
                    alt={session.activeCampaign.title}
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/banners/haiphong_city_bg.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-800 text-yellow-300 border border-yellow-400/40">
                      Áp phích chính sách số
                    </span>
                  </div>
                </div>
              )}
              <div className="p-5 md:p-6 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-400 text-slate-950 text-[10.5px] font-extrabold uppercase tracking-wider">
                    <Megaphone className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
                    <span>Chiến Dịch Tuyên Truyền TP. Hải Phòng Đang Phát Sóng</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug">
                    {session.activeCampaign.title}
                  </h2>
                  {session.activeCampaign.description && (
                    <p className="text-xs text-red-100 leading-relaxed font-sans">
                      {session.activeCampaign.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {session.activeCampaign.actionUrl ? (
                    <a
                      href={session.activeCampaign.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded text-xs font-black transition shadow-sm cursor-pointer uppercase tracking-wide"
                    >
                      <span>Xem Toàn Văn Kế Hoạch & Chính Sách</span>
                      <ExternalLink className="w-4 h-4 text-slate-900" />
                    </a>
                  ) : (
                    <a
                      href="https://haiphong.gov.vn"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded text-xs font-black transition shadow-sm cursor-pointer uppercase tracking-wide"
                    >
                      <span>Cổng Thông Tin TP. Hải Phòng</span>
                      <ExternalLink className="w-4 h-4 text-slate-900" />
                    </a>
                  )}
                  <span className="text-[11px] text-red-200 italic font-sans">
                    * Ban Tuyên giáo & UBND TP. Hải Phòng chỉ đạo phát sóng trên toàn mạng Wi-Fi.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Public Administrative Services Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#a81c1c]" />
                Dịch Vụ Công Trực Tuyến & Tiện Ích Số Hải Phòng
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bà con có thể thực hiện thủ tục hành chính, tra cứu hồ sơ hoàn toàn miễn phí tại Nhà văn hóa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Tra cứu hồ sơ */}
            <a
              href="https://dichvucong.haiphong.gov.vn/dichvucong/tracuu"
              target="_blank"
              rel="noreferrer"
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-blue-50 text-[#004b87] flex items-center justify-center group-hover:scale-105 transition">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#004b87] transition flex items-center justify-between">
                  <span>Tra Cứu Tiến Độ Hồ Sơ</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#004b87]" />
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  Nhập mã số biên nhận Một cửa điện tử để theo dõi tiến độ xử lý thủ tục hành chính mọi lúc.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#004b87] mt-3 pt-2 border-t border-slate-100">
                Tra cứu ngay <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </a>

            {/* 2. Nộp hồ sơ trực tuyến */}
            <a
              href="https://dichvucong.haiphong.gov.vn/dichvucong/dichvu"
              target="_blank"
              rel="noreferrer"
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition flex items-center justify-between">
                  <span>Nộp Hồ Sơ Trực Tuyến</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-700" />
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  Hơn 1.800 dịch vụ công toàn trình cấp Tỉnh, Huyện, Xã. Nộp hồ sơ tại nhà không cần xếp hàng.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 mt-3 pt-2 border-t border-slate-100">
                Xem danh mục DVC <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </a>

            {/* 3. Cư trú & VNeID */}
            <a
              href="https://dichvucong.dancuquocgia.gov.vn/"
              target="_blank"
              rel="noreferrer"
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
                  <span>Cư Trú & Hộ Tịch (VNeID)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  Đăng ký thường trú, tạm trú, thông báo lưu trú, khai sinh và cấp căn cước công dân trực tuyến.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-3 pt-2 border-t border-slate-100">
                Cổng Dân cư Quốc gia <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </a>

            {/* 4. Thanh toán trực tuyến */}
            <a
              href="https://dichvucong.haiphong.gov.vn/dichvucong/thanhtoan"
              target="_blank"
              rel="noreferrer"
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition flex items-center justify-between">
                  <span>Thanh Toán Lệ Phí Trực Tuyến</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-700" />
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  Thanh toán phí/lệ phí TTHC, thuế đất, biên lai điện tử qua ngân hàng và ví điện tử không tiền mặt.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-3 pt-2 border-t border-slate-100">
                Cổng Thanh toán DVC <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </div>
        </div>

        {/* Policy Awareness & Digital Citizen Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Box 1: Digital Transformation Guideline */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#a81c1c] uppercase">
              <Megaphone className="w-4 h-4 text-[#a81c1c] flex-shrink-0" />
              <span>Hướng Dẫn Chuyển Đổi Số Cơ Sở</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Tổ công nghệ số cộng đồng và Đoàn Thanh niên luôn túc trực tại Nhà văn hóa để hướng dẫn bà con:
            </p>
            <ul className="text-[11.5px] text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Kích hoạt tài khoản định danh điện tử mức độ 2 trên ứng dụng <strong>VNeID</strong>.</li>
              <li>Cài đặt ứng dụng <strong>Hải Phòng Smart</strong> để phản ánh hiện trường và nhận cảnh báo đô thị.</li>
              <li>Tạo chữ ký số cá nhân miễn phí phục vụ ký số hồ sơ hành chính công trực tuyến.</li>
            </ul>
          </div>

          {/* Box 2: Cyber Safety & Hotlines */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#004b87] uppercase">
              <HelpCircle className="w-4 h-4 text-[#004b87] flex-shrink-0" />
              <span>Đường Dây Nóng Hỗ Trợ Kỹ Thuật & TTHC</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-semibold text-slate-800">Tổng đài Dịch vụ công TP. Hải Phòng:</span>
                <span className="font-mono font-bold text-[#004b87]">0225.1022</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-semibold text-slate-800">Hỗ trợ kỹ thuật mạng Wi-Fi (VNPT Hải Phòng):</span>
                <span className="font-mono font-bold text-emerald-700">1800.1166</span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Mạng Wi-Fi công cộng tuân thủ các quy tắc an toàn thông tin theo Nghị định 13/2023/NĐ-CP của Chính phủ.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-center py-4 px-3 text-[11px] border-t border-slate-800 space-y-1">
        <div className="font-semibold text-slate-200">
          ỦY BAN NHÂN DÂN THÀNH PHỐ HẢI PHÒNG • SỞ THÔNG TIN VÀ TRUYỀN THÔNG
        </div>
        
      </footer>
    </div>
  );
};
