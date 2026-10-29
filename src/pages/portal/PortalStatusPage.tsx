import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, Clock, LogOut, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { portalApi } from '../../api/portalApi';
import { GuestSessionStatusResponse } from '../../types/models';
import { StatusBadge } from '../../components/Badge';

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
            // Trigger physical gateway lock if running under MyPublicWiFi
            try {
              fetch(`http://${window.location.hostname}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: '_action=TOCLogout',
                mode: 'no-cors',
              }).catch(() => {});
            } catch (_) {}
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
    if (!window.confirm('Bạn có muốn ngắt kết nối Wi-Fi?')) return;

    setDisconnecting(true);
    try {
      // Trigger underlying gateway physical lock
      try {
        fetch(`http://${window.location.hostname}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: '_action=TOCLogout',
          mode: 'no-cors',
        }).catch(() => {});
      } catch (_) {}
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-xs w-full shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-slate-800 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang kiểm tra kết nối...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-sm w-full shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Không tìm thấy phiên</h2>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/portal')}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
          >
            Quay lại cổng Wi-Fi
          </button>
        </div>
      </div>
    );
  }

  const isAuthorized = session?.status === 'AUTHORIZED';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50/25 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 max-w-sm w-full overflow-hidden">
        {/* Subtle Government Ribbon Line */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-amber-400 to-blue-700 w-full" />

        {/* Status Header */}
        <div className="p-6 pb-5 border-b border-slate-100 text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border ${
            isAuthorized 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs' 
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {isAuthorized ? <CheckCircle2 className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
          </div>
          <div className="text-[10px] font-bold tracking-widest text-blue-900 uppercase">
            UBND THÀNH PHỐ HẢI PHÒNG
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-slate-900 mt-0.5">
            {isAuthorized ? 'Đã Kết Nối Internet Thành Công' : 'Đã Ngắt Kết Nối Mạng'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Mạng Wi-Fi Nhà văn hóa cơ sở</p>
          
          <div className="mt-3 flex justify-center">
            <StatusBadge status={session?.status || 'PENDING'} size="sm" />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Active Countdown Card */}
          {isAuthorized ? (
            <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Thời gian truy cập còn lại
              </span>
              <div className="font-mono text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatRemainingTime(remainingSec)}
              </div>
              <div className="text-[10.5px] text-emerald-700 font-medium mt-1">
                Tốc độ tối đa: {session?.maxBandwidthMbps || 15} Mbps
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-center">
              <span className="text-xs font-semibold text-amber-800 block">
                {session?.status === 'EXPIRED' ? 'Phiên truy cập đã hết thời lượng' : 'Đã ngắt kết nối Wi-Fi'}
              </span>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                Vui lòng bấm nút bên dưới để kết nối lại và tiếp tục sử dụng mạng.
              </p>
            </div>
          )}

          {/* Real Session Metadata */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5 font-mono">
            <div className="flex justify-between items-center font-sans">
              <span className="text-slate-400">Địa chỉ IP:</span>
              <span className="font-mono text-slate-800 font-semibold">{session?.ipAddress}</span>
            </div>
            <div className="flex justify-between items-center font-sans">
              <span className="text-slate-400">Địa chỉ MAC:</span>
              <span className="font-mono text-slate-800 font-semibold">{session?.macAddress}</span>
            </div>
            <div className="flex justify-between items-center font-sans">
              <span className="text-slate-400">Mã phiên:</span>
              <span className="font-mono text-slate-700 text-[10px] truncate max-w-[150px]">{session?.sessionToken}</span>
            </div>
          </div>

          {/* Action buttons */}
          {isAuthorized ? (
            <div className="space-y-2">
              <a
                href="https://dichvucong.haiphong.gov.vn"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Cổng Dịch vụ công TP. Hải Phòng</span>
              </a>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                {disconnecting ? 'Đang ngắt kết nối...' : 'Ngắt kết nối Wi-Fi'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/portal')}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kết nối lại mạng
            </button>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
          Sở Thông tin và Truyền thông Hải Phòng • 1.584 Điểm Nhà văn hóa
        </div>
      </div>
    </div>
  );
};
