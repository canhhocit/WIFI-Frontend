import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { AccessLogRetentionDto, LocationDto } from '../../types/models';
import {
  FileText,
  Search,
  Download,
  Calendar,
  ShieldCheck,
  HardDrive,
  Clock,
  Filter,
  RefreshCw,
  MapPin,
  Lock
} from 'lucide-react';

export const AccessLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AccessLogRetentionDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [page, setPage] = useState<number>(0);

  // Filters
  const [clientMac, setClientMac] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadLogs = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const parsedLocId = locationId !== 'ALL' ? Number(locationId) : undefined;
      const parsedStart = startDate ? new Date(startDate).toISOString() : undefined;
      const parsedEnd = endDate ? new Date(endDate).toISOString() : undefined;

      const [logPage, locPage] = await Promise.all([
        adminApi.searchAccessLogs({
          clientMac: clientMac || undefined,
          locationId: parsedLocId,
          startDate: parsedStart,
          endDate: parsedEnd,
          page: pageIndex,
          size: 25,
        }),
        adminApi.getLocations({ page: 0, size: 100 }),
      ]);

      setLogs(logPage.content);
      setTotalElements(logPage.totalElements);
      setPage(logPage.pageNumber);
      setLocations(locPage.content);
    } catch (err) {
      console.error('Failed to load access logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(0);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs(0);
  };

  const exportCsv = () => {
    if (logs.length === 0) return;

    const headers = [
      'ID',
      'Session Token',
      'Địa chỉ MAC',
      'Địa chỉ IP',
      'Điểm phát NVH',
      'Số điện thoại',
      'Thời điểm kết nối (UTC)',
      'Thời điểm ngắt kết nối (UTC)',
      'Thời lượng (giây)',
      'Bytes In',
      'Bytes Out',
      'Lý do kết thúc',
      'Hạn lưu trữ pháp lý 12 tháng',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.sessionToken || 'N/A',
      log.clientMac,
      log.clientIp,
      `"${log.locationName || 'N/A'}"`,
      log.phoneNumber || 'N/A',
      log.authenticatedAt,
      log.disconnectedAt || '',
      log.durationSeconds,
      log.bytesIn,
      log.bytesOut,
      log.terminationReason,
      log.retainedUntil,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nhat_ky_truy_cap_hai_phong_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Lock className="w-7 h-7 text-indigo-600" />
            Nhật Ký Truy Cập Pháp Lý 12 Tháng (Compliance Access Logs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lưu trữ siêu dữ liệu phiên truy cập theo quy định của Luật An ninh mạng & Nghị định 72/2013/NĐ-CP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadLogs(page)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={exportCsv}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 rounded-lg shadow-sm"
          >
            <Download className="w-4 h-4" />
            Xuất dữ liệu điều tra (CSV)
          </button>
        </div>
      </div>

      {/* Compliance Notice Banner */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900">
          <span className="font-bold">Quy chuẩn An ninh dữ liệu quốc gia:</span> Toàn bộ bản ghi truy cập tại 1.584 Nhà văn hóa được mã hóa và bảo lưu tự động đúng <span className="font-semibold underline">365 ngày</span> kể từ thời điểm thiết bị kết nối mạng. Hệ thống tự động tiến hành thanh lọc các bản ghi hết thời hạn lưu trữ vào lúc 03:00 UTC hằng đêm.
        </div>
      </div>

      {/* Filters Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 text-xs"
      >
        <div>
          <label className="block font-medium text-gray-700 mb-1">Địa chỉ MAC</label>
          <input
            type="text"
            placeholder="Tìm theo MAC..."
            value={clientMac}
            onChange={(e) => setClientMac(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg font-mono"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Điểm phát NVH</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
          >
            <option value="ALL">-- Tất cả điểm phát --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Từ ngày</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Đến ngày</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="w-full py-1.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Tra cứu
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Phiên / MAC / IP</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Điểm phát NVH</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Thời điểm kết nối</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Thời lượng</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Lưu lượng dữ liệu</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Lý do kết thúc</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Bảo lưu đến ngày (365d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-1" />
                    Đang tra cứu nhật ký truy cập pháp lý...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy bản ghi nhật ký nào thỏa mãn điều kiện tìm kiếm
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-gray-900">{log.clientMac}</div>
                      <div className="font-mono text-[11px] text-gray-500">{log.clientIp}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {log.locationName || `NVH #${log.locationId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{new Date(log.authenticatedAt).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {new Date(log.authenticatedAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {Math.round(log.durationSeconds / 60)} phút
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-[11px]">
                      <div>DL: {(log.bytesIn / (1024 * 1024)).toFixed(2)} MB</div>
                      <div className="text-gray-400">UL: {(log.bytesOut / (1024 * 1024)).toFixed(2)} MB</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">
                        {log.terminationReason}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-indigo-700 font-semibold">
                        {new Date(log.retainedUntil).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Hợp chuẩn 12 tháng</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination summary */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>Tổng số bản ghi: <strong className="text-gray-900">{totalElements}</strong> phiên lưu trữ</span>
          <div className="flex gap-1">
            <button
              onClick={() => loadLogs(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 disabled:opacity-40"
            >
              Trang trước
            </button>
            <span className="px-3 py-1 font-mono">Trang {page + 1}</span>
            <button
              onClick={() => loadLogs(page + 1)}
              disabled={(page + 1) * 25 >= totalElements}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
