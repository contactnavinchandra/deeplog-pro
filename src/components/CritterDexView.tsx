import React, { useState } from 'react';
import { Search, Sparkles, Compass, CheckCircle2, Layers } from 'lucide-react';
import {
  CritterFamilyId,
  CritterFamilyMeta,
  CritterSpecies,
  DiveRecord,
} from '../types/dive';
import { CritterSilhouette } from './CritterSilhouette';

interface CritterDexViewProps {
  families: CritterFamilyMeta[];
  species: CritterSpecies[];
  dives: DiveRecord[];
  initialFamilyFilter?: string;
  onSelectDiveFromDex: (diveId: string) => void;
}

export const CritterDexView: React.FC<CritterDexViewProps> = ({
  families,
  species,
  dives,
  initialFamilyFilter = 'all',
  onSelectDiveFromDex,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>(initialFamilyFilter);
  const [searchQuery, setSearchQuery] = useState('');

  const sightingsBySpecies: Record<
    string,
    { totalCount: number; dives: { id: string; diveNumber: number; siteName: string }[] }
  > = {};

  for (const sp of species) {
    sightingsBySpecies[sp.id] = { totalCount: 0, dives: [] };
  }

  for (const dive of dives) {
    for (const c of dive.critters) {
      if (sightingsBySpecies[c.speciesId]) {
        sightingsBySpecies[c.speciesId].totalCount += c.count;
        sightingsBySpecies[c.speciesId].dives.push({
          id: dive.id,
          diveNumber: dive.diveNumber,
          siteName: dive.siteName,
        });
      }
    }
  }

  const filteredSpecies = species.filter((sp) => {
    const matchesFamily = selectedFamily === 'all' || sp.familyId === selectedFamily;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      sp.commonName.toLowerCase().includes(q) ||
      sp.scientificName.toLowerCase().includes(q) ||
      sp.habitat.toLowerCase().includes(q);
    return matchesFamily && matchesSearch;
  });

  // Unified monochrome rarity badges
  const rarityStyles: Record<CritterSpecies['rarity'], string> = {
    'Holy Grail': 'bg-zinc-950 text-white border-zinc-950',
    Rare: 'bg-zinc-200 text-zinc-900 border-zinc-300',
    Uncommon: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    Common: 'bg-zinc-50 text-zinc-500 border-zinc-200',
  };

  return (
    <div className="space-y-2.5">
      {/* Top Banner & Search */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
            Zero-Bloat Vector Field Guide
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {species.length} Bali Species
          </span>
        </div>
        <h2 className="font-display text-sm font-bold text-zinc-950">
          Taxonomic Critter Dex
        </h2>

        <div className="relative mt-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search frogfish, wonderpus, Latin name..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white rounded-xl text-xs text-zinc-900 placeholder-zinc-400 outline-none"
          />
        </div>

        {/* Horizontal Swipeable Family Filter Pills (Unified Monochrome) */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedFamily('all')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold shrink-0 border transition-all ${
              selectedFamily === 'all'
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-950'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>All ({species.length})</span>
          </button>

          {families.map((fam) => {
            const isSelected = selectedFamily === fam.id;
            const count = species.filter((s) => s.familyId === fam.id).length;
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => setSelectedFamily(fam.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold shrink-0 border transition-all ${
                  isSelected
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <CritterSilhouette familyId={fam.id as CritterFamilyId} className="w-4 h-4" />
                <span>{fam.name}</span>
                <span className="text-[9px] font-mono opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unified Monochrome Species Cards */}
      <div className="grid grid-cols-1 gap-2">
        {filteredSpecies.map((sp) => {
          const fam = families.find((f) => f.id === sp.familyId);
          const stats = sightingsBySpecies[sp.id] || { totalCount: 0, dives: [] };

          return (
            <div
              key={sp.id}
              className="bg-white border border-zinc-200 rounded-2xl p-3 flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-900 shrink-0">
                    <CritterSilhouette familyId={sp.familyId} className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                          rarityStyles[sp.rarity]
                        }`}
                      >
                        {sp.rarity}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {fam?.taxonomy}
                      </span>
                    </div>
                    <h3 className="font-display text-xs font-bold text-zinc-950 mt-0.5 truncate">
                      {sp.commonName}
                    </h3>
                    <p className="text-[10px] italic text-zinc-500 truncate">
                      {sp.scientificName}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200 text-[10px] font-mono font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-zinc-700" />
                  ×{stats.totalCount}
                </span>
              </div>

              <p className="text-[11px] text-zinc-600 leading-snug">
                {sp.description}
              </p>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] text-zinc-500 inline-flex items-center gap-1">
                  <Compass className="w-3 h-3 text-zinc-400" />
                  {sp.typicalDepthM} • {sp.habitat}
                </span>

                <div className="flex items-center flex-wrap gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-zinc-400" />
                  {stats.dives.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onSelectDiveFromDex(d.id)}
                      className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 border border-zinc-200 text-[9px] font-mono font-semibold transition-colors"
                    >
                      #{d.diveNumber}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
