import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import type { ReportStatus, SeverityLevel, TierDefinition } from '../types/tidewise';

export function TidewiseWordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="32"
          height="32"
          rx="9"
          fill={inverted ? '#0D9488' : '#0B253A'}
        />
        <path
          d="M5 18.5C8.5 15 12 15 15.5 18.5C19 22 22.5 22 27 18"
          stroke="#5EEAD4"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M5 13C8.5 9.5 12 9.5 15.5 13C19 16.5 22.5 16.5 27 12.5"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          inverted ? 'text-white' : 'text-[#0B253A]'
        }`}
      >
        Tidewise
      </span>
    </div>
  );
}

export function AquaTierEmblem({
  tierName,
  size = 44,
}: {
  tierName: TierDefinition['name'];
  size?: number;
}) {
  const palette: Record<TierDefinition['name'], { bg: string; fg: string; accent: string }> = {
    'Tide Starter': { bg: '#E0F2FE', fg: '#0369A1', accent: '#38BDF8' },
    'Minnow Scout': { bg: '#CCFBF1', fg: '#0F766E', accent: '#14B8A6' },
    'Otter Ally': { bg: '#D1FAE5', fg: '#047857', accent: '#10B981' },
    'Dolphin Defender': { bg: '#DBEAFE', fg: '#1D4ED8', accent: '#3B82F6' },
    'Turtle Guardian': { bg: '#ECFCCB', fg: '#3F6212', accent: '#84CC16' },
    'Manta Keeper': { bg: '#E0E7FF', fg: '#3730A3', accent: '#6366F1' },
    'Ocean Sentinel': { bg: '#FEF3C7', fg: '#92400E', accent: '#F59E0B' },
  };
  const colors = palette[tierName];

  return (
    <div
      style={{ width: size, height: size, backgroundColor: colors.bg }}
      className="rounded-xl flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="11" stroke={colors.accent} strokeWidth="1.8" />
        <path
          d="M6.5 15.5C9 13 11.5 13 14 15.5C16.5 18 19 18 21.5 15.5"
          stroke={colors.fg}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M8.5 11.5C10.5 9.8 12.2 9.8 14 11.5C15.8 13.2 17.5 13.2 19.5 11.5"
          stroke={colors.fg}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function StatusInline({ status }: { status: ReportStatus }) {
  const config: Record<
    ReportStatus,
    { icon: React.ReactNode; textClass: string }
  > = {
    Submitted: {
      icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#0369A1]',
    },
    'Under review': {
      icon: <Eye className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#B45309]',
    },
    Verified: {
      icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#0D9488]',
    },
    Assigned: {
      icon: <Truck className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#0284C7]',
    },
    'In progress': {
      icon: <Truck className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#0F766E]',
    },
    Resolved: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#15803D]',
    },
    Rejected: {
      icon: <XCircle className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#B91C1C]',
    },
    Duplicate: {
      icon: <Copy className="w-3.5 h-3.5 shrink-0" />,
      textClass: 'text-[#52677A]',
    },
  };

  const item = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.textClass} whitespace-nowrap`}>
      {item.icon}
      <span>{status}</span>
    </span>
  );
}

export function SeverityInline({ severity }: { severity: SeverityLevel }) {
  const map: Record<SeverityLevel, string> = {
    Low: 'text-[#0F766E]',
    Medium: 'text-[#B45309]',
    High: 'text-[#B91C1C]',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${map[severity]} whitespace-nowrap`}>
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>{severity} priority</span>
    </span>
  );
}

export function SafePhoto({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-[#0B253A] via-[#123652] to-[#0D9488] flex flex-col items-center justify-center text-white/80 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M4 18C8 14 12 14 16 18C20 22 24 22 28 18"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M4 12C8 8 12 8 16 12C20 16 24 16 28 12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        <span className="mt-2 text-xs font-medium">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
