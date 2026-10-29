import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { NetworkBandwidthPolicyDto, CreatePolicyRequest } from '../../types/models';
import {
  Gauge,
  Plus,
  Zap,
  ArrowDown,
  ArrowUp,
  Clock,
  HardDrive,
  CheckCircle,
  X,
  RefreshCw,
  Shield
} from 'lucide-react';

export const NetworkPoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<NetworkBandwidthPolicyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [downloadSpeedKbps, setDownloadSpeedKbps] = useState<number>(5120);
  const [uploadSpeedKbps, setUploadSpeedKbps] = useState<number>(2048);
  const [maxSessionSeconds, setMaxSessionSeconds] = useState<number>(5400);
  const [quotaMb, setQuotaMb] = useState<number>(0);
  const [priority, setPriority] = useState<number>(1);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getNetworkPolicies();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load network policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const updated = await adminApi.toggleNetworkPolicy(id);
      setPolicies((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setActionMessage(`Đã ${updated.active ? 'kích hoạt' : 'tắt'} chính sách: ${updated.name}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Không thể cập nhật trạng thái chính sách');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload: CreatePolicyRequest = {
        name,
        description,
        downloadSpeedKbps,
        uploadSpeedKbps,
        maxSessionSeconds,
        quotaMb,
        priority,
        active: true,
      };
      const created = await adminApi.createNetworkPolicy(payload);
      setPolicies((prev) => [...prev, created]);
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setActionMessage(`Đã thêm chính sách băng thông mới: ${created.name}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Không thể tạo chính sách băng thông');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Gauge className="w-7 h-7 text-blue-600" />
            Chính sách Điều tiết Băng thông QoS & Giới hạn Phiên
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm soát tốc độ tải xuống / tải lên (Download/Upload Throttling) và thời lượng kết nối cho từng nhóm điểm phát
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPolicies}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm chính sách QoS
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Đang tải danh mục chính sách băng thông QoS...
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                policy.active ? 'border-gray-200 hover:shadow-md' : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      Độ ưu tiên: Mức {policy.priority}
                    </span>
                    <h3 className="font-bold text-gray-900 text-base mt-0.5">{policy.name}</h3>
                  </div>
                  {/* Toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.active}
                      onChange={() => handleToggle(policy.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {policy.description || 'Chính sách quản lý băng thông Wi-Fi công cộng'}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      Tải xuống (Download):
                    </span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {(policy.downloadSpeedKbps / 1024).toFixed(1)} Mbps
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      Tải lên (Upload):
                    </span>
                    <span className="font-bold text-blue-600 font-mono">
                      {(policy.uploadSpeedKbps / 1024).toFixed(1)} Mbps
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Thời lượng mỗi phiên:
                    </span>
                    <span className="font-medium text-gray-900">
                      {Math.round(policy.maxSessionSeconds / 60)} phút
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-purple-600" />
                      Hạn mức dữ liệu (Quota):
                    </span>
                    <span className="font-medium text-gray-900">
                      {policy.quotaMb && policy.quotaMb > 0 ? `${policy.quotaMb} MB` : 'Không giới hạn'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 text-[11px] text-gray-400 border-t border-gray-50 flex items-center justify-between">
                <span>Trạng thái OPNsense dummynet:</span>
                <span className="font-medium text-emerald-600">Đã đồng bộ pipe</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create Policy */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Thêm Chính Sách Băng Thông QoS Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Tên chính sách</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chính sách Nhà văn hóa Khu vực Trung tâm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Mô tả mục đích</label>
                <input
                  type="text"
                  placeholder="Áp dụng cho các nhà văn hóa phục vụ người dân học tập và tra cứu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Tốc độ tải xuống (Kbps)</label>
                  <input
                    type="number"
                    required
                    value={downloadSpeedKbps}
                    onChange={(e) => setDownloadSpeedKbps(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">
                    = {(downloadSpeedKbps / 1024).toFixed(1)} Mbps
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Tốc độ tải lên (Kbps)</label>
                  <input
                    type="number"
                    required
                    value={uploadSpeedKbps}
                    onChange={(e) => setUploadSpeedKbps(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">
                    = {(uploadSpeedKbps / 1024).toFixed(1)} Mbps
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Thời lượng phiên (Giây)</label>
                  <input
                    type="number"
                    required
                    value={maxSessionSeconds}
                    onChange={(e) => setMaxSessionSeconds(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">
                    = {Math.round(maxSessionSeconds / 60)} phút
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Quota MB (0 = Vô hạn)</label>
                  <input
                    type="number"
                    value={quotaMb}
                    onChange={(e) => setQuotaMb(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Độ ưu tiên (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                  Lưu chính sách QoS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
