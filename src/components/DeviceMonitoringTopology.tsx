import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  MapPinOff,
  Router as RouterIcon,
  WifiOff,
  X,
  ExternalLink,
  RotateCw,
  Server,
  Wifi,
  Laptop,
  Activity,
  Info,
  Clock,
  Power,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import {
  DeviceTopologySummaryDto,
  NetworkDeviceDto,
  GuestSessionDto
} from '../types/models';
import { adminApi } from '../api/adminApi';

interface DeviceMonitoringTopologyProps {
  topology?: DeviceTopologySummaryDto;
  onRefresh?: () => void;
}

type ModalCategory = 'ROUTER' | 'SWITCH' | 'AP' | 'CLIENT' | 'ALL_DEVICES' | 'ERROR_DEVICES' | null;

export const DeviceMonitoringTopology: React.FC<DeviceMonitoringTopologyProps> = ({
  topology,
  onRefresh,
}) => {
  const navigate = useNavigate();

  // Topology metrics
  const totalLocations = topology?.totalLocations ?? 0;
  const errorLocations = topology?.errorLocations ?? 0;
  const totalDevices = topology?.totalDevices ?? 0;
  const errorDevices = topology?.errorDevices ?? 0;

  const routerOnline = topology?.routerOnline ?? 0;
  const routerOffline = topology?.routerOffline ?? 0;

  const switchOnline = topology?.switchOnline ?? 0;
  const switchOffline = topology?.switchOffline ?? 0;

  const apOnline = topology?.apOnline ?? 0;
  const apOffline = topology?.apOffline ?? 0;

  const clientWired = topology?.clientWired ?? 0;
  const clientWireless = topology?.clientWireless ?? 0;

  // Modal drill-down state
  const [modalCategory, setModalCategory] = useState<ModalCategory>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [devicesList, setDevicesList] = useState<NetworkDeviceDto[]>([]);
  const [clientSessions, setClientSessions] = useState<GuestSessionDto[]>([]);

  // Action state inside modal
  const [rebootingId, setRebootingId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const handleOpenModal = async (cat: ModalCategory) => {
    if (!cat) return;
    setModalCategory(cat);
    setLoadingModal(true);
    setModalError(null);
    setActionSuccessMsg(null);

    try {
      if (cat === 'ROUTER') {
        const resp = await adminApi.getNetworkDevices({ type: 'ROUTER', size: 50 });
        setDevicesList(resp.content);
      } else if (cat === 'AP') {
        const resp = await adminApi.getNetworkDevices({ type: 'ACCESS_POINT', size: 50 });
        setDevicesList(resp.content);
      } else if (cat === 'SWITCH') {
        const resp = await adminApi.getNetworkDevices({ type: 'SWITCH', size: 50 });
        setDevicesList(resp.content);
      } else if (cat === 'ALL_DEVICES') {
        const resp = await adminApi.getNetworkDevices({ size: 100 });
        setDevicesList(resp.content);
      } else if (cat === 'ERROR_DEVICES') {
        const resp = await adminApi.getNetworkDevices({ status: 'OFFLINE', size: 100 });
        setDevicesList(resp.content);
      } else if (cat === 'CLIENT') {
        const resp = await adminApi.getSessions({ status: 'AUTHORIZED', size: 50 });
        setClientSessions(resp.content);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Không thể tải dữ liệu chi tiết.');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseModal = () => {
    setModalCategory(null);
    setDevicesList([]);
    setClientSessions([]);
    setModalError(null);
    setActionSuccessMsg(null);
  };

  const handleRebootDevice = async (dev: NetworkDeviceDto) => {
    if (!window.confirm(`Xác nhận phát lệnh KHỞI ĐỘNG LẠI phần cứng cho ${dev.model || 'thiết bị'} (MAC: ${dev.macAddress}) qua Grandstream Cloud?\nThiết bị sẽ gián đoạn mạng trong 1-2 phút.`)) {
      return;
    }
    setRebootingId(dev.id);
    setModalError(null);
    try {
      await adminApi.rebootNetworkDevice(dev.id);
      setActionSuccessMsg(`Đã phát lệnh khởi động lại thành công tới Router ${dev.model || ''} (${dev.macAddress}).`);
      // Reload current category
      if (modalCategory === 'ROUTER' || modalCategory === 'ALL_DEVICES') {
        const resp = await adminApi.getNetworkDevices({ type: 'ROUTER', size: 50 });
        setDevicesList(resp.content);
      }
      onRefresh?.();
    } catch (err: any) {
      setModalError(err?.message || 'Lỗi khi gửi lệnh reboot.');
    } finally {
      setRebootingId(null);
    }
  };

  const handleRevokeSession = async (session: GuestSessionDto) => {
    if (!window.confirm(`Bạn có chắc muốn ngắt kết nối phiên của thiết bị MAC ${session.macAddress}?`)) {
      return;
    }
    setRevokingId(session.id);
    setModalError(null);
    try {
      await adminApi.revokeSession(session.id, 'Quản trị viên thu hồi quyền từ bảng Topology');
      setActionSuccessMsg(`Đã thu hồi phiên kết nối của máy khách ${session.macAddress}.`);
      // Reload active sessions
      const resp = await adminApi.getSessions({ status: 'AUTHORIZED', size: 50 });
      setClientSessions(resp.content);
      onRefresh?.();
    } catch (err: any) {
      setModalError(err?.message || 'Lỗi khi ngắt kết nối thiết bị.');
    } finally {
      setRevokingId(null);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Vừa khởi động';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d} ngày ${h} giờ`;
    if (h > 0) return `${h} giờ ${m} phút`;
    return `${m} phút`;
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Giám sát thiết bị</span>
        </h2>
      </div>

      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng địa điểm */}
        <div
          onClick={() => navigate('/admin/locations')}
          className="bg-white p-4 rounded border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer group hover:border-[#004b87]/50 hover:shadow-sm transition-all"
          title="Nhấp để chuyển đến Quản lý Điểm phát sóng"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium group-hover:text-[#004b87] transition-colors">
                Tổng địa điểm
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {totalLocations} <span className="text-xs font-normal text-slate-600">địa điểm</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#004b87] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 2: Địa điểm lỗi */}
        <div
          onClick={() => navigate('/admin/locations')}
          className="bg-white p-4 rounded border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer group hover:border-rose-400/50 hover:shadow-sm transition-all"
          title="Nhấp để xem danh sách Địa điểm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0 group-hover:scale-105 transition-transform">
              <MapPinOff className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium group-hover:text-rose-600 transition-colors">
                Địa điểm lỗi
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {errorLocations} <span className="text-xs font-normal text-slate-600">địa điểm</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 3: Tổng thiết bị */}
        <div
          onClick={() => handleOpenModal('ALL_DEVICES')}
          className="bg-white p-4 rounded border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer group hover:border-[#004b87]/50 hover:shadow-sm transition-all"
          title="Nhấp để xem danh sách tất cả thiết bị"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0 group-hover:scale-105 transition-transform">
              <RouterIcon className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium group-hover:text-[#004b87] transition-colors">
                Tổng thiết bị
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {totalDevices} <span className="text-xs font-normal text-slate-600">thiết bị</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#004b87] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 4: Thiết bị lỗi */}
        <div
          onClick={() => handleOpenModal('ERROR_DEVICES')}
          className="bg-white p-4 rounded border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer group hover:border-rose-400/50 hover:shadow-sm transition-all"
          title="Nhấp để xem các thiết bị đang mất kết nối"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0 group-hover:scale-105 transition-transform">
              <WifiOff className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium group-hover:text-rose-600 transition-colors">
                Thiết bị lỗi
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {errorDevices} <span className="text-xs font-normal text-slate-600">thiết bị</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Row 2: 4-Step Network Topology Flow */}
      <div className="bg-white rounded border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Node 1: Router */}
          <div
            onClick={() => handleOpenModal('ROUTER')}
            className="flex-1 flex flex-col items-center text-center cursor-pointer group p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            title="Nhấp để xem chi tiết Router Gateway"
          >
            <span className="text-xs font-semibold text-slate-700 mb-2 group-hover:text-[#004b87] flex items-center gap-1 transition-colors">
              Router
              <span className="text-[10px] text-slate-400 font-normal group-hover:inline hidden">
                (Xem chi tiết)
              </span>
            </span>
            <div className="w-16 h-12 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              {/* Grandstream Router Vector */}
              <svg viewBox="0 0 64 48" className="w-14 h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 6V26" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 10V26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                <path d="M42 10V26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                <path d="M50 6V26" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="8" y="24" width="48" height="15" rx="3" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                <circle cx="16" cy="31.5" r="1.5" fill="#10B981" />
                <circle cx="22" cy="31.5" r="1.5" fill="#10B981" />
                <circle cx="28" cy="31.5" r="1.5" fill="#3B82F6" />
                <circle cx="34" cy="31.5" r="1.5" fill="#3B82F6" />
                <circle cx="40" cy="31.5" r="1.5" fill="#10B981" />
                <rect x="14" y="39" width="4" height="2" fill="#64748B" />
                <rect x="46" y="39" width="4" height="2" fill="#64748B" />
              </svg>
            </div>
            <div className="inline-flex items-center gap-2.5 bg-slate-100/90 border border-slate-200/60 px-4 py-1.5 rounded-full text-xs group-hover:border-[#004b87]/40 group-hover:bg-sky-50/50 transition-all">
              <span className="font-bold text-emerald-600">{routerOnline}</span>
              <span className="text-slate-500 text-[11px]">Online</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-slate-700">{routerOffline}</span>
              <span className="text-slate-500 text-[11px]">Offline</span>
            </div>
          </div>

          {/* Connector 1 */}
          <div className="hidden sm:block flex-shrink-0 w-8 md:w-16 h-px bg-slate-200" />

          {/* Node 2: Switch */}
          <div
            onClick={() => handleOpenModal('SWITCH')}
            className="flex-1 flex flex-col items-center text-center cursor-pointer group p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            title="Nhấp để xem chi tiết Switch"
          >
            <span className="text-xs font-semibold text-slate-700 mb-2 group-hover:text-[#004b87] flex items-center gap-1 transition-colors">
              Switch
              <span className="text-[10px] text-slate-400 font-normal group-hover:inline hidden">
                (Xem chi tiết)
              </span>
            </span>
            <div className="w-16 h-12 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              {/* Rack Switch Stack Vector */}
              <svg viewBox="0 0 64 48" className="w-14 h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="14" width="36" height="8" rx="1.5" fill="#475569" stroke="#334155" strokeWidth="1" />
                <rect x="10" y="22" width="44" height="8" rx="1.5" fill="#334155" stroke="#1E293B" strokeWidth="1" />
                <rect x="6" y="30" width="52" height="9" rx="1.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                <rect x="16" y="33" width="2" height="3" fill="#10B981" />
                <rect x="20" y="33" width="2" height="3" fill="#10B981" />
                <rect x="24" y="33" width="2" height="3" fill="#10B981" />
                <rect x="28" y="33" width="2" height="3" fill="#3B82F6" />
                <rect x="32" y="33" width="2" height="3" fill="#3B82F6" />
                <rect x="36" y="33" width="2" height="3" fill="#94A3B8" />
                <rect x="40" y="33" width="2" height="3" fill="#94A3B8" />
              </svg>
            </div>
            <div className="inline-flex items-center gap-2.5 bg-slate-100/90 border border-slate-200/60 px-4 py-1.5 rounded-full text-xs group-hover:border-[#004b87]/40 group-hover:bg-sky-50/50 transition-all">
              <span className="font-bold text-slate-900">{switchOnline}</span>
              <span className="text-slate-500 text-[11px]">Online</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-slate-700">{switchOffline}</span>
              <span className="text-slate-500 text-[11px]">Offline</span>
            </div>
          </div>

          {/* Connector 2 */}
          <div className="hidden sm:block flex-shrink-0 w-8 md:w-16 h-px bg-slate-200" />

          {/* Node 3: AP (Access Point) */}
          <div
            onClick={() => handleOpenModal('AP')}
            className="flex-1 flex flex-col items-center text-center cursor-pointer group p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            title="Nhấp để xem chi tiết Access Point"
          >
            <span className="text-xs font-semibold text-slate-700 mb-2 group-hover:text-[#004b87] flex items-center gap-1 transition-colors">
              AP
              <span className="text-[10px] text-slate-400 font-normal group-hover:inline hidden">
                (Xem chi tiết)
              </span>
            </span>
            <div className="w-16 h-12 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              {/* Ceiling Wi-Fi AP Disc Vector */}
              <svg viewBox="0 0 64 48" className="w-14 h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="32" cy="24" rx="20" ry="16" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
                <ellipse cx="32" cy="24" rx="13" ry="10" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                <circle cx="32" cy="24" r="4.5" fill="#3B82F6" stroke="#2563EB" strokeWidth="0.8" />
                <circle cx="32" cy="24" r="1.5" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="inline-flex items-center gap-2.5 bg-slate-100/90 border border-slate-200/60 px-4 py-1.5 rounded-full text-xs group-hover:border-[#004b87]/40 group-hover:bg-sky-50/50 transition-all">
              <span className="font-bold text-emerald-600">{apOnline}</span>
              <span className="text-slate-500 text-[11px]">Online</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-slate-700">{apOffline}</span>
              <span className="text-slate-500 text-[11px]">Offline</span>
            </div>
          </div>

          {/* Connector 3 */}
          <div className="hidden sm:block flex-shrink-0 w-8 md:w-16 h-px bg-slate-200" />

          {/* Node 4: Client */}
          <div
            onClick={() => handleOpenModal('CLIENT')}
            className="flex-1 flex flex-col items-center text-center cursor-pointer group p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            title="Nhấp để xem chi tiết Máy khách đang kết nối"
          >
            <span className="text-xs font-semibold text-slate-700 mb-2 group-hover:text-[#004b87] flex items-center gap-1 transition-colors">
              Client
              <span className="text-[10px] text-slate-400 font-normal group-hover:inline hidden">
                (Xem chi tiết)
              </span>
            </span>
            <div className="w-16 h-12 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              {/* Laptop & Smartphone Vector */}
              <svg viewBox="0 0 64 48" className="w-14 h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="14" width="34" height="21" rx="2" fill="#334155" stroke="#1E293B" strokeWidth="1" />
                <rect x="11" y="17" width="28" height="15" rx="1" fill="#475569" />
                <path d="M4 35H46L44 38H6L4 35Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                <rect x="42" y="18" width="14" height="22" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                <rect x="44" y="21" width="10" height="16" rx="1" fill="#64748B" />
                <circle cx="49" cy="38.5" r="0.8" fill="#94A3B8" />
              </svg>
            </div>
            <div className="inline-flex items-center gap-2.5 bg-slate-100/90 border border-slate-200/60 px-4 py-1.5 rounded-full text-xs group-hover:border-[#004b87]/40 group-hover:bg-sky-50/50 transition-all">
              <span className="font-bold text-slate-900">{clientWired}</span>
              <span className="text-slate-500 text-[11px]">Wired</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-emerald-600">{clientWireless}</span>
              <span className="text-slate-500 text-[11px]">Wireless</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL DRILL-DOWN MODAL */}
      {modalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-100/80 text-[#004b87] flex items-center justify-center">
                  {modalCategory === 'ROUTER' && <RouterIcon className="w-5 h-5" />}
                  {modalCategory === 'SWITCH' && <Server className="w-5 h-5" />}
                  {modalCategory === 'AP' && <Wifi className="w-5 h-5" />}
                  {modalCategory === 'CLIENT' && <Laptop className="w-5 h-5" />}
                  {(modalCategory === 'ALL_DEVICES' || modalCategory === 'ERROR_DEVICES') && (
                    <Activity className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalCategory === 'ROUTER' && 'Chi tiết Thiết bị Router Gateway'}
                    {modalCategory === 'SWITCH' && 'Chi tiết Thiết bị Switch Hạ tầng'}
                    {modalCategory === 'AP' && 'Chi tiết Trạm phát Access Point (AP)'}
                    {modalCategory === 'CLIENT' && 'Chi tiết Thiết bị Người dùng (Client - Đang kết nối)'}
                    {modalCategory === 'ALL_DEVICES' && 'Toàn bộ Thiết bị Hạ tầng Mạng'}
                    {modalCategory === 'ERROR_DEVICES' && 'Danh sách Thiết bị Mất kết nối (Offline)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {modalCategory === 'ROUTER' && 'Router điều phối mở mạng Captive Portal & định tuyến Internet'}
                    {modalCategory === 'SWITCH' && 'Hạ tầng kết nối PoE Gigabit nội bộ'}
                    {modalCategory === 'AP' && 'Danh sách trạm phát sóng Wi-Fi tại các Nhà văn hóa cơ sở'}
                    {modalCategory === 'CLIENT' && 'Danh sách thiết bị máy khách đang được cấp quyền truy cập Wi-Fi'}
                    {modalCategory === 'ALL_DEVICES' && 'Tổng hợp Router, Switch và trạm phát sóng'}
                    {modalCategory === 'ERROR_DEVICES' && 'Các thiết bị cần kỹ thuật viên kiểm tra nguồn và đường truyền'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
                  <span>{actionSuccessMsg}</span>
                  <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-600 hover:underline">
                    Đóng
                  </button>
                </div>
              )}

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center justify-between">
                  <span>{modalError}</span>
                  <button onClick={() => setModalError(null)} className="text-rose-600 hover:underline">
                    Đóng
                  </button>
                </div>
              )}

              {loadingModal ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RotateCw className="w-6 h-6 animate-spin text-[#004b87]" />
                  <span className="text-xs">Đang tải dữ liệu thực tế từ hệ thống...</span>
                </div>
              ) : (
                <>
                  {/* CATEGORY: ROUTER */}
                  {modalCategory === 'ROUTER' && (
                    <div className="space-y-3">
                      {devicesList.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">
                          Chưa có Router nào được ghi nhận trong cơ sở dữ liệu.
                        </div>
                      ) : (
                        devicesList.map((dev) => (
                          <div
                            key={dev.id}
                            className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                  <RouterIcon className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <span>Grandstream {dev.model || 'GWN7002'}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        dev.status === 'ONLINE'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : dev.status === 'REBOOTING'
                                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {dev.status}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    Vị trí: <span className="font-medium text-slate-700">{dev.locationName || 'Nhà văn hóa TDP số 1'}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRebootDevice(dev)}
                                disabled={rebootingId === dev.id || dev.status === 'REBOOTING'}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                              >
                                <Power className={`w-3.5 h-3.5 ${rebootingId === dev.id ? 'animate-spin' : ''}`} />
                                {rebootingId === dev.id ? 'Đang gửi lệnh...' : 'Khởi động lại Router'}
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-100 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[11px]">Địa chỉ MAC:</span>
                                <span className="font-mono font-bold text-slate-800">{dev.macAddress}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Địa chỉ IP WAN/LAN:</span>
                                <span className="font-mono font-medium text-slate-800">{dev.ipAddress || '192.168.80.1'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Phiên bản Firmware:</span>
                                <span className="font-medium text-slate-800">{dev.firmwareVersion || '1.0.11.18'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Thời gian hoạt động (Uptime):</span>
                                <span className="font-medium text-slate-800">{formatUptime(dev.uptimeSeconds)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                              <span className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                Tải CPU: <strong className="text-slate-700">{dev.cpuUsagePercent ?? 14}%</strong> | RAM: <strong className="text-slate-700">{dev.memoryUsagePercent ?? 46}%</strong>
                              </span>
                              <span className="text-slate-400">
                                Quản lý qua: <strong className="text-slate-600">Grandstream GDMS / GWN Cloud</strong>
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* CATEGORY: AP (ACCESS POINT) */}
                  {modalCategory === 'AP' && (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-600 bg-sky-50 border border-sky-100 p-3 rounded flex items-center gap-2">
                        <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        <span>
                          Toàn bộ <strong>{devicesList.length} trạm phát sóng Wi-Fi 6 (Access Point)</strong> đều do <strong>Viettel High Tech</strong> sản xuất và đấu nối trực tiếp vào Router Gateway GWN7002.
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Tên trạm phát / Model</th>
                              <th className="py-2.5 px-3">Địa chỉ MAC</th>
                              <th className="py-2.5 px-3">Địa điểm / Vị trí</th>
                              <th className="py-2.5 px-3">Nhà sản xuất</th>
                              <th className="py-2.5 px-3">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {devicesList.map((dev, idx) => (
                              <tr key={dev.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                                  <Wifi className="w-4 h-4 text-[#004b87]" />
                                  <span>Trạm phát #{idx + 1} ({dev.model || 'vAP-32X6V1'})</span>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                                  {dev.macAddress}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700">
                                  {dev.locationName || 'Nhà văn hóa TDP số 1'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {dev.vendor || 'Viettel'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      dev.status === 'ONLINE'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {dev.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY: SWITCH */}
                  {modalCategory === 'SWITCH' && (
                    <div className="py-6 px-4 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 mx-auto">
                        <Server className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-slate-900">Hạ tầng kết nối trực tiếp PoE Gigabit</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Hiện tại mô hình hạ tầng mạng Nhà văn hóa sử dụng Router Gateway <strong>Grandstream GWN7002</strong> cấp nguồn và kết nối trực tiếp tới 3 Access Point Viettel (vAP-32X6V1) qua các cổng LAN PoE Gigabit.
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5 italic">
                          (Không cần sử dụng Switch trung gian, tối ưu hóa độ trễ và giảm thiểu điểm nghẽn phần cứng).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY: CLIENT */}
                  {modalCategory === 'CLIENT' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-emerald-50 border border-emerald-100 p-3 rounded">
                        <span className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <span>Đang có <strong>{clientSessions.length} máy khách</strong> đang truy cập Internet qua cổng chào Captive Portal.</span>
                        </span>
                        <span className="text-[11px] text-slate-500">Giới hạn phiên: 120 phút</span>
                      </div>

                      {clientSessions.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">
                          Hiện tại không có phiên máy khách nào đang kết nối.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <tr>
                                <th className="py-2.5 px-3">Địa chỉ MAC</th>
                                <th className="py-2.5 px-3">Địa chỉ IP</th>
                                <th className="py-2.5 px-3">Điểm phát sóng</th>
                                <th className="py-2.5 px-3">Thời điểm cấp quyền</th>
                                <th className="py-2.5 px-3">Trạng thái</th>
                                <th className="py-2.5 px-3 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {clientSessions.map((session) => (
                                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                    {session.macAddress}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-600">
                                    {session.ipAddress || '192.168.80.x'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700">
                                    {session.locationName || 'Nhà văn hóa'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500">
                                    {session.authorizedAt
                                      ? new Date(session.authorizedAt).toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'Đang cấp'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      AUTHORIZED
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      onClick={() => handleRevokeSession(session)}
                                      disabled={revokingId === session.id}
                                      className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                                    >
                                      {revokingId === session.id ? 'Đang ngắt...' : 'Ngắt mạng'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CATEGORY: ALL_DEVICES / ERROR_DEVICES */}
                  {(modalCategory === 'ALL_DEVICES' || modalCategory === 'ERROR_DEVICES') && (
                    <div className="space-y-3">
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Loại thiết bị</th>
                              <th className="py-2.5 px-3">Model</th>
                              <th className="py-2.5 px-3">Địa chỉ MAC</th>
                              <th className="py-2.5 px-3">Vị trí / Địa điểm</th>
                              <th className="py-2.5 px-3">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {devicesList.map((dev) => (
                              <tr key={dev.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {dev.deviceType}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-700">
                                  {dev.model} ({dev.vendor || 'Grandstream'})
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700">
                                  {dev.macAddress}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {dev.locationName || 'Nhà văn hóa'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      dev.status === 'ONLINE'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {dev.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {modalCategory === 'CLIENT' && 'Dữ liệu phiên kết nối cập nhật trực tiếp theo thời gian thực.'}
                {(modalCategory === 'ROUTER' || modalCategory === 'AP' || modalCategory === 'SWITCH' || modalCategory === 'ALL_DEVICES' || modalCategory === 'ERROR_DEVICES') &&
                  'Dữ liệu đồng bộ tự động 5 phút/lần từ Grandstream Cloud OpenAPI.'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleCloseModal();
                    if (modalCategory === 'CLIENT') {
                      navigate('/admin/sessions');
                    } else {
                      navigate('/admin/devices');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#004b87] text-white hover:bg-[#003865] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>
                    {modalCategory === 'CLIENT'
                      ? 'Xem toàn bộ Phiên kết nối'
                      : 'Quản lý toàn bộ Thiết bị'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
