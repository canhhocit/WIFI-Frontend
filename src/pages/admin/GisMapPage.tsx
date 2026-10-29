import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../../api/adminApi';
import { GisLocationPinDto, AdminUnitDto } from '../../types/models';
import {
  MapPin,
  Wifi,
  WifiOff,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  X,
  Radio,
  Server
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GisMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [pins, setPins] = useState<GisLocationPinDto[]>([]);
  const [districts, setDistricts] = useState<AdminUnitDto[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPin, setSelectedPin] = useState<GisLocationPinDto | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pinsData, districtsData] = await Promise.all([
        adminApi.getGisLocations(),
        adminApi.getAdminByLevel(2), // Level 2 = Districts
      ]);
      setPins(pinsData);
      setDistricts(districtsData);
    } catch (err) {
      console.error('Failed to load GIS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPins = useMemo(() => {
    return pins.filter((p) => {
      const matchDistrict = selectedDistrict === 'ALL' || p.districtName === selectedDistrict;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.locationCode && p.locationCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDistrict && matchStatus && matchSearch;
    });
  }, [pins, selectedDistrict, selectedStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = pins.length;
    const online = pins.filter((p) => p.status === 'ONLINE').length;
    const degraded = pins.filter((p) => p.status === 'DEGRADED').length;
    const offline = pins.filter((p) => p.status === 'OFFLINE').length;
    const activeSessions = pins.reduce((acc, p) => acc + (p.activeSessionsCount || 0), 0);
    return { total, online, degraded, offline, activeSessions };
  }, [pins]);

  // Hải Phòng Bounding Box: minLat: 20.65, maxLat: 21.05, minLng: 106.50, maxLng: 107.15
  const projectCoordinates = (lat?: number, lng?: number) => {
    if (!lat || !lng) return { x: 50, y: 50 };
    const minLat = 20.65, maxLat = 21.05;
    const minLng = 106.50, maxLng = 107.15;
    const x = Math.max(5, Math.min(95, ((lng - minLng) / (maxLng - minLng)) * 100));
    const y = Math.max(5, Math.min(95, (1 - (lat - minLat) / (maxLat - minLat)) * 100));
    return { x, y };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-7 h-7 text-blue-600" />
            Bản đồ Số GIS & Trạng thái 1.584 Điểm phát Wi-Fi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hệ thống giám sát định vị không gian địa lý Hải Phòng, mật độ phiên và tình trạng kết nối thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-sm border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bản đồ GIS
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Danh sách ({filteredPins.length})
            </button>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Tổng điểm phát</span>
            <MapPin className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">Nhà văn hóa / Công cộng</div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-medium">
            <span>Hoạt động tốt (Online)</span>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{stats.online}</div>
          <div className="text-xs text-emerald-600/80 mt-0.5">
            {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% độ khả dụng
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 text-xs font-medium">
            <span>Cảnh báo (Degraded)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{stats.degraded}</div>
          <div className="text-xs text-amber-600/80 mt-0.5">Mất kết nối 1 phần thiết bị</div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-red-600 text-xs font-medium">
            <span>Mất kết nối (Offline)</span>
            <WifiOff className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">{stats.offline}</div>
          <div className="text-xs text-red-600/80 mt-0.5">Cần kỹ thuật kiểm tra</div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 text-xs font-medium">
            <span>Phiên truy cập đang chạy</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{stats.activeSessions}</div>
          <div className="text-xs text-blue-600/80 mt-0.5">Người dân đang online</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-3 rounded-sm border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NVH, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* District Selector */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">-- Tất cả Quận/Huyện TP Hải Phòng --</option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="ONLINE">🟢 Hoạt động tốt (Online)</option>
            <option value="DEGRADED">🟡 Cảnh báo / Suy giảm (Degraded)</option>
            <option value="OFFLINE">🔴 Mất kết nối (Offline)</option>
          </select>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
              heatmapEnabled
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {heatmapEnabled ? 'Tắt Heatmap' : 'Bật Heatmap mật độ'}
          </button>

          {viewMode === 'map' && (
            <div className="inline-flex rounded-sm border border-gray-300 bg-white">
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-l-lg border-r border-gray-200"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Map / List Display */}
      {viewMode === 'map' ? (
        <div className="relative bg-slate-900 rounded border border-gray-300 shadow-inner overflow-hidden min-h-[580px] h-[650px] flex items-center justify-center">
          {/* Map Vector Grid & Sea styling */}
          <div
            className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
          />

          {/* Interactive Zoomable Map Canvas */}
          <div
            className="relative w-full h-full transition-transform duration-300 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Hai Phong Stylized Region Map Outline */}
            <svg
              className="absolute w-[90%] h-[90%] opacity-40 pointer-events-none"
              viewBox="0 0 1000 800"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
            >
              {/* Mainland Hai Phong Path Contour */}
              <path
                d="M 220 280 Q 320 200 480 230 T 680 320 Q 740 450 620 620 T 360 680 Q 210 590 200 420 Z"
                fill="#0369a1"
                fillOpacity="0.15"
                strokeDasharray="4 4"
              />
              {/* Cat Ba Island outline */}
              <path
                d="M 750 420 Q 840 400 860 480 T 790 560 Q 740 520 750 420 Z"
                fill="#0284c7"
                fillOpacity="0.2"
              />
              {/* Bach Long Vi Island outline */}
              <circle cx="890" cy="710" r="14" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" />
              <text x="880" y="740" fill="#94a3b8" fontSize="12" fontFamily="sans-serif">
                Bạch Long Vĩ
              </text>
              <text x="780" y="390" fill="#94a3b8" fontSize="12" fontFamily="sans-serif">
                H. Đảo Cát Hải
              </text>
              <text x="440" y="440" fill="#e2e8f0" fontSize="18" fontWeight="600" opacity="0.4">
                THÀNH PHỐ HẢI PHÒNG
              </text>
            </svg>

            {/* Heatmap Layer if activated */}
            {heatmapEnabled && (
              <div className="absolute inset-0 pointer-events-none">
                {filteredPins.map((pin) => {
                  const pos = projectCoordinates(pin.latitude, pin.longitude);
                  const intensity = Math.min(1, Math.max(0.3, pin.activeSessionsCount / 50));
                  return (
                    <div
                      key={`heat-${pin.id}`}
                      className="absolute rounded-full blur-xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        width: `${60 + pin.activeSessionsCount * 2}px`,
                        height: `${60 + pin.activeSessionsCount * 2}px`,
                        backgroundColor: `rgba(245, 158, 11, ${intensity * 0.4})`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Location Pin Markers */}
            {filteredPins.map((pin) => {
              const pos = projectCoordinates(pin.latitude, pin.longitude);
              const isSelected = selectedPin?.id === pin.id;

              let markerColor = 'bg-emerald-500 border-emerald-300';
              let pulseColor = 'bg-emerald-400';
              if (pin.status === 'OFFLINE') {
                markerColor = 'bg-rose-600 border-rose-300';
                pulseColor = 'bg-rose-500';
              } else if (pin.status === 'DEGRADED') {
                markerColor = 'bg-amber-500 border-amber-300';
                pulseColor = 'bg-amber-400';
              }

              return (
                <div
                  key={pin.id}
                  onClick={() => setSelectedPin(pin)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform ${
                    isSelected ? 'scale-150 z-30' : 'hover:scale-125'
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {/* Pulse Effect for degraded or offline */}
                  {pin.status !== 'ONLINE' && (
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${pulseColor}`}
                    />
                  )}
                  <div
                    className={`w-4 h-4 rounded-full border-2 shadow-lg flex items-center justify-center text-[8px] font-bold text-white ${markerColor}`}
                    title={`${pin.name} (${pin.status})`}
                  >
                    {pin.activeSessionsCount > 0 ? pin.activeSessionsCount : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Map Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-sm p-3 text-xs text-slate-200 shadow-xl pointer-events-auto">
            <div className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              Chú thích bản đồ GIS
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300 inline-block" />
                <span>Hoạt động tốt ({stats.online})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 inline-block" />
                <span>Cảnh báo / Suy giảm ({stats.degraded})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-300 inline-block" />
                <span>Mất kết nối ({stats.offline})</span>
              </div>
            </div>
          </div>

          {/* Location Detail Popover when Pin Clicked */}
          {selectedPin && (
            <div className="absolute top-4 right-4 w-80 bg-white rounded-sm shadow-2xl border border-gray-200 p-4 z-40 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      selectedPin.status === 'ONLINE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedPin.status === 'DEGRADED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedPin.status === 'ONLINE'
                      ? '🟢 Hoạt động tốt'
                      : selectedPin.status === 'DEGRADED'
                      ? '🟡 Suy giảm kết nối'
                      : '🔴 Mất tín hiệu'}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-1">{selectedPin.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Mã: {selectedPin.locationCode || 'N/A'}</p>
                </div>
                <button
                  onClick={() => setSelectedPin(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-600 space-y-1.5 border-t border-b border-gray-100 py-2.5">
                <div>
                  <span className="font-medium text-gray-700">Địa chỉ:</span> {selectedPin.address || 'Chưa cập nhật'}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Khu vực:</span> {selectedPin.districtName || 'Hải Phòng'}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tọa độ:</span>{' '}
                  <span className="font-mono">
                    {selectedPin.latitude?.toFixed(4)}, {selectedPin.longitude?.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Thiết bị hạ tầng:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPin.onlineDevices} / {selectedPin.totalDevices} online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phiên truy cập đang dùng:</span>
                  <span className="font-semibold text-blue-600">{selectedPin.activeSessionsCount} người</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sự cố đang mở:</span>
                  <span className={`font-semibold ${selectedPin.openIncidentsCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {selectedPin.openIncidentsCount} sự cố
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/locations/${selectedPin.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium rounded-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Xem chi tiết
                </button>
                <button
                  onClick={() => navigate(`/admin/incidents?createLocationId=${selectedPin.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 text-xs font-medium rounded-sm shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Tạo vé sự cố
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List Mode View */
        <div className="bg-white rounded-sm border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Mã & Điểm phát</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Quận / Huyện</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Thiết bị (Online/Tổng)</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Phiên Wi-Fi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Sự cố</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPins.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Không tìm thấy điểm phát nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  filteredPins.map((pin) => (
                    <tr key={pin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{pin.name}</div>
                        <div className="text-gray-500 font-mono text-[11px]">{pin.locationCode || 'N/A'} - {pin.address}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{pin.districtName || pin.adminUnitName || 'Hải Phòng'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            pin.status === 'ONLINE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pin.status === 'DEGRADED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pin.status === 'ONLINE' ? '🟢 Online' : pin.status === 'DEGRADED' ? '🟡 Degraded' : '🔴 Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {pin.onlineDevices} / {pin.totalDevices}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {pin.activeSessionsCount}
                      </td>
                      <td className="px-4 py-3">
                        {pin.openIncidentsCount > 0 ? (
                          <span className="text-red-600 font-semibold">{pin.openIncidentsCount} đang mở</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPin(pin);
                            setViewMode('map');
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Định vị
                        </button>
                        <button
                          onClick={() => navigate(`/admin/locations/${pin.id}`)}
                          className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
