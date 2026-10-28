import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Clock,
  RefreshCw,
  Loader2,
  PieChart,
  Users
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { DashboardOverviewDto, HourlyTrendDto } from '../../types/models';
import { StatusBadge } from '../../components/Badge';

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverviewDto | null>(null);
  const [trends, setTrends] = useState<HourlyTrendDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, trData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getTrends()
      ]);
      setOverview(ovData);
      setTrends(trData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
      </div>
    );
  }

  // Find max count for trend bar height
  const maxTrend = trends.reduce((max, t) => Math.max(max, t.sessionCount), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Báo Cáo & Thống Kê Lưu Lượng</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng hợp dữ liệu kết nối mạng theo từng điểm phát sóng và xu hướng truy cập theo dòng thời gian.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Cập nhật số liệu
        </button>
      </div>

      {/* Grid: Location Breakdown & Status Shares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Market Share */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Phân Bổ Lưu Lượng Theo Điểm Phát</h2>
              <p className="text-[11px] text-slate-400">Tỷ lệ phần trăm tổng số khách kết nối qua từng chi nhánh</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {overview?.locationDistribution && overview.locationDistribution.length > 0 ? (
              overview.locationDistribution.map((loc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{loc.locationName}</span>
                    <span className="font-mono text-slate-600 font-semibold">{loc.sessionCount} phiên ({loc.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(3, loc.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu phân bổ theo địa điểm.</p>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tỷ Lệ Trạng Thái Phiên</h2>
              <p className="text-[11px] text-slate-400">Tỷ lệ các phiên thành công, hết hạn hoặc bị ngắt kết nối</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            {overview?.sessionsByStatus && Object.entries(overview.sessionsByStatus).map(([status, count]) => {
              const total = overview.totalSessions || 1;
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
                      style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hourly Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Xu Hướng Lưu Lượng Truy Cập Theo Giờ</h2>
            <p className="text-[11px] text-slate-400">Số lượng phiên kết nối mới theo từng khung giờ trong 24 giờ qua</p>
          </div>
        </div>

        {trends.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">Chưa có đủ dữ liệu theo khung giờ.</p>
        ) : (
          <div className="pt-6">
            <div className="h-44 flex items-end gap-2 sm:gap-3 px-2 border-b border-slate-100">
              {trends.map((t, idx) => {
                const heightPct = Math.round((t.sessionCount / maxTrend) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.sessionCount}
                    </span>
                    <div
                      className="w-full bg-sky-500 hover:bg-sky-600 rounded-t-md transition-all cursor-pointer min-h-[4px]"
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      title={`${t.timeLabel}: ${t.sessionCount} phiên`}
                    />
                    <span className="text-[10px] text-slate-400 font-mono truncate w-full text-center">
                      {t.timeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-3">
              <span>Đơn vị: Khung giờ trong ngày</span>
              <span>Tổng cộng: {trends.reduce((s, t) => s + t.sessionCount, 0)} kết nối</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
