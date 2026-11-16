import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import type { WasteReport, WaterBody } from '../types/tidewise';

interface LeafletOdishaMapProps {
  waterBodies: WaterBody[];
  reports: WasteReport[];
  selectedMarkerId?: string | null;
  onSelectWaterBody?: (wb: WaterBody) => void;
  onSelectReport?: (report: WasteReport) => void;
  heightClass?: string;
}

type FocusRegion = 'all' | 'puri' | 'bhubaneswar' | 'chandipur';

const REGION_VIEWS: Record<FocusRegion, { center: [number, number]; zoom: number; label: string }> = {
  all: { center: [20.52, 86.35], zoom: 8, label: 'All Odisha' },
  puri: { center: [19.801, 85.831], zoom: 13, label: 'Puri' },
  bhubaneswar: { center: [20.305, 85.845], zoom: 12, label: 'Bhubaneswar' },
  chandipur: { center: [21.4414, 87.0155], zoom: 13, label: 'Chandipur' },
};

// Fallback coastal polyline so Odisha geography remains legible even in offline sandboxes
const ODISHA_COAST_REFERENCE: [number, number][] = [
  [19.65, 85.45],
  [19.7983, 85.8249], // Puri
  [19.88, 86.11], // Konark
  [20.26, 86.67], // Paradip
  [20.75, 86.95], // Dhamra
  [21.4414, 87.0155], // Chandipur
  [21.62, 87.48], // Digha border
];

function createWaterBodyIcon(name: string, isSelected: boolean): L.DivIcon {
  const shortName = name.split('(')[0].trim();
  const ring = isSelected
    ? '<span style="position:absolute;inset:-6px;border-radius:9999px;background:rgba(2,132,199,0.22);border:1.5px solid #0284C7;"></span>'
    : '';
  return L.divIcon({
    className: 'tidewise-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        ${ring}
        <span style="position:relative;width:18px;height:18px;border-radius:9999px;background:#0284C7;border:2.5px solid #FFFFFF;box-shadow:0 2px 6px rgba(11,37,58,0.28);display:flex;align-items:center;justify-content:center;">
          <span style="width:5px;height:5px;border-radius:9999px;background:#FFFFFF;"></span>
        </span>
        <span style="position:absolute;left:26px;top:50%;transform:translateY(-50%);background:rgba(11,37,58,0.88);color:#FFFFFF;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;padding:2px 7px;border-radius:6px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 4px rgba(0,0,0,0.16);">
          ${shortName}
        </span>
      </div>
    `,
  });
}

function createHotspotPinIcon(
  severity: WasteReport['severity'],
  status: WasteReport['status'],
  isSelected: boolean,
): L.DivIcon {
  const isResolved = status === 'Resolved';
  const fill = isResolved ? '#0D9488' : severity === 'High' ? '#DC2626' : '#D97706';
  const halo = isSelected
    ? `<circle cx="16" cy="14" r="14" fill="${fill}" fill-opacity="0.22" stroke="${fill}" stroke-width="1.5" />`
    : '';

  return L.divIcon({
    className: 'tidewise-leaflet-marker',
    iconSize: [32, 36],
    iconAnchor: [16, 30],
    html: `
      <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(11,37,58,0.32));">
        ${halo}
        <path d="M16 4C10.477 4 6 8.477 6 14C6 21 16 31 16 31C16 31 26 21 26 14C26 8.477 21.523 4 16 4Z" fill="${fill}" stroke="#FFFFFF" stroke-width="2.2"/>
        <circle cx="16" cy="14" r="3.4" fill="#FFFFFF"/>
      </svg>
    `,
  });
}

export function LeafletOdishaMap({
  waterBodies,
  reports,
  selectedMarkerId,
  onSelectWaterBody,
  onSelectReport,
  heightClass = 'h-[380px] sm:h-[460px] lg:h-[520px]',
}: LeafletOdishaMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [focusRegion, setFocusRegion] = useState<FocusRegion>('all');
  const [tileFailed, setTileFailed] = useState(false);

  const onSelectWbRef = useRef(onSelectWaterBody);
  const onSelectRepRef = useRef(onSelectReport);
  onSelectWbRef.current = onSelectWaterBody;
  onSelectRepRef.current = onSelectReport;

  // Initialize Leaflet map instance
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: REGION_VIEWS.all.center,
      zoom: REGION_VIEWS.all.zoom,
      minZoom: 7,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: true,
    });

    const tiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 18,
      },
    );

    tiles.on('tileerror', () => {
      setTileFailed(true);
    });
    tiles.on('tileload', () => {
      setTileFailed(false);
    });
    tiles.addTo(map);

    // Subtle Odisha coastline vector guide layer beneath markers
    L.polyline(ODISHA_COAST_REFERENCE, {
      color: '#0D9488',
      weight: 2.5,
      opacity: 0.45,
      dashArray: '6 6',
      interactive: false,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    // Ensure accurate sizing after flex/grid layout paint
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Render water body and waste hotspot markers whenever filters or selection change
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    for (const wb of waterBodies) {
      const isSelected = selectedMarkerId === wb.id;
      const marker = L.marker([wb.lat, wb.lng], {
        icon: createWaterBodyIcon(wb.name, isSelected),
        zIndexOffset: isSelected ? 400 : 100,
      });
      marker.on('click', () => {
        onSelectWbRef.current?.(wb);
        map.panTo([wb.lat, wb.lng], { animate: true });
      });
      marker.addTo(layer);
    }

    for (const rep of reports) {
      const isSelected = selectedMarkerId === rep.id;
      const marker = L.marker([rep.lat, rep.lng], {
        icon: createHotspotPinIcon(rep.severity, rep.status, isSelected),
        zIndexOffset: isSelected ? 500 : 250,
      });
      marker.on('click', () => {
        onSelectRepRef.current?.(rep);
        map.panTo([rep.lat, rep.lng], { animate: true });
      });
      marker.addTo(layer);
    }
  }, [waterBodies, reports, selectedMarkerId]);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const map = mapRef.current;
    if (!map || !selectedMarkerId) return;
    const targetWb = waterBodies.find((w) => w.id === selectedMarkerId);
    if (targetWb) {
      map.panTo([targetWb.lat, targetWb.lng], { animate: true });
      return;
    }
    const targetRep = reports.find((r) => r.id === selectedMarkerId);
    if (targetRep) {
      map.panTo([targetRep.lat, targetRep.lng], { animate: true });
    }
  }, [selectedMarkerId, waterBodies, reports]);

  const handleJumpRegion = (reg: FocusRegion) => {
    setFocusRegion(reg);
    const map = mapRef.current;
    if (!map) return;
    const target = REGION_VIEWS[reg];
    map.flyTo(target.center, target.zoom, { duration: 0.65 });
  };

  return (
    <div
      className={`relative isolate z-0 w-full ${heightClass} rounded-2xl overflow-hidden border border-[#0B253A]/12 bg-[#DCECF2]`}
    >
      {/* Leaflet Mount Container */}
      <div
        ref={containerRef}
        className="w-full h-full z-0"
        aria-label="Interactive Leaflet geographic map of Odisha beaches, urban lakes, and waste hotspots"
      />

      {/* Offline / Fallback Notice if map tiles are blocked */}
      {tileFailed && (
        <div className="absolute top-14 left-3 z-[450] bg-white/92 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0B253A]/10 text-[11px] font-medium text-[#52677A] pointer-events-none">
          Geographic coordinates &amp; coastal pins active (offline base layer)
        </div>
      )}

      {/* Region Jump & Custom Zoom Controls */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1 bg-white/94 backdrop-blur-md p-1 rounded-xl border border-[#0B253A]/10 shadow-sm pointer-events-auto overflow-x-auto no-scrollbar">
          {(['all', 'puri', 'bhubaneswar', 'chandipur'] as FocusRegion[]).map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => handleJumpRegion(reg)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                focusRegion === reg
                  ? 'bg-[#0B253A] text-white'
                  : 'text-[#52677A] hover:text-[#0B253A] hover:bg-[#EEF3F5]'
              }`}
            >
              {REGION_VIEWS[reg].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white/94 backdrop-blur-md p-1 rounded-xl border border-[#0B253A]/10 shadow-sm pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out map"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0B253A] hover:bg-[#EEF3F5] cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in map"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0B253A] hover:bg-[#EEF3F5] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleJumpRegion('all')}
            aria-label="Reset map view to All Odisha"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0284C7] hover:bg-[#EEF3F5] cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[500] bg-white/94 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0B253A]/10 text-[11px] font-medium text-[#0B253A] flex items-center gap-3 pointer-events-none shadow-sm">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" /> Water body
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" /> High priority
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] inline-block" /> Needs cleanup
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] inline-block" /> Resolved
        </span>
      </div>
    </div>
  );
}
