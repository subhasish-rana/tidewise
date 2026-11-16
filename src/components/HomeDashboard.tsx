import React from 'react';
import { ArrowRight, Camera, CheckCircle2, MapPin, Star, Users } from 'lucide-react';
import { getTierForPoints } from '../data/seedData';
import type {
  CleanupDrive,
  ImpactMonthPoint,
  MemberAccount,
  WasteReport,
  WaterBody,
} from '../types/tidewise';
import { ImpactChart } from './ImpactChart';
import { OdishaMap } from './OdishaMap';
import { AquaTierEmblem, SafePhoto, StatusInline } from './StatusIndicator';

interface HomeDashboardProps {
  member: MemberAccount;
  waterBodies: WaterBody[];
  reports: WasteReport[];
  drives: CleanupDrive[];
  impactSeries: ImpactMonthPoint[];
  onStartReport: () => void;
  onOpenExplore: () => void;
  onSelectWaterBody: (wb: WaterBody) => void;
  onSelectReport: (report: WasteReport) => void;
  onSelectDrive: (drive: CleanupDrive) => void;
  onOpenDrives: () => void;
}

export function HomeDashboard({
  member,
  waterBodies,
  reports,
  drives,
  impactSeries,
  onStartReport,
  onOpenExplore,
  onSelectWaterBody,
  onSelectReport,
  onSelectDrive,
  onOpenDrives,
}: HomeDashboardProps) {
  const firstName = member.fullName.split(' ')[0] || 'Friend';
  const tierInfo = getTierForPoints(member.points);
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length + 82;
  const activeDrivesCount = drives.length + 14;
  const totalKg = impactSeries.reduce((acc, p) => acc + p.kgCleared, 0);

  return (
    <div className="space-y-8">
      {/* Hero Greeting + Primary Report Action */}
      <section className="rounded-2xl bg-[#0B253A] tide-contour-dark text-white p-6 sm:p-8 border border-[#0B253A]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#99E2D8]">
              <AquaTierEmblem tierName={tierInfo.current.name} size={28} />
              <span>{tierInfo.current.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{member.points} points</span>
              <span aria-hidden="true">·</span>
              <span>{member.homeRegion}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight [text-wrap:balance]">
              Good morning, {firstName}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              Spot litter along Puri, Chandipur, or Bhubaneswar lakes? Snap a photo to tag the waste type and route municipal pickup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onStartReport}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#14B8A6] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <span>Report waste</span>
            </button>
            <button
              type="button"
              onClick={onOpenExplore}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/18 text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              <span>Open map</span>
            </button>
          </div>
        </div>
      </section>

      {/* Map Preview + Community Impact Split on Desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#0B253A]/10 p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B253A]">
                Odisha Coast &amp; Urban Lakes
              </h2>
              <p className="text-xs text-[#52677A] mt-0.5">
                Tap any water body or hotspot pin to inspect status
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenExplore}
              className="text-xs font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1 min-h-[40px] whitespace-nowrap shrink-0"
            >
              <span>Full map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <OdishaMap
            waterBodies={waterBodies}
            reports={reports}
            onSelectWaterBody={onSelectWaterBody}
            onSelectReport={onSelectReport}
            heightClass="h-64 sm:h-72"
            showControls={false}
          />
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#0B253A]/10 p-5 flex flex-col justify-between gap-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B253A]">
              Community impact over time
            </h2>
            <p className="text-xs text-[#52677A] mt-0.5">
              Verified reports routed to Puri, Balasore &amp; BMC squads
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 py-2 border-y border-[#0B253A]/8">
            <div>
              <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#0B253A]">
                {resolvedCount}
              </div>
              <div className="text-xs text-[#52677A] mt-0.5">Reports resolved</div>
            </div>
            <div>
              <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#0D9488]">
                {activeDrivesCount}
              </div>
              <div className="text-xs text-[#52677A] mt-0.5">Drives completed</div>
            </div>
            <div>
              <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#0284C7]">
                {(totalKg / 1000).toFixed(1)}t
              </div>
              <div className="text-xs text-[#52677A] mt-0.5">Waste diverted</div>
            </div>
          </div>

          <ImpactChart data={impactSeries} compact />
        </div>
      </section>

      {/* Explore Nearby Water Bodies */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B253A]">
              Explore nearby water bodies
            </h2>
            <p className="text-sm text-[#52677A]">
              Community cleanliness ratings across beaches, lakes, and rivers
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenExplore}
            className="text-sm font-semibold text-[#0284C7] hover:underline whitespace-nowrap shrink-0"
          >
            View all
          </button>
        </div>

        <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-visible pb-2 no-scrollbar">
          {waterBodies.slice(0, 3).map((wb) => (
            <button
              key={wb.id}
              type="button"
              onClick={() => onSelectWaterBody(wb)}
              className="min-w-[270px] lg:min-w-0 text-left bg-white rounded-2xl border border-[#0B253A]/10 overflow-hidden hover:border-[#0284C7]/40 transition-colors cursor-pointer group flex flex-col"
            >
              <div className="h-40 w-full overflow-hidden">
                <SafePhoto
                  src={wb.imageUrl}
                  alt={wb.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-xs text-[#52677A] flex items-center gap-1.5">
                    <span>{wb.type}</span>
                    <span aria-hidden="true">·</span>
                    <span>{wb.region}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#0B253A] mt-1">
                    {wb.name}
                  </h3>
                </div>
                <div className="pt-2 border-t border-[#0B253A]/8 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#0B253A] tabular-nums">
                    <Star className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" />
                    {wb.rating.toFixed(1)} / 5 ({wb.ratingCount})
                  </span>
                  <span className="font-medium text-[#0D9488]">{wb.trend}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Cleanup Activities Near You & Recent Reports */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#0B253A]">
              Cleanup activities near you
            </h2>
            <button
              type="button"
              onClick={onOpenDrives}
              className="text-sm font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
            >
              All drives
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 divide-y divide-[#0B253A]/8">
            {drives.slice(0, 3).map((drive) => (
              <button
                key={drive.id}
                type="button"
                onClick={() => onSelectDrive(drive)}
                className="w-full text-left p-4 hover:bg-[#EEF3F5]/60 transition-colors flex items-center justify-between gap-4 cursor-pointer min-h-[68px]"
              >
                <div className="min-w-0">
                  <div className="text-xs text-[#52677A] flex items-center gap-1.5 truncate">
                    <span>{drive.dateLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{drive.locationName}</span>
                  </div>
                  <div className="font-display text-sm font-bold text-[#0B253A] mt-0.5 truncate">
                    {drive.title}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#52677A]">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="w-3.5 h-3.5" />
                      {drive.participants}/{drive.capacity} joined
                    </span>
                    {drive.joined && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0D9488]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Joined
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#52677A] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#0B253A]">
              Recent hotspot reports
            </h2>
            <span className="text-xs text-[#52677A] tabular-nums">
              {reports.length} active records
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 divide-y divide-[#0B253A]/8">
            {reports.slice(0, 3).map((rep) => (
              <button
                key={rep.id}
                type="button"
                onClick={() => onSelectReport(rep)}
                className="w-full text-left p-4 hover:bg-[#EEF3F5]/60 transition-colors flex items-center gap-3.5 cursor-pointer min-h-[68px]"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <SafePhoto
                    src={rep.photoUrl}
                    alt={rep.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[#52677A] flex items-center gap-1.5 truncate">
                    <span>{rep.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rep.locationName}</span>
                  </div>
                  <div className="font-display text-sm font-bold text-[#0B253A] mt-0.5 truncate">
                    {rep.title}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <StatusInline status={rep.status} />
                    <span className="text-xs text-[#52677A] tabular-nums">{rep.createdAt}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
