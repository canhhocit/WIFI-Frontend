import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GisLocationPinDto } from '../../types/models';
import { 
  Layers, 
  Satellite, 
  Moon, 
  Sun, 
  Map as MapIcon, 
  Ruler, 
  RotateCcw, 
  Compass, 
  X, 
  Wifi, 
  Activity,
  Flame,
  Check,
  ChevronDown
} from 'lucide-react';

export type GisBasemap = 'google_hybrid' | 'cyber_dark' | 'clean_light' | 'osm';

export const BASEMAP_OPTIONS: Array<{
  id: GisBasemap;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}> = [
  {
    id: 'google_hybrid',
    label: 'Google Vệ tinh',
    desc: 'Ảnh vệ tinh HD & Tên đường tiếng Việt',
    icon: Satellite,
    iconColor: 'text-amber-400',
  },
  {
    id: 'cyber_dark',
    label: 'IOC Cyber Dark',
    desc: 'Nền tối phát quang cho trung tâm điều hành',
    icon: Moon,
    iconColor: 'text-cyan-400',
  },
  {
    id: 'clean_light',
    label: 'Bản đồ Sáng',
    desc: 'Bản đồ giao thông rõ ràng 100% tiếng Việt',
    icon: Sun,
    iconColor: 'text-amber-300',
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    desc: 'Bản đồ đường phố tiêu chuẩn toàn cầu',
    icon: MapIcon,
    iconColor: 'text-emerald-400',
  },
];

interface LeafletGisMapProps {
  pins: GisLocationPinDto[];
  selectedPin: GisLocationPinDto | null;
  onSelectPin: (pin: GisLocationPinDto | null) => void;
  heatmapEnabled: boolean;
  selectedDistrict: string;
  compact?: boolean;
}

// Tọa độ trung tâm TP. Hải Phòng và 15 Quận / Huyện
export const DISTRICT_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  ALL: { lat: 20.8449, lng: 106.6881, zoom: 11 },
  'Quận Hồng Bàng': { lat: 20.8651, lng: 106.6838, zoom: 14 },
  'Quận Ngô Quyền': { lat: 20.8580, lng: 106.7000, zoom: 14 },
  'Quận Lê Chân': { lat: 20.8450, lng: 106.6780, zoom: 14 },
  'Quận Hải An': { lat: 20.8350, lng: 106.7250, zoom: 13 },
  'Quận Kiến An': { lat: 20.8050, lng: 106.6280, zoom: 13 },
  'Quận Đồ Sơn': { lat: 20.7100, lng: 106.7850, zoom: 13 },
  'Quận Dương Kinh': { lat: 20.7850, lng: 106.7150, zoom: 13 },
  'Huyện Thủy Nguyên': { lat: 20.9350, lng: 106.6850, zoom: 12 },
  'Huyện An Dương': { lat: 20.8750, lng: 106.6050, zoom: 12 },
  'Huyện An Lão': { lat: 20.8250, lng: 106.5450, zoom: 12 },
  'Huyện Kiến Thụy': { lat: 20.7650, lng: 106.6650, zoom: 12 },
  'Huyện Tiên Lãng': { lat: 20.7250, lng: 106.5650, zoom: 12 },
  'Huyện Vĩnh Bảo': { lat: 20.6850, lng: 106.4850, zoom: 12 },
  'Huyện Cát Hải': { lat: 20.7275, lng: 107.0494, zoom: 12 },
  'Huyện Bạch Long Vĩ': { lat: 20.1333, lng: 107.7167, zoom: 14 },
};

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface ClusterNode {
  lat: number;
  lng: number;
  pins: GisLocationPinDto[];
  totalSessions: number;
  hasOffline: boolean;
  hasDegraded: boolean;
}

export const LeafletGisMap: React.FC<LeafletGisMapProps> = ({
  pins,
  selectedPin,
  onSelectPin,
  heatmapEnabled,
  selectedDistrict,
  compact = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<number, L.Marker>>(new Map());
  const tileLayersRef = useRef<Record<GisBasemap, L.TileLayer>>({} as any);

  // Lưu tùy chọn chế độ bản đồ (mặc định lấy Google Vệ tinh từ bandoso)
  const [activeBasemap, setActiveBasemap] = useState<GisBasemap>(() => {
    try {
      return (localStorage.getItem('wifi_map_basemap') as GisBasemap) || 'google_hybrid';
    } catch {
      return 'google_hybrid';
    }
  });

  // State dropdown Combobox chọn lớp bản đồ nền
  const [basemapDropdownOpen, setBasemapDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBasemapDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Chế độ đo khoảng cách (Measurement tool)
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);

  // Thống kê nhanh trên bản đồ
  const pinStats = useMemo(() => {
    const total = pins.length;
    const online = pins.filter(p => p.status === 'ONLINE').length;
    const offline = pins.filter(p => p.status === 'OFFLINE').length;
    const degraded = pins.filter(p => p.status === 'DEGRADED').length;
    const sessions = pins.reduce((sum, p) => sum + (p.activeSessionsCount || 0), 0);
    return { total, online, offline, degraded, sessions };
  }, [pins]);

  // 1. Khởi tạo Bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Định nghĩa 4 lớp Tile chuyên nghiệp (Google Hybrid từ bandoso, IOC Cyber Dark, Google Bản đồ Sáng, OSM)
    // 100% Miễn phí, 0 API key, Tiếng Việt đầy đủ sắc nét, không watermark
    const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '© Google Maps',
    });

    const cyberDark = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      className: 'leaflet-cyber-dark-tiles',
      attribution: '© Google Maps (IOC Dark)',
    });

    const cleanLight = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '© Google Maps',
    });

    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    });

    tileLayersRef.current = {
      google_hybrid: googleHybrid,
      cyber_dark: cyberDark,
      clean_light: cleanLight,
      osm: osmStandard,
    };

    const initialLayer = tileLayersRef.current[activeBasemap] || googleHybrid;

    const map = L.map(mapContainerRef.current, {
      center: [20.8449, 106.6881],
      zoom: 11,
      minZoom: 9,
      maxZoom: 19,
      layers: [initialLayer],
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const heatmapLayer = L.layerGroup().addTo(map);
    const measureLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    heatmapLayerRef.current = heatmapLayer;
    measureLayerRef.current = measureLayer;

    // Invalidate map size
    const t1 = setTimeout(() => { map.invalidateSize(); }, 150);
    const t2 = setTimeout(() => { map.invalidateSize(); }, 500);
    const handleResize = () => { map.invalidateSize(); };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      heatmapLayerRef.current = null;
      measureLayerRef.current = null;
      markersMapRef.current.clear();
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // 2. Chuyển đổi Basemap mượt mà
  useEffect(() => {
    if (!mapRef.current || !tileLayersRef.current) return;
    const map = mapRef.current;

    Object.values(tileLayersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    const targetLayer = tileLayersRef.current[activeBasemap] || tileLayersRef.current.google_hybrid;
    targetLayer.addTo(map);

    // Cập nhật background container để tránh chớp sáng khi tải tiles
    if (mapContainerRef.current) {
      if (activeBasemap === 'cyber_dark') {
        mapContainerRef.current.classList.add('dark-basemap');
      } else {
        mapContainerRef.current.classList.remove('dark-basemap');
      }
    }

    try {
      localStorage.setItem('wifi_map_basemap', activeBasemap);
    } catch {}
  }, [activeBasemap]);

  // 3. Bay tới vị trí Quận/Huyện được chọn
  useEffect(() => {
    if (!mapRef.current) return;
    const target = DISTRICT_CENTERS[selectedDistrict] || DISTRICT_CENTERS.ALL;
    mapRef.current.flyTo([target.lat, target.lng], target.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedDistrict]);

  // 4. Đo đạc khoảng cách (Measurement Tool)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isMeasuring) return;

      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      setMeasurePoints((prev) => {
        if (prev.length >= 2) {
          return [newPoint];
        }
        return [...prev, newPoint];
      });
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMeasuring]);

  // Vẽ đường đo khoảng cách
  useEffect(() => {
    if (!measureLayerRef.current) return;
    const layer = measureLayerRef.current;
    layer.clearLayers();

    if (!isMeasuring || measurePoints.length === 0) {
      setMeasureDistance(null);
      return;
    }

    measurePoints.forEach((pt, idx) => {
      const circle = L.circleMarker([pt[0], pt[1]], {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 1,
      });
      circle.addTo(layer);
    });

    if (measurePoints.length === 2) {
      const p1 = measurePoints[0];
      const p2 = measurePoints[1];
      const dist = distanceInMeters(p1[0], p1[1], p2[0], p2[1]);
      setMeasureDistance(dist);

      const polyline = L.polyline([p1, p2], {
        color: '#f59e0b',
        weight: 3.5,
        dashArray: '4, 6',
      });
      polyline.addTo(layer);
    } else {
      setMeasureDistance(null);
    }
  }, [measurePoints, isMeasuring]);

  const resetMeasurement = () => {
    setMeasurePoints([]);
    setMeasureDistance(null);
    if (measureLayerRef.current) measureLayerRef.current.clearLayers();
  };

  // 5. Render Marker & Clustering theo chuẩn đồ họa bandoso
  const renderMarkers = useCallback(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const map = mapRef.current;
    const zoom = map.getZoom();

    markersLayerRef.current.clearLayers();
    markersMapRef.current.clear();

    const validPins: { pin: GisLocationPinDto; lat: number; lng: number }[] = [];
    pins.forEach((p) => {
      const lat = typeof p.latitude === 'number' ? p.latitude : parseFloat(String(p.latitude));
      const lng = typeof p.longitude === 'number' ? p.longitude : parseFloat(String(p.longitude));
      if (!isNaN(lat) && !isNaN(lng)) {
        validPins.push({ pin: p, lat, lng });
      }
    });

    // Gom cụm thông minh khi zoom xa (< 13) để không dính chùm
    if (zoom < 13 && validPins.length > 5) {
      const clusterDistancePx = 60;
      const clusters: ClusterNode[] = [];

      validPins.forEach(({ pin, lat, lng }) => {
        const point = map.latLngToLayerPoint([lat, lng]);
        let matchedCluster: ClusterNode | null = null;

        for (const c of clusters) {
          const cPoint = map.latLngToLayerPoint([c.lat, c.lng]);
          const distPx = Math.hypot(point.x - cPoint.x, point.y - cPoint.y);
          if (distPx < clusterDistancePx) {
            matchedCluster = c;
            break;
          }
        }

        if (matchedCluster) {
          matchedCluster.pins.push(pin);
          matchedCluster.totalSessions += pin.activeSessionsCount || 0;
          if (pin.status === 'OFFLINE') matchedCluster.hasOffline = true;
          if (pin.status === 'DEGRADED') matchedCluster.hasDegraded = true;
          // Re-calculate weighted center
          matchedCluster.lat = (matchedCluster.lat * (matchedCluster.pins.length - 1) + lat) / matchedCluster.pins.length;
          matchedCluster.lng = (matchedCluster.lng * (matchedCluster.pins.length - 1) + lng) / matchedCluster.pins.length;
        } else {
          clusters.push({
            lat,
            lng,
            pins: [pin],
            totalSessions: pin.activeSessionsCount || 0,
            hasOffline: pin.status === 'OFFLINE',
            hasDegraded: pin.status === 'DEGRADED',
          });
        }
      });

      // Render từng cụm Donut Cluster
      clusters.forEach((cluster) => {
        const count = cluster.pins.length;
        if (count === 1) {
          // Chỉ 1 điểm thì vẽ marker đơn
          renderSinglePin(cluster.pins[0], cluster.lat, cluster.lng);
          return;
        }

        const clusterSize = count < 15 ? 42 : count < 50 ? 50 : 58;
        let ringBorder = '#10b981';
        let bgGradient = 'linear-gradient(135deg, #065f46 0%, #047857 100%)';

        if (cluster.hasOffline) {
          ringBorder = '#f43f5e';
          bgGradient = 'linear-gradient(135deg, #881337 0%, #be123c 100%)';
        } else if (cluster.hasDegraded) {
          ringBorder = '#f59e0b';
          bgGradient = 'linear-gradient(135deg, #78350f 0%, #b45309 100%)';
        }

        const clusterIcon = L.divIcon({
          className: 'leaflet-bandoso-cluster',
          html: `
            <div style="width: ${clusterSize}px; height: ${clusterSize}px; border-radius: 9999px; background: ${bgGradient}; border: 3px solid ${ringBorder}; box-shadow: 0 6px 16px rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
              <span style="font-size: 13px; font-weight: 900; line-height: 1; font-family: monospace;">${count}</span>
              ${cluster.totalSessions > 0 ? `<span style="font-size: 8px; font-weight: 700; color: #a7f3d0; margin-top: 1px;">${cluster.totalSessions} onl</span>` : ''}
            </div>
          `,
          iconSize: [clusterSize, clusterSize],
          iconAnchor: [clusterSize / 2, clusterSize / 2],
        });

        const clusterMarker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });
        clusterMarker.on('click', () => {
          map.flyTo([cluster.lat, cluster.lng], Math.min(16, zoom + 2), { duration: 0.8 });
        });

        clusterMarker.addTo(markersLayerRef.current!);
      });
      return;
    }

    // Render từng điểm riêng lẻ khi zoom gần
    validPins.forEach(({ pin, lat, lng }) => {
      renderSinglePin(pin, lat, lng);
    });
  }, [pins, selectedPin, onSelectPin]);

  const renderSinglePin = (pin: GisLocationPinDto, lat: number, lng: number) => {
    if (!markersLayerRef.current) return;
    const isSelected = selectedPin?.id === pin.id;

    let bgGradient = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
    let ringColor = '#10b981';
    let statusText = 'Hoạt động tốt';
    let statusColor = '#059669';
    let statusDotHex = '#10b981';
    let pulseHtml = '';

    if (pin.status === 'OFFLINE') {
      bgGradient = 'linear-gradient(135deg, #b91c1c 0%, #e11d48 100%)';
      ringColor = '#e11d48';
      statusText = 'Mất mạng';
      statusColor = '#e11d48';
      statusDotHex = '#e11d48';
      // Hiệu ứng sóng radar loang cảnh báo sự cố
      pulseHtml = `<span style="position: absolute; inset: -6px; border-radius: 9999px; background: #f43f5e; opacity: 0.75; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`;
    } else if (pin.status === 'DEGRADED') {
      bgGradient = 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)';
      ringColor = '#f59e0b';
      statusText = 'Suy giảm';
      statusColor = '#d97706';
      statusDotHex = '#f59e0b';
    } else {
      // Soft glow cho trạm online
      pulseHtml = `<span style="position: absolute; inset: -2px; border-radius: 9999px; background: #10b981; opacity: 0.3; filter: blur(2px);"></span>`;
    }

    const scaleStyle = isSelected
      ? 'transform: scale(1.35); z-index: 999;'
      : 'transform: scale(1);';
    const selectedRing = isSelected ? 'box-shadow: 0 0 0 4px #f59e0b, 0 8px 20px rgba(0,0,0,0.5);' : 'box-shadow: 0 4px 12px rgba(0,0,0,0.35);';

    const customIcon = L.divIcon({
      className: 'leaflet-bandoso-marker',
      html: `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); ${scaleStyle}">
          ${pulseHtml}
          <div style="width: 36px; height: 36px; border-radius: 9999px; background: ${bgGradient}; border: 2.5px solid #ffffff; ${selectedRing} display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff;">
            <svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            ${pin.activeSessionsCount > 0 ? `<span style="font-size: 8px; font-weight: 900; font-family: monospace; line-height: 1; letter-spacing: -0.5px;">${pin.activeSessionsCount}</span>` : ''}
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -22],
    });

    const marker = L.marker([lat, lng], { icon: customIcon });

    // Glassmorphism Card Popup cao cấp
    const popupHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 235px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 9.5px; font-weight: 800; color: #004b87; text-transform: uppercase; letter-spacing: 0.5px;">
            ${pin.districtName || 'TP. Hải Phòng'}
          </span>
          <span style="font-size: 9px; font-family: monospace; color: #64748b; background: #f1f5f9; padding: 1px 5px; border-radius: 3px;">
            NVH-${pin.id}
          </span>
        </div>
        <div style="font-size: 13.5px; font-weight: 700; color: #0f172a; margin-top: 4px; line-height: 1.3;">
          ${pin.name}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.35;">
          📍 ${pin.address || 'Nhà văn hóa cơ sở Hải Phòng'}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding: 6px 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 999px; background: ${statusDotHex};"></span>
            <span style="font-weight: 700; color: ${statusColor}; font-size: 11px;">${statusText}</span>
          </div>
          <span style="color: #0369a1; font-weight: 800; font-family: monospace;">
            ${pin.activeSessionsCount || 0} online
          </span>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 6px;">
          <a href="/portal?location=${pin.slug}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #004b87; color: #ffffff; text-decoration: none; padding: 6px 10px; border-radius: 5px; font-size: 11px; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            Mở Cổng chào ↗
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noreferrer" style="text-align: center; background: #ffffff; color: #334155; text-decoration: none; padding: 6px 10px; border-radius: 5px; font-size: 11px; font-weight: 600; border: 1px solid #cbd5e1;">
            Chỉ đường
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.on('click', () => {
      onSelectPin(pin);
    });

    marker.addTo(markersLayerRef.current!);
    markersMapRef.current.set(pin.id, marker);
  };

  // Re-render markers khi pins hoặc zoom thay đổi
  useEffect(() => {
    renderMarkers();
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleZoomOrMove = () => {
      renderMarkers();
    };

    map.on('zoomend', handleZoomOrMove);
    return () => {
      map.off('zoomend', handleZoomOrMove);
    };
  }, [renderMarkers]);

  // 6. Bản đồ nhiệt Heatmap đa tầng phát quang
  useEffect(() => {
    if (!mapRef.current || !heatmapLayerRef.current) return;
    const layer = heatmapLayerRef.current;
    layer.clearLayers();

    if (!heatmapEnabled) return;

    pins.forEach((pin) => {
      const lat = typeof pin.latitude === 'number' ? pin.latitude : parseFloat(String(pin.latitude));
      const lng = typeof pin.longitude === 'number' ? pin.longitude : parseFloat(String(pin.longitude));
      if (isNaN(lat) || isNaN(lng)) return;

      const sessions = pin.activeSessionsCount || 0;
      const radiusMeters = Math.max(350, Math.min(2200, 350 + sessions * 45));

      let coreColor = '#38bdf8';
      let haloColor = '#0284c7';

      if (sessions >= 20) {
        coreColor = '#f43f5e';
        haloColor = '#e11d48';
      } else if (sessions >= 10) {
        coreColor = '#fbbf24';
        haloColor = '#d97706';
      }

      // Outer Glow Halo
      L.circle([lat, lng], {
        radius: radiusMeters,
        color: 'transparent',
        fillColor: haloColor,
        fillOpacity: 0.18,
      }).addTo(layer);

      // Inner Core Circle
      L.circle([lat, lng], {
        radius: radiusMeters * 0.45,
        color: coreColor,
        weight: 1.5,
        fillColor: coreColor,
        fillOpacity: 0.38,
      }).addTo(layer);
    });
  }, [pins, heatmapEnabled]);

  // 7. Tự động Focus vào pin được chọn từ bên ngoài
  useEffect(() => {
    if (!selectedPin || !mapRef.current) return;
    const marker = markersMapRef.current.get(selectedPin.id);
    const lat = typeof selectedPin.latitude === 'number' ? selectedPin.latitude : parseFloat(String(selectedPin.latitude));
    const lng = typeof selectedPin.longitude === 'number' ? selectedPin.longitude : parseFloat(String(selectedPin.longitude));
    if (marker && !isNaN(lat) && !isNaN(lng)) {
      mapRef.current.setView([lat, lng], 15, { animate: true });
      marker.openPopup();
    }
  }, [selectedPin]);

  const handleCenterCity = () => {
    if (!mapRef.current) return;
    const c = DISTRICT_CENTERS.ALL;
    mapRef.current.flyTo([c.lat, c.lng], c.zoom, { duration: 1 });
  };

  const currentBasemapOption = BASEMAP_OPTIONS.find((o) => o.id === activeBasemap) || BASEMAP_OPTIONS[0];
  const ActiveBasemapIcon = currentBasemapOption.icon;

  return (
    <div className={`relative w-full h-full ${compact ? 'min-h-[340px]' : 'min-h-[620px]'} rounded-lg overflow-hidden border border-slate-300 shadow-md group z-0`}>
      {/* Dynamic CSS styles for Cyber Dark and Leaflet Map */}
      <style>{`
        .leaflet-cyber-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(92%) saturate(130%) !important;
        }
        .dark-basemap {
          background-color: #0b1329 !important;
        }
      `}</style>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 🌟 Floating Top-Right HUD Toolbar: Combobox Lớp Bản Đồ Gọn Gàng + Đo khoảng cách + Reset */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-xl text-white">
        {/* Combobox chọn Chế độ bản đồ */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setBasemapDropdownOpen((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
            title="Chọn chế độ bản đồ nền"
          >
            <ActiveBasemapIcon className={`w-3.5 h-3.5 ${currentBasemapOption.iconColor}`} />
            <span className="font-medium">{currentBasemapOption.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${basemapDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {basemapDropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-60 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 mb-1">
                <Layers className="w-3 h-3 text-blue-400" />
                <span>Chế độ bản đồ nền</span>
              </div>
              <div className="space-y-0.5">
                {BASEMAP_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = activeBasemap === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setActiveBasemap(opt.id);
                        setBasemapDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded bg-slate-800 border border-slate-700/60 ${opt.iconColor}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold leading-tight text-white flex items-center gap-1">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {opt.desc}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-400 ml-2 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Thước đo khoảng cách (Measurement Tool) */}
        <button
          type="button"
          onClick={() => {
            setIsMeasuring(!isMeasuring);
            if (isMeasuring) resetMeasurement();
          }}
          className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
            isMeasuring
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md animate-pulse'
              : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20'
          }`}
          title={isMeasuring ? 'Đang bật thước đo (Click 2 điểm)' : 'Thước đo khoảng cách'}
        >
          <Ruler className="w-4 h-4" />
        </button>

        {/* Nút Reset về trung tâm Hải Phòng */}
        <button
          type="button"
          onClick={handleCenterCity}
          className="p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition cursor-pointer"
          title="Về trung tâm TP. Hải Phòng"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 🧭 Top-Left Quick Info Badge (Nếu không compact) */}
      {!compact && (
        <div className="absolute top-3 left-3 z-[400] hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-xl text-white text-xs font-sans">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">{pinStats.total}</span>
            <span className="text-slate-300">điểm phát</span>
          </div>
          <span className="h-3 w-px bg-white/20" />
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold font-mono">
            <span>{pinStats.sessions}</span>
            <span className="text-[11px] font-sans text-slate-300">thiết bị kết nối</span>
          </div>
          {pinStats.offline > 0 && (
            <>
              <span className="h-3 w-px bg-white/20" />
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{pinStats.offline} mất mạng</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 📏 Pill kết quả đo khoảng cách */}
      {isMeasuring && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 text-white text-xs font-semibold shadow-2xl border border-amber-400 backdrop-blur-md animate-in fade-in zoom-in-95">
          <Ruler className="w-4 h-4 text-amber-400 animate-bounce" />
          {measureDistance !== null ? (
            <span>
              Khoảng cách:{' '}
              <strong className="text-amber-300 font-mono text-sm">
                {measureDistance >= 1000 ? `${(measureDistance / 1000).toFixed(2)} km` : `${Math.round(measureDistance)} m`}
              </strong>
            </span>
          ) : (
            <span className="text-slate-300 text-[11.5px]">
              {measurePoints.length === 0 ? 'Click điểm thứ nhất trên bản đồ...' : 'Click điểm thứ hai để đo...'}
            </span>
          )}
          <button
            type="button"
            onClick={resetMeasurement}
            className="p-1 hover:bg-white/20 rounded-full text-slate-400 hover:text-white transition cursor-pointer ml-1"
            title="Đo lại"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMeasuring(false);
              resetMeasurement();
            }}
            className="p-1 hover:bg-white/20 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
            title="Đóng thước đo"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
