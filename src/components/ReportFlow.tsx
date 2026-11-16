import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
} from 'lucide-react';
import { IMAGES } from '../data/seedData';
import type {
  MemberAccount,
  SeverityLevel,
  WasteCategory,
  WasteReport,
  WaterBody,
} from '../types/tidewise';
import { OdishaMap } from './OdishaMap';
import { SafePhoto } from './StatusIndicator';

const CATEGORIES: WasteCategory[] = [
  'Plastic',
  'Glass',
  'Metal',
  'Organic',
  'Fishing gear',
  'Mixed',
  'Other',
];

const SEVERITIES: SeverityLevel[] = ['Low', 'Medium', 'High'];

interface ReportFlowProps {
  member: MemberAccount;
  waterBodies: WaterBody[];
  reports: WasteReport[];
  onSubmitReport: (report: WasteReport) => void;
  onViewReportDetail: (report: WasteReport) => void;
  onDoneHome: () => void;
}

export function ReportFlow({
  member,
  waterBodies,
  reports,
  onSubmitReport,
  onViewReportDetail,
  onDoneHome,
}: ReportFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [description, setDescription] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [pickedLocation, setPickedLocation] = useState<{
    name: string;
    region: 'Puri' | 'Balasore' | 'Bhubaneswar';
    waterBodyId: string;
    lat: number;
    lng: number;
    mapX: number;
    mapY: number;
  } | null>(null);

  const [locLoading, setLocLoading] = useState(false);
  const [locNote, setLocNote] = useState('');

  // Step 2 states
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>('Plastic');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('Medium');

  // Step 3 states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReport, setSubmittedReport] = useState<WasteReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSamplePhoto = () => {
    setPhotoPreview(IMAGES.sampleHotspot);
  };

  const handleUseCurrentLocation = () => {
    setLocLoading(true);
    setLocNote('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          // Match closest Odisha water body for demo context if far outside Odisha
          const inOdisha = lat >= 19.0 && lat <= 22.0 && lng >= 84.5 && lng <= 87.5;
          if (inOdisha) {
            setPickedLocation({
              name: 'Detected GPS Location · Odisha Coast',
              region: lat > 21.0 ? 'Balasore' : lat > 20.1 ? 'Bhubaneswar' : 'Puri',
              waterBodyId: lat > 21.0 ? 'wb-chandipur' : lat > 20.1 ? 'wb-bindusagar' : 'wb-puri',
              lat,
              lng,
              mapX: 465,
              mapY: 565,
            });
            setLocNote(`GPS locked at ${lat}° N, ${lng}° E`);
          } else {
            const puri = waterBodies[0];
            setPickedLocation({
              name: `${puri.name.split('(')[0].trim()} · Sector 4 GPS`,
              region: 'Puri',
              waterBodyId: puri.id,
              lat: puri.lat,
              lng: puri.lng,
              mapX: puri.mapX,
              mapY: puri.mapY,
            });
            setLocNote('Browser GPS centered to Puri Beach Sector 4 sample coordinates.');
          }
          setLocLoading(false);
        },
        () => {
          const puri = waterBodies[0];
          setPickedLocation({
            name: `${puri.name.split('(')[0].trim()} · Sector 4 GPS`,
            region: 'Puri',
            waterBodyId: puri.id,
            lat: puri.lat,
            lng: puri.lng,
            mapX: puri.mapX,
            mapY: puri.mapY,
          });
          setLocNote('Location permission unavailable — defaulted to Puri Beach Sector 4.');
          setLocLoading(false);
        },
        { timeout: 3500 },
      );
    } else {
      const puri = waterBodies[0];
      setPickedLocation({
        name: `${puri.name.split('(')[0].trim()} · Sector 4 GPS`,
        region: 'Puri',
        waterBodyId: puri.id,
        lat: puri.lat,
        lng: puri.lng,
        mapX: puri.mapX,
        mapY: puri.mapY,
      });
      setLocLoading(false);
    }
  };

  const handleContinueToDetails = () => {
    if (!photoPreview || !pickedLocation) return;
    setStep(2);
  };

  const handleSubmitFinal = async () => {
    if (!pickedLocation) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const resp = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${selectedCategory} waste near ${pickedLocation.name.split('·')[0].trim()}`,
          waterBodyId: pickedLocation.waterBodyId,
          locationName: pickedLocation.name,
          region: pickedLocation.region,
          lat: pickedLocation.lat,
          lng: pickedLocation.lng,
          mapX: pickedLocation.mapX,
          mapY: pickedLocation.mapY,
          category: selectedCategory,
          severity: selectedSeverity,
          description:
            description.trim() ||
            `Geotagged ${selectedCategory.toLowerCase()} waste reported for municipal cleanup.`,
          photoUrl: photoPreview,
          reporterName: member.fullName,
          reporterId: member.id,
        }),
      });
      const created = (await resp.json()) as WasteReport & { error?: string };
      if (!resp.ok) {
        throw new Error(created.error || 'Failed to submit report.');
      }
      onSubmitReport(created);
      setSubmittedReport(created);
      setStep(3);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = Boolean(photoPreview && pickedLocation);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#0D9488] font-mono-tabular">
            Step {step} of 3
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0B253A] mt-0.5">
            {step === 1 && 'Photo & geotag location'}
            {step === 2 && 'Waste category & severity'}
            {step === 3 && 'Waste report submitted'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-2 rounded-full transition-all ${
                n <= step ? 'w-8 bg-[#0D9488]' : 'w-4 bg-[#0B253A]/15'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Photo + Location */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Photo Card */}
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#0B253A]">
                  1. Capture or upload photo
                </h2>
                <p className="text-xs text-[#52677A]">
                  Clear daylight photo helps coordinators confirm the waste type
                </p>
              </div>
            </div>

            {photoPreview ? (
              <div className="space-y-3">
                <div className="h-56 sm:h-64 rounded-xl overflow-hidden border border-[#0B253A]/10">
                  <SafePhoto
                    src={photoPreview}
                    alt="Uploaded waste hotspot preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#EEF3F5] hover:bg-[#E1EBEF] text-xs font-semibold text-[#0B253A] cursor-pointer"
                  >
                    Replace photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview('');
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-[#B91C1C] hover:bg-red-50 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-[#0B253A]/20 bg-[#F8F6F1] p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#CCFBF1] text-[#0F766E] mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#0B253A]">
                    Add a photo of the waste hotspot
                  </p>
                  <p className="text-xs text-[#52677A]">
                    Use camera/gallery or try the sample Puri Beach litter photo
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B253A] hover:bg-[#123652] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>Camera / Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseSamplePhoto}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 hover:bg-[#EEF3F5] text-[#0B253A] text-xs font-semibold cursor-pointer"
                  >
                    Use sample Puri litter photo
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B253A]">
                2. Pin hotspot location
              </h2>
              <p className="text-xs text-[#52677A]">
                Use GPS or tap directly on the Odisha map to drop a pin
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locLoading}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {locLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
                <span>Use current location</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMapPicker((v) => !v)}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer border ${
                  showMapPicker
                    ? 'bg-[#0B253A] text-white border-[#0B253A]'
                    : 'bg-white text-[#0B253A] border-[#0B253A]/15 hover:bg-[#EEF3F5]'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>{showMapPicker ? 'Hide map picker' : 'Choose on map'}</span>
              </button>
            </div>

            {showMapPicker && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#0284C7]">
                  Tap anywhere on the Odisha map below to place your geotag pin:
                </p>
                <OdishaMap
                  waterBodies={waterBodies}
                  reports={reports}
                  pickMode
                  pickedCoords={
                    pickedLocation
                      ? {
                          mapX: pickedLocation.mapX,
                          mapY: pickedLocation.mapY,
                          lat: pickedLocation.lat,
                          lng: pickedLocation.lng,
                        }
                      : null
                  }
                  onPickLocation={(coords) => {
                    setPickedLocation({
                      name: coords.nearestName,
                      region: coords.nearestRegion,
                      waterBodyId: coords.nearestWaterBodyId,
                      lat: coords.lat,
                      lng: coords.lng,
                      mapX: coords.mapX,
                      mapY: coords.mapY,
                    });
                    setLocNote(`Map pin dropped at ${coords.lat}° N, ${coords.lng}° E`);
                  }}
                  heightClass="h-64 sm:h-72"
                />
              </div>
            )}

            {pickedLocation && (
              <div className="p-3.5 rounded-xl bg-[#EEF3F5] flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-[#0B253A] text-sm">
                    {pickedLocation.name}
                  </div>
                  <div className="font-mono-tabular text-[#52677A]">
                    {pickedLocation.lat.toFixed(4)}° N, {pickedLocation.lng.toFixed(4)}° E · {pickedLocation.region}
                  </div>
                  {locNote && <div className="text-[#0F766E]">{locNote}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Optional Description */}
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-2">
            <label htmlFor="report-desc" className="block font-display text-base font-bold text-[#0B253A]">
              3. Observation notes (optional)
            </label>
            <textarea
              id="report-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Washed ashore near boat landing, needs dry-waste bags before high tide."
              className="w-full p-3.5 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/15 text-sm text-[#0B253A]"
            />
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinueToDetails}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-[#0B253A]/20 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            {canContinue ? 'Continue to waste details' : 'Add a photo and location to continue'}
          </button>
        </div>
      )}

      {/* Step 2: Waste details */}
      {step === 2 && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A] min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" /> Edit photo or location
          </button>

          <div className="bg-white rounded-2xl border border-[#0B253A]/10 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-12">
              <div className="sm:col-span-5 h-52 sm:h-auto">
                <SafePhoto
                  src={photoPreview}
                  alt="Waste report photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:col-span-7 p-5 space-y-2">
                <div className="text-xs font-semibold text-[#0284C7]">Report summary</div>
                <p className="font-display text-lg font-bold text-[#0B253A]">
                  {pickedLocation?.name || 'Hotspot location'}
                </p>
                {pickedLocation && (
                  <p className="font-mono-tabular text-xs text-[#52677A]">
                    {pickedLocation.lat.toFixed(4)}° N, {pickedLocation.lng.toFixed(4)}° E ·{' '}
                    {pickedLocation.region}
                  </p>
                )}
                {description && (
                  <p className="text-xs text-[#52677A] leading-relaxed">{description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Editable Waste Categories */}
          <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-5 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B253A]">
                Select waste category
              </h2>
              <p className="text-xs text-[#52677A]">
                Pick the dominant material visible in the photo
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#0B253A] text-white'
                        : 'bg-[#EEF3F5] text-[#0B253A] hover:bg-[#DFE9EE]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#0B253A]/8">
              <h3 className="font-display text-sm font-bold text-[#0B253A] mb-2">
                Visible severity
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {SEVERITIES.map((sev) => {
                  const active = selectedSeverity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSelectedSeverity(sev)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#0D9488] text-white border-[#0D9488]'
                          : 'bg-white text-[#0B253A] border-[#0B253A]/15 hover:bg-[#EEF3F5]'
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              {submitError}
            </div>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitFinal}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Submitting report…' : 'Submit report'}</span>
          </button>
        </div>
      )}

      {/* Step 3: Confirmation State */}
      {step === 3 && submittedReport && (
        <div className="bg-white rounded-2xl border border-[#0B253A]/10 p-6 sm:p-8 space-y-5">
          <div className="w-12 h-12 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <div className="font-mono-tabular text-xs font-semibold text-[#0D9488]">
              Report ID: {submittedReport.id} · Status: {submittedReport.status}
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0B253A]">
              Thank you for reporting
            </h2>
            <p className="text-sm text-[#52677A] leading-relaxed">
              Your geotagged report at <span className="font-semibold text-[#0B253A]">{submittedReport.locationName}</span> has been logged. Municipal coordinators review reports before assigning a cleanup squad. You earned <span className="font-semibold text-[#0D9488]">+35 points</span>!
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/10 text-xs text-[#52677A] space-y-1">
            <div>Category: <span className="font-semibold text-[#0B253A]">{submittedReport.category}</span></div>
            <div>Severity: <span className="font-semibold text-[#0B253A]">{submittedReport.severity}</span></div>
            <div className="font-mono-tabular">
              Coordinates: {submittedReport.lat.toFixed(4)}° N, {submittedReport.lng.toFixed(4)}° E
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onViewReportDetail(submittedReport)}
              className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#0B253A] hover:bg-[#123652] text-white font-semibold text-sm cursor-pointer"
            >
              Track report status
            </button>
            <button
              type="button"
              onClick={onDoneHome}
              className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#EEF3F5] hover:bg-[#E1EBEF] text-[#0B253A] font-semibold text-sm cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
