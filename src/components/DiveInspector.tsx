import React, { useRef, useState } from 'react';
import {
  Camera,
  Users,
  MapPin,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Folder,
} from 'lucide-react';
import {
  CritterFamilyMeta,
  CritterSpecies,
  DiveRecord,
  DiveTrip,
  UnitSystem,
  VaultPhoto,
} from '../types/dive';
import { formatDepth, formatPressure, formatTemp } from '../utils/units';
import { formatTripDateRange, formatTripTitle } from '../utils/trips';
import { CritterSilhouette } from './CritterSilhouette';

interface DiveInspectorProps {
  dive: DiveRecord;
  trips: DiveTrip[];
  onChangeDiveTrip?: (diveId: string, tripId: string | undefined) => void;
  coverPhoto: VaultPhoto;
  galleryPhotos: VaultPhoto[];
  unitSystem: UnitSystem;
  onUploadPhotoToDive: (diveId: string, file: File) => Promise<void>;
  speciesMap: Record<string, CritterSpecies>;
  familyMap: Record<string, CritterFamilyMeta>;
  onInspectSpeciesInDex: (speciesId: string) => void;
  onBackToLogbook?: () => void;
  onPrevDive?: () => void;
  onNextDive?: () => void;
}

export const DiveInspector: React.FC<DiveInspectorProps> = ({
  dive,
  trips,
  onChangeDiveTrip,
  coverPhoto,
  galleryPhotos,
  unitSystem,
  onUploadPhotoToDive,
  speciesMap,
  onInspectSpeciesInDex,
  onBackToLogbook,
  onPrevDive,
  onNextDive,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string>(coverPhoto.id);
  const [detailTab, setDetailTab] = useState<'critters' | 'notes'>('critters');

  const displayedPhoto =
    galleryPhotos.find((p) => p.id === activePhotoId) || coverPhoto;

  const totalCritterCount = dive.critters.length;
  const assignedTrip = trips.find((t) => t.id === dive.tripId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onUploadPhotoToDive(dive.id, file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Navigation Row: Back to Logbook + Prev/Next Dive Stepper */}
      {onBackToLogbook && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBackToLogbook}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-500" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5">
            {onPrevDive && (
              <button
                type="button"
                onClick={onPrevDive}
                className="p-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
                aria-label="Previous dive"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <span className="px-2.5 py-1 rounded-xl bg-zinc-900 text-white text-xs font-bold">
              Dive #{dive.diveNumber}
            </span>
            {onNextDive && (
              <button
                type="button"
                onClick={onNextDive}
                className="p-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm"
                aria-label="Next dive"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3 bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
        {/* 1. CLEAN DIVE COVER PHOTO BANNER */}
        <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-900">
          <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
            {displayedPhoto.vaultWebpDataUrl && (
              <img
                src={displayedPhoto.vaultWebpDataUrl}
                alt={dive.siteName}
                className="w-full h-full object-cover object-center"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />

            {/* Top Row inside Banner: Date/Time + Add Photo Button */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-zinc-200 text-[11px] font-medium">
                {dive.date} • {dive.timeIn}
              </span>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 hover:bg-white text-zinc-950 text-[11px] font-semibold transition-all shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Saving...' : 'Add Photo'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Site Title & Location inside Banner */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white leading-tight truncate">
                  {dive.siteName}
                </h2>
                <p className="text-xs text-zinc-300 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>
                    {dive.subLocation}
                    {assignedTrip ? ` • ${formatTripTitle(assignedTrip)}` : ' • Single Dive'}
                  </span>
                </p>
              </div>

              {galleryPhotos.length > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  {galleryPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setActivePhotoId(photo.id)}
                      className={`w-8 h-6 rounded overflow-hidden border transition-all ${
                        displayedPhoto.id === photo.id
                          ? 'border-white ring-1 ring-white'
                          : 'border-zinc-500 opacity-70'
                      }`}
                    >
                      <img
                        src={photo.vaultWebpDataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trip Folder Assignment Bar (Move between trips or set as Standalone) */}
        {onChangeDiveTrip && (
          <div className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 shrink-0">
              <Folder className="w-3.5 h-3.5 text-zinc-500" />
              <span>Trip Folder</span>
            </div>
            <select
              aria-label="Assign dive to trip"
              value={dive.tripId || 'none'}
              onChange={(e) =>
                onChangeDiveTrip(
                  dive.id,
                  e.target.value === 'none' ? undefined : e.target.value
                )
              }
              className="flex-1 max-w-[230px] bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-900 truncate"
            >
              <option value="none">No Trip (Single Dive)</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {formatTripTitle(trip)} ({formatTripDateRange(trip.startDate, trip.endDate)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. KEY DIVE TELEMETRY ROW (5 CLEAN METRIC CARDS) */}
        <div
          className="grid grid-cols-5 gap-1.5"
          aria-label="Key dive metrics"
        >
          <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
              Depth
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-0.5 leading-tight">
              {formatDepth(dive.maxDepthM, unitSystem)}
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">
              avg {formatDepth(dive.avgDepthM, unitSystem)}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
              Time
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-0.5 leading-tight">
              {dive.bottomTimeMin}m
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">
              {dive.safetyStopsCount !== undefined
                ? dive.safetyStopsCount === 0
                  ? 'No stop'
                  : `${dive.safetyStopsCount} ${dive.safetyStopsCount === 1 ? 'stop' : 'stops'}`
                : '1 stop'}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
              {dive.gasMix}
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-0.5 leading-tight">
              {formatPressure(dive.startPressureBar, unitSystem, false)}→
              {formatPressure(dive.endPressureBar, unitSystem, false)}
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">
              {unitSystem === 'metric' ? 'bar' : 'psi'} • {dive.tankVolumeL}L
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
              Temp
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-0.5 leading-tight">
              {formatTemp(dive.waterTempC, unitSystem)}
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">
              Vis {formatDepth(dive.visibilityM, unitSystem)}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
              Conditions
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-0.5 leading-tight truncate">
              {dive.dayNight ? `${dive.diveType} • ${dive.dayNight}` : dive.diveType}
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5 truncate">
              {dive.waterType || 'Salt'} • {dive.current}
            </div>
          </div>
        </div>

        {/* 3. MARINE LIFE SIGHTINGS & DIVE NOTES */}
        <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="inline-flex bg-zinc-200/70 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setDetailTab('critters')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  detailTab === 'critters'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Marine Life ({totalCritterCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('notes')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  detailTab === 'notes'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes & Crew</span>
              </button>
            </div>
          </div>

          {detailTab === 'critters' ? (
            <div className="grid grid-cols-2 gap-2">
              {dive.critters.map((sighted) => {
                const sp = speciesMap[sighted.speciesId];
                if (!sp) return null;

                return (
                  <button
                    key={sighted.speciesId}
                    type="button"
                    onClick={() => onInspectSpeciesInDex(sighted.speciesId)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-zinc-100/80 border border-zinc-200 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200 bg-zinc-50 text-zinc-900">
                      <CritterSilhouette familyId={sp.familyId} className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-zinc-900 truncate block">
                        {sp.commonName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-zinc-700 leading-relaxed bg-white p-3 rounded-xl border border-zinc-200">
                {dive.notes}
              </p>
              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-zinc-700" />
                  Buddies:
                </span>
                {dive.buddies.map((b) => (
                  <span
                    key={b}
                    className="px-2 py-0.5 rounded-lg bg-white text-zinc-800 border border-zinc-200 text-[11px] font-medium"
                  >
                    {b}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-lg bg-zinc-200/70 text-zinc-800 text-[11px] font-medium">
                  Guide: {dive.diveGuide}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-1.5">
                {dive.gearUsed.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-lg bg-white text-zinc-500 border border-zinc-200 text-[10px]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
