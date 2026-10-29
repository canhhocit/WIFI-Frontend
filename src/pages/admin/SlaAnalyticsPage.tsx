import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { SlaMetricsDto, IncidentTicketDto } from '../../types/models';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart2,
  PieChart,
  Zap,
  Activity,
  RefreshCw,
  Award
} from 'lucide-react';

export const SlaAnalyticsPage: React.FC = () => {
  const [slaMetrics, setSlaMetrics] = useState<SlaMetricsDto | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<IncidentTicketDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metrics, tickets] = await Promise.all([
        adminApi.getSlaMetrics(),
        adminApi.getIncidents({ size: 20 }),
      ]);
      setSlaMetrics(metrics);
      setRecentIncidents(tickets.content);
    } catch (err) {
      console.error('Failed to load SLA metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Báo cáo Đánh giá Chỉ số SLA & Thời gian Phục hồi MTTR
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Báo cáo đánh giá chất lượng cung cấp dịch vụ Internet công cộng và đo lường cam kết thời gian đáp ứng
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới số liệu
        </button>
      </div>

      {/* KPI Overview Cards */}
      {slaMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* SLA Compliance Gauge Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Độ tuân thủ cam kết SLA</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">
                {slaMetrics.slaComplianceRatePercent}%
              </span>
              <span className="text-xs text-gray-500">Mục tiêu: ≥ 99.0%</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, slaMetrics.slaComplianceRatePercent)}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Đạt chuẩn cam kết dịch vụ công
            </div>
          </div>

          {/* MTTR Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Thời gian phục hồi MTTR</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-600">
                {slaMetrics.averageResolutionHours}
              </span>
              <span className="text-xs text-gray-500">giờ / sự cố</span>
            </div>
            <div className="mt-3 text-[11px] text-gray-500">
              Trung bình hoàn tất khắc phục từ khi mở phiếu
            </div>
          </div>

          {/* Resolved Count Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Đã khắc phục thành công</span>
              <CheckCircle className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-teal-600">
                {slaMetrics.resolvedTickets}
              </span>
              <span className="text-xs text-gray-500">/ {slaMetrics.totalTickets} phiếu</span>
            </div>
            <div className="mt-3 text-[11px] text-teal-700 font-medium">
              Tỷ lệ xử lý thành công: {slaMetrics.totalTickets > 0 ? Math.round((slaMetrics.resolvedTickets / slaMetrics.totalTickets) * 100) : 100}%
            </div>
          </div>

          {/* Breached SLA Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Số vụ vi phạm hạn SLA</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600">
                {slaMetrics.slaBreachedCount}
              </span>
              <span className="text-xs text-gray-500">sự cố trễ hạn</span>
            </div>
            <div className="mt-3 text-[11px] text-rose-600 font-medium">
              Chiếm {(slaMetrics.totalTickets > 0 ? (slaMetrics.slaBreachedCount / slaMetrics.totalTickets) * 100 : 0).toFixed(1)}% tổng sự cố
            </div>
          </div>
        </div>
      )}

      {/* SLA Benchmarks Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-gray-900">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Mức CRITICAL (Mất kết nối hoàn toàn)
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Hạn cam kết (SLA Window):</span>
              <span className="font-bold text-gray-900 font-mono">4.0 Giờ</span>
            </div>
            <div className="flex justify-between">
              <span>Quy trình ứng cứu:</span>
              <span className="font-medium text-gray-800">Đội cơ động tại chỗ 30m</span>
            </div>
            <div className="flex justify-between">
              <span>Kênh thông báo:</span>
              <span className="font-medium text-rose-600">Telegram + SMS Cấp bách</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-gray-900">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Mức MAJOR (Suy giảm nghiêm trọng)
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Hạn cam kết (SLA Window):</span>
              <span className="font-bold text-gray-900 font-mono">8.0 Giờ</span>
            </div>
            <div className="flex justify-between">
              <span>Quy trình ứng cứu:</span>
              <span className="font-medium text-gray-800">Kiểm tra đường truyền ODF</span>
            </div>
            <div className="flex justify-between">
              <span>Kênh thông báo:</span>
              <span className="font-medium text-amber-600">Telegram Bot</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-gray-900">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            Mức MINOR (Chậm chờn / Lỗi nhẹ)
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Hạn cam kết (SLA Window):</span>
              <span className="font-bold text-gray-900 font-mono">24.0 Giờ</span>
            </div>
            <div className="flex justify-between">
              <span>Quy trình ứng cứu:</span>
              <span className="font-medium text-gray-800">Bảo trì theo ca làm việc</span>
            </div>
            <div className="flex justify-between">
              <span>Kênh thông báo:</span>
              <span className="font-medium text-blue-600">Dashboard & Email</span>
            </div>
          </div>
        </div>
      </div>

      {/* Root Cause Analysis Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-600" />
          Phân bố Nguyên nhân Sự cố Cốt lõi (Root Cause Analysis - RCA)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="font-semibold text-amber-900">⚡ Mất điện lưới (POWER_OUTAGE)</div>
            <div className="mt-1 text-xs text-amber-700">Tất cả ONT & AP cùng tắt nguồn</div>
            <div className="mt-2 text-xl font-bold text-amber-800">45%</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="font-semibold text-blue-900">✂️ Đứt cáp quang (FIBER_CUT)</div>
            <div className="mt-1 text-xs text-blue-700">Mất tín hiệu quang, thiết bị có điện</div>
            <div className="mt-2 text-xl font-bold text-blue-800">30%</div>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <div className="font-semibold text-rose-900">🔥 Hỏng phần cứng (HARDWARE)</div>
            <div className="mt-1 text-xs text-rose-700">Nguồn adapter, cổng LAN, anten</div>
            <div className="mt-2 text-xl font-bold text-rose-800">15%</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-900">⚙️ Cấu hình / Khác (CONFIG)</div>
            <div className="mt-1 text-xs text-slate-700">Xung đột IP, cổng gateway</div>
            <div className="mt-2 text-xl font-bold text-slate-800">10%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
