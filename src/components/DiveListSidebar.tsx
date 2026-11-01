import React from 'react';
import { Search, MapPin, Calendar, Clock, Sparkles, X } from 'lucide-react';
import { DiveRecord, UnitSystem } from '../types/dive';
import { formatDepth } from '../utils/units';

interface DiveListSidebarProps {
  dives: DiveRecord[];
  selectedDiveId: string;
  onSelectDive: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unitSystem: UnitSystem;
}

export const DiveListSidebar: React.FC<DiveListSidebarProps> = ({
  dives,
  selectedDiveId,
  onSelectDive,
  searchQuery,
  onSearchChange,
  unitSystem,
}) => {
  return (
    <aside className="flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Search & Filter Header */}
      <div className="p-3 border-b border-zinc-200 bg-zinc-50/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="font-display text-[11px] font-bold uppercase tracking-wider text-zinc-800">
              Historical Dive Log
            </h2>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-200/80 text-zinc-800">
              #215–#222
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">
            Geko Dive Bali
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search site, #dive, buddy, or critter..."
            aria-label="Search historical dives"
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-zinc-200 focus:border-zinc-900 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Dive List */}
      <div className="divide-y divide-zinc-100 max-h-[580px] overflow-y-auto">
        {dives.length === 0 ? (
          <div className="p-6 text-center text-zinc-400 text-xs">
            No dives match "{searchQuery}". Try "Liberty", "222", or "Frogfish".
          </div>
        ) : (
          dives.map((dive) => {
            const isSelected = dive.id === selectedDiveId;
            const totalCritters = dive.critters.reduce((sum, c) => sum + c.count, 0);

            return (
              <button
                key={dive.id}
                type="button"
                onClick={() => onSelectDive(dive.id)}
                className={`w-full text-left p-3 transition-all flex items-start justify-between gap-2 relative ${
                  isSelected
                    ? 'bg-zinc-100/90 border-l-4 border-l-zinc-950'
                    : 'hover:bg-zinc-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isSelected
                          ? 'bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                      }`}
                    >
                      #{dive.diveNumber}
                    </span>
                    <h3 className="font-display text-xs font-bold text-zinc-900 truncate">
                      {dive.siteName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 mb-1.5">
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      {dive.subLocation}
                    </span>
                    <span className="inline-flex items-center gap-1 shrink-0 font-mono">
                      <Calendar className="w-2.5 h-2.5 text-zinc-400" />
                      {dive.date}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-700">
                      Max <strong className="text-zinc-950">{formatDepth(dive.maxDepthM, unitSystem)}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-700">
                      <Clock className="w-2.5 h-2.5 text-zinc-400" />
                      {dive.bottomTimeMin}m
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-medium text-zinc-700">
                      <Sparkles className="w-2.5 h-2.5 text-zinc-600" />
                      {totalCritters} critters
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
