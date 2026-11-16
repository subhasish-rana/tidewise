import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ShieldAlert,
  Truck,
  XCircle,
} from 'lucide-react';
import { MUNICIPAL_UNITS } from '../data/seedData';
import type {
  ImpactMonthPoint,
  ReportStatus,
  WasteReport,
} from '../types/tidewise';
import { ImpactChart } from './ImpactChart';
import { SafePhoto, SeverityInline, StatusInline } from './StatusIndicator';

interface ModeratorWorkspaceProps {
  reports: WasteReport[];
  impactSeries: ImpactMonthPoint[];
  onUpdateReport: (
    id: string,
    payload: { status: ReportStatus; assignedUnit?: string; note?: string },
  ) => Promise<void>;
  onSelectReport: (report: WasteReport) => void;
  onExit: () => void;
}

export function ModeratorWorkspace({
  reports,
  impactSeries,
  onUpdateReport,
  onSelectReport,
  onExit,
}: ModeratorWorkspaceProps) {
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<'pending' | 'assigned' | 'all'>('pending');

  const filteredQueue = reports.filter((r) => {
    if (queueFilter === 'pending') {
      return r.status === 'Submitted' || r.status === 'Under review' || r.status === 'Verified';
    }
    if (queueFilter === 'assigned') {
      return r.status === 'Assigned' || r.status === 'In progress';
    }
    return true;
  });

  const handleAction = async (
    rep: WasteReport,
    status: ReportStatus,
    unit?: string,
    note?: string,
  ) => {
    setBusyId(rep.id);
    try {
      await onUpdateReport(rep.id, { status, assignedUnit: unit, note });
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = reports.filter(
    (r) => r.status === 'Submitted' || r.status === 'Under review',
  ).length;
  const activeDispatchCount = reports.filter(
    (r) => r.status === 'Assigned' || r.status === 'In progress',
  ).length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length + 82;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A] min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" /> Return to public member view
        </button>
      </div>

      {/* Restricted Coordinator Notice */}
      <div className="rounded-2xl bg-[#0B253A] text-white p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FCD34D]">
            <ShieldAlert className="w-4 h-4" />
            <span>Restricted Coordinator &amp; Municipal Routing Workspace</span>
          </div>
          <h1 className="font-display text-2xl font-bold">
            Waste Verification &amp; Municipal Pickup Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Separate from public member accounts. Verify AI waste tags, filter duplicates, and route pickups to Puri Municipality, BMC, or Balasore squads.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-white/15 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <div className="font-mono-tabular text-2xl font-bold">{pendingCount}</div>
            <div className="text-[11px] text-slate-300">Needs triage</div>
          </div>
          <div>
            <div className="font-mono-tabular text-2xl font-bold text-[#38BDF8]">
              {activeDispatchCount}
            </div>
            <div className="text-[11px] text-slate-300">Active pickups</div>
          </div>
          <div>
            <div className="font-mono-tabular text-2xl font-bold text-[#2DD4BF]">
              {resolvedCount}
            </div>
            <div className="text-[11px] text-slate-300">Total resolved</div>
          </div>
        </div>
      </div>

      {/* Queue Filter + Report Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-[#0B253A]/10">
            {(
              [
                { id: 'pending', label: 'Needs review' },
                { id: 'assigned', label: 'Assigned / In progress' },
                { id: 'all', label: 'All reports' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQueueFilter(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  queueFilter === tab.id
                    ? 'bg-[#0B253A] text-white'
                    : 'text-[#52677A] hover:text-[#0B253A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-8 text-center text-sm text-[#52677A]">
            No reports currently in this queue.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQueue.map((rep) => {
              const defaultUnit =
                selectedUnits[rep.id] ||
                rep.assignedUnit ||
                (rep.region === 'Puri'
                  ? MUNICIPAL_UNITS[0]
                  : rep.region === 'Balasore'
                  ? MUNICIPAL_UNITS[3]
                  : MUNICIPAL_UNITS[1]);

              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-[#0B253A]/10 p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center"
                >
                  <button
                    type="button"
                    onClick={() => onSelectReport(rep)}
                    className="lg:col-span-3 h-40 lg:h-32 rounded-xl overflow-hidden text-left cursor-pointer"
                  >
                    <SafePhoto
                      src={rep.photoUrl}
                      alt={rep.title}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="lg:col-span-5 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#52677A]">
                      <span className="font-mono-tabular font-semibold">{rep.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rep.createdAt}</span>
                      <span aria-hidden="true">·</span>
                      <SeverityInline severity={rep.severity} />
                    </div>
                    <h2 className="font-display text-base font-bold text-[#0B253A]">
                      {rep.title}
                    </h2>
                    <div className="text-xs text-[#52677A]">
                      {rep.locationName} · Category: <strong className="text-[#0B253A]">{rep.category}</strong> (AI {rep.aiConfidence}%)
                    </div>
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <StatusInline status={rep.status} />
                      {rep.assignedUnit && (
                        <span className="text-xs font-medium text-[#0284C7]">
                          Owner: {rep.assignedUnit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-2.5">
                    <select
                      aria-label={`Select municipal unit for ${rep.id}`}
                      value={defaultUnit}
                      onChange={(e) =>
                        setSelectedUnits((prev) => ({ ...prev, [rep.id]: e.target.value }))
                      }
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/15 text-xs font-medium text-[#0B253A]"
                    >
                      {MUNICIPAL_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === rep.id}
                        onClick={() =>
                          handleAction(
                            rep,
                            'Verified',
                            undefined,
                            'Verified by Odisha coastal coordinator.',
                          )
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EEF3F5] hover:bg-[#DFE9EE] text-xs font-semibold text-[#0B253A] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Verify</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyId === rep.id}
                        onClick={() =>
                          handleAction(
                            rep,
                            'Assigned',
                            defaultUnit,
                            `Routed to ${defaultUnit} for scheduled pickup.`,
                          )
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-xs font-semibold text-white inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Assign pickup</span>
                      </button>

                      {(rep.status === 'Assigned' || rep.status === 'In progress') && (
                        <button
                          type="button"
                          disabled={busyId === rep.id}
                          onClick={() =>
                            handleAction(
                              rep,
                              'Resolved',
                              defaultUnit,
                              `Pickup completed by ${defaultUnit}.`,
                            )
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-xs font-semibold text-white inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark resolved</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busyId === rep.id}
                        onClick={() =>
                          handleAction(rep, 'Duplicate', undefined, 'Merged with nearby active report.')
                        }
                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#52677A] hover:bg-[#EEF3F5] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyId === rep.id}
                        onClick={() =>
                          handleAction(rep, 'Rejected', undefined, 'Flagged as non-waste or unclear image.')
                        }
                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#B91C1C] hover:bg-red-50 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cleanup Impact Over Time Analytics */}
      <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 sm:p-6 space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0B253A]">
            Municipal pickup impact over time
          </h2>
          <p className="text-xs text-[#52677A]">
            Monthly tonnage cleared and average municipal pickup turnaround across Puri, Chandipur, and Bhubaneswar
          </p>
        </div>
        <ImpactChart data={impactSeries} />
      </div>
    </div>
  );
}
