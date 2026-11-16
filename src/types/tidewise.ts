export type WasteCategory =
  | 'Plastic'
  | 'Glass'
  | 'Metal'
  | 'Organic'
  | 'Fishing gear'
  | 'Mixed'
  | 'Other';

export type SeverityLevel = 'Low' | 'Medium' | 'High';

export type ReportStatus =
  | 'Submitted'
  | 'Under review'
  | 'Verified'
  | 'Assigned'
  | 'In progress'
  | 'Resolved'
  | 'Rejected'
  | 'Duplicate';

export type WaterBodyType = 'Beach' | 'River' | 'Lake & pond';

export interface WaterBody {
  id: string;
  name: string;
  type: WaterBodyType;
  region: 'Puri' | 'Balasore' | 'Bhubaneswar';
  areaLabel: string;
  lat: number;
  lng: number;
  mapX: number; // 0-1000 SVG coordinate
  mapY: number; // 0-700 SVG coordinate
  imageUrl: string;
  rating: number;
  ratingCount: number;
  trend: 'Improving' | 'Steady' | 'Needs attention';
  summary: string;
  municipalBody: string;
}

export interface TimelineEvent {
  status: ReportStatus;
  timestamp: string;
  note: string;
  actor: string;
}

export interface WasteReport {
  id: string;
  title: string;
  waterBodyId: string;
  locationName: string;
  region: 'Puri' | 'Balasore' | 'Bhubaneswar';
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  category: WasteCategory;
  aiSuggestedCategory: WasteCategory;
  aiConfidence: number; // 0-100
  aiReasoning: string;
  severity: SeverityLevel;
  status: ReportStatus;
  description: string;
  photoUrl: string;
  reporterName: string;
  reporterId: string;
  createdAt: string;
  assignedUnit?: string;
  estimatedKg?: number;
  timeline: TimelineEvent[];
}

export interface CleanupDrive {
  id: string;
  title: string;
  waterBodyId: string;
  locationName: string;
  region: 'Puri' | 'Balasore' | 'Bhubaneswar';
  dateLabel: string;
  timeLabel: string;
  organizer: string;
  participants: number;
  capacity: number;
  joined: boolean;
  isNearby: boolean;
  description: string;
  whatToBring: string[];
  meetingPoint: string;
  mapX: number;
  mapY: number;
  imageUrl: string;
}

export interface CleanlinessRatingEntry {
  id: string;
  waterBodyId: string;
  authorName: string;
  score: number;
  observations: string[];
  comment: string;
  createdAt: string;
}

export interface TierDefinition {
  name:
    | 'Tide Starter'
    | 'Minnow Scout'
    | 'Otter Ally'
    | 'Dolphin Defender'
    | 'Turtle Guardian'
    | 'Manta Keeper'
    | 'Ocean Sentinel';
  minPoints: number;
  maxPoints: number | null;
  tagline: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  criteria: string;
  earned: boolean;
  earnedDate?: string;
}

export interface PointsEvent {
  id: string;
  label: string;
  points: number;
  dateLabel: string;
  category: 'Report' | 'Rating' | 'Cleanup' | 'Verification';
}

export interface LocalRewardItem {
  id: string;
  title: string;
  partner: string;
  location: string;
  pointsCost: number;
  description: string;
}

export interface ImpactMonthPoint {
  month: string;
  resolvedReports: number;
  kgCleared: number;
  avgPickupHours: number;
}

export interface MemberAccount {
  id: string;
  fullName: string;
  email: string;
  age: number;
  verified: boolean;
  points: number;
  homeRegion: string;
}

export interface AiClassificationResult {
  category: WasteCategory;
  confidenceLabel: 'High confidence' | 'Moderate confidence' | 'Low confidence';
  confidenceScore: number;
  reasoning: string;
  suggestedSeverity: SeverityLevel;
  municipalUnitHint: string;
}

export type AppScreen =
  | 'welcome'
  | 'register'
  | 'verify-email'
  | 'login'
  | 'forgot-password'
  | 'home'
  | 'explore'
  | 'report'
  | 'drives'
  | 'profile'
  | 'water-body-detail'
  | 'report-detail'
  | 'drive-detail'
  | 'moderator';
