import React from 'react';
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, Truck } from 'lucide-react';
import type { WasteReport, WaterBody } from '../types/tidewise';
import { OdishaMap } from './OdishaMap';
import { SafePhoto, SeverityInline, StatusInline } from './StatusIndicator';

interface ReportDetailViewProps {
  report: WasteReport;
  waterBodies: WaterBody[];
  onBack: () => void;
}

export function ReportDetailView({
  report,
  waterBodies,
  onBack,
}: ReportDetailViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A] min-h-[40px]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-[#0B253A]/10 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 h-60 lg:h-auto">
            <SafePhoto
              src={report.photoUrl}
              alt={report.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-7 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-tabular text-xs font-semibold text-[#52677A]">
                {report.id} · {report.createdAt}
              </span>
              <StatusInline status={report.status} />
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0B253A]">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#52677A]">
              <span>Category: <strong className="text-[#0B253A]">{report.category}</strong></span>
              <span aria-hidden="true">·</span>
              <SeverityInline severity={report.severity} />
              {report.estimatedKg && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">Est. {report.estimatedKg} kg</span>
                </>
              )}
            </div>

            <p className="text-sm text-[#52677A] leading-relaxed">{report.description}</p>

            <div className="p-3.5 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/10 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#0B253A]">
                <MapPin className="w-4 h-4 text-[#0284C7]" />
                <span>{report.locationName}</span>
              </div>
              <div className="font-mono-tabular text-[#52677A] pl-6">
                {report.lat.toFixed(4)}° N, {report.lng.toFixed(4)}° E · Reported by {report.reporterName}
              </div>
              {report.assignedUnit && (
                <div className="flex items-center gap-2 text-[#0F766E] font-semibold pt-1">
                  <Truck className="w-4 h-4" />
                  <span>Municipal queue: {report.assignedUnit}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-[#52677A] pt-1">
              <span className="font-semibold text-[#0B253A]">AI check:</span> Suggested{' '}
              {report.aiSuggestedCategory} ({report.aiConfidence}% confidence) — {report.aiReasoning}
            </div>
          </div>
        </div>
      </div>

      {/* Location Snippet + Progress Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#0B253A]/10 p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B253A]">
            Status &amp; municipal routing timeline
          </h2>
          <ol className="space-y-4">
            {report.timeline.map((evt, idx) => {
              const isLast = idx === report.timeline.length - 1;
              return (
                <li key={`${evt.status}-${idx}`} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {evt.status === 'Resolved' ? (
                      <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                    ) : isLast ? (
                      <ShieldCheck className="w-5 h-5 text-[#0284C7]" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
                    )}
                  </div>
                  <div className="flex-1 pb-3 border-b border-[#0B253A]/8 last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#0B253A]">{evt.status}</span>
                      <span className="font-mono-tabular text-xs text-[#52677A]">
                        {evt.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[#52677A] mt-0.5">{evt.note}</p>
                    <p className="text-[11px] text-[#52677A] mt-0.5">Updated by {evt.actor}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#0B253A]/10 p-4 space-y-3">
          <h2 className="font-display text-base font-bold text-[#0B253A]">
            Mapped geotag location
          </h2>
          <OdishaMap
            waterBodies={waterBodies}
            reports={[report]}
            selectedMarkerId={report.id}
            heightClass="h-64"
            showControls={false}
          />
        </div>
      </div>
    </div>
  );
}
