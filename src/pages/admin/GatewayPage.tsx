import React, { useEffect, useState } from 'react';
import {
  Radio,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  Activity,
  Shield,
  Wifi
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { GatewayStatusDto, GatewayTransactionDto } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';

export const GatewayPage: React.FC = () => {
  const [status, setStatus] = useState<GatewayStatusDto | null>(null);
  const [transactions, setTransactions] = useState<GatewayTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGatewayData();
  }, []);

  const loadGatewayData = async () => {
    setLoading(true);
    try {
      const [st, tx] = await Promise.all([
        adminApi.getGatewayStatus(),
        adminApi.getGatewayTransactions(0, 20)
      ]);
      setStatus(st);
      setTransactions(tx.content);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin trạng thái cổng Gateway.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-5 h-5 text-slate-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trạng Thái Trạm Phát Wi-Fi (Gateway)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát trực tiếp luồng cấp quyền truy cập mạng và kết nối từ các thiết bị khách.
          </p>
        </div>
        <button
          onClick={loadGatewayData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 bg-white rounded-sm text-xs font-medium text-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Clean Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Status */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
            Trạng thái hoạt động
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Trực tuyến
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sẵn sàng điều hướng phiên</p>
        </div>

        {/* Network Engine */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
            Cơ chế chuyển tiếp
          </span>
          <div className="text-base font-bold font-mono text-slate-900">
            Wi-Fi Gateway Engine
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chặn & mở cổng tự động</p>
        </div>

        {/* Latency */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
            Thời gian phản hồi
          </span>
          <div className="text-base font-bold font-mono text-slate-900">
            {status?.simulatedLatencyMs ? `${status.simulatedLatencyMs} ms` : '< 5 ms'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Độ trễ xử lý gói tin</p>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
            Giao dịch đã xử lý
          </span>
          <div className="text-base font-bold font-mono text-slate-900">
            {transactions.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lượt cấp quyền / thu hồi</p>
        </div>
      </div>

      {/* Gateway Transactions Table */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lịch sử giao dịch cấp phép kết nối mạng
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Giao dịch thời gian thực</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4">Loại thao tác</th>
                <th className="py-2.5 px-4">Phiên ID</th>
                <th className="py-2.5 px-4">Độ trễ</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4">Mã phản hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có giao dịch cấp quyền nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.operation === 'AUTHORIZE' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                          Cấp quyền kết nối
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Thu hồi phiên
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {tx.sessionId ? `#${tx.sessionId}` : 'Hệ thống'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {tx.executionTimeMs ?? 0} ms
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.success ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                          Thất bại
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      HTTP {tx.statusCode || (tx.success ? 200 : 500)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
