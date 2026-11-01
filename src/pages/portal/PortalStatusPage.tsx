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
} from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { GuestSessionStatusResponse } from '../../types/models';

export const PortalStatusPage: React.FC = () => {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<GuestSessionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

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
        <div className="w-12 h-12 rounded-xs bg-[#a81c1c] text-yellow-300 font-bold flex items-center justify-center text-xl shadow-lg mb-4 border border-yellow-400/30">
          ★
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
        <p className="text-xs text-slate-300 font-medium">Đang xác minh phiên mạng và mở Cổng Dịch vụ công...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 rounded border border-slate-300 text-center max-w-sm w-full shadow-sm">
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
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-slate-900 font-sans">
        <div className="bg-white rounded border border-slate-300 shadow-sm max-w-sm w-full overflow-hidden">
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
                Điểm phát sóng: <strong>{session?.locationName || 'Nhà văn hóa Hải Phòng'}</strong>
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
            <div className="w-7 h-7 aspect-square rounded-xs bg-[#a81c1c] text-yellow-300 font-bold flex items-center justify-center text-xs border border-amber-300/40 shadow-xs flex-shrink-0">
              ★
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest leading-none">
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

      {/* 3. Main Embedded Public Administration Page View */}
      <main className="flex-1 relative flex flex-col w-full bg-slate-100">
        {/* Iframe Loading Overlay */}
        {iframeLoading && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#004b87]" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-800">
                Đang nạp Cổng Dịch vụ công trực tuyến Thành phố Hải Phòng...
              </h2>
              <p className="text-xs text-slate-500">
                Địa chỉ truy cập: <span className="font-mono text-[#004b87]">https://dichvucong.haiphong.gov.vn</span>
              </p>
            </div>
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          src="https://dichvucong.haiphong.gov.vn/"
          title="Cổng Dịch vụ công Thành phố Hải Phòng"
          className="w-full flex-1 border-none min-h-[calc(100vh-80px)] bg-white"
          onLoad={() => setIframeLoading(false)}
          onError={() => {
            setIframeLoading(false);
            setIframeError(true);
          }}
        />

        {/* Fallback Banner for restricted browsers */}
        {iframeError && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 text-center text-xs text-amber-800 space-y-2">
            <p>Trình duyệt của bạn có cài đặt bảo mật chặn hiển thị trang lồng khung.</p>
            <a
              href="https://dichvucong.haiphong.gov.vn"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-bold transition shadow-xs"
            >
              <span>Truy cập Cổng Dịch vụ công TP. Hải Phòng (Toàn màn hình)</span>
              <ExternalLink className="w-4 h-4 text-blue-200" />
            </a>
          </div>
        )}
      </main>
    </div>
  );
};
