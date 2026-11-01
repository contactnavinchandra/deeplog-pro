import React from 'react';
import {
  PlusSquare,
  Wrench,
  Sparkles,
  QrCode,
  Calculator,
  BarChart3,
  Layers,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { DiveRecord, TabId, UnitSystem } from '../types/dive';
import { formatDepth, formatTemp } from '../utils/units';

interface Stage2Props {
  activeTab: TabId;
  dives: DiveRecord[];
  unitSystem: UnitSystem;
  onReturnToDives: () => void;
}

export const Stage2Placeholders: React.FC<Stage2Props> = ({
  activeTab,
  dives,
  unitSystem,
  onReturnToDives,
}) => {
  const latestDive = dives[0];
  const totalBottomTimeMin = dives.reduce((acc, d) => acc + d.bottomTimeMin, 0);
  const deepestDive = dives.reduce(
    (max, d) => (d.maxDepthM > max.maxDepthM ? d : max),
    dives[0]
  );
  const totalCritterSightings = dives.reduce(
    (acc, d) => acc + d.critters.reduce((s, c) => s + c.count, 0),
    0
  );

  if (activeTab === 'log') {
    return (
      <div className="space-y-3">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
              Stage 2 Slot
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Next Entry: <strong className="text-zinc-950">Dive #{latestDive.diveNumber + 1}</strong>
            </span>
          </div>

          <h2 className="font-display text-base font-bold text-zinc-950 flex items-center gap-2">
            <PlusSquare className="w-4 h-4 text-zinc-900" />
            Smart Multi-Day Dive Logger
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Prepared for Stage 2 rapid liveaboard logging with 1-tap buddy inheritance, gear locker tick-boxes, and notes auto-tagging.
          </p>

          <div className="grid grid-cols-1 gap-2.5 mt-4">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                <CheckSquare className="w-3.5 h-3.5" />
                1-Tap "Same Buddies & Guide as Dive #{latestDive.diveNumber}"
              </div>
              <p className="text-[11px] text-zinc-500">
                Inherits <span className="text-zinc-800 font-medium">{latestDive.buddies.join(', ')}</span> and guide{' '}
                <span className="text-zinc-800 font-medium">{latestDive.diveGuide}</span>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                <Sparkles className="w-3.5 h-3.5" />
                Smart Auto-Tag Critters from Notes Scanner
              </div>
              <p className="text-[11px] text-zinc-500">
                Scans field notes and auto-links species IDs in real time.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                <Calculator className="w-3.5 h-3.5" />
                Live Nitrox MOD (1.4 ppO₂) Calculator
              </div>
              <p className="text-[11px] text-zinc-500">
                Real-time Maximum Operating Depth validator in {unitSystem.toUpperCase()} units.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                <ShieldCheck className="w-3.5 h-3.5" />
                WebP Photo Vault Hook Ready
              </div>
              <p className="text-[11px] text-zinc-500">
                Connected to <code className="text-zinc-800 font-mono">compressPhotoToWebpVault()</code> (~35KB Directory.Data sandbox).
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
            <button
              type="button"
              onClick={onReturnToDives}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all"
            >
              <span>Inspect Logged Dives (#215–#222)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'gear') {
    return (
      <div className="space-y-3">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
            Stage 2 Slot • Gear & Crew Sync
          </span>
          <h2 className="font-display text-base font-bold text-zinc-950 flex items-center gap-2 mt-2">
            <Wrench className="w-4 h-4 text-zinc-900" />
            Gear Locker & Offline Boat QR Crew Sync
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Structural placeholder for Stage 2 Gear Locker tick-boxes, Offline Boat QR Code sharing, and 2-way Critter Delta Sync.
          </p>

          <div className="grid grid-cols-1 gap-2.5 mt-4">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                <Layers className="w-3.5 h-3.5" />
                Active Bali Safari Gear Kit
              </div>
              <div className="flex flex-wrap gap-1.5">
                {latestDive.gearUsed.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-1 rounded-lg bg-white border border-zinc-200 text-[11px] font-mono text-zinc-700"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                <QrCode className="w-3.5 h-3.5" />
                Offline Boat QR & 2-Way Critter Delta Sync
              </div>
              <p className="text-[11px] text-zinc-500">
                Zero-internet peer-to-peer QR payload exchange for Geko Dive boat buddies (<span className="text-zinc-800 font-medium">Made Wirawan, Elena Rostova, Marcus Vance</span>).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Statistics Tab (Uniform Monochrome Telemetry)
  return (
    <div className="space-y-3">
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display text-base font-bold text-zinc-950 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-900" />
              Bali Expedition Telemetry (#215–#222)
            </h2>
            <p className="text-[11px] text-zinc-500">
              Formatted in {unitSystem === 'metric' ? 'Metric (M / BAR / °C)' : 'Imperial (FT / PSI / °F)'}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Bottom Time
            </span>
            <div className="font-display text-lg font-bold text-zinc-950 mt-0.5">
              {Math.floor(totalBottomTimeMin / 60)}h {totalBottomTimeMin % 60}m
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Across {dives.length} Geko Dives
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Max Depth
            </span>
            <div className="font-display text-lg font-bold text-zinc-950 mt-0.5">
              {formatDepth(deepestDive.maxDepthM, unitSystem)}
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Dive #{deepestDive.diveNumber} ({deepestDive.siteName.split(' ')[0]})
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Temp Range
            </span>
            <div className="font-display text-lg font-bold text-zinc-950 mt-0.5">
              {formatTemp(24, unitSystem, false)}–{formatTemp(28, unitSystem)}
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Lombok Thermocline
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Critters Logged
            </span>
            <div className="font-display text-lg font-bold text-zinc-950 mt-0.5">
              {totalCritterSightings}
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Vector silhouettes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
