import React, { useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Folder,
  FolderOpen,
  Calendar,
  Plus,
  Users,
  Check,
  ArrowUpDown,
  Wrench,
  X,
} from 'lucide-react';
import {
  DiveRecord,
  DiveTrip,
  GearCategory,
  UnitSystem,
  VaultPhoto,
} from '../types/dive';
import { formatDepth, formatTemp } from '../utils/units';
import { formatTripDateRange, formatTripTitle } from '../utils/trips';

interface DiveListSidebarProps {
  dives: DiveRecord[];
  trips: DiveTrip[];
  buddyPool: string[];
  gearCategories?: GearCategory[];
  careerTotalDives?: number;
  selectedDiveId: string;
  onSelectDive: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unitSystem: UnitSystem;
  vaultPhotos?: Record<string, VaultPhoto>;
  onCreateTrip?: (
    destination: string,
    startDate: string,
    endDate: string,
    buddies: string[],
    gearBrought: string[]
  ) => DiveTrip;
  onUpdateTripBuddies?: (tripId: string, buddies: string[]) => void;
  onUpdateTripGear?: (tripId: string, gearBrought: string[]) => void;
  openedTripId?: string | null;
  onOpenTrip?: (tripId: string | null) => void;
}

type ChronologicalEntry =
  | {
      kind: 'trip';
      trip: DiveTrip;
      tripDives: DiveRecord[];
      sortDate: string;
      sortDiveNum: number;
    }
  | {
      kind: 'single-dive';
      dive: DiveRecord;
      sortDate: string;
      sortDiveNum: number;
    };

export const DiveListSidebar: React.FC<DiveListSidebarProps> = ({
  dives,
  trips,
  buddyPool,
  gearCategories = [],
  careerTotalDives,
  onSelectDive,
  searchQuery,
  onSearchChange,
  unitSystem,
  vaultPhotos = {},
  onCreateTrip,
  onUpdateTripBuddies,
  onUpdateTripGear,
  openedTripId: controlledOpenedTripId,
  onOpenTrip,
}) => {
  const [internalOpenedTripId, setInternalOpenedTripId] = useState<string | null>(null);
  const openedTripId =
    controlledOpenedTripId !== undefined
      ? controlledOpenedTripId
      : internalOpenedTripId;
  const setOpenedTripId = (next: string | null) => {
    if (onOpenTrip) {
      onOpenTrip(next);
    } else {
      setInternalOpenedTripId(next);
    }
  };
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [newTripDest, setNewTripDest] = useState('');
  const [newTripStart, setNewTripStart] = useState('2026-11-10');
  const [newTripEnd, setNewTripEnd] = useState('2026-11-20');
  const [newTripBuddies, setNewTripBuddies] = useState<string[]>([]);
  const [newTripGear, setNewTripGear] = useState<string[]>([]);
  const [customTripBuddyInput, setCustomTripBuddyInput] = useState('');
  const [openedTripBuddyInput, setOpenedTripBuddyInput] = useState('');
  const [isEditingOpenedTripGear, setIsEditingOpenedTripGear] = useState(false);

  const latestDiveNum =
    careerTotalDives !== undefined
      ? careerTotalDives
      : dives.reduce((max, d) => Math.max(max, d.diveNumber), 0);
  const totalMinutes = dives.reduce((sum, d) => sum + d.bottomTimeMin, 0);
  const maxDepth = dives.reduce((max, d) => Math.max(max, d.maxDepthM), 0);

  const openedTrip = trips.find((t) => t.id === openedTripId) || null;
  const isSearching = searchQuery.trim().length > 0;

  // Build unified chronological feed where Trip Folders and Single Dives sit in exact running order
  const chronologicalFeed = useMemo<ChronologicalEntry[]>(() => {
    const items: ChronologicalEntry[] = [];

    for (const trip of trips) {
      const tripDives = dives.filter((d) => d.tripId === trip.id);
      const maxNum = tripDives.length
        ? Math.max(...tripDives.map((d) => d.diveNumber))
        : -1;
      const latestDiveDate = tripDives[0]?.date || trip.endDate;

      items.push({
        kind: 'trip',
        trip,
        tripDives,
        sortDate: latestDiveDate,
        sortDiveNum: maxNum,
      });
    }

    for (const dive of dives) {
      const belongsToValidTrip =
        dive.tripId && trips.some((t) => t.id === dive.tripId);
      if (!belongsToValidTrip) {
        items.push({
          kind: 'single-dive',
          dive,
          sortDate: dive.date,
          sortDiveNum: dive.diveNumber,
        });
      }
    }

    const sorted = items.sort((a, b) => {
      // If both have dive numbers, sort strictly by running dive number descending
      if (a.sortDiveNum > 0 && b.sortDiveNum > 0) {
        return b.sortDiveNum - a.sortDiveNum;
      }
      // Otherwise compare by date descending, then dive number
      if (a.sortDate !== b.sortDate) {
        return b.sortDate.localeCompare(a.sortDate);
      }
      return b.sortDiveNum - a.sortDiveNum;
    });

    return sortOrder === 'oldest' ? [...sorted].reverse() : sorted;
  }, [dives, trips, sortOrder]);

  const handleToggleNewTripBuddy = (buddy: string) => {
    setNewTripBuddies((prev) =>
      prev.includes(buddy) ? prev.filter((b) => b !== buddy) : [...prev, buddy]
    );
  };

  const handleAddCustomNewTripBuddy = () => {
    const trimmed = customTripBuddyInput.trim();
    if (!trimmed) return;
    if (!newTripBuddies.includes(trimmed)) {
      setNewTripBuddies((prev) => [...prev, trimmed]);
    }
    setCustomTripBuddyInput('');
  };

  const handleToggleNewTripGear = (item: string) => {
    setNewTripGear((prev) =>
      prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item]
    );
  };

  const handleSaveNewTrip = () => {
    const cleanDest = newTripDest.trim();
    if (!cleanDest || !onCreateTrip) return;
    const start = newTripStart <= newTripEnd ? newTripStart : newTripEnd;
    const end = newTripEnd >= newTripStart ? newTripEnd : newTripStart;
    const created = onCreateTrip(
      cleanDest,
      start,
      end,
      newTripBuddies,
      newTripGear
    );
    setNewTripDest('');
    setNewTripBuddies([]);
    setNewTripGear([]);
    setIsCreatingTrip(false);
    setOpenedTripId(created.id);
  };

  const handleToggleOpenedTripGear = (item: string) => {
    if (!openedTrip || !onUpdateTripGear) return;
    const current = openedTrip.gearBrought || [];
    const next = current.includes(item)
      ? current.filter((g) => g !== item)
      : [...current, item];
    onUpdateTripGear(openedTrip.id, next);
  };

  const handleAddBuddyToOpenedTrip = () => {
    const trimmed = openedTripBuddyInput.trim();
    if (!trimmed || !openedTrip || !onUpdateTripBuddies) return;
    const current = openedTrip.buddies || [];
    if (!current.includes(trimmed)) {
      onUpdateTripBuddies(openedTrip.id, [...current, trimmed]);
    }
    setOpenedTripBuddyInput('');
  };

  const handleRemoveBuddyFromOpenedTrip = (buddy: string) => {
    if (!openedTrip || !onUpdateTripBuddies) return;
    const current = openedTrip.buddies || [];
    onUpdateTripBuddies(
      openedTrip.id,
      current.filter((b) => b !== buddy)
    );
  };

  const renderDiveCard = (dive: DiveRecord, isSingleDive = false) => {
    const cover = vaultPhotos[dive.coverPhotoId];
    const totalCritters = dive.critters.length;
    const assignedTrip = trips.find((t) => t.id === dive.tripId);

    // In the main overview, keep Single Dive cards aligned in a clean 2x2 grid (Left: Title + Date | Right: #Number + Single Dive)
    if (isSingleDive && !isSearching) {
      return (
        <button
          key={dive.id}
          type="button"
          onClick={() => onSelectDive(dive.id)}
          className="w-full text-left bg-white hover:bg-zinc-50/90 border border-zinc-200 rounded-2xl p-3 transition-all flex items-center gap-3 shadow-sm group"
        >
          {cover?.vaultWebpDataUrl && (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200">
              <img
                src={cover.vaultWebpDataUrl}
                alt={dive.siteName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
            {/* Left Side: Title on top, Date below */}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-950 truncate">
                {dive.subLocation
                  ? `${dive.subLocation}, ${dive.siteName}`
                  : dive.siteName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{formatTripDateRange(dive.date, dive.date)}</span>
              </div>
            </div>

            {/* Right Side: Dive Number on top right, Single Dive below */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 text-white">
                #{dive.diveNumber}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-[11px] font-bold text-zinc-700">
                Single Dive
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-800 shrink-0" />
        </button>
      );
    }

    return (
      <button
        key={dive.id}
        type="button"
        onClick={() => onSelectDive(dive.id)}
        className="w-full text-left bg-white hover:bg-zinc-50/80 border border-zinc-200 rounded-2xl p-3 transition-all flex items-center gap-3 shadow-sm group"
      >
        {/* Full-Colour Cover Thumbnail */}
        {cover?.vaultWebpDataUrl && (
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200">
            <img
              src={cover.vaultWebpDataUrl}
              alt={dive.siteName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-bold text-zinc-950 truncate">
                {dive.siteName}
              </h3>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 text-white shrink-0">
                #{dive.diveNumber}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 shrink-0">
              {formatTripDateRange(dive.date, dive.date)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="truncate">{dive.subLocation}</span>
            {isSearching && assignedTrip && (
              <span className="px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-700 shrink-0">
                {formatTripTitle(assignedTrip)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-700 font-medium">
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
  };

  const allSelectableNewTripBuddies = Array.from(
    new Set([...buddyPool, ...newTripBuddies])
  );

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
          <div className="text-[11px] text-zinc-500">{trips.length} trips</div>
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
            Deepest Dive
          </div>
          <div className="text-lg font-bold text-zinc-950 mt-0.5">
            {formatDepth(maxDepth, unitSystem)}
          </div>
          <div className="text-[11px] text-zinc-500">Logged max</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search trips, dive site, location, or marine life..."
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

      {/* Mode 1: Active Search Results */}
      {isSearching ? (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 px-1">
            Search Results ({dives.length})
          </div>
          {dives.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 text-xs">
              No dives match "{searchQuery}".
            </div>
          ) : (
            dives.map((dive) => renderDiveCard(dive, !dive.tripId))
          )}
        </div>
      ) : openedTrip ? (
        /* Mode 2: Inside a Specific Trip Folder (e.g. Bali 2026 -> #222, #221, #220...) */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpenedTripId(null)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-500" />
              <span>All Dives & Trips</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>

          <div className="bg-zinc-950 text-white rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold truncate">
                    {formatTripTitle(openedTrip)}
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {formatTripDateRange(openedTrip.startDate, openedTrip.endDate)}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold shrink-0">
                {dives.filter((d) => d.tripId === openedTrip.id).length} Dives
              </span>
            </div>

            {/* Trip Buddies Bar inside the Trip Folder */}
            <div className="pt-2.5 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-300 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  Trip Buddies ({(openedTrip.buddies || []).length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(openedTrip.buddies || []).map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-100 text-[11px] font-medium"
                  >
                    <span>{b}</span>
                    {onUpdateTripBuddies && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBuddyFromOpenedTrip(b)}
                        className="text-zinc-400 hover:text-white ml-0.5"
                        aria-label={`Remove ${b} from trip`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}

                {onUpdateTripBuddies && (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={openedTripBuddyInput}
                      onChange={(e) => setOpenedTripBuddyInput(e.target.value)}
                      placeholder="+ Add buddy to trip"
                      className="w-32 px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] text-white placeholder-zinc-500 outline-none"
                    />
                    {openedTripBuddyInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddBuddyToOpenedTrip}
                        className="px-2 py-0.5 rounded-lg bg-white text-zinc-950 text-[11px] font-bold"
                      >
                        Add
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Trip Gear Bar inside the Trip Folder */}
            <div className="pt-2.5 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-300 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                  Trip Gear ({(openedTrip.gearBrought || []).length})
                </span>
                {onUpdateTripGear && gearCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsEditingOpenedTripGear((prev) => !prev)}
                    className="text-[11px] font-semibold text-zinc-300 hover:text-white underline underline-offset-2"
                  >
                    {isEditingOpenedTripGear ? 'Done' : 'Edit Trip Gear'}
                  </button>
                )}
              </div>

              {!isEditingOpenedTripGear ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {(openedTrip.gearBrought || []).length === 0 ? (
                    <span className="text-[11px] text-zinc-500">
                      No specific gear selected for this trip yet.
                    </span>
                  ) : (
                    (openedTrip.gearBrought || []).map((g) => (
                      <span
                        key={g}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 text-[11px] font-medium"
                      >
                        <span>{g}</span>
                        {onUpdateTripGear && (
                          <button
                            type="button"
                            onClick={() => handleToggleOpenedTripGear(g)}
                            className="text-zinc-400 hover:text-white ml-0.5"
                            aria-label={`Remove ${g} from trip`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {gearCategories.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                        {cat.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.items.map((item) => {
                          const packed = (openedTrip.gearBrought || []).includes(
                            item
                          );
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleToggleOpenedTripGear(item)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                                packed
                                  ? 'bg-white text-zinc-950 border-white font-bold'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              {packed && <Check className="w-3 h-3" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {dives.filter((d) => d.tripId === openedTrip.id).length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center text-zinc-500 text-xs">
                No dives logged inside {formatTripTitle(openedTrip)} yet. Any dive logged between{' '}
                <span className="font-semibold text-zinc-800">
                  {formatTripDateRange(openedTrip.startDate, openedTrip.endDate)}
                </span>{' '}
                will automatically be placed here.
              </div>
            ) : (
              (sortOrder === 'oldest'
                ? [...dives.filter((d) => d.tripId === openedTrip.id)].reverse()
                : dives.filter((d) => d.tripId === openedTrip.id)
              ).map((dive) => renderDiveCard(dive, false))
            )}
          </div>
        </div>
      ) : (
        /* Mode 3: Single Unified Chronological Logbook (Trips & Single Dives in Running Order) */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">
                Logbook ({dives.length} Dives)
              </span>
              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === 'newest' ? 'oldest' : 'newest'
                  )
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-zinc-200 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
              >
                <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                <span>
                  {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </span>
              </button>
            </div>
            {onCreateTrip && (
              <button
                type="button"
                onClick={() => setIsCreatingTrip((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-600"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingTrip ? 'Cancel' : 'Create a Trip'}</span>
              </button>
            )}
          </div>

          {isCreatingTrip && (
            <div className="bg-white border border-zinc-300 rounded-2xl p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-950">
                  New Trip Folder
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingTrip(false)}
                  className="text-zinc-400 hover:text-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                  Destination (e.g. Bali, Raja Ampat, Phuket, Cairns)
                </label>
                <input
                  type="text"
                  value={newTripDest}
                  onChange={(e) => setNewTripDest(e.target.value)}
                  placeholder="e.g. Bali"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-950 font-semibold outline-none focus:border-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newTripStart}
                    onChange={(e) => setNewTripStart(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-950 font-medium outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newTripEnd}
                    onChange={(e) => setNewTripEnd(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-950 font-medium outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              {/* Add Dive Buddies Directly Into the Trip */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                  Trip Dive Buddies
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allSelectableNewTripBuddies.map((b) => {
                    const selected = newTripBuddies.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleToggleNewTripBuddy(b)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                        <span>{b}</span>
                      </button>
                    );
                  })}

                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={customTripBuddyInput}
                      onChange={(e) => setCustomTripBuddyInput(e.target.value)}
                      placeholder="+ New buddy"
                      className="w-28 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 outline-none"
                    />
                    {customTripBuddyInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddCustomNewTripBuddy}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-bold"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Select Trip Gear (Grouped by Custom Gear Locker Categories) */}
              {gearCategories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                      Trip Gear: {newTripGear.length} Selected
                    </label>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Only selected gear will show when logging dives on this trip
                    </p>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {gearCategories
                      .filter((c) => c.items.length > 0)
                      .map((cat) => (
                        <div key={cat.id} className="space-y-1">
                          <div className="text-[10px] font-bold text-zinc-600">
                            {cat.name}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.items.map((item) => {
                              const selected = newTripGear.includes(item);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => handleToggleNewTripGear(item)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                                    selected
                                      ? 'bg-zinc-950 text-white border-zinc-950'
                                      : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                                  }`}
                                >
                                  {selected && <Check className="w-3 h-3" />}
                                  <span>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveNewTrip}
                disabled={!newTripDest.trim()}
                className="w-full py-2 rounded-xl bg-zinc-950 disabled:bg-zinc-300 text-white text-xs font-bold transition-all"
              >
                Save Trip Folder
              </button>
            </div>
          )}

          {/* Unified Running Sequence of Trip Folders and Single Dives */}
          <div className="space-y-2">
            {chronologicalFeed.map((entry) => {
              if (entry.kind === 'single-dive') {
                return renderDiveCard(entry.dive, true);
              }

              const { trip, tripDives } = entry;
              const tripDiveNums = tripDives.map((d) => d.diveNumber);
              const minNum = tripDiveNums.length ? Math.min(...tripDiveNums) : null;
              const maxNum = tripDiveNums.length ? Math.max(...tripDiveNums) : null;
              const latestTripDive = tripDives[0];
              const cover = latestTripDive
                ? vaultPhotos[latestTripDive.coverPhotoId]
                : undefined;

              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => setOpenedTripId(trip.id)}
                  className="w-full text-left bg-white hover:bg-zinc-50/90 border border-zinc-200 rounded-2xl p-3 transition-all flex items-center gap-3 shadow-sm group"
                >
                  {cover?.vaultWebpDataUrl ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200 relative">
                      <img
                        src={cover.vaultWebpDataUrl}
                        alt={trip.destination}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-zinc-950/90 text-white flex items-center justify-center"
                        title="Trip Folder"
                      >
                        <Folder className="w-3 h-3" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-zinc-700">
                      <Folder className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                    {/* Left Side: Trip Title on top, Dates below */}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-zinc-950 truncate">
                        {formatTripTitle(trip)}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{formatTripDateRange(trip.startDate, trip.endDate)}</span>
                      </div>
                    </div>

                    {/* Right Side: Dive Numbers pushed to top right, Number of Dives below it */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {minNum !== null && maxNum !== null && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 text-white">
                          {minNum === maxNum
                            ? `#${maxNum}`
                            : `#${minNum} - ${maxNum}`}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-[11px] font-bold text-zinc-900">
                        {tripDives.length} {tripDives.length === 1 ? 'Dive' : 'Dives'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-800 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
