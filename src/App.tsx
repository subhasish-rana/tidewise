import React, { useEffect, useState } from 'react';
import {
  Camera,
  Compass,
  Home,
  User,
  Users,
} from 'lucide-react';
import { DrivesView } from './components/DrivesView';
import { ExploreView } from './components/ExploreView';
import { HomeDashboard } from './components/HomeDashboard';
import { ModeratorWorkspace } from './components/ModeratorWorkspace';
import { ProfileRewardsView } from './components/ProfileRewardsView';
import { ReportDetailView } from './components/ReportDetailView';
import { ReportFlow } from './components/ReportFlow';
import { TidewiseWordmark } from './components/StatusIndicator';
import { WaterBodyDetail } from './components/WaterBodyDetail';
import { WelcomeAuth } from './components/WelcomeAuth';
import {
  DEFAULT_DEMO_MEMBER,
  IMPACT_SERIES,
  INITIAL_BADGES,
  INITIAL_DRIVES,
  INITIAL_POINTS_HISTORY,
  INITIAL_RATINGS,
  INITIAL_REPORTS,
  INITIAL_WATER_BODIES,
} from './data/seedData';
import type {
  AppScreen,
  BadgeDefinition,
  CleanupDrive,
  CleanlinessRatingEntry,
  ImpactMonthPoint,
  MemberAccount,
  PointsEvent,
  ReportStatus,
  WasteReport,
  WaterBody,
} from './types/tidewise';

const MEMBER_STORAGE_KEY = 'tidewise_member_v1';
const POINTS_STORAGE_KEY = 'tidewise_points_history_v1';
const BADGES_STORAGE_KEY = 'tidewise_badges_v1';

export default function App() {
  const [member, setMember] = useState<MemberAccount | null>(() => {
    try {
      const saved = localStorage.getItem(MEMBER_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as MemberAccount) : null;
    } catch {
      return null;
    }
  });

  const [screen, setScreen] = useState<AppScreen>(() => (member ? 'home' : 'welcome'));
  const [prevScreen, setPrevScreen] = useState<AppScreen>('home');

  const [waterBodies, setWaterBodies] = useState<WaterBody[]>(INITIAL_WATER_BODIES);
  const [reports, setReports] = useState<WasteReport[]>(INITIAL_REPORTS);
  const [drives, setDrives] = useState<CleanupDrive[]>(INITIAL_DRIVES);
  const [ratings, setRatings] = useState<CleanlinessRatingEntry[]>(INITIAL_RATINGS);
  const [impactSeries, setImpactSeries] = useState<ImpactMonthPoint[]>(IMPACT_SERIES);

  const [badges, setBadges] = useState<BadgeDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(BADGES_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as BadgeDefinition[]) : INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  });

  const [pointsHistory, setPointsHistory] = useState<PointsEvent[]>(() => {
    try {
      const saved = localStorage.getItem(POINTS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as PointsEvent[]) : INITIAL_POINTS_HISTORY;
    } catch {
      return INITIAL_POINTS_HISTORY;
    }
  });

  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBody | null>(null);
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<CleanupDrive | null>(null);

  useEffect(() => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            waterBodies?: WaterBody[];
            reports?: WasteReport[];
            drives?: CleanupDrive[];
            ratings?: CleanlinessRatingEntry[];
            impactSeries?: ImpactMonthPoint[];
          } | null,
        ) => {
          if (!data) return;
          if (data.waterBodies) setWaterBodies(data.waterBodies);
          if (data.reports) setReports(data.reports);
          if (data.drives) setDrives(data.drives);
          if (data.ratings) setRatings(data.ratings);
          if (data.impactSeries) setImpactSeries(data.impactSeries);
        },
      )
      .catch(() => {
        // Keep seeded defaults cleanly if offline
      });
  }, []);

  const persistMember = (next: MemberAccount | null) => {
    setMember(next);
    try {
      if (next) {
        localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(MEMBER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  };

  const awardPoints = (label: string, points: number, category: PointsEvent['category']) => {
    if (!member) return;
    const updatedMember: MemberAccount = { ...member, points: member.points + points };
    persistMember(updatedMember);

    const newEvt: PointsEvent = {
      id: `pts-${Date.now()}`,
      label,
      points,
      dateLabel: 'Just now',
      category,
    };
    const nextHistory = [newEvt, ...pointsHistory];
    setPointsHistory(nextHistory);
    try {
      localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(nextHistory));
    } catch {
      // ignore
    }
  };

  const navigateTo = (next: AppScreen) => {
    setPrevScreen(screen);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWaterBody = (wb: WaterBody) => {
    setSelectedWaterBody(wb);
    navigateTo('water-body-detail');
  };

  const handleOpenReport = (rep: WasteReport) => {
    setSelectedReport(rep);
    navigateTo('report-detail');
  };

  const handleOpenDrive = (drv: CleanupDrive) => {
    setSelectedDrive(drv);
    navigateTo('drives');
  };

  const handleNewReportSubmitted = (created: WasteReport) => {
    setReports((prev) => [created, ...prev]);
    awardPoints(`Submitted report · ${created.locationName}`, 35, 'Report');
    if (created.region === 'Bhubaneswar' || created.category === 'Fishing gear') {
      const nextBadges = badges.map((b) => {
        if (created.category === 'Fishing gear' && b.id === 'bdg-reef' && !b.earned) {
          return { ...b, earned: true, earnedDate: 'Today' };
        }
        return b;
      });
      setBadges(nextBadges);
      try {
        localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(nextBadges));
      } catch {
        // ignore
      }
    }
  };

  const handleSubmitRating = async (payload: {
    waterBodyId: string;
    score: number;
    observations: string[];
    comment: string;
  }) => {
    const resp = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        authorName: member?.fullName || 'Member',
      }),
    });
    if (!resp.ok) return;
    const data = (await resp.json()) as {
      waterBody: WaterBody;
      ratingEntry: CleanlinessRatingEntry;
    };
    setWaterBodies((prev) =>
      prev.map((w) => (w.id === data.waterBody.id ? data.waterBody : w)),
    );
    setSelectedWaterBody(data.waterBody);
    setRatings((prev) => [data.ratingEntry, ...prev]);
    awardPoints(`Cleanliness rating · ${data.waterBody.name.split('(')[0].trim()}`, 15, 'Rating');
  };

  const handleToggleDriveJoin = async (driveId: string) => {
    const resp = await fetch(`/api/drives/${driveId}/toggle`, {
      method: 'POST',
    });
    if (!resp.ok) return;
    const updated = (await resp.json()) as CleanupDrive;
    setDrives((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (selectedDrive?.id === updated.id) {
      setSelectedDrive(updated);
    }
    if (updated.joined) {
      awardPoints(`Joined drive · ${updated.title}`, 25, 'Cleanup');
    }
  };

  const handleModeratorUpdate = async (
    id: string,
    payload: { status: ReportStatus; assignedUnit?: string; note?: string },
  ) => {
    const resp = await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) return;
    const updated = (await resp.json()) as WasteReport;
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedReport?.id === updated.id) {
      setSelectedReport(updated);
    }
  };

  // Unauthenticated / Auth Screens
  if (
    !member ||
    screen === 'welcome' ||
    screen === 'register' ||
    screen === 'verify-email' ||
    screen === 'login' ||
    screen === 'forgot-password'
  ) {
    const authScreen =
      screen === 'register' ||
      screen === 'verify-email' ||
      screen === 'login' ||
      screen === 'forgot-password'
        ? screen
        : 'welcome';

    return (
      <WelcomeAuth
        screen={authScreen}
        onNavigate={(s) => setScreen(s)}
        onCompleteAuth={(acc) => {
          persistMember(acc);
          setScreen('home');
        }}
        onDemoEnter={() => {
          persistMember(DEFAULT_DEMO_MEMBER);
          setScreen('home');
        }}
      />
    );
  }

  const activeNavTab: 'home' | 'explore' | 'report' | 'drives' | 'profile' | 'moderator' =
    screen === 'explore' || screen === 'water-body-detail'
      ? 'explore'
      : screen === 'report'
      ? 'report'
      : screen === 'drives' || screen === 'drive-detail'
      ? 'drives'
      : screen === 'profile' || screen === 'report-detail'
      ? 'profile'
      : screen === 'moderator'
      ? 'moderator'
      : 'home';

  return (
    <div className="min-h-screen bg-[#F8F6F1] tide-contour-bg text-[#0B253A] pb-24 lg:pb-12">
      {/* Desktop Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="hidden lg:block sticky top-0 z-30 bg-[#F8F6F1]/92 backdrop-blur-md border-b border-[#0B253A]/10">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text/mark brand */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="cursor-pointer whitespace-nowrap shrink-0"
          >
            <TidewiseWordmark />
          </button>

          {/* Zone 2: Clean single-line text links */}
          <nav className="flex items-center gap-6 text-sm font-medium" aria-label="Primary">
            {(
              [
                { id: 'home', label: 'Home' },
                { id: 'explore', label: 'Explore' },
                { id: 'drives', label: 'Drives' },
                { id: 'profile', label: 'Profile' },
                { id: 'moderator', label: 'Municipal Queue' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'drives') setSelectedDrive(null);
                  navigateTo(item.id);
                }}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  activeNavTab === item.id
                    ? 'border-[#0D9488] text-[#0B253A] font-semibold'
                    : 'border-transparent text-[#52677A] hover:text-[#0B253A]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('report')}
              className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Report waste</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Sticky Top Bar (52px) */}
      <header className="lg:hidden sticky top-0 z-30 h-[52px] bg-[#F8F6F1]/92 backdrop-blur-md border-b border-[#0B253A]/10 px-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="cursor-pointer"
        >
          <TidewiseWordmark />
        </button>
        <button
          type="button"
          onClick={() => navigateTo('profile')}
          className="text-xs font-semibold text-[#0B253A] font-mono-tabular min-h-[40px] px-2 flex items-center"
        >
          {member.points} pts
        </button>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {screen === 'home' && (
          <HomeDashboard
            member={member}
            waterBodies={waterBodies}
            reports={reports}
            drives={drives}
            impactSeries={impactSeries}
            onStartReport={() => navigateTo('report')}
            onOpenExplore={() => navigateTo('explore')}
            onSelectWaterBody={handleOpenWaterBody}
            onSelectReport={handleOpenReport}
            onSelectDrive={handleOpenDrive}
            onOpenDrives={() => {
              setSelectedDrive(null);
              navigateTo('drives');
            }}
          />
        )}

        {screen === 'explore' && (
          <ExploreView
            waterBodies={waterBodies}
            reports={reports}
            onOpenWaterBody={handleOpenWaterBody}
            onOpenReport={handleOpenReport}
          />
        )}

        {screen === 'report' && (
          <ReportFlow
            member={member}
            waterBodies={waterBodies}
            reports={reports}
            onSubmitReport={handleNewReportSubmitted}
            onViewReportDetail={handleOpenReport}
            onDoneHome={() => navigateTo('home')}
          />
        )}

        {screen === 'water-body-detail' && selectedWaterBody && (
          <WaterBodyDetail
            waterBody={selectedWaterBody}
            reports={reports}
            drives={drives}
            ratings={ratings}
            authorName={member.fullName}
            onBack={() => navigateTo(prevScreen === 'home' ? 'home' : 'explore')}
            onSubmitRating={handleSubmitRating}
            onSelectReport={handleOpenReport}
            onSelectDrive={handleOpenDrive}
          />
        )}

        {screen === 'report-detail' && selectedReport && (
          <ReportDetailView
            report={
              reports.find((r) => r.id === selectedReport.id) || selectedReport
            }
            waterBodies={waterBodies}
            onBack={() =>
              navigateTo(
                prevScreen === 'moderator' ||
                  prevScreen === 'profile' ||
                  prevScreen === 'explore'
                  ? prevScreen
                  : 'home',
              )
            }
          />
        )}

        {screen === 'drives' && (
          <DrivesView
            drives={drives}
            waterBodies={waterBodies}
            selectedDrive={selectedDrive}
            onSelectDrive={setSelectedDrive}
            onToggleJoin={handleToggleDriveJoin}
          />
        )}

        {screen === 'profile' && (
          <ProfileRewardsView
            member={member}
            reports={reports}
            drives={drives}
            badges={badges}
            pointsHistory={pointsHistory}
            onSelectReport={handleOpenReport}
            onSelectDrive={handleOpenDrive}
            onOpenModerator={() => navigateTo('moderator')}
            onLogout={() => {
              persistMember(null);
              setScreen('welcome');
            }}
          />
        )}

        {screen === 'moderator' && (
          <ModeratorWorkspace
            reports={reports}
            impactSeries={impactSeries}
            onUpdateReport={handleModeratorUpdate}
            onSelectReport={handleOpenReport}
            onExit={() => navigateTo('home')}
          />
        )}
      </main>

      {/* Mobile Persistent 5-Destination Bottom Navigation Bar (64px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#0B253A]/10 grid grid-cols-5 items-center px-1"
      >
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeNavTab === 'home' ? 'text-[#0D9488]' : 'text-[#52677A]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('explore')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeNavTab === 'explore' ? 'text-[#0D9488]' : 'text-[#52677A]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Explore</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('report')}
          className="flex flex-col items-center justify-center min-h-[48px]"
        >
          <span
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${
              activeNavTab === 'report'
                ? 'bg-[#0B253A] text-white'
                : 'bg-[#0D9488] text-white'
            }`}
          >
            <Camera className="w-5 h-5" />
          </span>
          <span className="text-[10px] font-semibold text-[#0B253A] mt-0.5">Report</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedDrive(null);
            navigateTo('drives');
          }}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeNavTab === 'drives' ? 'text-[#0D9488]' : 'text-[#52677A]'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Drives</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('profile')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeNavTab === 'profile' || activeNavTab === 'moderator'
              ? 'text-[#0D9488]'
              : 'text-[#52677A]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Profile</span>
        </button>
      </nav>
    </div>
  );
}
