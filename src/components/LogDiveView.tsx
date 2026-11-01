import React, { useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Square,
  Sparkles,
  Upload,
  Plus,
  Minus,
  AlertTriangle,
  Check,
  Wand2,
  ShieldCheck,
} from 'lucide-react';
import {
  CritterSpecies,
  DiveRecord,
  SpottedCritter,
  UnitSystem,
} from '../types/dive';
import {
  calculateEadMeters,
  calculateModMeters,
  calculateSacAndRmv,
  scanNotesForCritters,
} from '../utils/diveCalculators';
import { formatDepth, formatPressure, formatTemp } from '../utils/units';
import { CritterSilhouette } from './CritterSilhouette';

interface LogDiveViewProps {
  latestDive: DiveRecord;
  allSpecies: CritterSpecies[];
  gearLocker: string[];
  buddyPool: string[];
  unitSystem: UnitSystem;
  onSaveNewDive: (
    newDive: Omit<DiveRecord, 'id' | 'coverPhotoId' | 'photoIds'>,
    uploadedFile?: File | null
  ) => Promise<void>;
}

const BALI_SITE_PRESETS = [
  { site: 'Manta Point & Cleaning Station', sub: 'Nusa Penida, Bali' },
  { site: 'Crystal Bay Corner', sub: 'Nusa Penida, Bali' },
  { site: 'Amed Pyramids & Deep Wall', sub: 'Amed Coast, East Bali' },
  { site: 'Blue Lagoon Jetty Night Muck', sub: 'Padang Bai, East Bali' },
];

const SAMPLE_SCANNER_NOTES = [
  'Dropped onto the cleaning station at 21m. Spotted 2 hairy frogfish on a sponge, a wonderpus hunting over black sand, and 3 pygmy seahorses on a gorgonian fan! Finished safety stop with a hawksbill turtle.',
  'Strong thermocline roll at 24m. Wayan found a flamboyant cuttlefish walking on the slope, 2 pikachu nudibranchs, and 4 shaun the sheep leaf slugs on green algae.',
];

export const LogDiveView: React.FC<LogDiveViewProps> = ({
  latestDive,
  allSpecies,
  gearLocker,
  buddyPool,
  unitSystem,
  onSaveNewDive,
}) => {
  const nextDiveNumber = latestDive.diveNumber + 1;

  // Core Dive Details
  const [siteName, setSiteName] = useState('Manta Point & Cleaning Station');
  const [subLocation, setSubLocation] = useState('Nusa Penida, Bali');
  const [operator, setOperator] = useState(latestDive.operator);
  const [date, setDate] = useState('2026-10-31');
  const [timeIn, setTimeIn] = useState('09:30');

  // Depth, Time, Gas, Temp (stored internally in Metric, displayed with unitSystem)
  const [maxDepthM, setMaxDepthM] = useState(23.6);
  const [avgDepthM, setAvgDepthM] = useState(15.2);
  const [bottomTimeMin, setBottomTimeMin] = useState(56);
  const [safetyStopMin, setSafetyStopMin] = useState(5);
  const [o2Percent, setO2Percent] = useState(32);
  const [startPressureBar, setStartPressureBar] = useState(205);
  const [endPressureBar, setEndPressureBar] = useState(55);
  const [tankVolumeL, setTankVolumeL] = useState(12);
  const [waterTempC, setWaterTempC] = useState(26);
  const [visibilityM, setVisibilityM] = useState(20);
  const [entryType, setEntryType] = useState<DiveRecord['entryType']>('Jukung Outrigger');
  const [current, setCurrent] = useState<DiveRecord['current']>('Mild');

  // 1-Tap "Same Buddies as Last Dive" & Gear Locker Tick-boxes
  const [sameBuddiesAsLast, setSameBuddiesAsLast] = useState(true);
  const [selectedBuddies, setSelectedBuddies] = useState<string[]>(latestDive.buddies);
  const [diveGuide, setDiveGuide] = useState(latestDive.diveGuide);
  const [customBuddyInput, setCustomBuddyInput] = useState('');

  const [sameGearAsLast, setSameGearAsLast] = useState(true);
  const [selectedGear, setSelectedGear] = useState<string[]>(latestDive.gearUsed);

  // Notes & Smart Auto-Tag Critters Scanner
  const [notes, setNotes] = useState(SAMPLE_SCANNER_NOTES[0]);
  const [spottedCritters, setSpottedCritters] = useState<SpottedCritter[]>(() =>
    scanNotesForCritters(SAMPLE_SCANNER_NOTES[0], allSpecies)
  );
  const [manualSpeciesId, setManualSpeciesId] = useState(allSpecies[0]?.id || '');

  // Optional Uploaded Cover Photo for WebP Vault
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Live Calculators: Nitrox MOD (1.4 ppO2) + EAD + SAC/RMV
  const mod14Meters = useMemo(() => calculateModMeters(o2Percent, 1.4), [o2Percent]);
  const mod16Meters = useMemo(() => calculateModMeters(o2Percent, 1.6), [o2Percent]);
  const eadMeters = useMemo(
    () => calculateEadMeters(maxDepthM, o2Percent),
    [maxDepthM, o2Percent]
  );
  const sacRmv = useMemo(
    () =>
      calculateSacAndRmv(
        avgDepthM,
        bottomTimeMin,
        startPressureBar,
        endPressureBar,
        tankVolumeL
      ),
    [avgDepthM, bottomTimeMin, startPressureBar, endPressureBar, tankVolumeL]
  );

  const isModExceeded = maxDepthM > mod14Meters;

  const handleToggleSameBuddies = () => {
    const next = !sameBuddiesAsLast;
    setSameBuddiesAsLast(next);
    if (next) {
      setSelectedBuddies(latestDive.buddies);
      setDiveGuide(latestDive.diveGuide);
    }
  };

  const handleToggleBuddy = (buddy: string) => {
    setSameBuddiesAsLast(false);
    setSelectedBuddies((prev) =>
      prev.includes(buddy) ? prev.filter((b) => b !== buddy) : [...prev, buddy]
    );
  };

  const handleAddCustomBuddy = () => {
    const trimmed = customBuddyInput.trim();
    if (!trimmed) return;
    if (!selectedBuddies.includes(trimmed)) {
      setSelectedBuddies((prev) => [...prev, trimmed]);
    }
    setCustomBuddyInput('');
    setSameBuddiesAsLast(false);
  };

  const handleToggleSameGear = () => {
    const next = !sameGearAsLast;
    setSameGearAsLast(next);
    if (next) {
      setSelectedGear(latestDive.gearUsed);
    }
  };

  const handleToggleGearItem = (item: string) => {
    setSameGearAsLast(false);
    setSelectedGear((prev) =>
      prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item]
    );
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    // Live auto-tag critters from notes
    const scanned = scanNotesForCritters(text, allSpecies);
    if (scanned.length > 0) {
      setSpottedCritters(scanned);
    }
  };

  const handleAdjustCritterCount = (speciesId: string, delta: number) => {
    setSpottedCritters((prev) =>
      prev
        .map((c) =>
          c.speciesId === speciesId ? { ...c, count: c.count + delta } : c
        )
        .filter((c) => c.count > 0)
    );
  };

  const handleAddManualCritter = () => {
    if (!manualSpeciesId) return;
    setSpottedCritters((prev) => {
      const existing = prev.find((c) => c.speciesId === manualSpeciesId);
      if (existing) {
        return prev.map((c) =>
          c.speciesId === manualSpeciesId ? { ...c, count: c.count + 1 } : c
        );
      }
      return [...prev, { speciesId: manualSpeciesId, count: 1, highlight: true }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const gasMixLabel = o2Percent === 21 ? 'Air 21%' : `EANx${o2Percent}`;
      await onSaveNewDive(
        {
          diveNumber: nextDiveNumber,
          siteName: siteName.trim() || `Bali Safari Dive #${nextDiveNumber}`,
          subLocation: subLocation.trim() || 'East Bali',
          operator,
          date,
          timeIn,
          maxDepthM,
          avgDepthM,
          bottomTimeMin,
          safetyStopMin,
          startPressureBar,
          endPressureBar,
          tankVolumeL,
          gasMix: gasMixLabel,
          o2Percent,
          waterTempC,
          visibilityM,
          entryType,
          current,
          buddies: selectedBuddies.length > 0 ? selectedBuddies : ['Solo / Guide'],
          diveGuide,
          gearUsed: selectedGear,
          notes,
          critters: spottedCritters,
          computerModel: 'Shearwater Peregrine TX',
        },
        uploadedFile
      );
    } finally {
      setIsSaving(false);
    }
  };

  const allAvailableBuddies = Array.from(
    new Set([...buddyPool, ...latestDive.buddies, ...selectedBuddies])
  );
  const allAvailableGear = Array.from(
    new Set([...gearLocker, ...latestDive.gearUsed, ...selectedGear])
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-4">
      {/* 1. HEADER & SITE SELECTION */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-zinc-950 text-white text-xs font-bold">
              DIVE #{nextDiveNumber}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {operator}
            </span>
          </div>
        </div>

        {/* Quick Site Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {BALI_SITE_PRESETS.map((preset) => {
            const active = siteName === preset.site;
            return (
              <button
                key={preset.site}
                type="button"
                onClick={() => {
                  setSiteName(preset.site);
                  setSubLocation(preset.sub);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0 border transition-all ${
                  active
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-950'
                }`}
              >
                {preset.site.split(' ')[0]} {preset.site.split(' ')[1]}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Dive Site Name
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs font-semibold text-zinc-950 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                Time In
              </label>
              <input
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRY + LIVE NITROX MOD (1.4 ppO2) & SAC/RMV CALCULATOR */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-900">
            Profile, Gas & Live MOD / SAC
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            Active Units: {unitSystem === 'metric' ? 'M / BAR / °C' : 'FT / PSI / °F'}
          </span>
        </div>

        {/* 4-Column Compact Inputs */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2">
            <label className="block text-[9px] uppercase font-semibold text-zinc-400">
              Max ({formatDepth(maxDepthM, unitSystem)})
            </label>
            <input
              type="number"
              step="0.5"
              min="3"
              max="65"
              value={maxDepthM}
              onChange={(e) => setMaxDepthM(Number(e.target.value))}
              className="w-full mt-0.5 bg-transparent font-display text-sm font-bold text-zinc-950 outline-none"
            />
            <span className="text-[9px] font-mono text-zinc-400">meters base</span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2">
            <label className="block text-[9px] uppercase font-semibold text-zinc-400">
              Avg ({formatDepth(avgDepthM, unitSystem)})
            </label>
            <input
              type="number"
              step="0.5"
              min="2"
              max="50"
              value={avgDepthM}
              onChange={(e) => setAvgDepthM(Number(e.target.value))}
              className="w-full mt-0.5 bg-transparent font-display text-sm font-bold text-zinc-950 outline-none"
            />
            <span className="text-[9px] font-mono text-zinc-400">meters base</span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2">
            <label className="block text-[9px] uppercase font-semibold text-zinc-400">
              Time (min)
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={bottomTimeMin}
              onChange={(e) => setBottomTimeMin(Number(e.target.value))}
              className="w-full mt-0.5 bg-transparent font-display text-sm font-bold text-zinc-950 outline-none"
            />
            <span className="text-[9px] font-mono text-zinc-400">+{safetyStopMin}m stop</span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2">
            <label className="block text-[9px] uppercase font-semibold text-zinc-400">
              Temp ({formatTemp(waterTempC, unitSystem)})
            </label>
            <input
              type="number"
              min="4"
              max="34"
              value={waterTempC}
              onChange={(e) => setWaterTempC(Number(e.target.value))}
              className="w-full mt-0.5 bg-transparent font-display text-sm font-bold text-zinc-950 outline-none"
            />
            <span className="text-[9px] font-mono text-zinc-400">°C base</span>
          </div>
        </div>

        {/* Gas Mix Slider & Pressure Inputs */}
        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-800">
              Gas Mix:{' '}
              <strong className="font-mono text-zinc-950">
                {o2Percent === 21 ? 'Air (21% O₂)' : `EANx${o2Percent} (${o2Percent}% O₂)`}
              </strong>
            </span>
            <div className="flex items-center gap-1">
              {[21, 32, 36].map((presetO2) => (
                <button
                  key={presetO2}
                  type="button"
                  onClick={() => setO2Percent(presetO2)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    o2Percent === presetO2
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-white text-zinc-600 border-zinc-200'
                  }`}
                >
                  {presetO2 === 21 ? 'AIR' : `EAN${presetO2}`}
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min="21"
            max="40"
            value={o2Percent}
            onChange={(e) => setO2Percent(Number(e.target.value))}
            className="w-full accent-zinc-950 h-1.5 bg-zinc-200 rounded-lg cursor-pointer"
          />

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="block text-[9px] uppercase font-semibold text-zinc-400">
                Start ({formatPressure(startPressureBar, unitSystem)})
              </label>
              <input
                type="number"
                value={startPressureBar}
                onChange={(e) => setStartPressureBar(Number(e.target.value))}
                className="w-full mt-0.5 px-2 py-1 rounded bg-white border border-zinc-200 font-mono text-xs font-bold text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-semibold text-zinc-400">
                End ({formatPressure(endPressureBar, unitSystem)})
              </label>
              <input
                type="number"
                value={endPressureBar}
                onChange={(e) => setEndPressureBar(Number(e.target.value))}
                className="w-full mt-0.5 px-2 py-1 rounded bg-white border border-zinc-200 font-mono text-xs font-bold text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-semibold text-zinc-400">
                Entry Type
              </label>
              <select
                value={entryType}
                onChange={(e) =>
                  setEntryType(e.target.value as DiveRecord['entryType'])
                }
                className="w-full mt-0.5 px-1.5 py-1 rounded bg-white border border-zinc-200 text-[11px] font-semibold text-zinc-900"
              >
                <option value="Jukung Outrigger">Jukung</option>
                <option value="Speedboat Roll">Speedboat</option>
                <option value="Shore Entry">Shore</option>
                <option value="Negative Drift">Drift</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Calculated MOD (1.4 ppO2), EAD & SAC/RMV Readout Bar */}
        <div
          className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
            isModExceeded
              ? 'bg-zinc-950 text-white border-zinc-950'
              : 'bg-zinc-100/80 text-zinc-900 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-wider opacity-70 block font-semibold">
                MOD (1.4 ppO₂)
              </span>
              <span className="font-display text-xs font-bold">
                {formatDepth(mod14Meters, unitSystem)}{' '}
                <span className="text-[9px] font-mono opacity-75">
                  (1.6: {formatDepth(mod16Meters, unitSystem)})
                </span>
              </span>
            </div>

            <div className="h-6 w-px bg-zinc-300/60" />

            <div>
              <span className="text-[9px] uppercase tracking-wider opacity-70 block font-semibold">
                EAD
              </span>
              <span className="font-display text-xs font-bold">
                {formatDepth(eadMeters, unitSystem)}
              </span>
            </div>

            <div className="h-6 w-px bg-zinc-300/60" />

            <div>
              <span className="text-[9px] uppercase tracking-wider opacity-70 block font-semibold">
                Live SAC / RMV
              </span>
              <span className="font-display text-xs font-bold">
                {unitSystem === 'metric'
                  ? `${sacRmv.rmvLitersMin} L/min (${sacRmv.sacBarMin} bar/m)`
                  : `${sacRmv.rmvCuftMin} cuft/m (${sacRmv.sacPsiMin} psi/m)`}
              </span>
            </div>
          </div>

          {isModExceeded && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-zinc-950 text-[10px] font-mono font-bold">
              <AlertTriangle className="w-3 h-3" />
              Exceeds 1.4 MOD!
            </span>
          )}
        </div>
      </div>

      {/* 3. 1-TAP "SAME BUDDIES AS LAST DIVE" & GEAR LOCKER TICK-BOXES */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        {/* Same Buddies as Last Dive */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handleToggleSameBuddies}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950"
            >
              {sameBuddiesAsLast ? (
                <CheckSquare className="w-4 h-4 text-zinc-950" />
              ) : (
                <Square className="w-4 h-4 text-zinc-400" />
              )}
              <span>Same Buddies & Guide as Dive #{latestDive.diveNumber}</span>
            </button>
            <span className="text-[10px] font-mono text-zinc-400">1-Tap Crew</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allAvailableBuddies.map((buddy) => {
              const checked = selectedBuddies.includes(buddy);
              return (
                <button
                  key={buddy}
                  type="button"
                  onClick={() => handleToggleBuddy(buddy)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    checked
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  }`}
                >
                  {checked && <Check className="w-3 h-3" />}
                  <span>{buddy}</span>
                </button>
              );
            })}

            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                value={customBuddyInput}
                onChange={(e) => setCustomBuddyInput(e.target.value)}
                placeholder="+ Buddy name"
                className="w-24 px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-900 outline-none"
              />
              {customBuddyInput.trim() && (
                <button
                  type="button"
                  onClick={handleAddCustomBuddy}
                  className="px-2 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-bold"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gear Locker Tick-Boxes */}
        <div className="pt-2.5 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handleToggleSameGear}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950"
            >
              {sameGearAsLast ? (
                <CheckSquare className="w-4 h-4 text-zinc-950" />
              ) : (
                <Square className="w-4 h-4 text-zinc-400" />
              )}
              <span>Gear Locker Tick-Boxes ({selectedGear.length} active)</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allAvailableGear.map((item) => {
              const checked = selectedGear.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleToggleGearItem(item)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                    checked
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                      : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                  }`}
                >
                  {checked && <Check className="w-2.5 h-2.5" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. SMART AUTO-TAG CRITTERS FROM NOTES SCANNER */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-zinc-900" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-900">
              Field Notes & Auto-Tag Critter Scanner
            </h3>
          </div>
          <button
            type="button"
            onClick={() =>
              handleNotesChange(
                notes === SAMPLE_SCANNER_NOTES[0]
                  ? SAMPLE_SCANNER_NOTES[1]
                  : SAMPLE_SCANNER_NOTES[0]
              )
            }
            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200"
          >
            Try Sample Note
          </button>
        </div>

        <textarea
          rows={3}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Type your dive notes (e.g., 'Spotted 2 hairy frogfish, a wonderpus, and 3 pygmy seahorses')..."
          className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs text-zinc-800 leading-relaxed outline-none"
        />

        {/* Auto-Tagged Species Pills with SVG Silhouettes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span className="inline-flex items-center gap-1 font-semibold text-zinc-700">
              <Sparkles className="w-3 h-3" />
              Auto-Tagged from Notes ({spottedCritters.reduce((s, c) => s + c.count, 0)} critters):
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {spottedCritters.map((item) => {
              const sp = allSpecies.find((s) => s.id === item.speciesId);
              if (!sp) return null;
              return (
                <div
                  key={item.speciesId}
                  className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-zinc-50 border border-zinc-200"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 text-zinc-900">
                      <CritterSilhouette familyId={sp.familyId} className="w-5 h-5" />
                    </div>
                    <span className="font-display text-[11px] font-bold text-zinc-900 truncate">
                      {sp.commonName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAdjustCritterCount(item.speciesId, -1)}
                      className="w-5 h-5 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-950"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="font-mono text-[10px] font-bold text-zinc-950 w-4 text-center">
                      {item.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustCritterCount(item.speciesId, 1)}
                      className="w-5 h-5 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-950"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Species Add Bar */}
          <div className="flex items-center gap-1.5 pt-1">
            <select
              value={manualSpeciesId}
              onChange={(e) => setManualSpeciesId(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 outline-none"
            >
              {allSpecies.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  + {sp.commonName} ({sp.scientificName})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddManualCritter}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold shrink-0"
            >
              Add Critter
            </button>
          </div>
        </div>
      </div>

      {/* 5. WEBP PHOTO VAULT ATTACHMENT & SUBMIT */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-2">
        <div className="min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">
              {uploadedFile ? uploadedFile.name : 'Add Dive Photo'}
            </span>
          </button>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold shadow-sm transition-all shrink-0"
        >
          {isSaving ? 'Saving to Vault...' : `Save Dive #${nextDiveNumber}`}
        </button>
      </div>
    </form>
  );
};
