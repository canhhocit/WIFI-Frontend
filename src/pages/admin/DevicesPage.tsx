import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Search,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Laptop
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { DeviceDto } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    loadDevices();
  }, [page]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getDevices({ search: search.trim() || undefined, page, size: 15 });
      setDevices(resp.content);
      setTotalPages(resp.totalPages);
      setTotalElements(resp.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadDevices();
  };

  const handleToggleBlock = async (device: DeviceDto) => {
    const actionText = device.blocked ? 'bỏ chặn' : 'chặn';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} thiết bị có địa chỉ MAC ${device.macAddress}?`)) return;

    setTogglingId(device.id);
    try {
      await adminApi.toggleBlockDevice(device.id, !device.blocked);
      loadDevices();
    } catch (err: any) {
      alert(err?.message || `Thao tác ${actionText} thiết bị thất bại.`);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderOsIcon = (os?: string) => {
    const lower = (os || '').toLowerCase();
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('android')) {
      return <Smartphone className="w-4 h-4 text-sky-600" />;
    }
    if (lower.includes('mac') || lower.includes('darwin')) {
      return <Laptop className="w-4 h-4 text-slate-700" />;
    }
    return <Monitor className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Thiết Bị</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi phần cứng kết nối, nhận diện hệ điều hành và kiểm soát danh sách chặn (Blocklist).
          </p>
        </div>
        <button
          onClick={loadDevices}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo MAC, IP, tên máy hoặc thông tin hệ điều hành..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Địa chỉ MAC & IP</th>
                <th className="py-3.5 px-4">Hệ điều hành / Loại máy</th>
                <th className="py-3.5 px-4">Lần đầu kết nối</th>
                <th className="py-3.5 px-4">Lần cuối hoạt động</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Kiểm soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    Đang tải danh sách thiết bị...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy thiết bị nào phù hợp.
                  </td>
                </tr>
              ) : (
                devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-900 block text-xs">{dev.macAddress}</span>
                      <span className="text-slate-400 text-[11px] block">{dev.ipAddress || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {renderOsIcon(dev.osType)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 block">{dev.osType || 'Không xác định'}</span>
                          {dev.hostname && <span className="text-[11px] text-slate-400 block">{dev.hostname}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(dev.firstSeenAt)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(dev.lastSeenAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {dev.blocked ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px]">
                          <ShieldAlert className="w-3 h-3 text-rose-500" /> Đã chặn truy cập
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Được phép
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(dev)}
                        disabled={togglingId === dev.id}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5 ${
                          dev.blocked
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {togglingId === dev.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : dev.blocked ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" /> Bỏ chặn
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" /> Chặn thiết bị
                          </>
                        )}
                      </button>
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
            Tổng số: <strong className="font-semibold text-slate-800">{totalElements}</strong> thiết bị
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
