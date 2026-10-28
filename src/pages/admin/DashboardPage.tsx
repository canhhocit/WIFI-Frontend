import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Activity,
  MapPin,
  Radio,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Router
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { DashboardOverviewDto } from '../../types/models';
import { StatusBadge } from '../../components/Badge';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOverview();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu tổng quan bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giám sát thời gian thực phiên truy cập Wi-Fi khách, điểm phát sóng và trạng thái cổng gateway.
          </p>
        </div>
        <button
          onClick={loadOverview}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới số liệu
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phiên đang kết nối</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {data?.activeSessions ?? 0}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Đang hoạt động & đã cấp phép
          </p>
        </div>

        {/* Today's Logins */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lượt đăng nhập hôm nay</span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {data?.todaySessions ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Từ {data?.totalDevices ?? 0} thiết bị riêng biệt
          </p>
        </div>

        {/* Total Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng phiên lịch sử</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {data?.totalSessions ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Trên tổng số {data?.totalLocations ?? 0} điểm phát sóng
          </p>
        </div>

        {/* Total Unique Devices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thiết bị đã ghi nhận</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {data?.totalDevices ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Lưu vết tự động qua MAC & IP
          </p>
        </div>
      </div>

      {/* Grid: Status Distribution & Locations Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-1">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Phân loại trạng thái phiên</span>
            <Link to="/admin/sessions" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1">
              Xem chi tiết <ArrowRight className="w-3 h-3" />
            </Link>
          </h2>

          <div className="space-y-3.5">
            {data?.sessionsByStatus && Object.entries(data.sessionsByStatus).map(([status, count]) => {
              const total = data.totalSessions || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <StatusBadge status={status} />
                    <span className="font-mono text-slate-700 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === 'AUTHORIZED' ? 'bg-emerald-500' :
                        status === 'REVOKED' ? 'bg-rose-500' :
                        status === 'EXPIRED' ? 'bg-slate-400' :
                        status === 'FAILED' ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Lưu lượng theo Điểm phát Wi-Fi</span>
            <Link to="/admin/locations" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1">
              Quản lý điểm phát <ArrowRight className="w-3 h-3" />
            </Link>
          </h2>

          <div className="divide-y divide-slate-100">
            {data?.locationDistribution && data.locationDistribution.length > 0 ? (
              data.locationDistribution.map((loc, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{loc.locationName}</h4>
                      <span className="text-[11px] text-slate-400">{loc.percentage}% tổng số phiên truy cập</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-slate-900">{loc.sessionCount}</span>
                    <span className="text-[11px] text-slate-400 block font-medium">khách</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu phiên truy cập theo địa điểm.</p>
            )}
          </div>
        </div>
      </div>

      {/* Integration Notice Box */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl flex-shrink-0">
            <Router className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sẵn sàng tích hợp Router phần cứng OPNsense</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Hệ thống áp dụng kiến trúc ranh giới <code className="text-sky-300 font-mono bg-slate-800 px-1 py-0.5 rounded">GatewayAdapter</code> độc lập. Toàn bộ cơ sở dữ liệu, thời hạn phiên và nhật ký kiểm toán đã hoạt động đầy đủ trên Neon PostgreSQL. Khi cần đấu nối thiết bị thật qua VirtualBox/OPNsense, chỉ cần gắn adapter mà không cần sửa logic phần mềm.
            </p>
          </div>
        </div>
        <Link
          to="/admin/gateway"
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm shadow-sky-600/20 cursor-pointer"
        >
          Kiểm tra Cổng Gateway
        </Link>
      </div>
    </div>
  );
};
