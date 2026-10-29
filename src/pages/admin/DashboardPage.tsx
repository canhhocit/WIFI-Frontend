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
  Router,
  Map,
  Server,
  Globe,
  BellRing,
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 text-blue-700 animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Đang đồng bộ số liệu NOC Hải Phòng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded border border-slate-300 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#004b87] text-white uppercase tracking-wider">
              NOC Hải Phòng
            </span>
            <span className="text-xs text-slate-500 font-mono">• Phủ sóng 15 Quận / Huyện</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Bảng Điều Hành Trung Tâm Wi-Fi Công Cộng Hải Phòng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát thời gian thực phiên truy cập của công dân, hạ tầng AP Gateway và chỉ số cam kết SLA viễn thông.
          </p>
        </div>
        <button
          onClick={loadOverview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới số liệu
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-sm text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Infrastructure Telemetry Quick Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-300 rounded shadow-xs flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-[#004b87] rounded-sm">
            <Map className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mục tiêu quy hoạch</div>
            <div className="text-sm font-bold text-slate-900 font-mono">1.584 Nhà văn hóa</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-300 rounded shadow-xs flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm">
            <Server className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trực tuyến Gateway</div>
            <div className="text-sm font-bold text-emerald-700 font-mono">OPNsense 24/7</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-300 rounded shadow-xs flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-[#004b87] rounded-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cam kết SLA Viễn thông</div>
            <div className="text-sm font-bold text-slate-900 font-mono">99.8% Chuẩn VNPT</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-300 rounded shadow-xs flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-[#004b87] rounded-sm">
            <Globe className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bộ lọc tên miền DNS</div>
            <div className="text-sm font-bold text-slate-900 font-mono">Cổng DVC Hải Phòng</div>
          </div>
        </div>
      </div>

      {/* Primary Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Sessions */}
        <div className="bg-white p-4 rounded border border-slate-300 shadow-xs hover:border-slate-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phiên đang kết nối</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {data?.activeSessions ?? 0}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Đang hoạt động & đã cấp phép qua cổng
          </p>
        </div>

        {/* Today's Logins */}
        <div className="bg-white p-4 rounded border border-slate-300 shadow-xs hover:border-slate-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lượt kết nối hôm nay</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-sm">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {data?.todaySessions ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Từ {data?.totalDevices ?? 0} thiết bị riêng biệt
          </p>
        </div>

        {/* Total Sessions */}
        <div className="bg-white p-4 rounded border border-slate-300 shadow-xs hover:border-slate-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng phiên lịch sử</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-sm">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {data?.totalSessions ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Trên tổng số {data?.totalLocations ?? 0} điểm phát sóng
          </p>
        </div>

        {/* Total Unique Devices */}
        <div className="bg-white p-4 rounded border border-slate-300 shadow-xs hover:border-slate-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Thiết bị đã ghi nhận</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-sm">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {data?.totalDevices ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Lưu vết 12 tháng tự động qua MAC & IP
          </p>
        </div>
      </div>

      {/* Grid: Status Distribution & Locations Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Session Status Breakdown */}
        <div className="bg-white p-4 sm:p-5 rounded border border-slate-300 shadow-xs lg:col-span-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
            <span>Phân loại trạng thái phiên</span>
            <Link to="/admin/sessions" className="text-xs text-[#004b87] hover:underline font-semibold flex items-center gap-1 normal-case">
              Xem chi tiết <ArrowRight className="w-3 h-3" />
            </Link>
          </h2>

          <div className="space-y-3">
            {data?.sessionsByStatus && Object.entries(data.sessionsByStatus).map(([status, count]) => {
              const total = data.totalSessions || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <StatusBadge status={status} />
                    <span className="font-mono text-slate-700 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-xs overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full transition-all ${
                        status === 'AUTHORIZED' ? 'bg-emerald-600' :
                        status === 'REVOKED' ? 'bg-rose-600' :
                        status === 'EXPIRED' ? 'bg-slate-400' :
                        status === 'FAILED' ? 'bg-red-700' : 'bg-amber-500'
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
        <div className="bg-white p-4 sm:p-5 rounded border border-slate-300 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mật độ phiên theo Địa bàn Nhà văn hóa</h2>
              <p className="text-[11px] text-slate-500">Thống kê lưu lượng truy cập thực tế tại các điểm phát</p>
            </div>
            <Link to="/admin/locations" className="text-xs text-[#004b87] hover:underline font-semibold flex items-center gap-1">
              Quản lý 1.584 Điểm <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.locationDistribution && data.locationDistribution.length > 0 ? (
              data.locationDistribution.map((loc, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between hover:bg-slate-100/60 transition">
                  <div className="flex items-center gap-2.5 truncate mr-3">
                    <div className="p-1.5 bg-white rounded-xs border border-slate-200 text-[#004b87] flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-slate-900 truncate">{loc.locationName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {loc.percentage != null ? `${loc.percentage.toFixed(1)}% lưu lượng toàn tỉnh` : 'Điểm phát sóng'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-xs text-slate-900">{loc.sessionCount} lượt</div>
                    <div className="text-[10px] text-emerald-700 font-medium">Phiên hoàn thành</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                Chưa có dữ liệu thống kê phiên theo địa bàn
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
