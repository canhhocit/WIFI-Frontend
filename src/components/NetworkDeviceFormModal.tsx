import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Router, Radio, Server, Cpu } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { LocationDto, NetworkDeviceDto } from '../types/models';
import { AlertBanner } from './AlertBanner';

interface NetworkDeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device?: NetworkDeviceDto | null;
  defaultLocationId?: number;
  locations: LocationDto[];
}

export const NetworkDeviceFormModal: React.FC<NetworkDeviceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  device,
  defaultLocationId,
  locations,
}) => {
  const [formData, setFormData] = useState({
    locationId: '' as string | number,
    name: '',
    deviceType: 'ROUTER',
    macAddress: '',
    serialNumber: '',
    model: 'GWN7002',
    vendor: 'Grandstream',
    ipAddress: '',
    gwnNetworkId: '',
    status: 'ONLINE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (device) {
      setFormData({
        locationId: device.locationId ?? '',
        name: device.name || '',
        deviceType: device.deviceType || 'ACCESS_POINT',
        macAddress: device.macAddress || '',
        serialNumber: device.serialNumber || '',
        model: device.model || '',
        vendor: device.vendor || '',
        ipAddress: device.ipAddress || '',
        gwnNetworkId: device.gwnNetworkId || '',
        status: device.status || 'ONLINE',
      });
    } else {
      setFormData({
        locationId: defaultLocationId ?? '',
        name: '',
        deviceType: 'ROUTER',
        macAddress: '',
        serialNumber: '',
        model: 'GWN7002',
        vendor: 'Grandstream',
        ipAddress: '',
        gwnNetworkId: '',
        status: 'ONLINE',
      });
    }
  }, [isOpen, device, defaultLocationId]);

  const handleTypeChange = (nextType: string) => {
    setFormData((prev) => {
      const autoModel =
        nextType === 'ROUTER'
          ? 'GWN7002'
          : nextType === 'ACCESS_POINT'
          ? 'vAP-32X6V1'
          : nextType === 'ONT'
          ? 'ONT'
          : 'Switch';
      const autoVendor =
        nextType === 'ROUTER'
          ? 'Grandstream'
          : nextType === 'ACCESS_POINT'
          ? 'Viettel High Tech'
          : 'Viettel';
      return {
        ...prev,
        deviceType: nextType,
        model: !device ? autoModel : prev.model,
        vendor: !device ? autoVendor : prev.vendor,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        locationId: formData.locationId ? Number(formData.locationId) : null,
        name: formData.name.trim() || undefined,
        deviceType: formData.deviceType,
        macAddress: formData.macAddress.trim().toUpperCase(),
        serialNumber: formData.serialNumber.trim(),
        model: formData.model.trim() || undefined,
        vendor: formData.vendor.trim() || undefined,
        ipAddress: formData.ipAddress.trim() || undefined,
        gwnNetworkId: formData.gwnNetworkId.trim() || undefined,
        status: formData.status,
      };

      if (device) {
        await adminApi.updateNetworkDevice(device.id, payload);
      } else {
        await adminApi.createNetworkDevice(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu thông tin thiết bị.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderTypeIcon = () => {
    switch (formData.deviceType) {
      case 'ROUTER':
        return <Router className="w-4 h-4 text-[#004b87]" />;
      case 'ACCESS_POINT':
        return <Radio className="w-4 h-4 text-emerald-600" />;
      case 'ONT':
        return <Server className="w-4 h-4 text-indigo-600" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-600" />;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-sm shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            {renderTypeIcon()}
            <h3 className="font-bold text-slate-900 text-sm">
              {device ? `Cập nhật & Gán điểm: ${device.macAddress}` : 'Thêm Mới Thiết Bị Hạ Tầng (GWN / AP)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
            {error && <AlertBanner type="error" message={error} />}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nhà văn hóa lắp đặt</label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004b87]"
              >
                <option value="">-- Chưa gán điểm (Kho thiết bị) --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.locationCode ? `(${loc.locationCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại thiết bị <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                >
                  <option value="ROUTER">Router Gateway (Grandstream GWN)</option>
                  <option value="ACCESS_POINT">Trạm phát Wi-Fi / Mesh AP</option>
                  <option value="ONT">Modem quang (ONT)</option>
                  <option value="SWITCH">Switch chia mạng</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên gợi nhớ tại điểm</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="vd: Router chính / AP Hội trường"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Địa chỉ MAC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value.toUpperCase() })}
                  placeholder="EC:74:D7:98:B0:42"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số Serial (S/N) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="vd: EC74D798B042 hoặc VTGRB..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hãng sản xuất (Vendor)</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Grandstream / Viettel High Tech"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Model thiết bị</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="GWN7002 / vAP-32X6V1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">IP quản trị (LAN/WAN)</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="vd: 192.168.80.111"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                >
                  <option value="ONLINE">ONLINE (Đang hoạt động)</option>
                  <option value="OFFLINE">OFFLINE (Mất kết nối)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Bảo trì)</option>
                  <option value="UNKNOWN">UNKNOWN (Chưa kiểm tra)</option>
                </select>
              </div>
            </div>

            {formData.deviceType === 'ROUTER' && (
              <div className="bg-slate-50 border border-slate-200 rounded-sm p-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  GWN Cloud Network ID (Tùy chọn — Để trống nếu dùng mặc định)
                </label>
                <input
                  type="text"
                  value={formData.gwnNetworkId}
                  onChange={(e) => setFormData({ ...formData, gwnNetworkId: e.target.value })}
                  placeholder="Mặc định lấy từ cấu hình hệ thống (vd: 2214)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-sm bg-white font-mono focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                />
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#004b87] hover:bg-[#003865] rounded-sm disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {device ? 'Lưu cập nhật' : 'Thêm thiết bị'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
