import React, { useState } from 'react';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import type { WasteReport, WaterBody } from '../types/tidewise';

interface OdishaMapProps {
  waterBodies: WaterBody[];
  reports: WasteReport[];
  selectedMarkerId?: string | null;
  onSelectWaterBody?: (wb: WaterBody) => void;
  onSelectReport?: (report: WasteReport) => void;
  pickMode?: boolean;
  pickedCoords?: { mapX: number; mapY: number; lat: number; lng: number } | null;
  onPickLocation?: (coords: { mapX: number; mapY: number; lat: number; lng: number; nearestRegion: 'Puri' | 'Balasore' | 'Bhubaneswar'; nearestWaterBodyId: string; nearestName: string }) => void;
  heightClass?: string;
  showControls?: boolean;
}

export function OdishaMap({
  waterBodies,
  reports,
  selectedMarkerId,
  onSelectWaterBody,
  onSelectReport,
  pickMode = false,
  pickedCoords,
  onPickLocation,
  heightClass = 'h-72 sm:h-96',
  showControls = true,
}: OdishaMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [focusRegion, setFocusRegion] = useState<'all' | 'puri' | 'bhubaneswar' | 'chandipur'>('all');

  const viewBoxByRegion: Record<typeof focusRegion, string> = {
    all: '0 0 1000 700',
    puri: '330 450 320 220',
    bhubaneswar: '260 200 320 230',
    chandipur: '680 70 300 210',
  };

  const currentViewBox = (() => {
    const base = viewBoxByRegion[focusRegion].split(' ').map(Number);
    if (zoom === 1) return base.join(' ');
    const [x, y, w, h] = base;
    const nw = w / zoom;
    const nh = h / zoom;
    const nx = x + (w - nw) / 2;
    const ny = y + (h - nh) / 2;
    return `${nx.toFixed(0)} ${ny.toFixed(0)} ${nw.toFixed(0)} ${nh.toFixed(0)}`;
  })();

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!pickMode || !onPickLocation) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const [vx, vy, vw, vh] = currentViewBox.split(' ').map(Number);
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const mapX = Math.round(vx + relX * vw);
    const mapY = Math.round(vy + relY * vh);

    // Map SVG coordinates to approximate Odisha lat/lng
    const lat = Number((21.95 - (mapY / 700) * 2.45).toFixed(4));
    const lng = Number((85.1 + (mapX / 1000) * 2.25).toFixed(4));

    let nearest = waterBodies[0];
    let bestDist = Infinity;
    for (const wb of waterBodies) {
      const d = Math.hypot(wb.mapX - mapX, wb.mapY - mapY);
      if (d < bestDist) {
        bestDist = d;
        nearest = wb;
      }
    }

    onPickLocation({
      mapX,
      mapY,
      lat,
      lng,
      nearestRegion: nearest ? nearest.region : 'Puri',
      nearestWaterBodyId: nearest ? nearest.id : 'wb-puri',
      nearestName: nearest ? `${nearest.name.split('(')[0].trim()} · Custom Pin` : 'Odisha Coast Pin',
    });
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-[#0B253A]/12 bg-[#DCECF2]`}>
      <svg
        viewBox={currentViewBox}
        preserveAspectRatio="xMidYMid slice"
        onClick={handleSvgClick}
        className={`w-full h-full select-none ${pickMode ? 'cursor-crosshair' : 'cursor-default'}`}
        role="img"
        aria-label="Interactive Odisha coastline and Bhubaneswar urban lakes map"
      >
        <defs>
          <linearGradient id="bayOfBengalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#CBE4EE" />
            <stop offset="55%" stopColor="#A6D4E5" />
            <stop offset="100%" stopColor="#7ABBD6" />
          </linearGradient>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#EFECE2" />
            <stop offset="100%" stopColor="#E6E1D3" />
          </linearGradient>
        </defs>

        {/* Bay of Bengal Sea */}
        <rect x="0" y="0" width="1000" height="700" fill="url(#bayOfBengalGrad)" />

        {/* Subtle bathymetry contour lines in sea */}
        <path
          d="M 420 700 C 520 590, 650 510, 770 390 C 860 300, 920 220, 1000 175"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M 520 700 C 610 600, 730 520, 845 410 C 915 340, 960 280, 1000 250"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.22"
          strokeWidth="1.2"
        />

        {/* Odisha Coastal Landmass */}
        <path
          d="M 0 0 L 1000 0 L 1000 105 C 945 125, 895 142, 835 168 C 770 198, 720 250, 680 310 C 640 370, 585 435, 535 495 C 485 555, 425 595, 345 635 C 265 675, 195 685, 110 700 L 0 700 Z"
          fill="url(#landGrad)"
          stroke="#C8C1AE"
          strokeWidth="2"
        />

        {/* Golden sand coastal belt */}
        <path
          d="M 110 700 C 195 685, 265 675, 345 635 C 425 595, 485 555, 535 495 C 585 435, 640 370, 680 310 C 720 250, 770 198, 835 168 C 895 142, 945 125, 1000 105"
          fill="none"
          stroke="#DFCFA9"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Mahanadi / Kuakhai River Delta channels */}
        <path
          d="M 150 220 C 260 255, 360 285, 465 322 C 550 350, 610 385, 655 415"
          fill="none"
          stroke="#89C4DC"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 415 305 C 455 340, 480 390, 505 460"
          fill="none"
          stroke="#89C4DC"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* NH-16 & Marine Drive road hints */}
        <path
          d="M 290 210 L 385 330 L 455 545"
          fill="none"
          stroke="#0B253A"
          strokeOpacity="0.12"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <path
          d="M 385 330 C 520 270, 675 215, 825 160"
          fill="none"
          stroke="#0B253A"
          strokeOpacity="0.12"
          strokeWidth="2"
          strokeDasharray="5 5"
        />

        {/* Urban Lake Shapes in Bhubaneswar */}
        <ellipse cx="390" cy="365" rx="16" ry="11" fill="#78BDD9" stroke="#0284C7" strokeOpacity="0.4" strokeWidth="1" />
        <ellipse cx="355" cy="265" rx="19" ry="12" fill="#78BDD9" stroke="#0284C7" strokeOpacity="0.4" strokeWidth="1" />

        {/* Region Geography Labels */}
        <text x="695" y="495" fill="#0B253A" fillOpacity="0.45" fontSize="14" fontWeight="600" letterSpacing="2">
          BAY OF BENGAL
        </text>
        <text x="275" y="395" fill="#0B253A" fillOpacity="0.65" fontSize="12" fontWeight="600">
          Bhubaneswar Basin
        </text>
        <text x="415" y="610" fill="#0B253A" fillOpacity="0.65" fontSize="12" fontWeight="600">
          Puri Coast
        </text>
        <text x="765" y="135" fill="#0B253A" fillOpacity="0.65" fontSize="12" fontWeight="600">
          Chandipur · Balasore
        </text>

        {/* Water Body Markers */}
        {waterBodies.map((wb) => {
          const isSelected = selectedMarkerId === wb.id;
          return (
            <g
              key={wb.id}
              transform={`translate(${wb.mapX}, ${wb.mapY})`}
              onClick={(e) => {
                if (pickMode) return;
                e.stopPropagation();
                onSelectWaterBody?.(wb);
              }}
              className={pickMode ? '' : 'cursor-pointer'}
            >
              {isSelected && (
                <circle r="22" fill="#0284C7" fillOpacity="0.18" stroke="#0284C7" strokeWidth="1.5" />
              )}
              <circle
                r={isSelected ? 11 : 9}
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <circle r="3" fill="#FFFFFF" />
              <g transform="translate(14, -6)">
                <rect
                  x="-2"
                  y="-11"
                  width={Math.min(148, wb.name.split('(')[0].trim().length * 6.8 + 14)}
                  height="19"
                  rx="5"
                  fill="#0B253A"
                  fillOpacity="0.86"
                />
                <text x="5" y="2" fill="#FFFFFF" fontSize="10.5" fontWeight="600">
                  {wb.name.split('(')[0].trim()}
                </text>
              </g>
            </g>
          );
        })}

        {/* Waste Report Hotspot Pins */}
        {reports.map((rep) => {
          const isSelected = selectedMarkerId === rep.id;
          const isResolved = rep.status === 'Resolved';
          const fill = isResolved ? '#0D9488' : rep.severity === 'High' ? '#DC2626' : '#D97706';
          return (
            <g
              key={rep.id}
              transform={`translate(${rep.mapX}, ${rep.mapY})`}
              onClick={(e) => {
                if (pickMode) return;
                e.stopPropagation();
                onSelectReport?.(rep);
              }}
              className={pickMode ? '' : 'cursor-pointer'}
            >
              {isSelected && (
                <circle r="18" fill={fill} fillOpacity="0.2" stroke={fill} strokeWidth="1.5" />
              )}
              <path
                d="M 0 -18 C -6 -18, -10 -13, -10 -8 C -10 -2, 0 6, 0 6 C 0 6, 10 -2, 10 -8 C 10 -13, 6 -18, 0 -18 Z"
                fill={fill}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle cx="0" cy="-8.5" r="3" fill="#FFFFFF" />
            </g>
          );
        })}

        {/* Custom Picked Pin for Step 1 Report Flow */}
        {pickMode && pickedCoords && (
          <g transform={`translate(${pickedCoords.mapX}, ${pickedCoords.mapY})`}>
            <circle r="20" fill="#0D9488" fillOpacity="0.22" stroke="#0D9488" strokeWidth="2" />
            <path
              d="M 0 -22 C -7 -22, -12 -16, -12 -10 C -12 -2, 0 8, 0 8 C 0 8, 12 -2, 12 -10 C 12 -16, 7 -22, 0 -22 Z"
              fill="#0D9488"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <circle cx="0" cy="-10" r="3.5" fill="#FFFFFF" />
          </g>
        )}
      </svg>

      {/* Map Region Jump & Zoom Controls */}
      {showControls && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1 bg-white/92 backdrop-blur-md p-1 rounded-xl border border-[#0B253A]/10 shadow-sm pointer-events-auto overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'All Odisha' },
                { id: 'puri', label: 'Puri' },
                { id: 'bhubaneswar', label: 'Bhubaneswar' },
                { id: 'chandipur', label: 'Chandipur' },
              ] as const
            ).map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => {
                  setFocusRegion(reg.id);
                  setZoom(1);
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  focusRegion === reg.id
                    ? 'bg-[#0B253A] text-white'
                    : 'text-[#52677A] hover:text-[#0B253A] hover:bg-[#EEF3F5]'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white/92 backdrop-blur-md p-1 rounded-xl border border-[#0B253A]/10 shadow-sm pointer-events-auto shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.35).toFixed(2))))}
              aria-label="Zoom out map"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0B253A] hover:bg-[#EEF3F5]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.35).toFixed(2))))}
              aria-label="Zoom in map"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0B253A] hover:bg-[#EEF3F5]"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setFocusRegion('all');
                setZoom(1);
              }}
              aria-label="Reset map view"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0284C7] hover:bg-[#EEF3F5]"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white/92 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0B253A]/10 text-[11px] font-medium text-[#0B253A] flex items-center gap-3 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" /> Water body
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" /> Needs cleanup
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] inline-block" /> Resolved
        </span>
      </div>
    </div>
  );
}
