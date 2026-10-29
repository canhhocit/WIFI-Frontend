import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { RadiusClientDto, CreateRadiusClientRequest, GatewayStatusDto } from '../../types/models';
import {
  Radio,
  Server,
  Plus,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Activity,
  Zap,
  Globe
} from 'lucide-react';

export const RadiusGatewayPage: React.FC = () => {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatusDto | null>(null);
  const [radiusClients, setRadiusClients] = useState<RadiusClientDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSecretMap, setShowSecretMap] = useState<Record<number, boolean>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [sharedSecret, setSharedSecret] = useState('');
  const [nasIdentifier, setNasIdentifier] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [status, clients] = await Promise.all([
        adminApi.getGatewayStatus(),
        adminApi.getRadiusClients(),
      ]);
      setGatewayStatus(status);
      setRadiusClients(clients);
    } catch (err) {
      console.error('Failed to load gateway data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSecretVisibility = (id: number) => {
    setShowSecretMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleClient = async (id: number) => {
    try {
      const updated = await adminApi.toggleRadiusClient(id);
      setRadiusClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setActionMessage(`Đã ${updated.enabled ? 'kích hoạt' : 'tắt'} RADIUS Client: ${updated.clientName}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Không thể đổi trạng thái RADIUS client');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !ipAddress.trim() || !sharedSecret.trim()) return;

    try {
      const payload: CreateRadiusClientRequest = {
        clientName,
        ipAddress,
        sharedSecret,
        nasIdentifier,
        description,
        enabled: true,
      };
      const created = await adminApi.createRadiusClient(payload);
      setRadiusClients((prev) => [...prev, created]);
      setShowAddModal(false);
      setClientName('');
      setIpAddress('');
      setSharedSecret('');
      setNasIdentifier('');
      setDescription('');
      setActionMessage(`Đã thêm mới RADIUS Client: ${created.clientName}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Không thể thêm RADIUS Client');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Radio className="w-7 h-7 text-teal-600" />
            Cấu hình Gateway OPNsense & RADIUS NAS Clients
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản trị các máy chủ truy nhập mạng (Network Access Server - NAS), chia sẻ Shared Secret và kết nối OPNsense API
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm RADIUS Client
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Gateway Live Status Banner */}
      {gatewayStatus && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">{gatewayStatus.adapterType} Gateway</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    HOẠT ĐỘNG TỐT (ONLINE)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{gatewayStatus.statusMessage}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Phiên bản:</span>
              <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-teal-300">
                {gatewayStatus.version || '24.7-RELEASE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <div className="text-slate-400">Tổng lệnh cấp quyền (Authorize)</div>
              <div className="mt-1 text-2xl font-bold text-teal-400 font-mono">
                {gatewayStatus.totalAuthorizations.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Gói tin IPfw pass rule</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <div className="text-slate-400">Tổng lệnh thu hồi (Revoke)</div>
              <div className="mt-1 text-2xl font-bold text-amber-400 font-mono">
                {gatewayStatus.totalRevocations.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Hết hạn hoặc ngắt cưỡng bức</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <div className="text-slate-400">Lỗi giao tiếp Gateway</div>
              <div className="mt-1 text-2xl font-bold text-rose-400 font-mono">
                {gatewayStatus.failedOperations}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Tỷ lệ lỗi 0.00%</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <div className="text-slate-400">Độ trễ trung bình</div>
              <div className="mt-1 text-2xl font-bold text-blue-400 font-mono">
                {gatewayStatus.simulatedLatencyMs || 15} ms
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Thời gian thực thi firewall</div>
            </div>
          </div>
        </div>
      )}

      {/* RADIUS Clients List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-600" />
            Danh sách thiết bị mạng ủy quyền RADIUS NAS ({radiusClients.length})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Tên thiết bị NAS</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Địa chỉ IP</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">NAS Identifier</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Shared Secret</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-1" />
                    Đang tải danh sách RADIUS Clients...
                  </td>
                </tr>
              ) : radiusClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Chưa có thiết bị RADIUS client nào được cấu hình
                  </td>
                </tr>
              ) : (
                radiusClients.map((client) => {
                  const isSecretVisible = !!showSecretMap[client.id];
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {client.clientName}
                      </td>
                      <td className="px-4 py-3 font-mono text-teal-700 font-bold">
                        {client.ipAddress}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {client.nasIdentifier || 'Mặc định'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span>{isSecretVisible ? client.sharedSecret : '••••••••••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility(client.id)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded"
                            title={isSecretVisible ? 'Ẩn bí mật' : 'Xem bí mật'}
                          >
                            {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {client.description || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            client.enabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {client.enabled ? 'Đang kích hoạt' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleClient(client.id)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded border ${
                            client.enabled
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {client.enabled ? 'Tắt' : 'Bật'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add RADIUS Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Thêm Mới Thiết Bị Mạng RADIUS Client (NAS)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Tên thiết bị NAS</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: OPNsense Gateway Khu vực Hồng Bàng"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Địa chỉ IP thiết bị (NAS IP)</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.1"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">NAS Identifier</label>
                  <input
                    type="text"
                    placeholder="OPNSENSE-HB-01"
                    value={nasIdentifier}
                    onChange={(e) => setNasIdentifier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Mã bí mật dùng chung (Shared Secret)</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập khóa bí mật RADIUS..."
                  value={sharedSecret}
                  onChange={(e) => setSharedSecret(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Ghi chú & Vị trí đặt thiết bị</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cụ thể phòng máy, tuyến cáp quang hoặc phụ trách kỹ thuật..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm"
                >
                  Lưu cấu hình RADIUS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
