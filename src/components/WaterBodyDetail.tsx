import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  MapPin,
  Star,
} from 'lucide-react';
import type {
  CleanupDrive,
  CleanlinessRatingEntry,
  WasteReport,
  WaterBody,
} from '../types/tidewise';
import { SafePhoto, StatusInline } from './StatusIndicator';

const OBSERVATION_PROMPTS = [
  'Clear shoreline',
  'Plastic litter visible',
  'Discarded fishing gear',
  'Overflowing bins',
  'Recent cleanup evident',
];

interface WaterBodyDetailProps {
  waterBody: WaterBody;
  reports: WasteReport[];
  drives: CleanupDrive[];
  ratings: CleanlinessRatingEntry[];
  authorName: string;
  onBack: () => void;
  onSubmitRating: (payload: {
    waterBodyId: string;
    score: number;
    observations: string[];
    comment: string;
  }) => Promise<void>;
  onSelectReport: (report: WasteReport) => void;
  onSelectDrive: (drive: CleanupDrive) => void;
}

export function WaterBodyDetail({
  waterBody,
  reports,
  drives,
  ratings,
  onBack,
  onSubmitRating,
  onSelectReport,
  onSelectDrive,
}: WaterBodyDetailProps) {
  const [score, setScore] = useState<number>(4);
  const [selectedObs, setSelectedObs] = useState<string[]>(['Clear shoreline']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const linkedReports = reports.filter((r) => r.waterBodyId === waterBody.id);
  const linkedDrives = drives.filter((d) => d.waterBodyId === waterBody.id);
  const linkedRatings = ratings.filter((rt) => rt.waterBodyId === waterBody.id);

  const toggleObs = (item: string) => {
    setSelectedObs((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitRating({
        waterBodyId: waterBody.id,
        score,
        observations: selectedObs,
        comment: comment.trim(),
      });
      setSubmittedNotice(true);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A] min-h-[40px]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero Photo Header */}
      <div className="bg-white rounded-2xl border border-[#0B253A]/10 overflow-hidden">
        <div className="h-56 sm:h-72 relative">
          <SafePhoto
            src={waterBody.imageUrl}
            alt={waterBody.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="text-xs font-medium text-white/90 flex items-center gap-2">
              <span>{waterBody.type}</span>
              <span aria-hidden="true">·</span>
              <span>{waterBody.areaLabel}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
              {waterBody.name}
            </h1>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#0B253A]/10">
            <div className="flex items-center gap-3">
              <div className="font-mono-tabular text-3xl font-bold text-[#0B253A]">
                {waterBody.rating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-4 h-4 ${
                        n <= Math.round(waterBody.rating)
                          ? 'text-[#D97706] fill-[#D97706]'
                          : 'text-[#0B253A]/20'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-[#52677A] mt-0.5 tabular-nums">
                  {waterBody.ratingCount} community ratings · {waterBody.trend}
                </div>
              </div>
            </div>

            <div className="text-xs text-[#52677A] space-y-0.5 sm:text-right">
              <div className="inline-flex items-center gap-1 font-medium text-[#0B253A]">
                <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="font-mono-tabular">
                  {waterBody.lat.toFixed(4)}° N, {waterBody.lng.toFixed(4)}° E
                </span>
              </div>
              <div>Municipal unit: {waterBody.municipalBody}</div>
            </div>
          </div>

          <p className="text-sm text-[#52677A] leading-relaxed">{waterBody.summary}</p>

          {/* Mandatory Scientific Disclaimer */}
          <div className="p-3.5 rounded-xl bg-[#EEF3F5] border border-[#0B253A]/10 flex items-start gap-2.5 text-xs text-[#0B253A]">
            <AlertCircle className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <span>
              Community cleanliness observations. Not a scientific water-quality or safety assessment.
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Rating Form */}
      <form
        onSubmit={handleRatingSubmit}
        className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 sm:p-6 space-y-4"
      >
        <div>
          <h2 className="font-display text-lg font-bold text-[#0B253A]">
            Rate visible cleanliness
          </h2>
          <p className="text-xs text-[#52677A]">
            Share what you observed on the shore or bank today (+15 points)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              aria-label={`Rate ${n} out of 5`}
              className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                score >= n
                  ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                  : 'bg-[#F8F6F1] border-[#0B253A]/15 text-[#52677A]'
              }`}
            >
              <Star
                className={`w-4 h-4 ${
                  score >= n ? 'text-[#D97706] fill-[#D97706]' : 'text-[#52677A]'
                }`}
              />
              <span className="tabular-nums">{n}</span>
            </button>
          ))}
        </div>

        <div>
          <div className="text-xs font-semibold text-[#0B253A] mb-2">
            Quick observation prompts
          </div>
          <div className="flex flex-wrap gap-2">
            {OBSERVATION_PROMPTS.map((prompt) => {
              const active = selectedObs.includes(prompt);
              return (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => toggleObs(prompt)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0B253A] text-white'
                      : 'bg-[#EEF3F5] text-[#52677A] hover:text-[#0B253A]'
                  }`}
                >
                  {prompt}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional note about bin availability, tide line, or cleanup progress…"
          className="w-full p-3.5 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/15 text-sm text-[#0B253A]"
        />

        {submittedNotice && (
          <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#0D9488]/25 text-xs font-semibold text-[#0F766E] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cleanliness rating submitted. Community average updated!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60"
        >
          {submitting ? 'Saving rating…' : 'Submit rating'}
        </button>
      </form>

      {/* Linked Reports, Drives & Recent Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-[#0B253A]">
            Recent waste reports here ({linkedReports.length})
          </h3>
          {linkedReports.length === 0 ? (
            <p className="text-xs text-[#52677A]">No recent reports for this water body.</p>
          ) : (
            <div className="divide-y divide-[#0B253A]/8">
              {linkedReports.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => onSelectReport(rep)}
                  className="w-full text-left py-3 hover:bg-[#F8F6F1] rounded-lg px-2 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#0B253A] truncate">
                      {rep.title}
                    </div>
                    <div className="text-xs text-[#52677A]">
                      {rep.category} · {rep.createdAt}
                    </div>
                  </div>
                  <StatusInline status={rep.status} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-[#0B253A]">
            Linked cleanup drives &amp; observations
          </h3>
          {linkedDrives.map((drv) => (
            <button
              key={drv.id}
              type="button"
              onClick={() => onSelectDrive(drv)}
              className="w-full text-left p-3 rounded-xl bg-[#F8F6F1] hover:bg-[#EEF3F5] flex items-center justify-between gap-3 cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-[#0B253A]">{drv.title}</div>
                <div className="text-xs text-[#52677A] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{drv.dateLabel} · {drv.timeLabel}</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#0284C7] shrink-0">View</span>
            </button>
          ))}
          <div className="divide-y divide-[#0B253A]/8 pt-1">
            {linkedRatings.map((rt) => (
              <div key={rt.id} className="py-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0B253A]">{rt.authorName}</span>
                  <span className="font-mono-tabular text-[#D97706] font-semibold">
                    {rt.score}/5 · {rt.createdAt}
                  </span>
                </div>
                {rt.comment && <p className="text-[#52677A]">{rt.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
