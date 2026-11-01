import React, { useMemo, useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Calendar,
  MapPin,
  X,
  QrCode,
  Fish,
  ArrowLeftRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import {
  CritterFamilyMeta,
  CritterSpecies,
  DiveRecord,
  SpottedCritter,
  UnitSystem,
} from '../types/dive';
import { generateQrMatrix } from '../utils/diveCalculators';
import { formatTripDateRange } from '../utils/trips';
import { formatDepth } from '../utils/units';
import { CritterSilhouette } from './CritterSilhouette';

interface CritterDexViewProps {
  families: CritterFamilyMeta[];
  species: CritterSpecies[];
  dives: DiveRecord[];
  selectedDiveId: string;
  onSelectDiveId: (id: string) => void;
  onMergeCritterDelta: (
    diveId: string,
    incomingCritters: SpottedCritter[],
    buddyName: string
  ) => void;
  unitSystem: UnitSystem;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  expandedSpeciesId: string | null;
  onToggleExpandedSpecies: (speciesId: string) => void;
  onSelectDiveFromDex: (diveId: string) => void;
}

interface SightingDiveEntry {
  diveId: string;
  diveNumber: number;
  siteName: string;
  subLocation: string;
  date: string;
}

interface BuddyQrPacket {
  id: string;
  buddyName: string;
  rig: string;
  critters: SpottedCritter[];
}

const BUDDY_QR_PACKETS: BuddyQrPacket[] = [
  {
    id: 'pkt-elena',
    buddyName: 'Elena Rostova',
    rig: 'Olympus TG-6 + SMC-1 Supermacro',
    critters: [
      { speciesId: 'sp-flamboyant-cuttle', count: 1, highlight: true },
      { speciesId: 'sp-pygmy-seahorse', count: 1, highlight: true },
      { speciesId: 'sp-pikachu-nudi', count: 1, highlight: true },
    ],
  },
  {
    id: 'pkt-made',
    buddyName: 'Made Wirawan',
    rig: 'Guide Slate + Snoot Torch',
    critters: [
      { speciesId: 'sp-wonderpus', count: 1, highlight: true },
      { speciesId: 'sp-hairy-frogfish', count: 1, highlight: true },
      { speciesId: 'sp-ribbon-eel', count: 1 },
    ],
  },
  {
    id: 'pkt-marcus',
    buddyName: 'Marcus Vance',
    rig: 'Sony A7R V + Wide Dome',
    critters: [
      { speciesId: 'sp-napoleon-wrasse', count: 1, highlight: true },
      { speciesId: 'sp-hawksbill-turtle', count: 1, highlight: true },
      { speciesId: 'sp-broadclub-cuttle', count: 1 },
    ],
  },
];

export const CritterDexView: React.FC<CritterDexViewProps> = ({
  families,
  species,
  dives,
  selectedDiveId,
  onSelectDiveId,
  onMergeCritterDelta,
  unitSystem,
  searchQuery,
  onSearchChange,
  expandedSpeciesId,
  onToggleExpandedSpecies,
  onSelectDiveFromDex,
}) => {
  const [subTab, setSubTab] = useState<'dex' | 'qr'>('dex');
  const [selectedPacketId, setSelectedPacketId] = useState<string>(
    BUDDY_QR_PACKETS[0].id
  );
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [syncedBanner, setSyncedBanner] = useState<string | null>(null);

  // Each dive where a species is logged counts as 1 sighting (1 per dive)
  const sightingsBySpecies: Record<
    string,
    { diveEntries: SightingDiveEntry[] }
  > = {};

  for (const dive of dives) {
    const seenOnThisDive = new Set<string>();
    for (const c of dive.critters) {
      if (c.count <= 0 || seenOnThisDive.has(c.speciesId)) continue;
      seenOnThisDive.add(c.speciesId);

      if (!sightingsBySpecies[c.speciesId]) {
        sightingsBySpecies[c.speciesId] = { diveEntries: [] };
      }
      sightingsBySpecies[c.speciesId].diveEntries.push({
        diveId: dive.id,
        diveNumber: dive.diveNumber,
        siteName: dive.siteName,
        subLocation: dive.subLocation,
        date: dive.date,
      });
    }
  }

  // Only include species that have actually been logged on at least 1 dive
  const loggedSpecies = species.filter(
    (sp) => (sightingsBySpecies[sp.id]?.diveEntries.length || 0) > 0
  );

  const filteredSpecies = loggedSpecies
    .filter((sp) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const fam = families.find((f) => f.id === sp.familyId);
      return (
        sp.commonName.toLowerCase().includes(q) ||
        (fam && fam.name.toLowerCase().includes(q))
      );
    })
    .sort(
      (a, b) =>
        (sightingsBySpecies[b.id]?.diveEntries.length || 0) -
        (sightingsBySpecies[a.id]?.diveEntries.length || 0)
    );

  const activeDive = useMemo(
    () => dives.find((d) => d.id === selectedDiveId) || dives[0],
    [dives, selectedDiveId]
  );

  const qrPayloadString = useMemo(() => {
    if (!activeDive) return '{}';
    const compact = {
      v: 'DLPRO-1',
      n: activeDive.diveNumber,
      s: activeDive.siteName,
      d: activeDive.maxDepthM,
      t: activeDive.bottomTimeMin,
      c: activeDive.critters.map((c) => c.speciesId.replace('sp-', '')),
    };
    return JSON.stringify(compact);
  }, [activeDive]);

  const qrMatrix = useMemo(
    () => generateQrMatrix(qrPayloadString),
    [qrPayloadString]
  );

  const activeBuddyPacket =
    BUDDY_QR_PACKETS.find((p) => p.id === selectedPacketId) ||
    BUDDY_QR_PACKETS[0];

  const deltaDiff = useMemo(() => {
    if (!activeDive) return [];
    return activeBuddyPacket.critters.map((incoming) => {
      const alreadyOnDive = activeDive.critters.some(
        (c) => c.speciesId === incoming.speciesId
      );
      return {
        speciesId: incoming.speciesId,
        alreadySynced: alreadyOnDive,
      };
    });
  }, [activeDive, activeBuddyPacket]);

  const handleCopyPayload = () => {
    navigator.clipboard?.writeText(qrPayloadString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleSyncBuddyPacket = () => {
    if (!activeDive) return;
    onMergeCritterDelta(
      activeDive.id,
      activeBuddyPacket.critters,
      activeBuddyPacket.buddyName
    );
    setSyncedBanner(
      `Merged ${activeBuddyPacket.buddyName}’s sightings into Dive #${activeDive.diveNumber}!`
    );
    setTimeout(() => setSyncedBanner(null), 3500);
  };

  return (
    <div className="space-y-2.5 pb-4">
      {/* Sub-Navigation Switcher: Logged Marine Life vs Boat QR & Critter Sync */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-1 w-full bg-zinc-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('dex')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'dex'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Fish className="w-3.5 h-3.5" />
            <span>Logged Marine Life ({loggedSpecies.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('qr')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'qr'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Boat QR & Critter Sync</span>
          </button>
        </div>
      </div>

      {subTab === 'dex' ? (
        <>
          {/* Search Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search cuttlefish, mantis shrimp, frogfish, turtle..."
                className="w-full pl-8 pr-8 py-2 bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white rounded-xl text-xs text-zinc-900 placeholder-zinc-400 outline-none"
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

          {/* Logged Marine Life Cards — Clean Vector Icon + Name + ×Count Badge */}
          <div className="grid grid-cols-1 gap-2">
            {filteredSpecies.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center text-xs text-zinc-400">
                No logged marine life matches "{searchQuery}".
              </div>
            ) : (
              filteredSpecies.map((sp) => {
                const diveEntries = sightingsBySpecies[sp.id]?.diveEntries || [];
                const diveCount = diveEntries.length;
                const isExpanded = expandedSpeciesId === sp.id;

                return (
                  <div
                    key={sp.id}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    {/* Main Creature Row (Tap to expand/collapse logged dives) */}
                    <button
                      type="button"
                      onClick={() => onToggleExpandedSpecies(sp.id)}
                      className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-900 shrink-0">
                          <CritterSilhouette
                            familyId={sp.familyId}
                            className="w-7 h-7"
                          />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-950 truncate">
                          {sp.commonName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-bold">
                          ×{diveCount}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-zinc-400 transition-transform ${
                            isExpanded ? 'rotate-180 text-zinc-900' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded List of Dives Where This Creature Was Logged */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 bg-zinc-50/70 border-t border-zinc-100 space-y-1.5">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 px-1 pt-1">
                          Logged on {diveCount}{' '}
                          {diveCount === 1 ? 'Dive' : 'Dives'} — Tap to open dive log
                        </div>

                        {diveEntries.map((entry) => (
                          <button
                            key={entry.diveId}
                            type="button"
                            onClick={() => onSelectDiveFromDex(entry.diveId)}
                            className="w-full p-2.5 rounded-xl bg-white hover:bg-zinc-100/80 border border-zinc-200 flex items-center justify-between gap-2 text-left transition-all group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] font-bold shrink-0">
                                  #{entry.diveNumber}
                                </span>
                                <span className="text-xs font-bold text-zinc-950 truncate">
                                  {entry.siteName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                                <span className="inline-flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                                  {entry.subLocation}
                                </span>
                                <span className="text-zinc-300">•</span>
                                <span className="inline-flex items-center gap-1 shrink-0">
                                  <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                                  {formatTripDateRange(entry.date, entry.date)}
                                </span>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-800 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* BOAT QR & CRITTER SYNC SUB-TAB */
        <div className="space-y-3">
          {activeDive && (
            <>
              <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-950">
                      Boat QR — Dive #{activeDive.diveNumber}
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Share your spotted marine life offline on the boat
                    </p>
                  </div>

                  <select
                    value={activeDive.id}
                    onChange={(e) => onSelectDiveId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 outline-none"
                  >
                    {dives.map((d) => (
                      <option key={d.id} value={d.id}>
                        #{d.diveNumber} {d.siteName.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                  <div className="p-2.5 bg-white border border-zinc-200 rounded-xl shadow-sm shrink-0">
                    <svg
                      viewBox="0 0 21 21"
                      className="w-28 h-28 text-zinc-950"
                      shapeRendering="crispEdges"
                      aria-label={`Offline QR code for Dive #${activeDive.diveNumber}`}
                    >
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width={1}
                              height={1}
                              fill="currentColor"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    <div className="text-xs font-bold text-zinc-950">
                      {activeDive.siteName}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Max {formatDepth(activeDive.maxDepthM, unitSystem)} •{' '}
                      {activeDive.bottomTimeMin} min •{' '}
                      {activeDive.critters.length} species logged
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-zinc-200 text-[10px] text-zinc-600 break-all">
                      {qrPayloadString}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPayload}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-semibold"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied QR String</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy QR String</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-zinc-950" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                      Buddy Critter Sync
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Dive #{activeDive.diveNumber}
                  </span>
                </div>

                <p className="text-xs text-zinc-500">
                  Select a dive buddy’s QR packet to compare what they spotted and merge missing marine life into Dive #{activeDive.diveNumber}:
                </p>

                <div className="grid grid-cols-3 gap-1.5">
                  {BUDDY_QR_PACKETS.map((pkt) => {
                    const active = pkt.id === selectedPacketId;
                    return (
                      <button
                        key={pkt.id}
                        type="button"
                        onClick={() => setSelectedPacketId(pkt.id)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">
                          {pkt.buddyName.split(' ')[0]}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            active ? 'text-zinc-300' : 'text-zinc-400'
                          }`}
                        >
                          {pkt.critters.length} species
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="text-xs font-bold text-zinc-950">
                    {activeBuddyPacket.buddyName}’s Sightings
                  </div>

                  <div className="space-y-1.5">
                    {deltaDiff.map((diff) => {
                      const sp = species.find((s) => s.id === diff.speciesId);
                      if (!sp) return null;
                      return (
                        <div
                          key={diff.speciesId}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-zinc-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0">
                              <CritterSilhouette
                                familyId={sp.familyId}
                                className="w-5 h-5"
                              />
                            </div>
                            <span className="text-xs font-bold text-zinc-900 truncate">
                              {sp.commonName}
                            </span>
                          </div>

                          {diff.alreadySynced ? (
                            <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[10px] font-semibold shrink-0">
                              Already in Log
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-zinc-950 text-white text-[10px] font-bold shrink-0">
                              + New Sighting
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {syncedBanner && (
                    <div className="p-2 rounded-lg bg-zinc-900 text-white text-xs font-medium">
                      {syncedBanner}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSyncBuddyPacket}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>
                      Merge {activeBuddyPacket.buddyName.split(' ')[0]}’s Sightings into Dive #{activeDive.diveNumber}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
