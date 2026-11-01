import React from 'react';
import { Search, MapPin, ChevronRight, X } from 'lucide-react';
import { DiveRecord, UnitSystem, VaultPhoto } from '../types/dive';
import { formatDepth, formatTemp } from '../utils/units';

interface DiveListSidebarProps {
  dives: DiveRecord[];
  selectedDiveId: string;
  onSelectDive: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unitSystem: UnitSystem;
  vaultPhotos?: Record<string, VaultPhoto>;
}

export const DiveListSidebar: React.FC<DiveListSidebarProps> = ({
  dives,
  selectedDiveId,
  onSelectDive,
  searchQuery,
  onSearchChange,
  unitSystem,
  vaultPhotos = {},
}) => {
  const latestDiveNum = dives[0]?.diveNumber || 222;
  const totalMinutes = dives.reduce((sum, d) => sum + d.bottomTimeMin, 0);
  const maxDepth = dives.reduce((max, d) => Math.max(max, d.maxDepthM), 0);

  return (
    <div className="space-y-3">
      {/* Logbook Summary Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider font-medium text-zinc-400">
            Total Logged
          </div>
          <div className="text-lg font-bold text-zinc-950 mt-0.5">
            {latestDiveNum}
          </div>
          <div className="text-[11px] text-zinc-500">Career dives</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider font-medium text-zinc-400">
            Recent Time
          </div>
          <div className="text-lg font-bold text-zinc-950 mt-0.5">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </div>
          <div className="text-[11px] text-zinc-500">Last {dives.length} dives</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider font-medium text-zinc-400">
            Max Depth
          </div>
          <div className="text-lg font-bold text-zinc-950 mt-0.5">
            {formatDepth(maxDepth, unitSystem)}
          </div>
          <div className="text-[11px] text-zinc-500">Geko Dive trip</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search dive site, location, buddy, or marine life..."
          aria-label="Search dives"
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200 focus:border-zinc-900 rounded-2xl text-xs text-zinc-900 placeholder-zinc-400 outline-none shadow-sm transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Clean Dive Log Cards */}
      <div className="space-y-2">
        {dives.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 text-xs">
            No dives match "{searchQuery}".
          </div>
        ) : (
          dives.map((dive) => {
            const cover = vaultPhotos[dive.coverPhotoId];
            const totalCritters = dive.critters.reduce((sum, c) => sum + c.count, 0);

            return (
              <button
                key={dive.id}
                type="button"
                onClick={() => onSelectDive(dive.id)}
                className="w-full text-left bg-white hover:bg-zinc-50/80 border border-zinc-200 rounded-2xl p-3 transition-all flex items-center gap-3 shadow-sm group"
              >
                {/* Cover Thumbnail */}
                {cover?.vaultWebpDataUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200">
                    <img
                      src={cover.vaultWebpDataUrl}
                      alt={dive.siteName}
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 text-white shrink-0">
                        #{dive.diveNumber}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-950 truncate">
                        {dive.siteName}
                      </h3>
                    </div>
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      {dive.date.slice(5)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{dive.subLocation}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-700 font-medium">
                    <span>{formatDepth(dive.maxDepthM, unitSystem)}</span>
                    <span className="text-zinc-300">•</span>
                    <span>{dive.bottomTimeMin} min</span>
                    <span className="text-zinc-300">•</span>
                    <span>{formatTemp(dive.waterTempC, unitSystem)}</span>
                    {totalCritters > 0 && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span className="text-zinc-500">{totalCritters} sightings</span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-700 shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
