import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, Signal, Smartphone, RotateCw, Clock, Cpu, MemoryStick, AlertTriangle, Radio, X } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { MeshApSnapshotDto, NetworkDeviceDto } from '../types/models';

interface Props {
  device: NetworkDeviceDto | null;
  onClose: () => void;
  onRefreshed?: () => void;
}

const MODE_TEXT: Record<string, string> = {
  LIVE: 'Đọc trực tiếp từ thiết bị',
  UNREACHABLE: 'Không kết nối được tới thiết bị',
  AUTH_FAILED: 'Thiết bị từ chối đăng nhập quản trị',
  ERROR: 'Lỗi khi đọc dữ liệu thiết bị',
  NOT_CONFIGURED: 'Thiết bị chưa khai báo IP quản trị',
  DISABLED: 'Chưa bật giám sát mesh trực tiếp trên máy chủ này',
};

const formatUptime = (sec?: number) => {
  if (sec == null) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d} ngày ${h} giờ` : `${h} giờ ${m} phút`;
};

const formatTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

const rssiClass = (rssi?: number | null) => {
  if (rssi == null) return 'text-slate-500 bg-slate-50 border-slate-200';
  if (rssi >= -65) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (rssi >= -75) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};

/**
 * Chi tiết mesh AP đọc trực tiếp từ thiết bị qua API ubus (không qua Grandstream, không dữ liệu giả lập).
 */
export const MeshApModal: React.FC<Props> = ({ device, onClose, onRefreshed }) => {
  const [snap, setSnap] = useState<MeshApSnapshotDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!device) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getMeshApSnapshot(device.id, true);
      setSnap(data);
      onRefreshed?.();
    } catch (err: any) {
      setError(err?.message || 'Không tải được dữ liệu mesh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSnap(null);
    if (device) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device?.id]);

  useEffect(() => {
    if (!device) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [device, onClose]);

  if (!device) return null;
  const live = snap?.monitoringMode === 'LIVE';
  const clients = snap?.clients ?? [];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Trạm phát Mesh {snap?.model || device.model || ''}</h3>
              <p className="text-xs text-slate-500 font-mono">
                {device.macAddress} · {device.ipAddress || 'chưa có IP'} · {device.locationName || 'Chưa gán điểm'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Đọc lại
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 p-1.5 rounded-lg transition cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">{error}</div>}

          {loading && !snap ? (
            <div className="py-12 text-center text-slate-400 text-xs">Đang đọc dữ liệu trực tiếp từ thiết bị mesh...</div>
          ) : snap ? (
            <>
              <div
                className={`flex items-start gap-2 p-3 rounded border text-xs ${
                  live ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {live ? <Radio className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                <div>
                  <div className="font-bold">{MODE_TEXT[snap.monitoringMode] || snap.monitoringMode}</div>
                  {!live && snap.message && <div className="mt-0.5">{snap.message}</div>}
                  <div className="mt-0.5 opacity-80">
                    Lần đọc: {formatTime(snap.fetchedAt)}
                    {snap.lastSuccessAt && !live && <> · Lần đọc thành công gần nhất: {formatTime(snap.lastSuccessAt)}</>}
                  </div>
                </div>
              </div>

              {live && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Số serial / Firmware</span>
                      <span className="font-mono font-bold text-slate-900 block mt-0.5">{snap.serialNumber || '—'}</span>
                      <span className="text-slate-600">{snap.firmwareVersion || '—'}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        Mật khẩu: {snap.credentialState === 'MANAGED' ? 'quản lý chung' : snap.credentialState === 'FACTORY' ? 'gốc (S/N)' : '—'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Thời gian hoạt động
                      </span>
                      <span className="font-bold text-slate-900 block mt-0.5">{formatUptime(snap.uptimeSeconds)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase flex items-center gap-1">
                        <MemoryStick className="w-3 h-3" /> RAM đang dùng
                      </span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {snap.memoryUsagePercent != null ? `${snap.memoryUsagePercent}%` : '—'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> Tải hệ thống (1 phút)
                      </span>
                      <span className="font-bold text-slate-900 block mt-0.5">{snap.loadAverage1m ?? '—'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Sóng phát (SSID / kênh)</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {snap.radios.map((r, i) => (
                        <div key={i} className="p-3 border border-slate-200 rounded-sm text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{r.band || 'Radio'}</span>
                            <span className="font-mono text-slate-500">Kênh {r.channel ?? '—'}</span>
                          </div>
                          {r.ssids.map((s, j) => (
                            <div key={j} className="mt-1.5 flex items-center justify-between text-slate-600">
                              <span className="font-semibold">{s.ssid || '(ẩn)'}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  s.security === 'OPEN'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {s.security === 'OPEN' ? 'MỞ (portal)' : s.security || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Thiết bị người dùng đang kết nối ({clients.length})</h4>
                    {clients.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-sm">
                        Hiện chưa có thiết bị nào kết nối vào trạm phát này.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-sm overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                              <th className="py-2.5 px-3">Thiết bị</th>
                              <th className="py-2.5 px-3 font-mono">MAC / IP</th>
                              <th className="py-2.5 px-3 text-center">Băng tần</th>
                              <th className="py-2.5 px-3 text-center">Tốc độ liên kết</th>
                              <th className="py-2.5 px-3 text-center">RSSI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {clients.map((c) => (
                              <tr key={c.mac} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-bold text-slate-900">{c.hostname || 'Không rõ tên'}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 ml-5">{c.ssid}</div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                  <div>{c.mac}</div>
                                  <div className="text-slate-400">{c.ip || '—'}</div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                      c.band === '5GHz'
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {c.band || '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono">
                                  {c.linkSpeedMbps != null ? `${c.linkSpeedMbps} Mbps` : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${rssiClass(c.rssi)}`}
                                  >
                                    <Signal className="w-3 h-3" /> {c.rssi != null ? `${c.rssi} dBm` : 'không có'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <span className="text-slate-500 text-[11px]">Nguồn: API quản trị của thiết bị mesh (đọc trực tiếp, không qua Grandstream)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
