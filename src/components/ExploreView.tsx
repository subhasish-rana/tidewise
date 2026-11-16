import React, { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Search, Star, X } from 'lucide-react';
import type { WasteReport, WaterBody } from '../types/tidewise';
import { LeafletOdishaMap } from './LeafletOdishaMap';
import { SafePhoto, SeverityInline, StatusInline } from './StatusIndicator';

type FilterChip =
  | 'All'
  | 'Waste hotspots'
  | 'Beaches'
  | 'Rivers'
  | 'Lakes & ponds'
  | 'Needs cleanup'
  | 'Resolved';

interface ExploreViewProps {
  waterBodies: WaterBody[];
  reports: WasteReport[];
  onOpenWaterBody: (wb: WaterBody) => void;
  onOpenReport: (report: WasteReport) => void;
}

export function ExploreView({
  waterBodies,
  reports,
  onOpenWaterBody,
  onOpenReport,
}: ExploreViewProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBody | null>(
    waterBodies[0] || null,
  );
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);

  const filters: FilterChip[] = [
    'All',
    'Waste hotspots',
    'Beaches',
    'Rivers',
    'Lakes & ponds',
    'Needs cleanup',
    'Resolved',
  ];

  const chipToWaterBodyType: Partial<Record<FilterChip, WaterBody['type']>> = {
    Beaches: 'Beach',
    Rivers: 'River',
    'Lakes & ponds': 'Lake & pond',
  };

  const filteredWaterBodies = useMemo(() => {
    if (
      activeFilter === 'Waste hotspots' ||
      activeFilter === 'Needs cleanup' ||
      activeFilter === 'Resolved'
    ) {
      return [];
    }
    const targetType = chipToWaterBodyType[activeFilter];
    return waterBodies.filter((wb) => {
      const matchesQuery =
        !query.trim() ||
        wb.name.toLowerCase().includes(query.toLowerCase()) ||
        wb.region.toLowerCase().includes(query.toLowerCase()) ||
        wb.areaLabel.toLowerCase().includes(query.toLowerCase());
      const matchesType = !targetType || wb.type === targetType;
      return matchesQuery && matchesType;
    });
  }, [waterBodies, query, activeFilter]);

  const filteredReports = useMemo(() => {
    const targetType = chipToWaterBodyType[activeFilter];
    return reports.filter((r) => {
      const matchesQuery =
        !query.trim() ||
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.locationName.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;
      if (targetType) {
        const wb = waterBodies.find((w) => w.id === r.waterBodyId);
        return wb?.type === targetType;
      }
      if (activeFilter === 'Needs cleanup') {
        return r.status !== 'Resolved' && r.status !== 'Rejected' && r.status !== 'Duplicate';
      }
      if (activeFilter === 'Resolved') {
        return r.status === 'Resolved';
      }
      return true;
    });
  }, [reports, waterBodies, query, activeFilter]);

  const selectedMarkerId = selectedReport?.id || selectedWaterBody?.id || null;

  return (
    <div className="space-y-4">
      {/* Search + Segmented Filters */}
      <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#52677A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search beaches, rivers, lakes…"
            aria-label="Search beaches, rivers, lakes"
            className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/10 text-sm text-[#0B253A] placeholder:text-[#52677A]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((chip) => {
            const active = activeFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveFilter(chip)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0B253A] text-white'
                    : 'bg-[#EEF3F5] text-[#52677A] hover:text-[#0B253A]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map + Selected Marker Sheet/Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <LeafletOdishaMap
            waterBodies={filteredWaterBodies}
            reports={filteredReports}
            selectedMarkerId={selectedMarkerId}
            onSelectWaterBody={(wb) => {
              setSelectedReport(null);
              setSelectedWaterBody(wb);
            }}
            onSelectReport={(rep) => {
              setSelectedWaterBody(null);
              setSelectedReport(rep);
            }}
            heightClass="h-[380px] sm:h-[460px] lg:h-[520px]"
          />
        </div>

        {/* Bottom Sheet / Desktop Side Sheet for Selected Marker */}
        <div className="lg:col-span-4 space-y-4">
          {selectedWaterBody && (
            <div className="bg-white rounded-2xl border border-[#0B253A]/12 overflow-hidden">
              <div className="h-44 relative">
                <SafePhoto
                  src={selectedWaterBody.imageUrl}
                  alt={selectedWaterBody.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedWaterBody(null)}
                  aria-label="Close selected location"
                  className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/55 text-white flex items-center justify-center hover:bg-black/75"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs text-[#52677A] flex items-center gap-1.5">
                  <span>{selectedWaterBody.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedWaterBody.areaLabel}</span>
                </div>
                <h2 className="font-display text-lg font-bold text-[#0B253A]">
                  {selectedWaterBody.name}
                </h2>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#0B253A] tabular-nums">
                    <Star className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
                    {selectedWaterBody.rating.toFixed(1)} / 5 ({selectedWaterBody.ratingCount} ratings)
                  </span>
                  <span className="font-semibold text-[#0D9488]">{selectedWaterBody.trend}</span>
                </div>
                <p className="text-sm text-[#52677A] leading-relaxed">
                  {selectedWaterBody.summary}
                </p>
                <div className="text-xs text-[#52677A] font-mono-tabular">
                  {selectedWaterBody.lat.toFixed(4)}° N, {selectedWaterBody.lng.toFixed(4)}° E
                </div>
                <button
                  type="button"
                  onClick={() => onOpenWaterBody(selectedWaterBody)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>View details &amp; rate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {selectedReport && (
            <div className="bg-white rounded-2xl border border-[#0B253A]/12 overflow-hidden">
              <div className="h-44 relative">
                <SafePhoto
                  src={selectedReport.photoUrl}
                  alt={selectedReport.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  aria-label="Close selected report"
                  className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/55 text-white flex items-center justify-center hover:bg-black/75"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs text-[#52677A] flex items-center gap-1.5">
                  <span className="font-mono-tabular">{selectedReport.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedReport.category}</span>
                </div>
                <h2 className="font-display text-lg font-bold text-[#0B253A]">
                  {selectedReport.title}
                </h2>
                <div className="flex items-center justify-between gap-2">
                  <StatusInline status={selectedReport.status} />
                  <SeverityInline severity={selectedReport.severity} />
                </div>
                <p className="text-sm text-[#52677A] leading-relaxed">
                  {selectedReport.description}
                </p>
                <div className="text-xs text-[#52677A] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{selectedReport.locationName}</span>
                </div>
                {selectedReport.assignedUnit && (
                  <div className="text-xs text-[#0B253A] font-medium">
                    Pickup queue: {selectedReport.assignedUnit}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onOpenReport(selectedReport)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B253A] hover:bg-[#123652] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>View details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!selectedWaterBody && !selectedReport && (
            <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-6 text-center space-y-2">
              <MapPin className="w-6 h-6 text-[#0284C7] mx-auto" />
              <h3 className="font-display text-base font-bold text-[#0B253A]">
                Select a map marker
              </h3>
              <p className="text-xs text-[#52677A]">
                Tap any water body circle or waste hotspot pin to inspect details, ratings, and cleanup status.
              </p>
            </div>
          )}

          {/* Quick list of visible markers */}
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-[#52677A]">
              Matching locations ({filteredWaterBodies.length + filteredReports.length})
            </h3>
            {filteredWaterBodies.length === 0 && filteredReports.length === 0 ? (
              <p className="text-xs text-[#52677A] py-3">
                No locations match your search or filter. Try clearing the search box.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-[#0B253A]/8">
                {filteredWaterBodies.map((wb) => (
                  <button
                    key={wb.id}
                    type="button"
                    onClick={() => {
                      setSelectedReport(null);
                      setSelectedWaterBody(wb);
                    }}
                    className="w-full text-left py-2.5 px-2 hover:bg-[#EEF3F5] rounded-lg flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <span className="font-semibold text-[#0B253A] truncate">{wb.name}</span>
                    <span className="text-[#52677A] shrink-0">{wb.type}</span>
                  </button>
                ))}
                {filteredReports.map((rep) => (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => {
                      setSelectedWaterBody(null);
                      setSelectedReport(rep);
                    }}
                    className="w-full text-left py-2.5 px-2 hover:bg-[#EEF3F5] rounded-lg flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <span className="font-medium text-[#0B253A] truncate">{rep.title}</span>
                    <StatusInline status={rep.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
