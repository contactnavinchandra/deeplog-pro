import React, { useMemo, useState } from 'react';
import {
  QrCode,
  RefreshCw,
  Check,
  Plus,
  Wrench,
  Users,
  ArrowLeftRight,
  Copy,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CritterSpecies,
  DiveRecord,
  SpottedCritter,
  UnitSystem,
} from '../types/dive';
import { generateQrMatrix } from '../utils/diveCalculators';
import { formatDepth } from '../utils/units';
import { CritterSilhouette } from './CritterSilhouette';

interface GearAndCrewViewProps {
  dives: DiveRecord[];
  selectedDiveId: string;
  onSelectDiveId: (id: string) => void;
  allSpecies: CritterSpecies[];
  gearLocker: string[];
  onAddGearItem: (item: string) => void;
  onRemoveGearItem: (item: string) => void;
  buddyPool: string[];
  onAddBuddyToPool: (buddy: string) => void;
  onMergeCritterDelta: (diveId: string, incomingCritters: SpottedCritter[], buddyName: string) => void;
  unitSystem: UnitSystem;
}

interface BuddyQrPacket {
  id: string;
  buddyName: string;
  rig: string;
  description: string;
  critters: SpottedCritter[];
}

const BUDDY_QR_PACKETS: BuddyQrPacket[] = [
  {
    id: 'pkt-elena',
    buddyName: 'Elena Rostova',
    rig: 'Olympus TG-6 + SMC-1 Supermacro',
    description: 'Elena’s macro sightings from the 18m black sand slope & gorgonian fan.',
    critters: [
      { speciesId: 'sp-flamboyant-cuttle', count: 1, highlight: true },
      { speciesId: 'sp-pygmy-seahorse', count: 3, highlight: true },
      { speciesId: 'sp-pikachu-nudi', count: 2, highlight: true },
    ],
  },
  {
    id: 'pkt-made',
    buddyName: 'Made Wirawan',
    rig: 'Geko Spotter Slate +Snoot Torch',
    description: 'Made’s guide slate log from the cleaning station & rubble ridge.',
    critters: [
      { speciesId: 'sp-wonderpus', count: 1, highlight: true },
      { speciesId: 'sp-hairy-frogfish', count: 2, highlight: true },
      { speciesId: 'sp-ribbon-eel', count: 2 },
    ],
  },
  {
    id: 'pkt-marcus',
    buddyName: 'Marcus Vance',
    rig: 'Sony A7R V + Wide Fisheye Dome',
    description: 'Marcus’s pelagic & outer wall sightings during the drift.',
    critters: [
      { speciesId: 'sp-napoleon-wrasse', count: 2, highlight: true },
      { speciesId: 'sp-hawksbill-turtle', count: 3, highlight: true },
      { speciesId: 'sp-broadclub-cuttle', count: 2 },
    ],
  },
];

export const GearAndCrewView: React.FC<GearAndCrewViewProps> = ({
  dives,
  selectedDiveId,
  onSelectDiveId,
  allSpecies,
  gearLocker,
  onAddGearItem,
  onRemoveGearItem,
  buddyPool,
  onAddBuddyToPool,
  onMergeCritterDelta,
  unitSystem,
}) => {
  const [subTab, setSubTab] = useState<'qr' | 'gear'>('qr');
  const [selectedPacketId, setSelectedPacketId] = useState<string>(BUDDY_QR_PACKETS[0].id);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [newGearInput, setNewGearInput] = useState('');
  const [newBuddyInput, setNewBuddyInput] = useState('');
  const [syncedBanner, setSyncedBanner] = useState<string | null>(null);

  const activeDive = useMemo(
    () => dives.find((d) => d.id === selectedDiveId) || dives[0],
    [dives, selectedDiveId]
  );

  // Build compact offline QR JSON payload for the active dive
  const qrPayloadString = useMemo(() => {
    const compact = {
      v: 'DLPRO-1',
      n: activeDive.diveNumber,
      s: activeDive.siteName,
      d: activeDive.maxDepthM,
      t: activeDive.bottomTimeMin,
      c: activeDive.critters.map((c) => `${c.speciesId.replace('sp-', '')}:${c.count}`),
    };
    return JSON.stringify(compact);
  }, [activeDive]);

  const qrMatrix = useMemo(() => generateQrMatrix(qrPayloadString), [qrPayloadString]);

  const activeBuddyPacket =
    BUDDY_QR_PACKETS.find((p) => p.id === selectedPacketId) || BUDDY_QR_PACKETS[0];

  // Calculate 2-Way Delta between activeDive.critters and activeBuddyPacket.critters
  const deltaDiff = useMemo(() => {
    return activeBuddyPacket.critters.map((incoming) => {
      const existing = activeDive.critters.find(
        (c) => c.speciesId === incoming.speciesId
      );
      const existingCount = existing ? existing.count : 0;
      const newCount = Math.max(existingCount, incoming.count);
      const isNewSpecies = !existing;
      const addedCount = Math.max(0, newCount - existingCount);
      return {
        speciesId: incoming.speciesId,
        buddyCount: incoming.count,
        existingCount,
        addedCount,
        isNewSpecies,
        alreadySynced: existingCount >= incoming.count,
      };
    });
  }, [activeDive, activeBuddyPacket]);

  const handleCopyPayload = () => {
    navigator.clipboard?.writeText(qrPayloadString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleSyncBuddyPacket = () => {
    onMergeCritterDelta(
      activeDive.id,
      activeBuddyPacket.critters,
      activeBuddyPacket.buddyName
    );
    setSyncedBanner(
      `Merged ${activeBuddyPacket.buddyName}’s critter delta into Dive #${activeDive.diveNumber}!`
    );
    setTimeout(() => setSyncedBanner(null), 3500);
  };

  const handleAddGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearInput.trim()) return;
    onAddGearItem(newGearInput.trim());
    setNewGearInput('');
  };

  const handleAddBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuddyInput.trim()) return;
    onAddBuddyToPool(newBuddyInput.trim());
    setNewBuddyInput('');
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Sub-Navigation Switcher: Offline Boat QR Sync vs Gear Locker */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-1 w-full bg-zinc-100 p-1 rounded-xl">
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
          <button
            type="button"
            onClick={() => setSubTab('gear')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'gear'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Gear Locker ({gearLocker.length})</span>
          </button>
        </div>
      </div>

      {subTab === 'qr' ? (
        <>
          {/* 1. OFFLINE BOAT QR CODE GENERATOR FOR SELECTED DIVE */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono text-[9px] font-bold uppercase tracking-wider">
                  Zero-Internet P2P Boat Share
                </span>
                <h2 className="font-display text-sm font-bold text-zinc-950 mt-1">
                  Offline Boat QR — Dive #{activeDive.diveNumber}
                </h2>
              </div>

              <select
                value={activeDive.id}
                onChange={(e) => onSelectDiveId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-zinc-900 outline-none"
              >
                {dives.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.diveNumber} {d.siteName.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              {/* Crisp 21x21 SVG QR Matrix */}
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
                <div className="font-display text-xs font-bold text-zinc-950">
                  {activeDive.siteName}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Max {formatDepth(activeDive.maxDepthM, unitSystem)} •{' '}
                  {activeDive.bottomTimeMin}m •{' '}
                  {activeDive.critters.reduce((s, c) => s + c.count, 0)} critters
                </div>
                <div className="p-2 rounded-lg bg-white border border-zinc-200 font-mono text-[9px] text-zinc-600 break-all">
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
                      <span>Copied Delta Payload</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy QR Delta String</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 2. TWO-WAY CRITTER DELTA SYNC (SCAN BUDDY'S BOAT QR) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-zinc-950" />
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-950">
                  2-Way Critter Delta Sync (Buddy QR)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                Target: Dive #{activeDive.diveNumber}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500">
              Select a boat buddy’s QR packet to compare their spotted critters against your Dive #{activeDive.diveNumber} log and merge missing species in 1 tap:
            </p>

            {/* Buddy QR Selector Pills */}
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
                    <div className="font-display text-[11px] font-bold truncate">
                      {pkt.buddyName.split(' ')[0]}
                    </div>
                    <div
                      className={`text-[9px] font-mono truncate ${
                        active ? 'text-zinc-300' : 'text-zinc-400'
                      }`}
                    >
                      {pkt.critters.length} species QR
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Delta Comparison Card */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-950">
                    {activeBuddyPacket.buddyName}’s QR Payload
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {activeBuddyPacket.rig}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-mono font-semibold text-zinc-700">
                  Delta Diff
                </span>
              </div>

              <div className="space-y-1.5">
                {deltaDiff.map((diff) => {
                  const sp = allSpecies.find((s) => s.id === diff.speciesId);
                  if (!sp) return null;
                  return (
                    <div
                      key={diff.speciesId}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-zinc-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0">
                          <CritterSilhouette familyId={sp.familyId} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display text-xs font-bold text-zinc-900 truncate">
                            {sp.commonName}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            Your log: ×{diff.existingCount} → Buddy QR: ×{diff.buddyCount}
                          </div>
                        </div>
                      </div>

                      {diff.alreadySynced ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10px] font-semibold shrink-0">
                          In Sync
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-zinc-950 text-white font-mono text-[10px] font-bold shrink-0">
                          +{diff.addedCount} {diff.isNewSpecies ? 'NEW' : 'DELTA'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {syncedBanner && (
                <div className="p-2 rounded-lg bg-zinc-900 text-white text-[11px] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{syncedBanner}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSyncBuddyPacket}
                className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-display text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  Merge {activeBuddyPacket.buddyName.split(' ')[0]}’s Critter Delta into Dive #{activeDive.diveNumber}
                </span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* GEAR LOCKER & CREW ROSTER MANAGER */
        <div className="space-y-3">
          <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Personal Scuba Gear Locker
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                Synced with Logger Tick-Boxes
              </span>
            </div>

            <form onSubmit={handleAddGear} className="flex gap-1.5">
              <input
                type="text"
                value={newGearInput}
                onChange={(e) => setNewGearInput(e.target.value)}
                placeholder="Add regulator, computer, strobe, wetsuit..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs text-zinc-900 outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="divide-y divide-zinc-100">
              {gearLocker.map((item) => {
                const diveUseCount = dives.filter((d) =>
                  d.gearUsed.includes(item)
                ).length;
                return (
                  <div
                    key={item}
                    className="py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 font-mono">
                        {item}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Used on {diveUseCount} of {dives.length} Bali dives
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveGearItem(item)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                      title="Remove from Gear Locker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Liveaboard Dive Buddy Roster
            </h3>

            <form onSubmit={handleAddBuddy} className="flex gap-1.5">
              <input
                type="text"
                value={newBuddyInput}
                onChange={(e) => setNewBuddyInput(e.target.value)}
                placeholder="Add boat buddy name..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs text-zinc-900 outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Buddy</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {buddyPool.map((b) => (
                <span
                  key={b}
                  className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-800"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
