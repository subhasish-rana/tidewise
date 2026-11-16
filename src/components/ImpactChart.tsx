import React from 'react';
import type { ImpactMonthPoint } from '../types/tidewise';

export function ImpactChart({
  data,
  compact = false,
}: {
  data: ImpactMonthPoint[];
  compact?: boolean;
}) {
  const maxKg = Math.max(...data.map((d) => d.kgCleared), 100);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 sm:gap-4 h-40 pt-4 pb-2">
        {data.map((item, idx) => {
          const heightPct = Math.max(14, Math.round((item.kgCleared / maxKg) * 100));
          const isLatest = idx === data.length - 1;
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="font-mono-tabular text-[11px] font-semibold text-[#0B253A]">
                {compact ? `${item.resolvedReports}` : `${item.kgCleared}kg`}
              </span>
              <div className="w-full max-w-[44px] h-full flex items-end">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isLatest
                      ? 'bg-[#0D9488]'
                      : 'bg-[#0284C7]/25 hover:bg-[#0284C7]/45'
                  }`}
                  title={`${item.month}: ${item.resolvedReports} reports resolved · ${item.kgCleared} kg diverted · ${item.avgPickupHours}h avg pickup`}
                />
              </div>
              <span className="text-xs font-medium text-[#52677A]">{item.month}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2.5 border-t border-[#0B253A]/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52677A]">
        <span>
          {compact
            ? 'Monthly resolved hotspots (Jun – Nov 2026)'
            : 'Kg of coastal & lake waste diverted by volunteers and municipal crews'}
        </span>
        <span className="font-mono-tabular font-semibold text-[#0D9488]">
          Avg pickup time: {data[data.length - 1]?.avgPickupHours ?? 11}h (down from 34h)
        </span>
      </div>
    </div>
  );
}
