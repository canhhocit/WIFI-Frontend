import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BellRing,
  Clock,
  // Map as MapIcon,
  MapPin,
  RefreshCw,
  Router,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import {
  DashboardOverviewDto,
  GisLocationPinDto,
  IncidentTicketDto,
  PageResponse,
} from '../../types/models';
import { StatusBadge } from '../../components/Badge';
import { DeviceMonitoringTopology } from '../../components/DeviceMonitoringTopology';
// import { LeafletGisMap } from '../../components/gis/LeafletGisMap';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardOverviewDto | null>(null);
  const [pins, setPins] = useState<GisLocationPinDto[]>([]);
  // const [selectedPin, setSelectedPin] = useState<GisLocationPinDto | null>(null);
  const [incidents, setIncidents] = useState<IncidentTicketDto[]>([]);
  const [openIncidentCount, setOpenIncidentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [mapError, setMapError] = useState<string | null>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadingRef = useRef(false);

  const loadOverview = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRefreshing(true);

    try {
      const [overviewResult, gisResult, openResult, assignedResult, inProgressResult] = await Promise.allSettled([
        adminApi.getOverview(),
        adminApi.getGisLocations(),
        adminApi.getIncidents({ status: 'OPEN', page: 0, size: 5 }),
        adminApi.getIncidents({ status: 'ASSIGNED', page: 0, size: 5 }),
        adminApi.getIncidents({ status: 'IN_PROGRESS', page: 0, size: 5 }),
      ]);

      if (overviewResult.status === 'fulfilled') {
        setData(overviewResult.value);
        setError(null);
      } else {
        setError('Không thể tải số liệu tổng quan. Vui lòng thử làm mới.');
      }

      if (gisResult.status === 'fulfilled') {
        setPins(gisResult.value);
        // setMapError(null);
        // setSelectedPin((previous) => previous
        //   ? gisResult.value.find((pin) => pin.id === previous.id) || null
        //   : null);
      }
      // else {
      //   setMapError('Không tải được dữ liệu bản đồ. Kiểm tra quyền truy cập hoặc thử làm mới.');
      // }

      const incidentResults = [openResult, assignedResult, inProgressResult];
      const incidentPages: PageResponse<IncidentTicketDto>[] = incidentResults.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      setOpenIncidentCount(incidentPages.reduce((total, page) => total + page.totalElements, 0));
      setIncidents(
        incidentPages.flatMap((page) => page.content)
          .sort((first, second) => {
            const timeA = new Date(second.reportedAt || second.createdAt || 0).getTime();
            const timeB = new Date(first.reportedAt || first.createdAt || 0).getTime();
            return timeA - timeB;
          })
          .slice(0, 6),
      );
      setIncidentError(incidentPages.length === incidentResults.length
        ? null
        : 'Một phần dữ liệu sự cố không tải được.');
      setLastUpdated(new Date());
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadOverview();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [loadOverview]);

  const mapStats = useMemo(() => {
    const online = pins.filter((pin) => pin.status === 'ONLINE').length;
    const degraded = pins.filter((pin) => pin.status === 'DEGRADED').length;
    const unassigned = pins.filter((pin) => pin.active && pin.hasGwnRouter === false).length;
    const offline = pins.filter((pin) => pin.status === 'OFFLINE' && !(pin.active && pin.hasGwnRouter === false)).length;
    return {
      total: pins.length,
      online,
      degraded,
      unassigned,
      offline,
    };
  }, [pins]);

  const incidentStatusLabel: Record<string, string> = {
    NEW: 'Mới tiếp nhận',
    OPEN: 'Mới tiếp nhận',
    ASSIGNED: 'Đã phân công',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã khắc phục',
    CLOSED: 'Đã đóng phiếu',
  };

  const incidentSeverityLabel: Record<string, string> = {
    CRITICAL: 'Khẩn cấp',
    MAJOR: 'Nghiêm trọng',
    MINOR: 'Bình thường',
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 animate-fade-in-up">
        <div className="h-20 rounded-xl border border-slate-200 bg-white p-5 shadow-card flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-48 rounded animate-shimmer" />
            <div className="h-3 w-72 rounded animate-shimmer" />
          </div>
          <div className="h-9 w-24 rounded-lg animate-shimmer" />
        </div>
        <div className="h-36 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="h-full w-full rounded-lg animate-shimmer" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-24 rounded-xl border border-slate-200 bg-white p-4 shadow-card space-y-2.5">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-7 w-16 rounded animate-shimmer" />
              <div className="h-2.5 w-24 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 animate-fade-in-up">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Tổng quan vận hành</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 text-emerald-500 live-pulse" />
              Trực tuyến
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Trạng thái điểm phát, tải mạng và công việc cần xử lý; dữ liệu tự làm mới mỗi 60 giây.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastUpdated && (
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
              Cập nhật {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadOverview()}
            disabled={refreshing}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={'h-4 w-4 ' + (refreshing ? 'animate-spin' : '')} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <DeviceMonitoringTopology topology={data?.topology} showSummaryCards={false} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-slate-300">
          <div className="flex items-center justify-between text-xs text-slate-500"><span>Điểm phát</span><MapPin className="h-4 w-4 text-slate-400" /></div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 tabular-nums">{mapStats.total || data?.totalLocations || 0}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {mapStats.online} đang hoạt động{mapStats.unassigned > 0 ? ` • ${mapStats.unassigned} chưa gán GWN` : ''}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-emerald-300">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-700">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${mapStats.online > 0 ? 'bg-emerald-500 text-emerald-500 live-pulse' : 'bg-slate-400'}`} />
              Đang hoạt động
            </span>
            <Wifi className="h-4 w-4" />
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-700 tabular-nums">{mapStats.online}</div>
          <div className="mt-1 text-[11px] text-slate-500">Điểm đã gán GWN online</div>
        </div>
        <div className="rounded-xl border border-amber-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-amber-300">
          <div className="flex items-center justify-between text-xs font-medium text-amber-700"><span>Chưa gán / Suy giảm</span><BellRing className="h-4 w-4" /></div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-amber-700 tabular-nums">{mapStats.unassigned + mapStats.degraded}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {mapStats.unassigned > 0
              ? `${mapStats.unassigned} chưa gán GWN${mapStats.degraded > 0 ? ` • ${mapStats.degraded} suy giảm` : ''}`
              : 'Điểm cần kiểm tra'}
          </div>
        </div>
        <div className="rounded-xl border border-red-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-red-300">
          <div className="flex items-center justify-between text-xs font-medium text-red-700"><span>Mất kết nối</span><WifiOff className="h-4 w-4" /></div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-red-700 tabular-nums">{mapStats.offline}</div>
          <div className="mt-1 text-[11px] text-slate-500">Điểm offline / tạm dừng</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/*
        <section className="overflow-hidden rounded border border-slate-300 bg-white shadow-xs xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <MapIcon className="h-4 w-4 text-[#004b87]" /> Bản đồ trạng thái điểm phát
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Chọn một điểm để mở hồ sơ vận hành.</p>
            </div>
            <Link to="/admin/gis" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[#004b87] hover:underline">
              Bản đồ đầy đủ <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {mapError ? (
            <div className="flex min-h-[300px] items-center justify-center p-6 text-center text-xs text-amber-800">{mapError}</div>
          ) : pins.length ? (
            <LeafletGisMap pins={pins} selectedPin={selectedPin} onSelectPin={setSelectedPin} heatmapEnabled={false} selectedDistrict="ALL" compact />
          ) : (
            <div className="flex min-h-[300px] items-center justify-center text-xs text-slate-500">Chưa có điểm phát có tọa độ để hiển thị.</div>
          )}
          {selectedPin && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800">{selectedPin.name}</span>
                <span className="ml-2 text-[11px] text-slate-500">{selectedPin.address}</span>
              </div>
              <Link to={'/admin/gis?selectLocation=' + selectedPin.id} className="text-xs font-semibold text-[#004b87] hover:underline">Mở hồ sơ điểm</Link>
            </div>
          )}
        </section>
        */}

        <section className="rounded border border-slate-300 bg-white shadow-xs xl:col-span-12">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-amber-600" /> Sự cố cần xử lý
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">{openIncidentCount} sự cố đang mở hoặc xử lý</p>
            </div>
            <Link to="/admin/incidents" className="text-xs font-semibold text-[#004b87] hover:underline">Tất cả</Link>
          </div>
          {incidentError && <div className="px-4 pt-3 text-[11px] text-amber-700">{incidentError}</div>}
          {incidents.length ? (
            <ul className="divide-y divide-slate-100">
              {incidents.map((incident) => (
                <li key={incident.id} className="px-4 py-3">
                  <Link to="/admin/incidents" className="block rounded focus:outline-none focus:ring-2 focus:ring-[#004b87]">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{incident.ticketCode}</span>
                      <span className="text-[10px] font-semibold text-amber-700">{incidentSeverityLabel[incident.severity] || incident.severity}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-700">{incident.title}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{incident.locationName || 'Chưa xác định điểm'}</span>
                      <span>{incidentStatusLabel[incident.status] || incident.status}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center text-xs text-slate-500">
              {incidentError ? 'Chưa tải được danh sách sự cố.' : 'Không có sự cố đang mở.'}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>Phiên đang kết nối</span><Activity className="h-4 w-4 text-emerald-700" /></div>
          <div className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums">{data?.activeSessions ?? 0}</div>
          <Link to="/admin/sessions" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#004b87] hover:underline">Xem phiên <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>Lượt kết nối hôm nay</span><Clock className="h-4 w-4 text-sky-600" /></div>
          <div className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums">{data?.todaySessions ?? 0}</div>
          <div className="mt-1 text-[11px] text-slate-500">Tổng phiên được tạo trong ngày</div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>Hạ tầng gateway</span><Router className="h-4 w-4 text-slate-600" /></div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className={`h-2 w-2 rounded-full ${data?.gatewayStatus?.healthy ? 'bg-emerald-500 text-emerald-500 live-pulse' : 'bg-amber-500'}`} />
            {data?.gatewayStatus?.healthy ? 'Đang hoạt động' : 'Cần kiểm tra'}
          </div>
          <div className="mt-1 line-clamp-2 text-[11px] text-slate-500">{data?.gatewayStatus?.statusMessage || 'Chưa có trạng thái gateway.'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card">
          <h2 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-700">
            <span>Phân loại trạng thái phiên</span>
            <Link to="/admin/sessions" className="normal-case text-[#004b87] hover:underline">Chi tiết</Link>
          </h2>
          <div className="space-y-3">
            {data?.sessionsByStatus && Object.entries(data.sessionsByStatus).map(([status, count]) => {
              const total = data.totalSessions || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs"><StatusBadge status={status} /><span className="font-mono font-semibold text-slate-700 tabular-nums">{count} ({percentage}%)</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#004b87] to-sky-500 transition-all duration-700 ease-out" style={{ width: percentage + '%' }} /></div>
                </div>
              );
            })}
            {!data?.sessionsByStatus && <p className="text-xs text-slate-500">Chưa có số liệu phiên.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">Lượt truy cập theo địa bàn</h2>
              <p className="mt-1 text-[11px] text-slate-500">Dẫn tới hồ sơ điểm và bản đồ GIS.</p>
            </div>
            <Link to="/admin/analytics" className="text-xs font-semibold text-[#004b87] hover:underline">Phân tích</Link>
          </div>
          {data?.locationDistribution?.length ? (
            <div className="space-y-2">
              {data.locationDistribution.slice(0, 6).map((location, index) => (
                <div key={location.locationName + '-' + index} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 transition-colors duration-150 hover:bg-sky-50/60 hover:border-sky-200/80">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-[#004b87]" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-900">{location.locationName}</div>
                      <div className="text-[10px] text-slate-500">{location.percentage != null ? location.percentage.toFixed(1) + '% lượt kết nối toàn thành phố' : 'Điểm phát'}</div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-slate-700 tabular-nums">{location.sessionCount} lượt</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">Chưa có dữ liệu truy cập theo địa bàn.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
