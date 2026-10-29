import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { MacBlacklistDto, CreateBlacklistRequest } from '../../types/models';
import {
  Ban,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  X,
  RefreshCw,
  AlertOctagon
} from 'lucide-react';

export const BlacklistPage: React.FC = () => {
  const [blacklist, setBlacklist] = useState<MacBlacklistDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State
  const [macAddress, setMacAddress] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const page = await adminApi.getBlacklist({ active: activeFilter, size: 50 });
      setBlacklist(page.content);
    } catch (err) {
      console.error('Failed to load blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const handleUnblock = async (id: number, mac: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn gỡ chặn cho thiết bị MAC [${mac}] không?`)) {
      return;
    }

    try {
      const updated = await adminApi.unblockMac(id);
      setBlacklist((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setActionMessage(`Đã gỡ chặn thành công cho địa chỉ MAC ${mac}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Không thể gỡ chặn thiết bị');
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress.trim())) {
      setFormError('Địa chỉ MAC không hợp lệ. Định dạng chuẩn: AA:BB:CC:DD:EE:FF');
      return;
    }

    if (!reason.trim()) {
      setFormError('Vui lòng nhập lý do cấm truy cập');
      return;
    }

    try {
      const payload: CreateBlacklistRequest = {
        macAddress: macAddress.trim().toUpperCase(),
        reason: reason.trim(),
      };
      const created = await adminApi.addToBlacklist(payload);
      setBlacklist((prev) => [created, ...prev.filter((item) => item.macAddress !== created.macAddress)]);
      setShowAddModal(false);
      setMacAddress('');
      setReason('');
      setActionMessage(`Đã đưa địa chỉ MAC ${created.macAddress} vào danh sách cấm!`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi thêm thiết bị vào danh sách đen');
    }
  };

  const filteredItems = blacklist.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.macAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.blockedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Ban className="w-7 h-7 text-red-600" />
            Danh Sách Đen MAC & Kiểm Soát An Ninh Mạng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ngăn chặn triệt để các thiết bị tấn công mạng, quét cổng, spam xác thực hoặc vi phạm pháp luật viễn thông
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Chặn địa chỉ MAC mới
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-sm border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo địa chỉ MAC, lý do chặn, người chặn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="inline-flex rounded-sm border border-gray-200 bg-gray-50 p-0.5">
            <button
              onClick={() => setActiveFilter(undefined)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === undefined ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveFilter(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === true ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đang bị chặn
            </button>
            <button
              onClick={() => setActiveFilter(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === false ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đã gỡ chặn
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Địa chỉ MAC</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Lý do ngăn chặn</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Người thực hiện</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Thời gian chặn</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-red-600 mb-1" />
                    Đang tải danh sách đen MAC...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Không có thiết bị nào trong danh sách đen phù hợp với tìm kiếm
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-gray-900 tracking-wider flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
                        {item.macAddress}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-sm">
                      {item.reason}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.blockedBy}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                      {new Date(item.blockedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.active
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600 line-through'
                        }`}
                      >
                        {item.active ? 'Đang chặn' : 'Đã gỡ chặn'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.active ? (
                        <button
                          onClick={() => handleUnblock(item.id, item.macAddress)}
                          className="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-medium"
                        >
                          Gỡ chặn
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">Bình thường</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Blacklist */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Đưa Thiết Bị Vào Danh Sách Đen (Blacklist)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlacklist} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-sm text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Địa chỉ MAC thiết bị (Định dạng AA:BB:CC:DD:EE:FF)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: AA:BB:CC:DD:EE:01"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs font-mono tracking-wider focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Lý do đưa vào danh sách đen & Căn cứ an ninh
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Phát hiện hành vi dò quét cổng và giả lập địa chỉ IP nội bộ tại Nhà văn hóa..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 font-medium shadow-sm"
                >
                  Xác nhận chặn vĩnh viễn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

