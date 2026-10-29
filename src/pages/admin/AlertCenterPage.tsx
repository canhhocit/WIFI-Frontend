import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { AlertRuleDto, IngestTelemetryRequest } from '../../types/models';
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle,
  Plus,
  Send,
  Zap,
  Activity,
  Cpu,
  WifiOff,
  Clock,
  Radio,
  X,
  RefreshCw
} from 'lucide-react';

export const AlertCenterPage: React.FC = () => {
  const [rules, setRules] = useState<AlertRuleDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [metricType, setMetricType] = useState<'CPU' | 'MEMORY' | 'LATENCY' | 'PACKET_LOSS' | 'OFFLINE'>('LATENCY');
  const [thresholdValue, setThresholdValue] = useState<number>(150);
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [severity, setSeverity] = useState<'WARNING' | 'CRITICAL'>('WARNING');
  const [notificationChannel, setNotificationChannel] = useState<'EMAIL' | 'SMS' | 'TELEGRAM' | 'WEBHOOK'>('TELEGRAM');
  const [recipientTarget, setRecipientTarget] = useState('@wificaptive_alert_bot');

  // Simulation form
  const [simDeviceId, setSimDeviceId] = useState<number>(1);
  const [simLocationId, setSimLocationId] = useState<number>(1);
  const [simCpu, setSimCpu] = useState<number>(95);
  const [simLatency, setSimLatency] = useState<number>(250);
  const [simPacketLoss, setSimPacketLoss] = useState<number>(12);
  const [simOnline, setSimOnline] = useState<boolean>(true);
  const [simResult, setSimResult] = useState<string | null>(null);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAlertRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load alert rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const updated = await adminApi.toggleAlertRule(id);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setActionMessage(`Đã ${updated.enabled ? 'kích hoạt' : 'tắt'} quy tắc cảnh báo: ${updated.name}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Không thể thay đổi trạng thái quy tắc');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const created = await adminApi.createAlertRule({
        name,
        metricType,
        thresholdValue,
        durationMinutes,
        severity,
        notificationChannel,
        recipientTarget,
        enabled: true,
      });
      setRules((prev) => [...prev, created]);
      setShowCreateModal(false);
      setName('');
      setActionMessage(`Đã tạo quy tắc cảnh báo mới: ${created.name}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Không thể tạo quy tắc cảnh báo');
    }
  };

  const handleSimulateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimResult(null);
    try {
      const payload: IngestTelemetryRequest = {
        deviceId: simDeviceId,
        locationId: simLocationId,
        cpuUsagePercent: simCpu,
        memoryUsagePercent: 75,
        pingLatencyMs: simLatency,
        packetLossPercent: simPacketLoss,
        connectedClients: 25,
        rxBytesDelta: 1048576,
        txBytesDelta: 2097152,
        online: simOnline,
      };
      const res = await adminApi.ingestTelemetry(payload);
      setSimResult(`Đã ghi nhận đo kiểm Telemetry id ${res.id}! Hệ thống đã kiểm tra ma trận cảnh báo & Root Cause Analysis tự động.`);
    } catch (err) {
      setSimResult('Lỗi gửi đo kiểm mô phỏng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-7 h-7 text-indigo-600" />
            Trung tâm Cảnh báo Ngưỡng & Ma trận Viễn thông
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập ngưỡng sai số mạng, độ trễ viễn thông và cơ chế kích hoạt gửi tin nhắn Telegram / Webhook tức thời
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-sm hover:bg-indigo-100 shadow-sm"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            Giả lập Telemetry
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm quy tắc mới
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            Đang tải danh mục quy tắc cảnh báo...
          </div>
        ) : rules.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-sm border border-dashed border-gray-300">
            <Bell className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            Chưa có quy tắc cảnh báo nào được cấu hình
          </div>
        ) : (
          rules.map((rule) => {
            let icon = <Activity className="w-5 h-5 text-indigo-600" />;
            if (rule.metricType === 'CPU') icon = <Cpu className="w-5 h-5 text-purple-600" />;
            if (rule.metricType === 'OFFLINE') icon = <WifiOff className="w-5 h-5 text-red-600" />;
            if (rule.metricType === 'PACKET_LOSS') icon = <AlertTriangle className="w-5 h-5 text-amber-600" />;

            return (
              <div
                key={rule.id}
                className={`bg-white rounded-sm border p-5 shadow-sm transition-all ${
                  rule.enabled ? 'border-gray-200 hover:shadow-md' : 'border-gray-200 opacity-60 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-sm bg-gray-50 border border-gray-100">{icon}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{rule.name}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                          rule.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggle(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Chỉ số giám sát:</span>
                    <span className="font-semibold text-gray-800 font-mono">{rule.metricType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Ngưỡng kích hoạt:</span>
                    <span className="font-semibold text-gray-800">
                      &gt; {rule.thresholdValue} {rule.metricType === 'LATENCY' ? 'ms' : '%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Kéo dài liên tục:</span>
                    <span className="font-medium text-gray-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {rule.durationMinutes} phút
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Kênh thông báo:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      <Radio className="w-3 h-3" />
                      {rule.notificationChannel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Đích nhận:</span>
                    <span className="font-mono text-gray-700 truncate max-w-[150px]">
                      {rule.recipientTarget || 'Mặc định'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Create Rule */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Thêm Quy tắc Cảnh báo Viễn thông
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Tên quy tắc</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cảnh báo suy hao quang & độ trễ cao"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Loại chỉ số</label>
                  <select
                    value={metricType}
                    onChange={(e: any) => setMetricType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  >
                    <option value="LATENCY">Độ trễ Ping (ms)</option>
                    <option value="PACKET_LOSS">Tỷ lệ mất gói Packet Loss (%)</option>
                    <option value="CPU">Tải CPU (%)</option>
                    <option value="MEMORY">Tải Bộ nhớ RAM (%)</option>
                    <option value="OFFLINE">Mất kết nối thiết bị</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Giá trị ngưỡng</label>
                  <input
                    type="number"
                    required
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Thời gian duy trì (Phút)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Mức độ nghiêm trọng</label>
                  <select
                    value={severity}
                    onChange={(e: any) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  >
                    <option value="WARNING">WARNING (Cảnh báo)</option>
                    <option value="CRITICAL">CRITICAL (Nghiêm trọng)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Kênh thông báo</label>
                  <select
                    value={notificationChannel}
                    onChange={(e: any) => setNotificationChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs"
                  >
                    <option value="TELEGRAM">Telegram Bot</option>
                    <option value="WEBHOOK">Webhook (HTTP POST)</option>
                    <option value="SMS">Tin nhắn SMS Brandname</option>
                    <option value="EMAIL">Email Hệ thống</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Đích nhận thông báo</label>
                  <input
                    type="text"
                    placeholder="@chat_id hoặc URL webhook"
                    value={recipientTarget}
                    onChange={(e) => setRecipientTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-xs font-mono"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 font-medium"
                >
                  Lưu quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Simulate Telemetry */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Giả lập Gói tin Đo kiểm Telemetry
              </h3>
              <button onClick={() => setShowSimulateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateTelemetry} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Device ID</label>
                  <input
                    type="number"
                    value={simDeviceId}
                    onChange={(e) => setSimDeviceId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Location ID</label>
                  <input
                    type="number"
                    value={simLocationId}
                    onChange={(e) => setSimLocationId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Độ trễ (ms)</label>
                  <input
                    type="number"
                    value={simLatency}
                    onChange={(e) => setSimLatency(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Mất gói (%)</label>
                  <input
                    type="number"
                    value={simPacketLoss}
                    onChange={(e) => setSimPacketLoss(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">CPU (%)</label>
                  <input
                    type="number"
                    value={simCpu}
                    onChange={(e) => setSimCpu(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="simOnline"
                  checked={simOnline}
                  onChange={(e) => setSimOnline(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="simOnline" className="text-gray-700 font-medium">
                  Thiết bị có tín hiệu nguồn (Online)
                </label>
              </div>

              {simResult && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-sm text-[11px]">
                  {simResult}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-sm"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 font-medium"
                >
                  Gửi đo kiểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
