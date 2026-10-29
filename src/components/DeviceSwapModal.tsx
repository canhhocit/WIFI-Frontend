import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { NetworkDeviceDto } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device?: NetworkDeviceDto | null;
}

export const DeviceSwapModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, device }) => {
  const [deviceType, setDeviceType] = useState<string>(device?.deviceType || 'ROUTER');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newMacAddress, setNewMacAddress] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [swapReason, setSwapReason] = useState('Hỏng cổng WAN do chập điện / sét đánh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device?.locationId) {
      setError('Thiết bị cần gán với một điểm phát sóng cụ thể để thực hiện hoán đổi');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminApi.swapNetworkDevice({
        locationId: device.locationId,
        oldDeviceId: device.id,
        deviceType,
        newSerialNumber: newSerialNumber.trim(),
        newMacAddress: newMacAddress.trim().toUpperCase(),
        newModel: newModel.trim() || undefined,
        newVendor: newVendor.trim() || undefined,
        swapReason: swapReason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi hoán đổi thiết bị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded border border-slate-300 shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            Ghi nhận thay thế thiết bị hỏng (Màn hình A10)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          <div className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
            <div className="text-gray-500 font-medium">Thiết bị cũ cần thay thế:</div>
            <div className="font-semibold text-gray-800">{device?.model} ({device?.deviceType})</div>
            <div className="font-mono text-gray-600">MAC cũ: {device?.macAddress} | SN: {device?.serialNumber}</div>
            <div className="text-gray-600">Điểm: {device?.locationName}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Loại thiết bị *</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ROUTER">Router chính</option>
                <option value="ACCESS_POINT">Access Point (AP)</option>
                <option value="ONT">Modem Quang (ONT)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hãng sản xuất</label>
              <input
                type="text"
                placeholder="Mikrotik / Ruijie / Cisco"
                value={newVendor}
                onChange={(e) => setNewVendor(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Số Serial mới *</label>
              <input
                type="text"
                required
                placeholder="SN-XXXX-XXXX"
                value={newSerialNumber}
                onChange={(e) => setNewSerialNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Địa chỉ MAC mới *</label>
              <input
                type="text"
                required
                placeholder="XX:XX:XX:XX:XX:XX"
                value={newMacAddress}
                onChange={(e) => setNewMacAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-sm text-xs font-mono focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87] uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Model thiết bị mới</label>
            <input
              type="text"
              placeholder="Ví dụ: RG-RAP2200(E) hoặc RB750Gr3"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-sm text-xs focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lý do thay thế phần cứng *</label>
            <textarea
              required
              rows={2}
              value={swapReason}
              onChange={(e) => setSwapReason(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-sm text-xs focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87]"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-sm text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] disabled:opacity-50 text-white rounded-sm text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Xác nhận thay thiết bị
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

