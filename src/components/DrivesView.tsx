import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Users,
} from 'lucide-react';
import type { CleanupDrive, WaterBody } from '../types/tidewise';
import { OdishaMap } from './OdishaMap';
import { SafePhoto } from './StatusIndicator';

type DriveFilter = 'Nearby' | 'Upcoming' | 'Joined';

interface DrivesViewProps {
  drives: CleanupDrive[];
  waterBodies: WaterBody[];
  selectedDrive: CleanupDrive | null;
  onSelectDrive: (drive: CleanupDrive | null) => void;
  onToggleJoin: (driveId: string) => Promise<void>;
}

export function DrivesView({
  drives,
  waterBodies,
  selectedDrive,
  onSelectDrive,
  onToggleJoin,
}: DrivesViewProps) {
  const [filter, setFilter] = useState<DriveFilter>('Nearby');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredDrives = useMemo(() => {
    if (filter === 'Joined') return drives.filter((d) => d.joined);
    if (filter === 'Nearby') return drives.filter((d) => d.isNearby);
    return drives;
  }, [drives, filter]);

  const handleJoinClick = async (id: string) => {
    setBusyId(id);
    try {
      await onToggleJoin(id);
    } finally {
      setBusyId(null);
    }
  };

  if (selectedDrive) {
    const spotsLeft = Math.max(0, selectedDrive.capacity - selectedDrive.participants);
    const fillPct = Math.min(
      100,
      Math.round((selectedDrive.participants / selectedDrive.capacity) * 100),
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => onSelectDrive(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A] min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" /> All cleanup drives
        </button>

        <div className="bg-white rounded-2xl border border-[#0B253A]/10 overflow-hidden">
          <div className="h-56 sm:h-68 relative">
            <SafePhoto
              src={selectedDrive.imageUrl}
              alt={selectedDrive.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="text-xs font-medium text-white/90">
                {selectedDrive.region} · Organized by {selectedDrive.organizer}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                {selectedDrive.title}
              </h1>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#0B253A]/10 text-xs">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#0B253A]">{selectedDrive.dateLabel}</div>
                  <div className="text-[#52677A]">{selectedDrive.timeLabel}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#0B253A]">{selectedDrive.locationName}</div>
                  <div className="text-[#52677A]">{selectedDrive.meetingPoint}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-[#0B253A] shrink-0 mt-0.5" />
                <div className="w-full">
                  <div className="font-semibold text-[#0B253A] tabular-nums">
                    {selectedDrive.participants}/{selectedDrive.capacity} volunteers · {spotsLeft} spots left
                  </div>
                  <div className="h-1.5 w-full bg-[#EEF3F5] rounded-full mt-1.5 overflow-hidden">
                    <div
                      style={{ width: `${fillPct}%` }}
                      className="h-full bg-[#0D9488] rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-base font-bold text-[#0B253A]">
                About this cleanup
              </h2>
              <p className="text-sm text-[#52677A] leading-relaxed">
                {selectedDrive.description}
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-base font-bold text-[#0B253A]">
                What to bring
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#0B253A]">
                {selectedDrive.whatToBring.map((item) => (
                  <li key={item} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6F1]">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-base font-bold text-[#0B253A]">
                Meeting point map
              </h2>
              <OdishaMap
                waterBodies={waterBodies.filter((w) => w.id === selectedDrive.waterBodyId)}
                reports={[]}
                selectedMarkerId={selectedDrive.waterBodyId}
                heightClass="h-52"
                showControls={false}
              />
            </div>

            {selectedDrive.joined && (
              <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#0D9488]/25 text-xs font-semibold text-[#0F766E] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>You are registered for this drive! It is listed under Joined / My drives (+25 points earned).</span>
              </div>
            )}

            <button
              type="button"
              disabled={busyId === selectedDrive.id}
              onClick={() => handleJoinClick(selectedDrive.id)}
              className={`w-full min-h-[48px] px-6 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
                selectedDrive.joined
                  ? 'bg-[#EEF3F5] hover:bg-[#E1EBEF] text-[#0B253A]'
                  : 'bg-[#0D9488] hover:bg-[#0F766E] text-white'
              }`}
            >
              {busyId === selectedDrive.id
                ? 'Updating registration…'
                : selectedDrive.joined
                ? 'Joined · Leave cleanup drive'
                : 'Join cleanup drive'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B253A]">
            Community cleanup drives
          </h1>
          <p className="text-sm text-[#52677A]">
            Join verified shoreline and lake sweeps across Puri, Chandipur, and Bhubaneswar
          </p>
        </div>

        {/* Future disabled capability per brief */}
        <button
          type="button"
          disabled
          title="Public drive creation will open in a future release"
          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#EEF3F5] text-[#52677A] text-xs font-semibold inline-flex items-center gap-2 opacity-75 cursor-not-allowed whitespace-nowrap self-start sm:self-auto"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Create a drive — coming soon</span>
        </button>
      </div>

      {/* Segmented Filter Controls */}
      <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-[#0B253A]/10">
        {(['Nearby', 'Upcoming', 'Joined'] as DriveFilter[]).map((tab) => {
          const active = filter === tab;
          const count =
            tab === 'Joined'
              ? drives.filter((d) => d.joined).length
              : tab === 'Nearby'
              ? drives.filter((d) => d.isNearby).length
              : drives.length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#0B253A] text-white'
                  : 'text-[#52677A] hover:text-[#0B253A]'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {filteredDrives.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-8 text-center space-y-2">
          <Clock className="w-6 h-6 text-[#52677A] mx-auto" />
          <h2 className="font-display text-base font-bold text-[#0B253A]">
            No cleanup drives in this view
          </h2>
          <p className="text-xs text-[#52677A]">
            Switch to Upcoming to browse all scheduled drives across Odisha.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDrives.map((drive) => {
            const spotsLeft = Math.max(0, drive.capacity - drive.participants);
            return (
              <div
                key={drive.id}
                className="bg-white rounded-2xl border border-[#0B253A]/10 overflow-hidden flex flex-col justify-between"
              >
                <button
                  type="button"
                  onClick={() => onSelectDrive(drive)}
                  className="text-left group cursor-pointer"
                >
                  <div className="h-44 overflow-hidden">
                    <SafePhoto
                      src={drive.imageUrl}
                      alt={drive.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="text-xs text-[#52677A] flex items-center gap-1.5">
                      <span>{drive.dateLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{drive.timeLabel}</span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#0B253A]">
                      {drive.title}
                    </h2>
                    <div className="text-xs text-[#52677A]">
                      {drive.locationName} · {drive.organizer}
                    </div>
                  </div>
                </button>

                <div className="px-5 pb-5 pt-2 border-t border-[#0B253A]/8 flex items-center justify-between gap-3">
                  <span className="text-xs text-[#52677A] tabular-nums">
                    {drive.participants}/{drive.capacity} joined · {spotsLeft} open
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDrive(drive)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0B253A] hover:bg-[#EEF3F5] cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      disabled={busyId === drive.id}
                      onClick={() => handleJoinClick(drive.id)}
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        drive.joined
                          ? 'bg-[#CCFBF1] text-[#0F766E]'
                          : 'bg-[#0D9488] hover:bg-[#0F766E] text-white'
                      }`}
                    >
                      {drive.joined ? 'Joined' : 'Join drive'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
