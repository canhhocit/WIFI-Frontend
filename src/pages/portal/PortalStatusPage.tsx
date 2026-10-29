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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-sm w-full overflow-hidden">
        {/* Status Header */}
        <div className="p-6 pb-5 border-b border-slate-100 text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border ${
            isAuthorized 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' 
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {isAuthorized ? <CheckCircle2 className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            {isAuthorized ? 'Đã Kết Nối Internet Thành Công' : 'Đã Ngắt Kết Nối Mạng'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">Hệ thống Wi-Fi Công cộng TP Hải Phòng</p>
          
          <div className="mt-3 flex justify-center">
            <StatusBadge status={session?.status || 'PENDING'} size="sm" />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Active Countdown Card */}
          {isAuthorized ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Thời gian truy cập còn lại
              </span>
              <div className="font-mono text-3xl font-bold text-slate-900 tracking-tight">
                {formatRemainingTime(remainingSec)}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-center">
              <span className="text-xs font-semibold text-amber-800 block">
                {session?.status === 'EXPIRED' ? 'Phiên truy cập đã hết thời lượng' : 'Đã ngắt kết nối Wi-Fi'}
              </span>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                Vui lòng bấm nút bên dưới để kết nối lại và tiếp tục sử dụng mạng.
              </p>
            </div>
          )}

          {/* Real Session Metadata */}
          <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Địa chỉ IP:</span>
              <span className="font-mono text-slate-800 font-medium">{session?.ipAddress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Địa chỉ MAC:</span>
              <span className="font-mono text-slate-800 font-medium">{session?.macAddress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tốc độ mạng:</span>
              <span className="font-mono text-slate-800 font-medium">{session?.maxBandwidthMbps} Mbps</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Mã phiên:</span>
              <span className="font-mono text-slate-800 font-medium text-[10px] truncate max-w-[140px]">{session?.sessionToken}</span>
            </div>
          </div>

          {/* Action button */}
          {isAuthorized ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              {disconnecting ? 'Đang ngắt kết nối...' : 'Ngắt kết nối Wi-Fi'}
            </button>
          ) : (
            <button
              onClick={() => navigate('/portal')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kết nối lại
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
