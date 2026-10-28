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
  Laptop,
  Server,
  Radio,
  Router,
  Repeat,
  CheckCircle2,
  XCircle,
  Cpu
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { DeviceDto, NetworkDeviceDto } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';
import { DeviceSwapModal } from '../../components/DeviceSwapModal';

export const DevicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'INFRASTRUCTURE'>('CLIENT');

  // Client devices state
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Network infrastructure devices state
  const [networkDevices, setNetworkDevices] = useState<NetworkDeviceDto[]>([]);
  const [loadingNetDev, setLoadingNetDev] = useState(false);
  const [netPage, setNetPage] = useState(0);
  const [netTotalPages, setNetTotalPages] = useState(1);
  const [netTotalElements, setNetTotalElements] = useState(0);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Device swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedDeviceForSwap, setSelectedDeviceForSwap] = useState<NetworkDeviceDto | null>(null);

  useEffect(() => {
    if (activeTab === 'CLIENT') {
      loadDevices();
    } else {
      loadNetworkDevices();
    }
  }, [activeTab, page, netPage]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getDevices({ search: search.trim() || undefined, page, size: 15 });
      setDevices(resp.content);
      setTotalPages(resp.totalPages);
      setTotalElements(resp.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách thiết bị khách.');
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkDevices = async () => {
    setLoadingNetDev(true);
    try {
      const resp = await adminApi.getNetworkDevices({
        type: deviceTypeFilter || undefined,
        status: statusFilter || undefined,
        page: netPage,
        size: 15,
      });
      setNetworkDevices(resp.content);
      setNetTotalPages(resp.totalPages);
      setNetTotalElements(resp.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách thiết bị hạ tầng.');
    } finally {
      setLoadingNetDev(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'CLIENT') {
      setPage(0);
      loadDevices();
    } else {
      setNetPage(0);
      loadNetworkDevices();
    }
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

  const renderNetDeviceIcon = (type: string) => {
    switch (type) {
      case 'ONT':
        return <Server className="w-4 h-4 text-indigo-600" />;
      case 'ROUTER':
        return <Router className="w-4 h-4 text-sky-600" />;
      case 'ACCESS_POINT':
        return <Radio className="w-4 h-4 text-emerald-600" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Thiết Bị & Hạ Tầng</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi thiết bị khách truy cập (Blacklist MAC) và phần cứng mạng tại 1.584 điểm (ONT, Router, AP, hoán đổi thiết bị).
          </p>
        </div>
        <button
          onClick={activeTab === 'CLIENT' ? loadDevices : loadNetworkDevices}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('CLIENT')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'CLIENT'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thiết Bị Khách Truy Cập ({totalElements})
        </button>
        <button
          onClick={() => setActiveTab('INFRASTRUCTURE')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'INFRASTRUCTURE'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thiết Bị Mạng Hạ Tầng (ONT / Router / AP)
        </button>
      </div>

      {/* Tab 1: Client Devices */}
      {activeTab === 'CLIENT' && (
        <>
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
                        Đang tải danh sách thiết bị khách...
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
        </>
      )}

      {/* Tab 2: Infrastructure Devices */}
      {activeTab === 'INFRASTRUCTURE' && (
        <>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center">
            <div className="w-48">
              <select
                value={deviceTypeFilter}
                onChange={(e) => {
                  setDeviceTypeFilter(e.target.value);
                  setNetPage(0);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">-- Tất cả loại thiết bị --</option>
                <option value="ONT">ONT (Modem quang)</option>
                <option value="ROUTER">Router điều hướng</option>
                <option value="ACCESS_POINT">Access Point (AP)</option>
              </select>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setNetPage(0);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="ONLINE">Đang hoạt động (ONLINE)</option>
                <option value="OFFLINE">Mất tín hiệu (OFFLINE)</option>
                <option value="MAINTENANCE">Đang bảo trì (MAINTENANCE)</option>
              </select>
            </div>
            <button
              onClick={() => {
                setNetPage(0);
                loadNetworkDevices();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Lọc thiết bị
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Loại & Model</th>
                    <th className="py-3.5 px-4">Địa chỉ MAC & IP</th>
                    <th className="py-3.5 px-4">Serial Number</th>
                    <th className="py-3.5 px-4">Trạng thái kết nối</th>
                    <th className="py-3.5 px-4">Lần cuối Heartbeat</th>
                    <th className="py-3.5 px-4 text-right">Thao tác hạ tầng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingNetDev ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                        Đang tải danh sách thiết bị hạ tầng...
                      </td>
                    </tr>
                  ) : networkDevices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Chưa có thiết bị mạng nào được ghi nhận hoặc không có dữ liệu phù hợp.
                      </td>
                    </tr>
                  ) : (
                    networkDevices.map((nd) => (
                      <tr key={nd.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                              {renderNetDeviceIcon(nd.deviceType)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">
                                {nd.locationName || `${nd.deviceType} - ${nd.macAddress.slice(-5)}`}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {nd.vendor} {nd.model}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900 block text-xs">{nd.macAddress}</span>
                          <span className="text-slate-400 text-[11px] block">{nd.ipAddress || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {nd.serialNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          {nd.status === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ONLINE
                            </span>
                          ) : nd.status === 'OFFLINE' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px]">
                              <XCircle className="w-3 h-3 text-rose-500" /> OFFLINE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px]">
                              {nd.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {formatDate(nd.lastSeenAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDeviceForSwap(nd);
                              setSwapModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="Hoán đổi phần cứng thay thế khi hỏng hóc tại cơ sở"
                          >
                            <Repeat className="w-3.5 h-3.5 text-amber-600" /> Thay thế thiết bị
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/40">
              <span>
                Tổng số: <strong className="font-semibold text-slate-800">{netTotalElements}</strong> thiết bị mạng
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Trang {netPage + 1} / {netTotalPages || 1}
                </span>
                <button
                  onClick={() => setNetPage((p) => Math.max(0, p - 1))}
                  disabled={netPage === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setNetPage((p) => Math.min(netTotalPages - 1, p + 1))}
                  disabled={netPage >= netTotalPages - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hardware Replacement Modal (Screen A10) */}
      <DeviceSwapModal
        isOpen={swapModalOpen}
        onClose={() => {
          setSwapModalOpen(false);
          setSelectedDeviceForSwap(null);
        }}
        onSuccess={() => {
          loadNetworkDevices();
        }}
        device={selectedDeviceForSwap}
      />
    </div>
  );
};