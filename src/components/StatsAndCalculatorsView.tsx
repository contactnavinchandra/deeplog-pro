import React, { useMemo, useState } from 'react';
import { BarChart3, Calculator, Gauge } from 'lucide-react';
import { DiveRecord, UnitSystem } from '../types/dive';
import {
  calculateBestMixO2,
  calculateEadMeters,
  calculateModMeters,
  calculateSacAndRmv,
} from '../utils/diveCalculators';
import { formatDepth, formatTemp } from '../utils/units';

interface StatsAndCalculatorsViewProps {
  dives: DiveRecord[];
  unitSystem: UnitSystem;
  onSelectDive: (diveId: string) => void;
}

export const StatsAndCalculatorsView: React.FC<StatsAndCalculatorsViewProps> = ({
  dives,
  unitSystem,
  onSelectDive,
}) => {
  // Interactive Standalone Nitrox & Gas Planner State
  const [calcO2, setCalcO2] = useState<number>(32);
  const [calcPpO2, setCalcPpO2] = useState<number>(1.4);
  const [plannedDepthM, setPlannedDepthM] = useState<number>(28);

  const totalBottomTimeMin = useMemo(
    () => dives.reduce((acc, d) => acc + d.bottomTimeMin, 0),
    [dives]
  );

  const deepestDive = useMemo(
    () => dives.reduce((max, d) => (d.maxDepthM > max.maxDepthM ? d : max), dives[0]),
    [dives]
  );

  // Per-dive SAC & RMV telemetry
  const diveMetrics = useMemo(() => {
    return dives.map((d) => ({
      dive: d,
      metrics: calculateSacAndRmv(
        d.avgDepthM,
        d.bottomTimeMin,
        d.startPressureBar,
        d.endPressureBar,
        d.tankVolumeL
      ),
    }));
  }, [dives]);

  const avgRmvLiters = useMemo(() => {
    const sum = diveMetrics.reduce((acc, item) => acc + item.metrics.rmvLitersMin, 0);
    return Math.round((sum / Math.max(1, diveMetrics.length)) * 10) / 10;
  }, [diveMetrics]);

  const avgRmvCuft = useMemo(
    () => Math.round(avgRmvLiters * 0.0353147 * 100) / 100,
    [avgRmvLiters]
  );

  const avgSacBar = useMemo(() => {
    const sum = diveMetrics.reduce((acc, item) => acc + item.metrics.sacBarMin, 0);
    return Math.round((sum / Math.max(1, diveMetrics.length)) * 100) / 100;
  }, [diveMetrics]);

  const avgSacPsi = useMemo(
    () => Math.round(avgSacBar * 14.5038 * 10) / 10,
    [avgSacBar]
  );

  const modMeters = useMemo(
    () => calculateModMeters(calcO2, calcPpO2),
    [calcO2, calcPpO2]
  );
  const eadMeters = useMemo(
    () => calculateEadMeters(plannedDepthM, calcO2),
    [plannedDepthM, calcO2]
  );
  const bestMixO2 = useMemo(
    () => calculateBestMixO2(plannedDepthM, calcPpO2),
    [plannedDepthM, calcPpO2]
  );

  return (
    <div className="space-y-3 pb-4">
      {/* 1. EXPEDITION SUMMARY KPI CARDS (UNIFORM GREYSCALE) */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="font-display text-sm font-bold text-zinc-950 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-zinc-900" />
              Expedition Telemetry & Gas Analytics
            </h2>
            <p className="text-[10px] text-zinc-500">
              {dives.length} Logged Dives • {unitSystem === 'metric' ? 'M / BAR / L/min' : 'FT / PSI / cuft/min'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
              Mean RMV
            </span>
            <div className="font-display text-base font-bold text-zinc-950 mt-0.5">
              {unitSystem === 'metric' ? `${avgRmvLiters} L/m` : `${avgRmvCuft} cf/m`}
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              Respiratory Min Vol
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
              Mean SAC
            </span>
            <div className="font-display text-base font-bold text-zinc-950 mt-0.5">
              {unitSystem === 'metric' ? `${avgSacBar} bar/m` : `${avgSacPsi} psi/m`}
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              12L / 80cf normalized
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
              Max Depth
            </span>
            <div className="font-display text-base font-bold text-zinc-950 mt-0.5">
              {formatDepth(deepestDive.maxDepthM, unitSystem)}
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              Dive #{deepestDive.diveNumber}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
              Bottom Time
            </span>
            <div className="font-display text-base font-bold text-zinc-950 mt-0.5">
              {Math.floor(totalBottomTimeMin / 60)}h {totalBottomTimeMin % 60}m
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              Temp {formatTemp(24, unitSystem, false)}–{formatTemp(28, unitSystem)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE NITROX MOD (1.4 ppO2), EAD & BEST MIX CALCULATOR */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" />
            Live Nitrox MOD, EAD & Best Mix Calculator
          </h3>
          <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
            {[1.4, 1.6].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => setCalcPpO2(limit)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  calcPpO2 === limit
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {limit.toFixed(1)} ppO₂
              </button>
            ))}
          </div>
        </div>

        {/* Sliders for O2% and Planned Depth */}
        <div className="space-y-2.5 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-zinc-700">Oxygen Mix (FO₂)</span>
              <span className="font-mono font-bold text-zinc-950">
                {calcO2 === 21 ? '21% (Air)' : `EANx${calcO2} (${calcO2}% O₂)`}
              </span>
            </div>
            <input
              type="range"
              min="21"
              max="40"
              value={calcO2}
              onChange={(e) => setCalcO2(Number(e.target.value))}
              className="w-full accent-zinc-950 h-1.5 bg-zinc-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-zinc-700">Planned Target Depth</span>
              <span className="font-mono font-bold text-zinc-950">
                {formatDepth(plannedDepthM, unitSystem)}
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="50"
              value={plannedDepthM}
              onChange={(e) => setPlannedDepthM(Number(e.target.value))}
              className="w-full accent-zinc-950 h-1.5 bg-zinc-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* 3 Uniform Monochrome Output Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
              MOD ({calcPpO2} ppO₂)
            </div>
            <div className="font-display text-sm font-bold text-zinc-950 mt-0.5">
              {formatDepth(modMeters, unitSystem)}
            </div>
            <div className="text-[9px] font-mono text-zinc-500">Max Op Depth</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
              EAD @ {formatDepth(plannedDepthM, unitSystem)}
            </div>
            <div className="font-display text-sm font-bold text-zinc-950 mt-0.5">
              {formatDepth(eadMeters, unitSystem)}
            </div>
            <div className="text-[9px] font-mono text-zinc-500">Equiv Air Depth</div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">
              Best Mix
            </div>
            <div className="font-display text-sm font-bold text-zinc-950 mt-0.5">
              EANx{bestMixO2}
            </div>
            <div className="text-[9px] font-mono text-zinc-500">
              For {formatDepth(plannedDepthM, unitSystem)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PER-DIVE SAC & RMV RATE BREAKDOWN TABLE */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            Per-Dive SAC / RMV Rate Log
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">
            Tap dive to inspect
          </span>
        </div>

        <div className="divide-y divide-zinc-100">
          {diveMetrics.map(({ dive, metrics }) => {
            const barWidthPct = Math.min(100, Math.max(20, (metrics.rmvLitersMin / 22) * 100));
            return (
              <button
                key={dive.id}
                type="button"
                onClick={() => onSelectDive(dive.id)}
                className="w-full py-2 px-1 hover:bg-zinc-50 transition-colors text-left flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-white">
                      #{dive.diveNumber}
                    </span>
                    <span className="font-display text-xs font-bold text-zinc-900 truncate">
                      {dive.siteName}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-900 h-full rounded-full"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <div className="text-xs font-bold text-zinc-950">
                    {unitSystem === 'metric'
                      ? `${metrics.rmvLitersMin} L/min`
                      : `${metrics.rmvCuftMin} cf/min`}
                  </div>
                  <div className="text-[9px] text-zinc-500">
                    {unitSystem === 'metric'
                      ? `${metrics.sacBarMin} bar/m`
                      : `${metrics.sacPsiMin} psi/m`}{' '}
                    • {metrics.ata} ATA
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
