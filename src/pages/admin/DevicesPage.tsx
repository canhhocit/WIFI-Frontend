import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Search,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Monitor,
  Laptop,
  Server,
  Radio,
  Router,
  Repeat,
  RotateCw,
  Power,
  Cpu,
  Users,
  MapPin,
  Upload,
  KeyRound,
  Plus,
  Edit2,
  ChevronLeft,
  Building2,
  Wifi,
  WifiOff,
  AlertTriangle,
  Eye,
  User,
  X,
  FileText,
  Clock
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { DeviceDto, NetworkDeviceDto, DeviceTopologySummaryDto, GwnClientDto, LocationDto, GwnPortStatus, DeviceDetail } from '../../types/models';
import { AlertBanner } from '../../components/AlertBanner';
import { DeviceSwapModal } from '../../components/DeviceSwapModal';
import { DeviceMonitoringTopology } from '../../components/DeviceMonitoringTopology';
import { ConnectedClientsModal } from '../../components/ConnectedClientsModal';
import { MeshApModal } from '../../components/MeshApModal';
import { NetworkDeviceImportModal } from '../../components/NetworkDeviceImportModal';
import { NetworkDeviceFormModal } from '../../components/NetworkDeviceFormModal';
import { DeviceStatusBadge } from '../../components/DeviceStatusBadge';
import { Pagination } from '../../components/Pagination';
import { useRbac } from '../../utils/rbac';

export const DevicesPage: React.FC = () => {
  const { canCreate, canEdit } = useRbac('DEVICES');
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'INFRASTRUCTURE'>('CLIENT');

  // Topology data
  const [topologyData, setTopologyData] = useState<DeviceTopologySummaryDto | undefined>(undefined);

  // Client devices state
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Xem chi tiết thiết bị khách (lịch sử phiên cổng chào + khảo sát)
  const [detailDevice, setDetailDevice] = useState<DeviceDto | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<DeviceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ---- Infrastructure: quản lý THEO ĐỊA ĐIỂM (danh sách điểm -> chi tiết điểm) ----
  // Danh sách địa điểm (mức ngoài). Mỗi điểm hiện tóm tắt router + số thiết bị, scale 1500 điểm.
  const [infraLocs, setInfraLocs] = useState<LocationDto[]>([]);
  const [infraLocSearch, setInfraLocSearch] = useState('');
  const [infraLocPage, setInfraLocPage] = useState(0);
  const [infraLocPageSize, setInfraLocPageSize] = useState(12);
  const [infraLocTotalPages, setInfraLocTotalPages] = useState(1);
  const [infraLocTotalElements, setInfraLocTotalElements] = useState(0);
  const [loadingInfraLocs, setLoadingInfraLocs] = useState(false);

  // Chi tiết 1 điểm (hoặc nhóm "chưa gán điểm")
  const [selectedLoc, setSelectedLoc] = useState<LocationDto | null>(null);
  const [viewUnassigned, setViewUnassigned] = useState(false);
  const [locDevices, setLocDevices] = useState<NetworkDeviceDto[]>([]);
  const [loadingLocDevices, setLoadingLocDevices] = useState(false);
  const [locPorts, setLocPorts] = useState<GwnPortStatus | null>(null);

  // Device swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedDeviceForSwap, setSelectedDeviceForSwap] = useState<NetworkDeviceDto | null>(null);

  // Grandstream sync & reboot state
  const [syncingGwn, setSyncingGwn] = useState(false);
  const [refreshingMesh, setRefreshingMesh] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [deviceToReboot, setDeviceToReboot] = useState<NetworkDeviceDto | null>(null);
  const [rebootingId, setRebootingId] = useState<number | null>(null);

  // Connected clients state
  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [selectedDeviceForClients, setSelectedDeviceForClients] = useState<NetworkDeviceDto | null>(null);
  const [connectedClients, setConnectedClients] = useState<GwnClientDto[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Mesh AP: đọc trực tiếp từ thiết bị
  const [meshDevice, setMeshDevice] = useState<NetworkDeviceDto | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Create / Edit / Assign device modal
  const [deviceFormOpen, setDeviceFormOpen] = useState(false);
  const [editingNetDevice, setEditingNetDevice] = useState<NetworkDeviceDto | null>(null);
  const [allLocations, setAllLocations] = useState<LocationDto[]>([]);

  const loadLocationsList = async () => {
    if (allLocations.length > 0) return;
    try {
      const resp = await adminApi.getLocations({ size: 2000 });
      setAllLocations(resp.content || []);
    } catch {
      // Ignore silent error
    }
  };

  const handleViewClients = async (dev: NetworkDeviceDto) => {
    if (dev.deviceType === 'ACCESS_POINT' || dev.deviceType === 'AP') {
      setMeshDevice(dev);
      return;
    }
    setSelectedDeviceForClients(dev);
    setClientsModalOpen(true);
    setLoadingClients(true);
    try {
      const data = await adminApi.getConnectedClientsFromCloud(dev.id);
      setConnectedClients(data);
    } catch (err: any) {
      console.error('Failed to load connected clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CLIENT') {
      loadDevices();
    } else if (!selectedLoc && !viewUnassigned) {
      loadInfraLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, pageSize, infraLocPage, infraLocPageSize]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getDevices({ search: search.trim() || undefined, page, size: pageSize });
      setDevices(resp.content);
      setTotalPages(resp.totalPages);
      setTotalElements(resp.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách thiết bị khách.');
    } finally {
      setLoading(false);
    }
  };

  const loadTopology = async () => {
    try {
      const overview = await adminApi.getOverview();
      setTopologyData(overview.topology);
    } catch {
      // Ignore background overview error
    }
  };

  // Mức ngoài: danh sách địa điểm (tìm kiếm + phân trang).
  const loadInfraLocations = async () => {
    setLoadingInfraLocs(true);
    loadTopology();
    try {
      const resp = await adminApi.getLocations({
        query: infraLocSearch.trim() || undefined,
        page: infraLocPage,
        size: infraLocPageSize,
      });
      setInfraLocs(resp.content || []);
      setInfraLocTotalPages(resp.totalPages);
      setInfraLocTotalElements(resp.totalElements);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách địa điểm.');
    } finally {
      setLoadingInfraLocs(false);
    }
  };

  // Chi tiết 1 điểm: thiết bị tại điểm + "AP theo cổng GWN" của router điểm đó.
  const loadLocationDetail = async (loc: LocationDto) => {
    setLoadingLocDevices(true);
    setLocPorts(null);
    try {
      const devs = await adminApi.getNetworkDevicesByLocation(loc.id);
      setLocDevices(devs || []);
      adminApi.getGwnPortStatusByLocation(loc.id).then(setLocPorts).catch(() => setLocPorts(null));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thiết bị của địa điểm.');
    } finally {
      setLoadingLocDevices(false);
    }
  };

  // Nhóm thiết bị CHƯA GÁN điểm (để kỹ thuật viên gán vào điểm).
  const loadUnassignedDetail = async () => {
    setLoadingLocDevices(true);
    setLocPorts(null);
    try {
      const devs = await adminApi.getUnassignedNetworkDevices();
      setLocDevices(devs || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thiết bị chưa gán điểm.');
    } finally {
      setLoadingLocDevices(false);
    }
  };

  const openLocation = (loc: LocationDto) => {
    setViewUnassigned(false);
    setSelectedLoc(loc);
    loadLocationDetail(loc);
  };

  const openUnassigned = () => {
    setSelectedLoc(null);
    setViewUnassigned(true);
    loadUnassignedDetail();
  };

  const backToLocationList = () => {
    setSelectedLoc(null);
    setViewUnassigned(false);
    loadInfraLocations();
  };

  // Làm mới đúng khung đang xem (danh sách điểm / chi tiết điểm / chưa gán).
  const refreshInfra = () => {
    if (selectedLoc) loadLocationDetail(selectedLoc);
    else if (viewUnassigned) loadUnassignedDetail();
    else loadInfraLocations();
  };

  const handleSyncGrandstream = async () => {
    setSyncingGwn(true);
    setError(null);
    setSyncSuccessMsg(null);
    try {
      const res = await adminApi.syncGrandstreamDevices();
      setSyncSuccessMsg(res.message || `Đồng bộ thành công ${res.syncedCount} thiết bị từ Grandstream Cloud.`);
      refreshInfra();
      await loadTopology();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi đồng bộ dữ liệu từ Grandstream Cloud.');
    } finally {
      setSyncingGwn(false);
    }
  };

  const handleRefreshMeshStatus = async () => {
    setRefreshingMesh(true);
    setError(null);
    setSyncSuccessMsg(null);
    try {
      const count = await adminApi.refreshMeshStatus();
      setSyncSuccessMsg(`Đã làm mới trạng thái ${count ?? 0} mesh từ GWN Cloud (link cổng LAN).`);
      refreshInfra();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi làm mới trạng thái mesh từ GWN Cloud.');
    } finally {
      setRefreshingMesh(false);
    }
  };

  const handleConfirmReboot = async () => {
    if (!deviceToReboot) return;
    setRebootingId(deviceToReboot.id);
    setError(null);
    try {
      await adminApi.rebootNetworkDevice(deviceToReboot.id);
      setSyncSuccessMsg(`Đã phát lệnh khởi động lại thành công tới Router ${deviceToReboot.model || ''} (MAC: ${deviceToReboot.macAddress}). Thiết bị đang trong tiến trình Reboot.`);
      setDeviceToReboot(null);
      refreshInfra();
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi lệnh khởi động lại tới thiết bị.');
    } finally {
      setRebootingId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'CLIENT') {
      setPage(0);
      loadDevices();
    } else {
      setInfraLocPage(0);
      loadInfraLocations();
    }
  };

  const openDeviceDetail = async (dev: DeviceDto) => {
    setDetailDevice(dev);
    setDeviceDetail(null);
    setLoadingDetail(true);
    try {
      setDeviceDetail(await adminApi.getDeviceDetail(dev.id));
    } catch (err: any) {
      setError(err?.message || 'Không tải được chi tiết thiết bị.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatBytes = (n?: number | null) => {
    if (n == null) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
    return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  const handleToggleBlock = async (device: DeviceDto) => {
    const actionText = device.blocked ? 'bỏ chặn' : 'chặn';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} thiết bị có địa chỉ MAC ${device.macAddress}?`)) return;

    setTogglingId(device.id);
    try {
      await adminApi.toggleBlockDevice(device.id, !device.blocked);
      loadDevices();
    } catch (err: any) {
      alert(err?.message || `Thao tác ${actionText} thiết bị thất bại.`);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderOsIcon = (os?: string) => {
    const lower = (os || '').toLowerCase();
    if (lower.includes('ios') || lower.includes('iphone') || lower.includes('android')) {
      return <Smartphone className="w-4 h-4 text-[#004b87]" />;
    }
    if (lower.includes('mac') || lower.includes('darwin')) {
      return <Laptop className="w-4 h-4 text-slate-700" />;
    }
    return <Monitor className="w-4 h-4 text-slate-500" />;
  };

  const renderNetDeviceIcon = (type: string) => {
    switch (type) {
      case 'ONT':
        return <Server className="w-4 h-4 text-indigo-600" />;
      case 'ROUTER':
        return <Router className="w-4 h-4 text-[#004b87]" />;
      case 'ACCESS_POINT':
        return <Radio className="w-4 h-4 text-emerald-600" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-600" />;
    }
  };

  // Một dòng thiết bị hạ tầng (dùng lại trong màn chi tiết điểm & nhóm chưa gán).
  const renderDeviceRow = (nd: NetworkDeviceDto) => (
    <tr key={nd.id} className="hover:bg-slate-50/80 transition">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600">
            {renderNetDeviceIcon(nd.deviceType)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 text-xs">
                {nd.name
                  ? nd.name
                  : nd.deviceType === 'ROUTER'
                  ? 'Router Gateway'
                  : nd.deviceType === 'ACCESS_POINT'
                  ? 'Trạm phát Wi-Fi (AP)'
                  : nd.deviceType === 'SWITCH'
                  ? 'Switch chia mạng'
                  : nd.deviceType === 'ONT'
                  ? 'Modem quang (ONT)'
                  : 'Thiết bị mạng'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                {nd.model || 'Tiêu chuẩn'}
              </span>
              {nd.gwnNetworkId && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  Net #{nd.gwnNetworkId}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="text-slate-400 font-medium">{nd.vendor}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 font-mono">
        <span className="font-bold text-slate-900 block text-xs">{nd.macAddress}</span>
        <span className="text-slate-400 text-[11px] block">{nd.ipAddress || '—'}</span>
      </td>
      <td className="py-3 px-4 font-mono text-slate-700">{nd.serialNumber}</td>
      <td className="py-3 px-4">
        <DeviceStatusBadge status={nd.status} monitoringSource={nd.monitoringSource} />
        {nd.deviceType === 'ACCESS_POINT' && nd.meshCredentialState && (
          <div
            className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500"
            title={nd.meshCredentialState === 'MANAGED' ? 'Đã đổi sang mật khẩu quản lý chung' : 'Đang dùng mật khẩu gốc = S/N in trên nhãn'}
          >
            <KeyRound className="w-3 h-3" />
            {nd.meshCredentialState === 'MANAGED' ? 'MK quản lý chung' : 'MK gốc (S/N)'}
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{formatDate(nd.lastSeenAt)}</td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleViewClients(nd)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-sm text-xs font-semibold transition cursor-pointer"
            title="Xem danh sách người dân đang bắt sóng thực tế và cường độ sóng RSSI"
          >
            <Users className="w-3.5 h-3.5 text-sky-600" /> {nd.deviceType === 'ACCESS_POINT' ? 'Chi tiết mesh' : 'Xem Client'}
          </button>
          {canEdit && (nd.deviceType === 'ROUTER' || (nd.vendor && nd.vendor.toLowerCase().includes('grandstream'))) && (
            <button
              onClick={() => setDeviceToReboot(nd)}
              disabled={rebootingId === nd.id || nd.status === 'REBOOTING'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 disabled:opacity-40 rounded-sm text-xs font-semibold transition cursor-pointer"
              title="Gửi lệnh khởi động lại phần cứng từ xa qua Grandstream Cloud"
            >
              {rebootingId === nd.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
              ) : (
                <Power className="w-3.5 h-3.5 text-rose-600" />
              )}
              Khởi động lại
            </button>
          )}
          <button
            onClick={() => {
              loadLocationsList();
              setEditingNetDevice(nd);
              setDeviceFormOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold transition cursor-pointer border ${
              !nd.locationId
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Gán Nhà văn hóa hoặc sửa thông tin thiết bị"
          >
            <Edit2 className="w-3.5 h-3.5" /> {!nd.locationId ? 'Gán điểm' : 'Sửa'}
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setSelectedDeviceForSwap(nd);
                setSwapModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-sm text-xs font-semibold transition cursor-pointer"
              title="Hoán đổi phần cứng thay thế khi hỏng hóc tại cơ sở"
            >
              <Repeat className="w-3.5 h-3.5 text-amber-700" /> Thay thế thiết bị
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  // Phân màu sức khỏe điểm: xanh = bình thường, cam = một phần mesh lỗi, đỏ = mất kết nối, xám = chưa có GWN.
  const HEALTH_STYLE: Record<string, { card: string; chip: string; dot: string; label: string }> = {
    GREEN: { card: 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500', chip: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', label: 'Đủ AP' },
    ORANGE: { card: 'border-amber-300 bg-amber-50/60 hover:border-amber-500', chip: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'Thiếu AP' },
    RED: { card: 'border-rose-300 bg-rose-50/60 hover:border-rose-500', chip: 'bg-rose-600 text-white', dot: 'bg-rose-500', label: 'Mất kết nối' },
    GRAY: { card: 'border-slate-300 bg-white hover:border-slate-400', chip: 'bg-slate-200 text-slate-600', dot: 'bg-slate-400', label: 'Chưa có GWN' },
  };
  const healthOf = (h?: string) => HEALTH_STYLE[(h || 'GRAY') as keyof typeof HEALTH_STYLE] || HEALTH_STYLE.GRAY;

  const detailTitle = viewUnassigned
    ? 'Thiết bị chưa gán điểm'
    : selectedLoc?.name || '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Thiết Bị & Hạ Tầng</h1>
        </div>
        <button
          onClick={activeTab === 'CLIENT' ? loadDevices : refreshInfra}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}
      {syncSuccessMsg && <AlertBanner type="success" message={syncSuccessMsg} />}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-300 gap-2">
        <button
          onClick={() => setActiveTab('CLIENT')}
          className={`pb-2.5 px-3.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'CLIENT'
              ? 'border-[#004b87] text-[#004b87]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thiết Bị Khách Truy Cập ({totalElements})
        </button>
        <button
          onClick={() => setActiveTab('INFRASTRUCTURE')}
          className={`pb-2.5 px-3.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'INFRASTRUCTURE'
              ? 'border-[#004b87] text-[#004b87]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thiết Bị Mạng Hạ Tầng (ONT / Router / AP)
        </button>
      </div>

      {/* Tab 1: Client Devices */}
      {activeTab === 'CLIENT' && (
        <>
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo MAC, IP, tên máy hoặc thông tin hệ điều hành..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87] transition font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-semibold transition cursor-pointer"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Địa chỉ MAC & IP</th>
                    <th className="py-3 px-4">Hệ điều hành / Loại máy</th>
                    <th className="py-3 px-4">Khách / Liên hệ (cổng chào)</th>
                    <th className="py-3 px-4">Lần cuối hoạt động</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Kiểm soát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
                        Đang tải danh sách thiết bị khách...
                      </td>
                    </tr>
                  ) : devices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Không tìm thấy thiết bị nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    devices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900 block text-xs">{dev.macAddress}</span>
                          <span className="text-slate-400 text-[11px] block">{dev.ipAddress || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-sm bg-slate-100 flex items-center justify-center flex-shrink-0">
                              {renderOsIcon(dev.osType)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 block">{dev.osType || 'Không xác định'}</span>
                              {dev.hostname && <span className="text-[11px] text-slate-400 block">{dev.hostname}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {dev.guestName || dev.guestContact ? (
                            <div>
                              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {dev.guestName || '—'}
                              </div>
                              {dev.guestContact && (
                                <div className="text-[11px] text-slate-500 ml-5">{dev.guestContact}</div>
                              )}
                              {dev.lastLocationName && (
                                <div className="text-[11px] text-slate-400 ml-5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {dev.lastLocationName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa qua cổng chào</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {formatDate(dev.lastSeenAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          {dev.blocked ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-sm text-[11px]">
                              <ShieldAlert className="w-3 h-3 text-rose-500" /> Đã chặn truy cập
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-sm text-[11px]">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Được phép
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDeviceDetail(dev)}
                              className="px-2.5 py-1 rounded-sm font-semibold text-xs transition cursor-pointer inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300"
                              title="Xem lịch sử phiên cổng chào và khảo sát của thiết bị này"
                            >
                              <Eye className="w-3.5 h-3.5" /> Chi tiết
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleToggleBlock(dev)}
                                disabled={togglingId === dev.id}
                                className={`px-2.5 py-1 rounded-sm font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5 ${
                                  dev.blocked
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {togglingId === dev.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : dev.blocked ? (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5" /> Bỏ chặn
                                  </>
                                ) : (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5" /> Chặn
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 15, 20]}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
              itemLabel="thiết bị khách"
            />
          </div>
        </>
      )}

      {/* Tab 2: Infrastructure Devices — quản lý THEO ĐỊA ĐIỂM */}
      {activeTab === 'INFRASTRUCTURE' && (
        <>
          <DeviceMonitoringTopology topology={topologyData} />

          {/* Thanh công cụ chung (luôn hiện) */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex flex-wrap gap-2.5 items-center">
            {(selectedLoc || viewUnassigned) && (
              <button
                onClick={backToLocationList}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 bg-white rounded-sm text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Danh sách địa điểm
              </button>
            )}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  loadLocationsList();
                  setEditingNetDevice(null);
                  setDeviceFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-semibold transition cursor-pointer shadow-xs"
                title="Thêm mới Router Grandstream GWN hoặc Access Point Viettel và gán vào Nhà văn hóa"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm thiết bị
              </button>
              {canCreate && (
                <button
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-semibold transition cursor-pointer shadow-xs"
                  title="Import danh sách thiết bị bàn giao (MAC + S/N) từ file Excel/CSV"
                >
                  <Upload className="w-3.5 h-3.5" /> Import danh sách thiết bị
                </button>
              )}
              {canEdit && (
                <button
                  onClick={handleSyncGrandstream}
                  disabled={syncingGwn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white rounded-sm text-xs font-semibold transition cursor-pointer shadow-xs"
                  title="Đồng bộ danh sách thiết bị Router và trạng thái thực tế từ Grandstream GDMS/GWN Cloud"
                >
                  {syncingGwn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đồng bộ...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-3.5 h-3.5" /> Đồng bộ từ Grandstream Cloud
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleRefreshMeshStatus}
                disabled={refreshingMesh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-sm text-xs font-semibold transition cursor-pointer shadow-xs"
                title="Làm mới ngay trạng thái on/off của mesh từ Grandstream GWN Cloud (link cổng LAN), không chờ chu kỳ tự động"
              >
                {refreshingMesh ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang làm mới...
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5" /> Làm mới trạng thái mesh
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ===== MỨC NGOÀI: DANH SÁCH ĐỊA ĐIỂM ===== */}
          {!selectedLoc && !viewUnassigned && (
            <>
              <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={infraLocSearch}
                      onChange={(e) => setInfraLocSearch(e.target.value)}
                      placeholder="Tìm địa điểm theo tên, mã điểm hoặc địa chỉ..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87] focus:border-[#004b87] transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-semibold transition cursor-pointer"
                  >
                    Tìm kiếm
                  </button>
                  <button
                    type="button"
                    onClick={openUnassigned}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-sm text-xs font-semibold transition cursor-pointer"
                    title="Xem các thiết bị đã import nhưng chưa gán vào địa điểm nào"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Chưa gán điểm
                  </button>
                </form>
              </div>

              {loadingInfraLocs ? (
                <div className="bg-white rounded border border-slate-300 shadow-xs py-16 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
                  Đang tải danh sách địa điểm...
                </div>
              ) : infraLocs.length === 0 ? (
                <div className="bg-white rounded border border-slate-300 shadow-xs py-16 text-center text-slate-400">
                  Không tìm thấy địa điểm nào phù hợp.
                </div>
              ) : (
                <>
                {/* Chú thích màu sức khỏe điểm */}
                <div className="bg-white rounded border border-slate-300 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-500">Chú thích:</span>
                  {(['GREEN', 'ORANGE', 'RED', 'GRAY'] as const).map((h) => (
                    <span key={h} className="inline-flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${healthOf(h).dot}`} />
                      {healthOf(h).label}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {infraLocs.map((loc) => {
                    const hs = healthOf(loc.healthStatus);
                    return (
                    <button
                      key={loc.id}
                      onClick={() => openLocation(loc)}
                      className={`text-left rounded border shadow-xs hover:shadow-sm transition p-4 cursor-pointer group border-l-4 ${hs.card}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded bg-white/70 border border-slate-200 flex items-center justify-center flex-shrink-0 text-[#004b87]">
                            <Building2 className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate" title={loc.name}>{loc.name}</div>
                            {loc.locationCode && (
                              <div className="text-[11px] text-slate-400 font-mono truncate">{loc.locationCode}</div>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${hs.chip}`}>
                          {loc.healthStatus === 'GREEN' ? <Wifi className="w-3 h-3" />
                            : loc.healthStatus === 'RED' ? <WifiOff className="w-3 h-3" />
                            : loc.healthStatus === 'ORANGE' ? <AlertTriangle className="w-3 h-3" />
                            : null}
                          {hs.label}
                        </span>
                      </div>
                      {loc.address && (
                        <div className="text-[11px] text-slate-500 flex items-start gap-1 mb-2">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{loc.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                        <span className="inline-flex items-center gap-1" title="Số AP đang kết nối (cổng LAN ON) / số AP kỳ vọng">
                          <Radio className="w-3.5 h-3.5 text-slate-400" />
                          AP: <strong className={`${(loc.activeApCount ?? null) === null ? 'text-slate-500' : (loc.activeApCount! < (loc.expectedApCount ?? 4) ? 'text-amber-600' : 'text-emerald-700')}`}>
                            {loc.activeApCount ?? '?'}/{loc.expectedApCount ?? 4}
                          </strong>
                        </span>
                        {loc.hasGwnRouter && (
                          <span className="text-slate-400">• 1 GWN</span>
                        )}
                        {loc.adminUnitName && (
                          <span className="text-slate-400 truncate">• {loc.adminUnitName}</span>
                        )}
                      </div>
                    </button>
                    );
                  })}
                </div>
                </>
              )}

              <div className="bg-white rounded border border-slate-300 shadow-xs">
                <Pagination
                  currentPage={infraLocPage}
                  totalPages={infraLocTotalPages}
                  totalElements={infraLocTotalElements}
                  pageSize={infraLocPageSize}
                  pageSizeOptions={[6, 12, 24, 48]}
                  onPageChange={setInfraLocPage}
                  onPageSizeChange={(newSize) => {
                    setInfraLocPageSize(newSize);
                    setInfraLocPage(0);
                  }}
                  itemLabel="địa điểm"
                />
              </div>
            </>
          )}

          {/* ===== MỨC TRONG: CHI TIẾT 1 ĐỊA ĐIỂM (hoặc nhóm chưa gán) ===== */}
          {(selectedLoc || viewUnassigned) && (
            <>
              <div className="bg-white rounded border border-slate-300 shadow-xs p-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[#004b87]">
                    {viewUnassigned ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">{detailTitle}</h2>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      {viewUnassigned ? (
                        <span>Thiết bị đã nhập kho nhưng chưa gán vào địa điểm — cần gán điểm để giám sát.</span>
                      ) : (
                        <>
                          {selectedLoc?.locationCode && <span className="font-mono">{selectedLoc.locationCode}</span>}
                          {selectedLoc?.address && (
                            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedLoc.address}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AP theo cổng GWN của riêng điểm này */}
              {!viewUnassigned && locPorts && Array.isArray(locPorts.ports) && locPorts.ports.length > 0 && (
                <div className="bg-white rounded border border-slate-300 shadow-xs p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700">
                      AP theo cổng GWN
                      {(() => {
                        const on = locPorts.ports.filter((p) => p.status === 'ONLINE').length;
                        const exp = selectedLoc?.expectedApCount ?? 4;
                        return (
                          <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded ${on < exp ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            AP đang kết nối: {on}/{exp}
                          </span>
                        );
                      })()}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {locPorts.apiReachable ? 'Trạng thái cổng LAN trực tiếp từ Grandstream' : 'Chưa kết nối được GWN Cloud'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {locPorts.ports.map((p) => (
                      <div key={p.port}
                        className={`rounded border px-3 py-2 flex items-center justify-between ${p.status === 'ONLINE' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                        <div>
                          <div className="text-xs font-semibold text-slate-700">{p.label}</div>
                          <div className="text-[11px] text-slate-500">{p.meshName || 'Chưa gán mesh'}</div>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${p.status === 'ONLINE' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                          {p.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bảng thiết bị của điểm */}
              <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Loại & Model</th>
                        <th className="py-3 px-4">Địa chỉ MAC & IP</th>
                        <th className="py-3 px-4">Serial Number</th>
                        <th className="py-3 px-4">Trạng thái kết nối</th>
                        <th className="py-3 px-4">Lần cuối Heartbeat</th>
                        <th className="py-3 px-4 text-right">Thao tác hạ tầng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingLocDevices ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
                            Đang tải thiết bị...
                          </td>
                        </tr>
                      ) : locDevices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            {viewUnassigned ? 'Không có thiết bị nào chưa gán điểm.' : 'Địa điểm này chưa có thiết bị mạng nào.'}
                          </td>
                        </tr>
                      ) : (
                        locDevices.map((nd) => renderDeviceRow(nd))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <DeviceSwapModal
        isOpen={swapModalOpen}
        onClose={() => {
          setSwapModalOpen(false);
          setSelectedDeviceForSwap(null);
        }}
        onSuccess={() => {
          refreshInfra();
        }}
        device={selectedDeviceForSwap}
      />

      {/* Remote Reboot Confirmation Modal */}
      {deviceToReboot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl border border-slate-300 max-w-md w-full p-6 text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <Power className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận khởi động lại Router</h3>
                <p className="text-xs text-slate-500">Phát lệnh phần cứng qua Grandstream Cloud</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn có chắc chắn muốn phát lệnh <strong>Reboot từ xa</strong> cho thiết bị{' '}
              <strong className="text-slate-900 font-mono">
                {deviceToReboot.model || 'Router'} ({deviceToReboot.macAddress})
              </strong>{' '}
              tại địa bàn <strong>{deviceToReboot.locationName || 'Nhà văn hóa'}</strong>?
            </p>
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-sm text-xs text-amber-800 mb-5">
              ⚠️ <strong>Lưu ý:</strong> Thiết bị sẽ tạm ngắt kết nối mạng khoảng 1 - 2 phút trong lúc phần cứng khởi động lại. Tất cả phiên Wi-Fi đang truy cập tại địa bàn sẽ tạm thời bị gián đoạn.
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeviceToReboot(null)}
                disabled={rebootingId !== null}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReboot}
                disabled={rebootingId !== null}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {rebootingId !== null ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang phát lệnh...
                  </>
                ) : (
                  <>
                    <Power className="w-3.5 h-3.5" /> Xác nhận Reboot
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Clients Modal */}
      <NetworkDeviceImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { refreshInfra(); }}
      />
      <NetworkDeviceFormModal
        isOpen={deviceFormOpen}
        onClose={() => {
          setDeviceFormOpen(false);
          setEditingNetDevice(null);
        }}
        onSuccess={() => refreshInfra()}
        device={editingNetDevice}
        locations={allLocations}
      />
      <MeshApModal
        device={meshDevice}
        onClose={() => setMeshDevice(null)}
        onRefreshed={() => { refreshInfra(); }}
      />
      <ConnectedClientsModal
        isOpen={clientsModalOpen}
        onClose={() => setClientsModalOpen(false)}
        device={selectedDeviceForClients}
        clients={connectedClients}
        loading={loadingClients}
      />

      {/* Chi tiết thiết bị khách: lịch sử phiên cổng chào + khảo sát */}
      {detailDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl border border-slate-300 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[#004b87]">
                  {renderOsIcon(detailDevice.osType)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-mono">{detailDevice.macAddress}</h3>
                  <div className="text-[11px] text-slate-500">
                    {detailDevice.osType || 'Không xác định'} · {detailDevice.ipAddress || '—'}
                    {detailDevice.hostname ? ` · ${detailDevice.hostname}` : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setDetailDevice(null); setDeviceDetail(null); }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {loadingDetail ? (
                <div className="py-10 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" /> Đang tải chi tiết...
                </div>
              ) : (
                <>
                  {/* Lịch sử truy cập (phiên cổng chào) */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" /> Lịch sử truy cập ({deviceDetail?.sessions?.length || 0} phiên)
                    </h4>
                    {deviceDetail && deviceDetail.sessions.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded">
                        <table className="w-full text-[11px] text-left">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                              <th className="py-1.5 px-2.5 font-semibold">Thời gian</th>
                              <th className="py-1.5 px-2.5 font-semibold">Điểm truy cập</th>
                              <th className="py-1.5 px-2.5 font-semibold">Khách</th>
                              <th className="py-1.5 px-2.5 font-semibold">Dung lượng</th>
                              <th className="py-1.5 px-2.5 font-semibold text-right">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {deviceDetail.sessions.map((s, i) => (
                              <tr key={i} className="hover:bg-slate-50/70">
                                <td className="py-1.5 px-2.5 text-slate-600 whitespace-nowrap">{formatDate(s.authorizedAt || s.createdAt || undefined)}</td>
                                <td className="py-1.5 px-2.5 text-slate-600">{s.locationName || '—'}</td>
                                <td className="py-1.5 px-2.5 text-slate-600">
                                  {s.guestName ? s.guestName : <span className="text-slate-400 italic">Khách vãng lai</span>}
                                  {s.guestContact ? <span className="text-slate-400"> · {s.guestContact}</span> : ''}
                                </td>
                                <td className="py-1.5 px-2.5 text-slate-500 whitespace-nowrap">↓{formatBytes(s.bytesDownloaded)} · ↑{formatBytes(s.bytesUploaded)}</td>
                                <td className="py-1.5 px-2.5 text-right">
                                  <span className={`px-1.5 py-0.5 rounded font-bold ${s.status === 'AUTHORIZED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {s.status === 'AUTHORIZED' ? 'Đang dùng' : s.status === 'EXPIRED' ? 'Hết hạn' : s.status === 'REVOKED' ? 'Đã thu hồi' : (s.status || '—')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Thiết bị chưa có phiên đăng nhập qua cổng chào.</p>
                    )}
                  </div>

                  {/* Khảo sát đã trả lời */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" /> Khảo sát đã trả lời ({deviceDetail?.surveys?.length || 0})
                    </h4>
                    {deviceDetail && deviceDetail.surveys.length > 0 ? (
                      <div className="space-y-2">
                        {deviceDetail.surveys.map((r, i) => (
                          <div key={i} className="border border-slate-200 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-700">{r.surveyTitle || `Khảo sát #${r.surveyId}`}</span>
                              <span className="text-[11px] text-slate-400">{formatDate(r.submittedAt || undefined)}</span>
                            </div>
                            {r.answers && r.answers.length > 0 ? (
                              <dl className="space-y-1.5">
                                {r.answers.map((a, j) => (
                                  <div key={j} className="text-[11px]">
                                    <dt className="text-slate-500">{a.question}</dt>
                                    <dd className="text-slate-800 font-semibold ml-0">{a.answer}</dd>
                                  </div>
                                ))}
                              </dl>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">Không có nội dung trả lời.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Thiết bị chưa trả lời khảo sát nào.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
