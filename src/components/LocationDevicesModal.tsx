import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Router, Radio, Server, Cpu, Loader2, Unlink, Edit2, Link2 } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { LocationDto, NetworkDeviceDto } from '../types/models';
import { DeviceStatusBadge } from './DeviceStatusBadge';
import { AlertBanner } from './AlertBanner';
import { NetworkDeviceFormModal } from './NetworkDeviceFormModal';

interface LocationDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationDto | null;
  allLocations: LocationDto[];
  onUpdated?: () => void;
}

export const LocationDevicesModal: React.FC<LocationDevicesModalProps> = ({
  isOpen,
  onClose,
  location,
  allLocations,
  onUpdated,
}) => {
  const [devices, setDevices] = useState<NetworkDeviceDto[]>([]);
  const [unassigned, setUnassigned] = useState<NetworkDeviceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedUnassignedId, setSelectedUnassignedId] = useState<string>('');
  const [assignName, setAssignName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDeviceDto | null>(null);

  const loadData = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const [locDevs, freeDevs] = await Promise.all([
        adminApi.getNetworkDevicesByLocation(location.id),
        adminApi.getUnassignedNetworkDevices().catch(() => []),
      ]);
      setDevices(locDevs || []);
      setUnassigned(freeDevs || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách thiết bị của điểm phát.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && location) {
      setSelectedUnassignedId('');
      setAssignName('');
      loadData();
    }
  }, [isOpen, location?.id]);

  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !selectedUnassignedId) return;
    setAssigning(true);
    setError(null);
    try {
      await adminApi.assignNetworkDeviceLocation(Number(selectedUnassignedId), {
        locationId: location.id,
        name: assignName.trim() || undefined,
      });
      setSelectedUnassignedId('');
      setAssignName('');
      await loadData();
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể gán thiết bị vào điểm này.');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (dev: NetworkDeviceDto) => {
    if (!window.confirm(`Gỡ thiết bị ${dev.macAddress} khỏi điểm "${location?.name}"?`)) return;
    try {
      await adminApi.assignNetworkDeviceLocation(dev.id, { locationId: null });
      await loadData();
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể gỡ thiết bị khỏi điểm.');
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
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

  if (!isOpen || !location) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-sm shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Thiết bị hạ tầng tại: {location.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quản lý Router Grandstream GWN, Mesh AP Viettel và Modem gắn tại điểm phát
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingDevice(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mới GWN / AP
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {error && <AlertBanner type="error" message={error} />}

            {/* Quick Assign Unassigned Device */}
            <form
              onSubmit={handleAssignExisting}
              className="bg-slate-50 border border-slate-200 rounded-sm p-3.5 space-y-2"
            >
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#004b87]" />
                Gán nhanh thiết bị chưa có điểm (từ GWN Cloud / Mesh tự đẩy lên)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <select
                    value={selectedUnassignedId}
                    onChange={(e) => setSelectedUnassignedId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                  >
                    <option value="">
                      {unassigned.length > 0
                        ? `-- Chọn thiết bị chưa gán điểm (${unassigned.length}) --`
                        : '-- Không có thiết bị nào đang chờ gán --'}
                    </option>
                    {unassigned.map((u) => (
                      <option key={u.id} value={u.id}>
                        [{u.deviceType}] {u.model || u.vendor || 'Thiết bị'} — {u.macAddress}
                        {u.ipAddress ? ` (${u.ipAddress})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={assignName}
                    onChange={(e) => setAssignName(e.target.value)}
                    placeholder="Tên gợi nhớ (tùy chọn)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={!selectedUnassignedId || assigning}
                    className="w-full h-full px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-sm font-semibold cursor-pointer"
                  >
                    {assigning ? 'Đang gán...' : 'Gán vào điểm'}
                  </button>
                </div>
              </div>
            </form>

            {/* Assigned Devices List */}
            {loading ? (
              <div className="py-10 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
                Đang tải thiết bị của điểm phát...
              </div>
            ) : devices.length === 0 ? (
              <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-sm">
                Điểm phát này chưa được gán Router GWN hoặc Access Point nào.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3">Thiết bị & Hãng</th>
                      <th className="py-2.5 px-3">MAC / IP</th>
                      <th className="py-2.5 px-3">Serial (S/N)</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devices.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              {renderIcon(d.deviceType)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {d.name || (d.deviceType === 'ROUTER' ? 'Router Gateway' : d.deviceType)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {d.vendor || '—'} • {d.model || 'Tiêu chuẩn'}
                                {d.gwnNetworkId ? ` • Net #${d.gwnNetworkId}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-semibold text-slate-900">{d.macAddress}</div>
                          <div className="text-[11px] text-slate-400">{d.ipAddress || '—'}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{d.serialNumber}</td>
                        <td className="py-2.5 px-3">
                          <DeviceStatusBadge status={d.status} monitoringSource={d.monitoringSource} />
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDevice(d);
                              setFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm font-semibold cursor-pointer"
                            title="Sửa thông tin thiết bị"
                          >
                            <Edit2 className="w-3 h-3" /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnassign(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-sm font-semibold cursor-pointer"
                            title="Gỡ thiết bị khỏi Nhà văn hóa này"
                          >
                            <Unlink className="w-3 h-3" /> Gỡ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      <NetworkDeviceFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingDevice(null);
        }}
        onSuccess={() => {
          loadData();
          onUpdated?.();
        }}
        device={editingDevice}
        defaultLocationId={location.id}
        locations={allLocations}
      />
    </>,
    document.body
  );
};
