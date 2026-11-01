import React, { useMemo } from 'react';
import { BarChart3, Clock, Compass } from 'lucide-react';
import { DiveRecord, UnitSystem } from '../types/dive';
import { formatDepth, formatPressure, formatTemp } from '../utils/units';

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
  const latestDiveNumber = dives[0]?.diveNumber || 222;

  const totalBottomTimeMin = useMemo(
    () => dives.reduce((acc, d) => acc + d.bottomTimeMin, 0),
    [dives]
  );

  const avgBottomTimeMin = useMemo(
    () => Math.round(totalBottomTimeMin / Math.max(1, dives.length)),
    [totalBottomTimeMin, dives.length]
  );

  const deepestDive = useMemo(
    () => dives.reduce((max, d) => (d.maxDepthM > max.maxDepthM ? d : max), dives[0]),
    [dives]
  );

  const longestDive = useMemo(
    () =>
      dives.reduce(
        (max, d) => (d.bottomTimeMin > max.bottomTimeMin ? d : max),
        dives[0]
      ),
    [dives]
  );

  const avgMaxDepthM = useMemo(() => {
    const sum = dives.reduce((acc, d) => acc + d.maxDepthM, 0);
    return Math.round((sum / Math.max(1, dives.length)) * 10) / 10;
  }, [dives]);

  const minTempC = useMemo(
    () => Math.min(...dives.map((d) => d.waterTempC)),
    [dives]
  );
  const maxTempC = useMemo(
    () => Math.max(...dives.map((d) => d.waterTempC)),
    [dives]
  );

  const avgAirUsedBar = useMemo(() => {
    const sum = dives.reduce(
      (acc, d) => acc + Math.max(0, d.startPressureBar - d.endPressureBar),
      0
    );
    return Math.round(sum / Math.max(1, dives.length));
  }, [dives]);

  const boatDiveCount = useMemo(
    () => dives.filter((d) => d.diveType === 'Boat').length,
    [dives]
  );
  const shoreDiveCount = useMemo(
    () => dives.filter((d) => d.diveType === 'Shore').length,
    [dives]
  );
  const nitroxDiveCount = useMemo(
    () => dives.filter((d) => d.o2Percent > 21).length,
    [dives]
  );
  const airDiveCount = dives.length - nitroxDiveCount;

  return (
    <div className="space-y-3 pb-4">
      {/* 1. PERSONAL DIVING SUMMARY */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-zinc-900" />
              Diving Summary
            </h2>
            <p className="text-[11px] text-zinc-500">
              Overview across your recent {dives.length} logged dives
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Career Dives
            </span>
            <div className="text-lg font-bold text-zinc-950 mt-0.5">
              {latestDiveNumber} Dives
            </div>
            <span className="text-[11px] text-zinc-500">
              {dives.length} on this trip
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Time Underwater
            </span>
            <div className="text-lg font-bold text-zinc-950 mt-0.5">
              {Math.floor(totalBottomTimeMin / 60)}h {totalBottomTimeMin % 60}m
            </div>
            <span className="text-[11px] text-zinc-500">
              Avg {avgBottomTimeMin} min / dive
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Deepest Dive
            </span>
            <div className="text-lg font-bold text-zinc-950 mt-0.5">
              {formatDepth(deepestDive.maxDepthM, unitSystem)}
            </div>
            <span className="text-[11px] text-zinc-500 truncate block">
              #{deepestDive.diveNumber} {deepestDive.siteName}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Longest Dive
            </span>
            <div className="text-lg font-bold text-zinc-950 mt-0.5">
              {longestDive.bottomTimeMin} min
            </div>
            <span className="text-[11px] text-zinc-500 truncate block">
              #{longestDive.diveNumber} {longestDive.siteName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DIVE CONDITIONS & BREAKDOWN */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          Conditions & Dive Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="text-[10px] uppercase font-semibold text-zinc-400">
              Dive Type
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-1">
              {boatDiveCount} Boat • {shoreDiveCount} Shore
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="text-[10px] uppercase font-semibold text-zinc-400">
              Breathing Gas
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-1">
              {nitroxDiveCount} Nitrox • {airDiveCount} Air
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="text-[10px] uppercase font-semibold text-zinc-400">
              Water Temp
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-1">
              {formatTemp(minTempC, unitSystem, false)}–{formatTemp(maxTempC, unitSystem)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="text-[10px] uppercase font-semibold text-zinc-400">
              Avg Air Used
            </div>
            <div className="text-xs font-bold text-zinc-950 mt-1">
              {formatPressure(avgAirUsedBar, unitSystem)} / dive
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEPTH & DURATION BY DIVE */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Depth & Dive Time History
          </h3>
          <span className="text-[11px] text-zinc-400">
            Avg Max: {formatDepth(avgMaxDepthM, unitSystem)}
          </span>
        </div>

        <div className="divide-y divide-zinc-100">
          {dives.map((dive) => {
            const depthPct = Math.min(100, Math.max(20, (dive.maxDepthM / 35) * 100));
            const airUsed = Math.max(0, dive.startPressureBar - dive.endPressureBar);

            return (
              <button
                key={dive.id}
                type="button"
                onClick={() => onSelectDive(dive.id)}
                className="w-full py-2.5 px-1 hover:bg-zinc-50 transition-colors text-left flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                      #{dive.diveNumber}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 truncate">
                      {dive.siteName}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      • {dive.diveType}
                    </span>
                  </div>
                  <div className="mt-1.5 w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-900 h-full rounded-full"
                      style={{ width: `${depthPct}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-zinc-950">
                    {formatDepth(dive.maxDepthM, unitSystem)} • {dive.bottomTimeMin} min
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {dive.gasMix} • {formatPressure(airUsed, unitSystem)} used
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
