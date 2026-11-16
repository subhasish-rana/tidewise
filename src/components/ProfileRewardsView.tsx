import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Gift,
  Lock,
  LogOut,
  Shield,
  Trophy,
} from 'lucide-react';
import {
  getTierForPoints,
  LEADERBOARD_PREVIEW,
  LOCAL_REWARDS_PREVIEW,
  TIERS,
} from '../data/seedData';
import type {
  BadgeDefinition,
  CleanupDrive,
  MemberAccount,
  PointsEvent,
  WasteReport,
} from '../types/tidewise';
import { AquaTierEmblem, SafePhoto, StatusInline } from './StatusIndicator';

type ProfileTab = 'reports' | 'drives' | 'badges' | 'points';

interface ProfileRewardsViewProps {
  member: MemberAccount;
  reports: WasteReport[];
  drives: CleanupDrive[];
  badges: BadgeDefinition[];
  pointsHistory: PointsEvent[];
  onSelectReport: (report: WasteReport) => void;
  onSelectDrive: (drive: CleanupDrive) => void;
  onOpenModerator: () => void;
  onLogout: () => void;
}

export function ProfileRewardsView({
  member,
  reports,
  drives,
  badges,
  pointsHistory,
  onSelectReport,
  onSelectDrive,
  onOpenModerator,
  onLogout,
}: ProfileRewardsViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('reports');

  const tierInfo = getTierForPoints(member.points);
  const myReports = reports.filter(
    (r) => r.reporterId === member.id || r.reporterName === member.fullName,
  );
  const myDrives = drives.filter((d) => d.joined);
  const initials = member.fullName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Member Identity + Prominent Aquatic Tier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#0B253A]/10 p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0B253A] text-white font-display text-xl font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-[#0B253A] truncate">
                {member.fullName}
              </h1>
              <div className="text-xs text-[#52677A] mt-0.5 truncate">
                {member.homeRegion} · Age {member.age}
              </div>
              <div className="text-xs text-[#0D9488] font-semibold mt-1 tabular-nums">
                {myReports.length} reports · {myDrives.length} drives joined
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#0B253A]/8 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenModerator}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EEF3F5] hover:bg-[#DFE9EE] text-xs font-semibold text-[#0B253A] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Coordinator routing workspace</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-[#52677A] hover:text-[#B91C1C] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Tier Card */}
        <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-[#0B253A] via-[#123652] to-[#0F5257] text-white p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <AquaTierEmblem tierName={tierInfo.current.name} size={52} />
              <div>
                <div className="text-xs text-[#99E2D8] font-medium">Current aquatic tier</div>
                <div className="font-display text-2xl font-bold">{tierInfo.current.name}</div>
                <div className="text-xs text-slate-300 mt-0.5">{tierInfo.current.tagline}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono-tabular text-3xl font-bold">{member.points}</div>
              <div className="text-xs text-[#99E2D8]">total points</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>
                {tierInfo.next
                  ? `${tierInfo.pointsToNext} points to ${tierInfo.next.name}`
                  : 'Highest guardian tier reached'}
              </span>
              <span className="font-mono-tabular">{tierInfo.progressPct}%</span>
            </div>
            <div className="h-2.5 w-full bg-white/15 rounded-full overflow-hidden">
              <div
                style={{ width: `${tierInfo.progressPct}%` }}
                className="h-full bg-[#2DD4BF] rounded-full transition-all duration-300"
              />
            </div>
            <div className="flex items-center justify-between gap-1 pt-1 overflow-x-auto no-scrollbar text-[11px] text-slate-300">
              {TIERS.map((t) => (
                <span
                  key={t.name}
                  className={`whitespace-nowrap ${
                    t.name === tierInfo.current.name ? 'text-white font-semibold' : 'opacity-65'
                  }`}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for My reports / My drives / Badges / Points history */}
      <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#0B253A]/8">
          {(
            [
              { id: 'reports', label: `My reports (${myReports.length})` },
              { id: 'drives', label: `My drives (${myDrives.length})` },
              { id: 'badges', label: `Badges (${badges.filter((b) => b.earned).length}/${badges.length})` },
              { id: 'points', label: 'Points history' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0B253A] text-white'
                  : 'text-[#52677A] hover:text-[#0B253A] hover:bg-[#EEF3F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'reports' && (
          <div className="divide-y divide-[#0B253A]/8">
            {myReports.length === 0 ? (
              <p className="text-sm text-[#52677A] py-4">
                You have not submitted any waste reports yet.
              </p>
            ) : (
              myReports.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => onSelectReport(rep)}
                  className="w-full text-left py-3.5 px-2 hover:bg-[#F8F6F1] rounded-xl flex items-center gap-3.5 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    <SafePhoto
                      src={rep.photoUrl}
                      alt={rep.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#52677A]">
                      {rep.category} · {rep.locationName} · {rep.createdAt}
                    </div>
                    <div className="font-display text-sm font-bold text-[#0B253A] truncate mt-0.5">
                      {rep.title}
                    </div>
                    <div className="mt-1">
                      <StatusInline status={rep.status} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#52677A] shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'drives' && (
          <div className="divide-y divide-[#0B253A]/8">
            {myDrives.length === 0 ? (
              <p className="text-sm text-[#52677A] py-4">
                You have not joined any cleanup drives yet. Browse Drives to RSVP!
              </p>
            ) : (
              myDrives.map((drv) => (
                <button
                  key={drv.id}
                  type="button"
                  onClick={() => onSelectDrive(drv)}
                  className="w-full text-left py-3.5 px-2 hover:bg-[#F8F6F1] rounded-xl flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="text-xs text-[#52677A]">
                      {drv.dateLabel} · {drv.locationName}
                    </div>
                    <div className="font-display text-sm font-bold text-[#0B253A] mt-0.5">
                      {drv.title}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488]">
                    <CheckCircle2 className="w-4 h-4" /> Joined
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {badges.map((bdg) => (
              <div
                key={bdg.id}
                className={`p-4 rounded-xl border ${
                  bdg.earned
                    ? 'bg-[#F8F6F1] border-[#0D9488]/30'
                    : 'bg-white border-[#0B253A]/10 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      bdg.earned
                        ? 'bg-[#CCFBF1] text-[#0F766E]'
                        : 'bg-[#EEF3F5] text-[#52677A]'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#52677A]">
                    {bdg.earned ? `Earned ${bdg.earnedDate}` : 'Locked'}
                  </span>
                </div>
                <div className="font-display text-sm font-bold text-[#0B253A] mt-3">
                  {bdg.name}
                </div>
                <p className="text-xs text-[#52677A] mt-1">{bdg.criteria}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'points' && (
          <div className="divide-y divide-[#0B253A]/8">
            {pointsHistory.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-[#0B253A]">{item.label}</div>
                  <div className="text-[#52677A] mt-0.5">
                    {item.category} · {item.dateLabel}
                  </div>
                </div>
                <span className="font-mono-tabular font-bold text-[#0D9488]">
                  +{item.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Preview + Local Rewards Coming Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#0B253A] inline-flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D97706]" />
              <span>Odisha community leaderboard</span>
            </h2>
            <span className="text-xs text-[#52677A]">Privacy-safe initials</span>
          </div>
          <div className="divide-y divide-[#0B253A]/8">
            {LEADERBOARD_PREVIEW.map((entry) => {
              const isYou = entry.displayName.includes('(You)');
              const pts = isYou ? member.points : entry.points;
              return (
                <div
                  key={entry.rank}
                  className={`py-2.5 px-2 rounded-lg flex items-center justify-between gap-3 text-xs ${
                    isYou ? 'bg-[#EEF3F5]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tabular font-bold text-[#52677A] w-5">
                      #{entry.rank}
                    </span>
                    <div>
                      <div className="font-semibold text-[#0B253A]">{entry.displayName}</div>
                      <div className="text-[#52677A]">
                        {entry.tier} · {entry.region}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono-tabular font-bold text-[#0B253A]">{pts} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-[#0B253A] inline-flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#0D9488]" />
              <span>Local partner rewards</span>
            </h2>
            <span className="text-xs font-semibold text-[#52677A] inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Coming soon
            </span>
          </div>
          <p className="text-xs text-[#52677A]">
            Preview of local Puri &amp; Bhubaneswar eco-partner perks planned after municipal pilot sign-off. Redemption is not yet active.
          </p>
          <div className="space-y-2.5">
            {LOCAL_REWARDS_PREVIEW.map((rew) => (
              <div
                key={rew.id}
                className="p-3.5 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/8 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-[#0B253A]">{rew.title}</div>
                  <div className="text-[11px] text-[#52677A] mt-0.5">
                    {rew.partner} · {rew.location}
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#0B253A]/10 text-[11px] font-semibold text-[#52677A] opacity-75 cursor-not-allowed whitespace-nowrap shrink-0 font-mono-tabular"
                >
                  {rew.pointsCost} pts · Soon
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
