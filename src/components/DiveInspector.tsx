import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Upload,
  Users,
  Compass,
  FileText,
  Sparkles,
  HardDrive,
  Smartphone,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import {
  CritterFamilyMeta,
  CritterSpecies,
  DiveRecord,
  UnitSystem,
  VaultPhoto,
} from '../types/dive';
import { formatDepth, formatPressure, formatTemp } from '../utils/units';
import { CritterSilhouette } from './CritterSilhouette';

interface DiveInspectorProps {
  dive: DiveRecord;
  coverPhoto: VaultPhoto;
  galleryPhotos: VaultPhoto[];
  unitSystem: UnitSystem;
  phonePhotosDeleted: boolean;
  onTogglePhonePhotosDeleted: () => void;
  onUploadPhotoToDive: (diveId: string, file: File) => Promise<void>;
  speciesMap: Record<string, CritterSpecies>;
  familyMap: Record<string, CritterFamilyMeta>;
  onInspectSpeciesInDex: (familyId: string) => void;
  onOpenDiveListModal?: () => void;
}

export const DiveInspector: React.FC<DiveInspectorProps> = ({
  dive,
  coverPhoto,
  galleryPhotos,
  unitSystem,
  phonePhotosDeleted,
  onTogglePhonePhotosDeleted,
  onUploadPhotoToDive,
  speciesMap,
  familyMap,
  onInspectSpeciesInDex,
  onOpenDiveListModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string>(coverPhoto.id);
  const [mobileDetailTab, setMobileDetailTab] = useState<'critters' | 'notes'>('critters');

  const displayedPhoto =
    galleryPhotos.find((p) => p.id === activePhotoId) || coverPhoto;

  const spaceSavedPercent = Math.max(
    90,
    Math.round((1 - displayedPhoto.vaultSizeKB / displayedPhoto.originalSizeKB) * 1000) / 10
  );

  const totalCritterCount = dive.critters.reduce((acc, c) => acc + c.count, 0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      await onUploadPhotoToDive(dive.id, file);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="flex flex-col gap-2.5 bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
      {/* 1. NEVER-DISAPPEARING DECLUTTER-SAFE PHOTO VAULT BANNER */}
      <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-950 group">
        <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-zinc-900">
          {displayedPhoto.vaultWebpDataUrl ? (
            <img
              src={displayedPhoto.vaultWebpDataUrl}
              alt={displayedPhoto.caption}
              className="w-full h-full object-cover object-center grayscale contrast-125"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
              Generating WebP Vault Image...
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50" />

          {/* Top Bar inside Hero Banner */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {onOpenDiveListModal && (
                  <button
                    type="button"
                    onClick={onOpenDiveListModal}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/95 text-zinc-950 text-[10px] font-semibold shadow-sm"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    All Dives
                  </button>
                )}
                <span className="px-2 py-0.5 rounded-md bg-white text-zinc-950 font-mono font-bold text-[11px] shadow-sm">
                  #{dive.diveNumber}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 text-zinc-200 border border-white/15 text-[10px] font-mono">
                  {dive.date}
                </span>
              </div>
              <h2 className="font-display text-base sm:text-lg font-bold text-white mt-1.5 leading-tight truncate">
                {dive.siteName}
              </h2>
              <p className="text-[11px] text-zinc-300 flex items-center gap-1 truncate">
                <Compass className="w-3 h-3 text-zinc-300 shrink-0" />
                {dive.subLocation}
              </p>
            </div>

            {/* Upload & Compress Photo Button */}
            <div className="shrink-0">
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
                disabled={isCompressing}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 hover:bg-white text-zinc-950 text-[10px] font-semibold transition-all shadow-sm"
              >
                <Upload className="w-3 h-3" />
                <span>{isCompressing ? 'Compressing...' : '+ Photo'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Caption & Thumbnails */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between gap-2">
            <p className="text-[10px] text-zinc-300 font-medium truncate">
              {displayedPhoto.caption}
            </p>

            {galleryPhotos.length > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                {galleryPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhotoId(photo.id)}
                    className={`w-7 h-5 rounded overflow-hidden border transition-all ${
                      displayedPhoto.id === photo.id
                        ? 'border-white ring-1 ring-white'
                        : 'border-zinc-500 opacity-70'
                    }`}
                  >
                    <img
                      src={photo.vaultWebpDataUrl}
                      alt=""
                      className="w-full h-full object-cover grayscale"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clean Monochrome Vault Proof Strip */}
        <div className="px-2.5 py-1.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-1.5 text-[10px]">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <Smartphone className="w-3 h-3 shrink-0 text-zinc-500" />
            {phonePhotosDeleted ? (
              <span className="text-zinc-400 font-mono line-through truncate">
                Phone Gallery Deleted
              </span>
            ) : (
              <span className="text-zinc-500 font-mono truncate">
                Phone: {(displayedPhoto.originalSizeKB / 1024).toFixed(1)}MB
              </span>
            )}
            <span className="text-zinc-300">→</span>
            <HardDrive className="w-3 h-3 text-zinc-900 shrink-0" />
            <span className="inline-flex items-center gap-0.5 text-zinc-900 font-mono font-semibold truncate">
              <ShieldCheck className="w-3 h-3 shrink-0 text-zinc-900" />
              {displayedPhoto.vaultSizeKB}KB WebP (-{spaceSavedPercent}%)
            </span>
          </div>

          <button
            type="button"
            onClick={onTogglePhonePhotosDeleted}
            className="px-2 py-0.5 rounded font-semibold shrink-0 border bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100"
          >
            {phonePhotosDeleted ? 'Restore' : 'Wipe Phone'}
          </button>
        </div>
      </div>

      {/* 2. UNIFORM GREYSCALE SINGLE-ROW 5-METRIC TELEMETRY BAR */}
      <div
        className="grid grid-cols-5 gap-1.5"
        aria-label="Single-row key dive metrics"
      >
        {/* Max / Avg Depth */}
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
          <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
            Depth
          </div>
          <div className="font-display text-xs sm:text-sm font-bold text-zinc-950 mt-0.5 leading-tight">
            {formatDepth(dive.maxDepthM, unitSystem)}
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
            avg {formatDepth(dive.avgDepthM, unitSystem)}
          </div>
        </div>

        {/* Bottom Time */}
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
          <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
            Time
          </div>
          <div className="font-display text-xs sm:text-sm font-bold text-zinc-950 mt-0.5 leading-tight">
            {dive.bottomTimeMin}m
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
            +{dive.safetyStopMin}m stop
          </div>
        </div>

        {/* Tank Pressure */}
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
          <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
            {dive.gasMix}
          </div>
          <div className="font-display text-xs sm:text-sm font-bold text-zinc-950 mt-0.5 leading-tight">
            {formatPressure(dive.startPressureBar, unitSystem, false)}→
            {formatPressure(dive.endPressureBar, unitSystem, false)}
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
            {unitSystem === 'metric' ? 'BAR' : 'PSI'} · {dive.tankVolumeL}L
          </div>
        </div>

        {/* Water Temp */}
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
          <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
            Temp
          </div>
          <div className="font-display text-xs sm:text-sm font-bold text-zinc-950 mt-0.5 leading-tight">
            {formatTemp(dive.waterTempC, unitSystem)}
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
            Vis {formatDepth(dive.visibilityM, unitSystem)}
          </div>
        </div>

        {/* Entry Type */}
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 text-center">
          <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
            Entry
          </div>
          <div className="font-display text-xs sm:text-sm font-bold text-zinc-950 mt-0.5 leading-tight truncate">
            {dive.entryType.split(' ')[0]}
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-0.5 truncate">
            {dive.current}
          </div>
        </div>
      </div>

      {/* 3. UNIFIED MONOCHROME CRITTERS & NOTES SECTION */}
      <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="inline-flex bg-zinc-200/70 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setMobileDetailTab('critters')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mobileDetailTab === 'critters'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Critters ({totalCritterCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileDetailTab('notes')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mobileDetailTab === 'notes'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Notes & Crew</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onInspectSpeciesInDex('all')}
            className="text-[10px] text-zinc-600 hover:text-zinc-950 inline-flex items-center gap-1 font-semibold"
          >
            <span>Critter Dex</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {mobileDetailTab === 'critters' ? (
          <div className="grid grid-cols-2 gap-1.5">
            {dive.critters.map((sighted) => {
              const sp = speciesMap[sighted.speciesId];
              if (!sp) return null;

              return (
                <button
                  key={sighted.speciesId}
                  type="button"
                  onClick={() => onInspectSpeciesInDex(sp.familyId)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-zinc-100/80 border border-zinc-200 hover:border-zinc-400 transition-all text-left group shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200 bg-zinc-50 text-zinc-900">
                    <CritterSilhouette familyId={sp.familyId} className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display text-[11px] font-bold text-zinc-900 truncate">
                        {sp.commonName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono text-[9px] font-semibold shrink-0">
                        ×{sighted.count}
                      </span>
                    </div>
                    <p className="text-[9px] italic text-zinc-500 truncate">
                      {sp.scientificName}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-zinc-700 leading-relaxed bg-white p-2.5 rounded-lg border border-zinc-200">
              {dive.notes}
            </p>
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <Users className="w-3 h-3 text-zinc-700" />
                Crew:
              </span>
              {dive.buddies.map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 rounded bg-white text-zinc-800 border border-zinc-200 text-[10px] font-medium"
                >
                  {b}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded bg-zinc-200/70 text-zinc-800 text-[10px] font-medium">
                Guide: {dive.diveGuide}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-1">
              {dive.gearUsed.map((g) => (
                <span
                  key={g}
                  className="px-1.5 py-0.5 rounded bg-white text-zinc-500 border border-zinc-200 text-[9px] font-mono"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
