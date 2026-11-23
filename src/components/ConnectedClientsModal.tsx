import React from 'react';
import { Users, Wifi, Signal, ArrowDown, ArrowUp, Clock, X, Smartphone } from 'lucide-react';
import { GwnClientDto, NetworkDeviceDto } from '../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  device: NetworkDeviceDto | null;
  clients: GwnClientDto[];
  loading: boolean;
}

export const ConnectedClientsModal: React.FC<Props> = ({ isOpen, onClose, device, clients, loading }) => {
  if (!isOpen || !device) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getRssiColor = (rssi: number | null) => {
    if (rssi == null) return 'text-slate-500 bg-slate-50 border-slate-200';
    if (rssi >= -65) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (rssi >= -75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-md max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh Sách Người Dùng Kết Nối Thực Tế</h3>
              <p className="text-xs text-slate-500 font-mono">
                {device.model} ({device.macAddress}) · Điểm: {device.locationName || 'Nhà văn hóa'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">TỔNG THIẾT BỊ ĐANG BẮT SÓNG</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">{clients.length} người</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">BĂNG TẦN ƯU TIÊN</span>
              <span className="text-lg font-bold text-sky-600 mt-0.5 block">
                {clients.filter(c => c.radioBand === '5GHz').length} máy (5GHz)
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">RSSI TRUNG BÌNH</span>
              <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
                {(() => {
                  const vals = clients.map(c => c.rssi).filter((v): v is number => v != null);
                  return vals.length ? `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)} dBm` : '—';
                })()}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Đang tải danh sách kết nối...
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Hiện tại chưa có người dùng nào kết nối tới điểm phát sóng này.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-2.5 px-3">Thiết bị / Hostname</th>
                    <th className="py-2.5 px-3 font-mono">Địa chỉ MAC / IP</th>
                    <th className="py-2.5 px-3 text-center">Băng tần</th>
                    <th className="py-2.5 px-3 text-center">Cường độ sóng (RSSI)</th>
                    <th className="py-2.5 px-3 text-right">Lưu lượng (Tải / Lên)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-900">{c.hostname || 'Client'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <div>{c.mac}</div>
                        <div className="text-slate-400">{c.ip}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          c.radioBand === '5GHz' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.radioBand}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getRssiColor(c.rssi)}`}>
                          <Signal className="w-3 h-3" /> {c.rssi != null ? `${c.rssi} dBm` : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">
                        <div className="flex items-center justify-end gap-1 text-emerald-700">
                          <ArrowDown className="w-3 h-3" /> {formatBytes(c.bytesRx)}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <ArrowUp className="w-3 h-3" /> {formatBytes(c.bytesTx)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <span className="text-slate-500 text-[11px]">Nguồn: Grandstream Cloud Open API (trống nếu chưa cấu hình App ID/Secret)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm text-slate-700 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
