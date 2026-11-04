import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GisLocationPinDto } from '../../types/models';

interface LeafletGisMapProps {
  pins: GisLocationPinDto[];
  selectedPin: GisLocationPinDto | null;
  onSelectPin: (pin: GisLocationPinDto | null) => void;
  heatmapEnabled: boolean;
  selectedDistrict: string;
}

// Center coordinates for Hai Phong and its 15 administrative districts
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

export const LeafletGisMap: React.FC<LeafletGisMapProps> = ({
  pins,
  selectedPin,
  onSelectPin,
  heatmapEnabled,
  selectedDistrict,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<number, L.Marker>>(new Map());

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Base Tile Layers
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    });
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: '',
      }
    );

    // Create Map Instance (Centered on Hai Phong Opera House / City Hall)
    const map = L.map(mapContainerRef.current, {
      center: [20.8449, 106.6881],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      layers: [osmStandard],
      zoomControl: false,
    });

    // Add Zoom Control to Top-Left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Add Scale
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Add Layer Control
    const baseMaps = {
      'Bản đồ Tiêu chuẩn': osmStandard,
      'Bản đồ Vệ tinh': esriSatellite,
    };
    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    // Initialize LayerGroups
    const markersLayer = L.layerGroup().addTo(map);
    const heatmapLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    heatmapLayerRef.current = heatmapLayer;

    // Invalidate map size to prevent gray tiles and layout miscalculation
    const t1 = setTimeout(() => { map.invalidateSize(); }, 150);
    const t2 = setTimeout(() => { map.invalidateSize(); }, 500);
    const handleResize = () => { map.invalidateSize(); };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      heatmapLayerRef.current = null;
      markersMapRef.current.clear();
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // 2. Fly to District Center when selected
  useEffect(() => {
    if (!mapRef.current) return;
    const target = DISTRICT_CENTERS[selectedDistrict] || DISTRICT_CENTERS.ALL;
    mapRef.current.flyTo([target.lat, target.lng], target.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedDistrict]);

  // 3. Render Markers & Popups when pins or selectedPin change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    markersMapRef.current.clear();

    const validCoords: [number, number][] = [];

    pins.forEach((pin) => {
      const lat = typeof pin.latitude === 'number' ? pin.latitude : parseFloat(String(pin.latitude));
      const lng = typeof pin.longitude === 'number' ? pin.longitude : parseFloat(String(pin.longitude));
      if (isNaN(lat) || isNaN(lng)) return;

      validCoords.push([lat, lng]);
      const isSelected = selectedPin?.id === pin.id;

      // Color coding
      let bgHex = '#10b981'; // emerald
      let pulseHex = '#34d399';
      let statusText = 'Hoạt động tốt';
      let statusBg = '#ecfdf5';
      let statusColor = '#065f46';

      if (pin.status === 'OFFLINE') {
        bgHex = '#e11d48'; // rose
        pulseHex = '#f43f5e';
        statusText = 'Mất mạng';
        statusBg = '#fff1f2';
        statusColor = '#9f1239';
      } else if (pin.status === 'DEGRADED') {
        bgHex = '#f59e0b'; // amber
        pulseHex = '#fbbf24';
        statusText = 'Suy giảm';
        statusBg = '#fffbeb';
        statusColor = '#92400e';
      }

      const pulseElement =
        pin.status !== 'ONLINE'
          ? `<span style="position: absolute; inset: -4px; border-radius: 9999px; background: ${pulseHex}; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
          : '';

      const scaleClass = isSelected ? 'transform: scale(1.3); z-index: 999;' : '';

      const customIcon = L.divIcon({
        className: 'leaflet-govtech-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; ${scaleClass}">
            ${pulseElement}
            <div style="width: 32px; height: 32px; border-radius: 9999px; background: ${bgHex}; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff;">
              <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
              ${pin.activeSessionsCount > 0 ? `<span style="font-size: 8px; font-weight: 800; font-family: monospace; line-height: 1;">${pin.activeSessionsCount}</span>` : ''}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Rich GovTech Popup
      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 220px; padding: 2px;">
          <div style="font-size: 10px; font-weight: 800; color: #004b87; text-transform: uppercase; letter-spacing: 0.5px;">
            ${pin.districtName || 'Thành phố Hải Phòng'}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 3px; line-height: 1.3;">
            ${pin.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.3;">
            ${pin.address || 'Hải Phòng'}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; font-size: 11px;">
            <span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 7px; border-radius: 4px; font-weight: 700;">
              ${statusText}
            </span>
            <span style="background: #eff6ff; color: #1e40af; padding: 2px 7px; border-radius: 4px; font-weight: 700;">
              ${pin.activeSessionsCount || 0} phiên
            </span>
          </div>
          <div style="margin-top: 8px; display: flex; gap: 4px;">
            <a href="/portal?location=${pin.slug}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #004b87; color: #ffffff; text-decoration: none; padding: 5px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 600;">
              Xem Cổng chào ↗
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
    });

    // Auto fit bounds to visible pins if ALL district is selected and user hasn't selected a single pin
    if (selectedDistrict === 'ALL' && !selectedPin && validCoords.length > 0) {
      try {
        mapRef.current.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 13 });
      } catch (err) {
        // Silently ignore if container has zero size
      }
    }
  }, [pins, selectedPin, onSelectPin, selectedDistrict]);

  // 4. Render Heatmap Density Layer when enabled
  useEffect(() => {
    if (!mapRef.current || !heatmapLayerRef.current) return;

    heatmapLayerRef.current.clearLayers();

    if (!heatmapEnabled) return;

    pins.forEach((pin) => {
      const lat = typeof pin.latitude === 'number' ? pin.latitude : parseFloat(String(pin.latitude));
      const lng = typeof pin.longitude === 'number' ? pin.longitude : parseFloat(String(pin.longitude));
      if (isNaN(lat) || isNaN(lng)) return;

      const sessions = pin.activeSessionsCount || 0;
      // Graduated radius and color based on active sessions
      const radiusMeters = Math.max(300, Math.min(2500, 300 + sessions * 50));
      let circleColor = '#3b82f6';
      let fillColor = '#60a5fa';

      if (sessions >= 20) {
        circleColor = '#dc2626';
        fillColor = '#f87171';
      } else if (sessions >= 10) {
        circleColor = '#d97706';
        fillColor = '#fbbf24';
      }

      const circle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: circleColor,
        fillColor: fillColor,
        fillOpacity: 0.25,
        weight: 1.5,
      });

      circle.addTo(heatmapLayerRef.current!);
    });
  }, [pins, heatmapEnabled]);

  // 5. Open popup when selectedPin changes from outside
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

  return (
    <div className="relative w-full h-full min-h-[580px] rounded-sm overflow-hidden border border-slate-300 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[580px] z-0" />
    </div>
  );
};

