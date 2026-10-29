import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Ban,
  Eye,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Signal,
  MapPin,
  Laptop
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { GuestSessionDto, LocationDto, SessionStatus } from '../../types/models';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { AlertBanner } from '../../components/AlertBanner';

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<GuestSessionDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [detailSession, setDetailSession] = useState<GuestSessionDto | null>(null);
  const [revokeSessionTarget, setRevokeSessionTarget] = useState<GuestSessionDto | null>(null);
  const [revokeReason, setRevokeReason] = useState('Vi phạm chính sách sử dụng mạng');
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getActiveLocations().then(setLocations).catch(console.error);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [page, selectedLocation, selectedStatus]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getSessions({
        locationId: selectedLocation,
        status: selectedStatus,
        search: searchTerm.trim() || undefined,
        page,
        size: 10,
        sortBy: 'createdAt',
        direction: 'desc',
      });
      setSessions(resp.content);
      setTotalPages(resp.totalPages);
      setTotalElements(resp.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách phiên truy cập Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadSessions();
  };

  const handleConfirmRevoke = async () => {
    if (!revokeSessionTarget) return;
    setRevoking(true);
    setRevokeError(null);

    try {
      await adminApi.revokeSession(revokeSessionTarget.id, revokeReason);
      setRevokeSessionTarget(null);
      loadSessions();
    } catch (err: any) {
      setRevokeError(err?.message || 'Không thể ngắt kết nối phiên trên cổng gateway.');
    } finally {
      setRevoking(false);
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
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Phiên Truy Cập Wi-Fi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu, kiểm soát phiên người dùng và quản lý quyền truy cập Internet qua cổng Captive.
          </p>
        </div>
        <button
          onClick={loadSessions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex flex-col md:flex-row gap-2.5">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo MAC, IP, tên khách hoặc mã token..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87] transition font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-semibold transition cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Location Dropdown */}
        <div className="flex gap-2">
          <select
            value={selectedLocation ?? ''}
            onChange={(e) => {
              setSelectedLocation(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87] bg-white text-slate-700 font-medium cursor-pointer"
          >
            <option value="">Tất cả điểm phát Wi-Fi</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus ?? ''}
            onChange={(e) => {
              setSelectedStatus((e.target.value as SessionStatus) || undefined);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87] bg-white text-slate-700 font-medium cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AUTHORIZED">Đang kết nối</option>
            <option value="PENDING">Đang chờ</option>
            <option value="REVOKED">Đã ngắt kết nối</option>
            <option value="EXPIRED">Đã hết hạn</option>
            <option value="FAILED">Thất bại</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-300 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Thiết bị & IP</th>
                <th className="py-3.5 px-4">Điểm phát Wi-Fi</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Thời gian tạo</th>
                <th className="py-3.5 px-4">Hết hạn vào</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
                    Đang tải danh sách phiên...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy phiên kết nối nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-800 block text-xs">{sess.macAddress}</span>
                      <span className="text-slate-400 text-[11px] block">{sess.ipAddress}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{sess.locationName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {sess.guestName || <span className="text-slate-400 italic font-normal">Khách vãng lai</span>}
                      </span>
                      {sess.guestContact && (
                        <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                          {sess.guestContact}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={sess.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(sess.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {formatDate(sess.expiresAt)}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setDetailSession(sess)}
                        className="p-1.5 text-slate-500 hover:text-[#004b87] hover:bg-slate-100 rounded-sm transition cursor-pointer"
                        title="Xem chi tiết phiên"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {sess.status === 'AUTHORIZED' && (
                        <button
                          onClick={() => {
                            setRevokeSessionTarget(sess);
                            setRevokeReason('Vi phạm chính sách sử dụng mạng');
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-sm transition cursor-pointer"
                          title="Ngắt kết nối mạng ngay"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/70">
          <span>
            Tổng số: <strong className="font-semibold text-slate-800">{totalElements}</strong> phiên truy cập
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded-sm border border-slate-300 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded-sm border border-slate-300 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Session Details */}
      <Modal
        isOpen={!!detailSession}
        onClose={() => setDetailSession(null)}
        title="Chi Tiết Phiên Truy Cập Wi-Fi"
        maxWidth="lg"
      >
        {detailSession && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-sm border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Trạng thái</span>
                <div className="mt-1">
                  <StatusBadge status={detailSession.status} size="md" />
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Điểm phát sóng</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block">{detailSession.locationName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Địa chỉ MAC</span>
                <span className="font-mono font-bold text-slate-800">{detailSession.macAddress}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Địa chỉ IP</span>
                <span className="font-mono font-bold text-slate-800">{detailSession.ipAddress}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Khách hàng</span>
                <span className="font-bold text-slate-800">{detailSession.guestName || 'Khách vãng lai'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Liên hệ</span>
                <span className="font-medium text-slate-800">{detailSession.guestContact || '—'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Thời gian bắt đầu</span>
                <span className="font-mono text-slate-700">{formatDate(detailSession.authorizedAt || detailSession.createdAt)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Thời gian hết hạn</span>
                <span className="font-mono text-slate-700">{formatDate(detailSession.expiresAt)}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Mã phiên truy cập (Session Token)</span>
              <span className="font-mono text-[11px] text-slate-700 break-all select-all block bg-white p-2 rounded-xs border border-slate-300">
                {detailSession.sessionToken}
              </span>
            </div>

            {detailSession.revokeReason && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-sm text-rose-800">
                <span className="font-bold block text-xs">Lý do ngắt kết nối:</span>
                <p className="mt-0.5 text-xs">{detailSession.revokeReason}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailSession(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 2: Confirm Revoke Session */}
      <Modal
        isOpen={!!revokeSessionTarget}
        onClose={() => setRevokeSessionTarget(null)}
        title="Xác Nhận Ngắt Kết Nối Phiên Wi-Fi"
        maxWidth="md"
      >
        {revokeSessionTarget && (
          <div className="space-y-3 text-xs">
            {revokeError && <AlertBanner type="error" message={revokeError} />}

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">Cảnh báo ngắt truy cập mạng</span>
                <p className="mt-0.5 leading-relaxed text-xs">
                  Thiết bị <code className="font-mono font-bold">{revokeSessionTarget.macAddress}</code> ({revokeSessionTarget.ipAddress}) tại <span className="font-bold">{revokeSessionTarget.locationName}</span> sẽ bị thu hồi quyền truy cập Internet ngay lập tức.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Lý do ngắt kết nối
              </label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white cursor-pointer font-medium"
              >
                <option value="Vi phạm chính sách sử dụng mạng">Vi phạm chính sách sử dụng mạng</option>
                <option value="Hết thời gian cấp phép dịch vụ">Hết thời gian cấp phép dịch vụ</option>
                <option value="Yêu cầu từ khách hàng">Yêu cầu từ khách hàng</option>
                <option value="Nghi vấn bảo mật / Quá tải băng thông">Nghi vấn bảo mật / Quá tải băng thông</option>
                <option value="Khác">Lý do khác</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokeSessionTarget(null)}
                className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={revoking}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                Xác nhận ngắt kết nối
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
