import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  Filter,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Ban,
  Radio,
  FileEdit,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AuditEventDto } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAudit();
  }, [page, selectedAction]);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getAuditEvents({
        action: selectedAction || undefined,
        page,
        size: 15,
      });
      setEvents(resp.content);
      setTotalPages(resp.totalPages);
      setTotalElements(resp.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải nhật ký hệ thống.');
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

  const renderActionBadge = (action: string) => {
    switch (action) {
      case 'ADMIN_LOGIN':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#003865] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
            <UserCheck className="w-3 h-3 text-[#004b87]" /> Đăng nhập Admin
          </span>
        );
      case 'SESSION_REVOKE':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            <Ban className="w-3 h-3 text-rose-600" /> Ngắt kết nối phiên
          </span>
        );
      case 'GATEWAY_TOGGLE':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            <Radio className="w-3 h-3 text-amber-600" /> Cấu hình Gateway
          </span>
        );
      case 'LOCATION_CREATE':
      case 'LOCATION_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            <FileEdit className="w-3 h-3 text-indigo-600" /> Điểm phát Wi-Fi
          </span>
        );
      case 'LOCATION_DELETE':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
            <Trash2 className="w-3 h-3 text-red-600" /> Xóa điểm phát
          </span>
        );
      case 'DEVICE_BLOCK':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Chặn thiết bị
          </span>
        );
      case 'DEVICE_UNBLOCK':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Mở chặn thiết bị
          </span>
        );
      default:
        return (
          <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nhật Ký Kiểm Toán Hệ Thống</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghi nhận bất biến mọi thao tác quản trị, đăng nhập và các sự kiện can thiệp mạng.
          </p>
        </div>
        <button
          onClick={loadAudit}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới nhật ký
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Filter */}
      <div className="bg-white p-4 rounded border border-slate-300 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Lọc theo loại hành động:</span>
        </div>
        <select
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value);
            setPage(0);
          }}
          className="px-3.5 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-1 focus:ring-[#004b87] bg-white text-slate-700 font-medium cursor-pointer"
        >
          <option value="">Tất cả các hành động</option>
          <option value="ADMIN_LOGIN">Đăng nhập Quản trị viên (ADMIN_LOGIN)</option>
          <option value="SESSION_REVOKE">Ngắt kết nối phiên (SESSION_REVOKE)</option>
          <option value="GATEWAY_TOGGLE">Cấu hình Gateway (GATEWAY_TOGGLE)</option>
          <option value="LOCATION_CREATE">Tạo điểm phát (LOCATION_CREATE)</option>
          <option value="LOCATION_UPDATE">Cập nhật điểm phát (LOCATION_UPDATE)</option>
          <option value="LOCATION_DELETE">Xóa điểm phát (LOCATION_DELETE)</option>
          <option value="DEVICE_BLOCK">Chặn thiết bị (DEVICE_BLOCK)</option>
          <option value="DEVICE_UNBLOCK">Mở chặn thiết bị (DEVICE_UNBLOCK)</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-300 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Loại hành động</th>
                <th className="py-3.5 px-4">Người thực hiện</th>
                <th className="py-3.5 px-4">Địa chỉ IP</th>
                <th className="py-3.5 px-4">Nội dung chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Không có sự kiện kiểm toán nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDate(evt.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderActionBadge(evt.action)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {evt.actorUsername}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {evt.clientIp || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed max-w-md">
                      {evt.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/40">
          <span>
            Tổng số: <strong className="font-semibold text-slate-800">{totalElements}</strong> bản ghi nhật ký
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-sm border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-sm border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
