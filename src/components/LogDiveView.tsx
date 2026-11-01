import React, { useRef, useState } from 'react';
import {
  CheckSquare,
  Square,
  Upload,
  Check,
  FolderPlus,
  Folder,
  Users,
  Wrench,
  Droplets,
  Gauge,
  X,
} from 'lucide-react';
import {
  CritterFamilyId,
  CritterFamilyMeta,
  CritterSpecies,
  DiveRecord,
  DiveTrip,
  GearCategory,
  SpottedCritter,
  UnitSystem,
} from '../types/dive';
import { scanNotesForCritters } from '../utils/diveCalculators';
import {
  findMatchingTripForDate,
  formatTripDateRange,
  formatTripTitle,
} from '../utils/trips';
import { formatDepth, formatPressure, formatTemp } from '../utils/units';
import { CritterSilhouette } from './CritterSilhouette';

interface LogDiveViewProps {
  latestDive: DiveRecord;
  nextDiveNumber?: number;
  trips: DiveTrip[];
  onCreateTrip: (
    destination: string,
    startDate: string,
    endDate: string,
    buddies: string[],
    gearBrought: string[]
  ) => DiveTrip;
  onUpdateTripBuddies?: (tripId: string, buddies: string[]) => void;
  allSpecies: CritterSpecies[];
  families?: CritterFamilyMeta[];
  onCreateSpecies?: (commonName: string, familyId: CritterFamilyId) => CritterSpecies;
  gearCategories: GearCategory[];
  buddyPool: string[];
  onAddBuddyToPool?: (buddy: string) => void;
  onRemoveBuddyFromPool?: (buddy: string) => void;
  unitSystem: UnitSystem;
  onSaveNewDive: (
    newDive: Omit<DiveRecord, 'id' | 'coverPhotoId' | 'photoIds'>,
    uploadedFile?: File | null
  ) => Promise<void>;
}

export const LogDiveView: React.FC<LogDiveViewProps> = ({
  latestDive,
  nextDiveNumber: explicitNextDiveNumber,
  trips,
  onCreateTrip,
  onUpdateTripBuddies,
  allSpecies,
  families = [],
  onCreateSpecies,
  gearCategories,
  buddyPool,
  onAddBuddyToPool,
  onRemoveBuddyFromPool,
  unitSystem,
  onSaveNewDive,
}) => {
  const nextDiveNumber = explicitNextDiveNumber ?? latestDive.diveNumber + 1;

  // Date & Time
  const [date, setDate] = useState('2026-10-30');
  const [timeIn, setTimeIn] = useState('09:30');

  // Trip selection: auto-match if initial date falls inside an existing trip, otherwise '' (Single Dive)
  const initialMatchedTrip = findMatchingTripForDate('2026-10-30', trips);
  const [selectedTripId, setSelectedTripId] = useState<string>(
    initialMatchedTrip ? initialMatchedTrip.id : ''
  );
  const [wasAutoMatched, setWasAutoMatched] = useState<boolean>(
    Boolean(initialMatchedTrip)
  );

  // Inline "Create a Trip" modal/drawer state
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [newTripDestination, setNewTripDestination] = useState('Bali');
  const [newTripStart, setNewTripStart] = useState('2026-11-10');
  const [newTripEnd, setNewTripEnd] = useState('2026-11-20');
  const [newTripBuddies, setNewTripBuddies] = useState<string[]>(
    latestDive.buddies
  );
  const [newTripGear, setNewTripGear] = useState<string[]>(
    latestDive.gearUsed
  );
  const [newTripCustomBuddy, setNewTripCustomBuddy] = useState('');
  const [showFullLockerOnTrip, setShowFullLockerOnTrip] = useState(false);

  // Dive Site & Location
  const [siteName, setSiteName] = useState('');
  const [subLocation, setSubLocation] = useState(
    initialMatchedTrip ? initialMatchedTrip.destination : ''
  );

  // Compact Entry Type & Day/Night toggles
  const [diveType, setDiveType] = useState<'Boat' | 'Shore'>(
    latestDive.diveType || 'Boat'
  );
  const [dayNight, setDayNight] = useState<'Day' | 'Night'>(
    latestDive.dayNight || 'Day'
  );

  // Depth, Time & Safety Stops (string-backed for effortless typing without spin arrows)
  const [maxDepthInput, setMaxDepthInput] = useState('22');
  const [avgDepthInput, setAvgDepthInput] = useState('15');
  const [bottomTimeInput, setBottomTimeInput] = useState('55');

  // Decompression / Safety Stop tick-box + 1..5 counter (defaults to 1 when ticked)
  const [hasSafetyStop, setHasSafetyStop] = useState(true);
  const [safetyStopsCount, setSafetyStopsCount] = useState<number>(1);

  // Water Conditions: Salt vs Fresh, Current, Water Temp, Visibility
  const [waterType, setWaterType] = useState<'Salt' | 'Fresh'>(
    latestDive.waterType || 'Salt'
  );
  const [current, setCurrent] = useState<DiveRecord['current']>('Mild');
  const [waterTempInput, setWaterTempInput] = useState('26');
  const [visibilityInput, setVisibilityInput] = useState('20');

  // Breathing Gas ('Air' vs 'Nitrox' with accurate decimal text input + 32% / 36% shortcuts)
  const [gasType, setGasType] = useState<'Air' | 'Nitrox'>(
    latestDive.o2Percent > 21 ? 'Nitrox' : 'Air'
  );
  const [nitroxO2Input, setNitroxO2Input] = useState<string>(
    latestDive.o2Percent > 21 ? String(latestDive.o2Percent) : '32'
  );

  const [startPressureInput, setStartPressureInput] = useState('200');
  const [endPressureInput, setEndPressureInput] = useState('55');
  const [tankVolumeL] = useState(12);

  // Buddies & Gear
  const [sameBuddiesAsLast, setSameBuddiesAsLast] = useState(true);
  const [selectedBuddies, setSelectedBuddies] = useState<string[]>(
    initialMatchedTrip && initialMatchedTrip.buddies.length > 0
      ? initialMatchedTrip.buddies
      : latestDive.buddies
  );
  const [diveGuide] = useState(latestDive.diveGuide);
  const [customBuddyInput, setCustomBuddyInput] = useState('');

  const [sameGearAsLast, setSameGearAsLast] = useState(true);
  const [selectedGear, setSelectedGear] = useState<string[]>(
    initialMatchedTrip &&
      initialMatchedTrip.gearBrought &&
      initialMatchedTrip.gearBrought.length > 0
      ? initialMatchedTrip.gearBrought
      : latestDive.gearUsed
  );

  // Notes & Marine Life
  const [notes, setNotes] = useState('');
  const [spottedCritters, setSpottedCritters] = useState<SpottedCritter[]>([]);
  const [manualSpeciesId, setManualSpeciesId] = useState(
    allSpecies[0]?.id || ''
  );
  const [customCritterName, setCustomCritterName] = useState('');
  const [customCritterFamily, setCustomCritterFamily] =
    useState<CritterFamilyId>('cuttlefish');

  // Optional Uploaded Cover Photo
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeTrip = trips.find((t) => t.id === selectedTripId);

  // Parsed numeric values for display & submission
  const maxDepthM = Math.max(0, parseFloat(maxDepthInput) || 0);
  const avgDepthM = Math.max(0, parseFloat(avgDepthInput) || 0);
  const bottomTimeMin = Math.max(1, Math.round(parseFloat(bottomTimeInput) || 0));
  const waterTempC = parseFloat(waterTempInput) || 26;
  const visibilityM = Math.max(0, parseFloat(visibilityInput) || 0);
  const startPressureBar = Math.max(0, Math.round(parseFloat(startPressureInput) || 0));
  const endPressureBar = Math.max(0, Math.round(parseFloat(endPressureInput) || 0));
  const parsedNitroxO2 = Math.min(
    100,
    Math.max(21, Math.round((parseFloat(nitroxO2Input) || 32) * 10) / 10)
  );

  // When the user changes the Dive Date, automatically check if it falls in a Trip date range
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const matchedTrip = findMatchingTripForDate(newDate, trips);
    if (matchedTrip) {
      setSelectedTripId(matchedTrip.id);
      setWasAutoMatched(true);
      if (!subLocation.trim()) {
        setSubLocation(matchedTrip.destination);
      }
      if (matchedTrip.buddies && matchedTrip.buddies.length > 0) {
        setSelectedBuddies(matchedTrip.buddies);
      }
      if (matchedTrip.gearBrought && matchedTrip.gearBrought.length > 0) {
        setSelectedGear(matchedTrip.gearBrought);
      }
    } else {
      setSelectedTripId('');
      setWasAutoMatched(false);
    }
  };

  const handleToggleNewTripBuddy = (buddy: string) => {
    setNewTripBuddies((prev) =>
      prev.includes(buddy) ? prev.filter((b) => b !== buddy) : [...prev, buddy]
    );
  };

  const handleAddNewTripCustomBuddy = () => {
    const trimmed = newTripCustomBuddy.trim();
    if (!trimmed) return;
    if (!newTripBuddies.includes(trimmed)) {
      setNewTripBuddies((prev) => [...prev, trimmed]);
    }
    if (onAddBuddyToPool) {
      onAddBuddyToPool(trimmed);
    }
    setNewTripCustomBuddy('');
  };

  const handleToggleNewTripGear = (item: string) => {
    setNewTripGear((prev) =>
      prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item]
    );
  };

  const handleConfirmCreateTrip = () => {
    const dest = newTripDestination.trim();
    if (!dest || !newTripStart || !newTripEnd) return;
    const created = onCreateTrip(
      dest,
      newTripStart,
      newTripEnd,
      newTripBuddies,
      newTripGear
    );
    setSelectedTripId(created.id);
    setWasAutoMatched(true);
    setSubLocation(created.destination);
    if (newTripBuddies.length > 0) {
      setSelectedBuddies(newTripBuddies);
    }
    if (newTripGear.length > 0) {
      setSelectedGear(newTripGear);
    }
    if (date < newTripStart || date > newTripEnd) {
      setDate(newTripStart);
    }
    setIsCreatingTrip(false);
  };

  const handleToggleSafetyStop = () => {
    setHasSafetyStop((prev) => {
      const next = !prev;
      if (next && safetyStopsCount < 1) {
        setSafetyStopsCount(1);
      }
      return next;
    });
  };

  const handleToggleSameBuddies = () => {
    const next = !sameBuddiesAsLast;
    setSameBuddiesAsLast(next);
    if (next) {
      setSelectedBuddies(latestDive.buddies);
    }
  };

  const handleToggleBuddy = (buddy: string) => {
    setSameBuddiesAsLast(false);
    setSelectedBuddies((prev) =>
      prev.includes(buddy) ? prev.filter((b) => b !== buddy) : [...prev, buddy]
    );
  };

  const handleDeleteBuddy = (buddy: string) => {
    setSelectedBuddies((prev) => prev.filter((b) => b !== buddy));
    if (activeTrip && onUpdateTripBuddies && activeTrip.buddies.includes(buddy)) {
      onUpdateTripBuddies(
        activeTrip.id,
        activeTrip.buddies.filter((b) => b !== buddy)
      );
    }
    if (onRemoveBuddyFromPool) {
      onRemoveBuddyFromPool(buddy);
    }
  };

  const handleAddCustomBuddy = () => {
    const trimmed = customBuddyInput.trim();
    if (!trimmed) return;
    if (!selectedBuddies.includes(trimmed)) {
      setSelectedBuddies((prev) => [...prev, trimmed]);
    }
    if (onAddBuddyToPool) {
      onAddBuddyToPool(trimmed);
    }
    if (activeTrip && onUpdateTripBuddies && !activeTrip.buddies.includes(trimmed)) {
      onUpdateTripBuddies(activeTrip.id, [...activeTrip.buddies, trimmed]);
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
    const scanned = scanNotesForCritters(text, allSpecies);
    if (scanned.length > 0) {
      setSpottedCritters(scanned);
    }
  };

  const handleRemoveCritter = (speciesId: string) => {
    setSpottedCritters((prev) =>
      prev.filter((c) => c.speciesId !== speciesId)
    );
  };

  const handleAddManualCritter = () => {
    if (!manualSpeciesId) return;
    setSpottedCritters((prev) => {
      if (prev.some((c) => c.speciesId === manualSpeciesId)) {
        return prev;
      }
      return [...prev, { speciesId: manualSpeciesId, count: 1, highlight: true }];
    });
  };

  const handleAddCustomCritter = () => {
    const cleanName = customCritterName.trim();
    if (!cleanName || !onCreateSpecies) return;
    const created = onCreateSpecies(cleanName, customCritterFamily);
    setSpottedCritters((prev) => {
      if (prev.some((c) => c.speciesId === created.id)) {
        return prev;
      }
      return [...prev, { speciesId: created.id, count: 1, highlight: true }];
    });
    setCustomCritterName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const effectiveO2 = gasType === 'Air' ? 21 : parsedNitroxO2;
      const gasMixLabel =
        gasType === 'Air' ? 'Air' : `Nitrox ${parsedNitroxO2}%`;
      const effectiveLocation =
        subLocation.trim() || (activeTrip ? activeTrip.destination : 'Single Dive');
      const effectiveSafetyStops = hasSafetyStop ? safetyStopsCount : 0;

      await onSaveNewDive(
        {
          diveNumber: nextDiveNumber,
          tripId: selectedTripId || undefined,
          siteName: siteName.trim() || `Dive #${nextDiveNumber}`,
          subLocation: effectiveLocation,
          operator: activeTrip ? activeTrip.destination : 'Single Dive',
          date,
          timeIn,
          maxDepthM,
          avgDepthM,
          bottomTimeMin,
          safetyStopMin: effectiveSafetyStops * 3,
          safetyStopsCount: effectiveSafetyStops,
          startPressureBar,
          endPressureBar,
          tankVolumeL,
          gasMix: gasMixLabel,
          o2Percent: effectiveO2,
          waterTempC,
          visibilityM,
          diveType,
          dayNight,
          waterType,
          current,
          buddies: selectedBuddies.length > 0 ? selectedBuddies : ['Solo / Guide'],
          diveGuide,
          gearUsed: selectedGear,
          notes: notes.trim() || 'Logged dive.',
          critters: spottedCritters,
          computerModel: 'Shearwater Peregrine TX',
        },
        uploadedFile
      );
    } finally {
      setIsSaving(false);
    }
  };

  const tripBuddies = activeTrip?.buddies || [];
  const otherBuddies = Array.from(
    new Set([...buddyPool, ...selectedBuddies])
  ).filter((b) => !tripBuddies.includes(b));

  const allPoolForNewTrip = Array.from(
    new Set([...buddyPool, ...latestDive.buddies, ...newTripBuddies])
  );

  const hasTripPackedGear = Boolean(
    activeTrip && activeTrip.gearBrought && activeTrip.gearBrought.length > 0
  );
  const tripPackedGearSet = new Set(activeTrip?.gearBrought || []);

  const visibleGearCategories = gearCategories
    .map((cat) => ({
      ...cat,
      items:
        hasTripPackedGear && !showFullLockerOnTrip
          ? cat.items.filter((item) => tripPackedGearSet.has(item))
          : cat.items,
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-4">
      {/* 1. DIVE, TRIP & SITE */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        {/* Top Row: Dive #223 + Create a Trip Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-white text-xs font-bold">
              Dive #{nextDiveNumber}
            </span>
            {activeTrip ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-semibold">
                <Folder className="w-3 h-3 text-zinc-600" />
                {formatTripTitle(activeTrip)}
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-medium">
                Single Dive
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingTrip((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{isCreatingTrip ? 'Cancel' : 'Create a Trip'}</span>
          </button>
        </div>

        {/* Inline "Create a Trip" Drawer */}
        {isCreatingTrip && (
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">
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
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                Destination (e.g. Bali, Raja Ampat, Cairns, Phuket)
              </label>
              <input
                type="text"
                value={newTripDestination}
                onChange={(e) => setNewTripDestination(e.target.value)}
                placeholder="e.g. Bali"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-950 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newTripStart}
                  onChange={(e) => setNewTripStart(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newTripEnd}
                  onChange={(e) => setNewTripEnd(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5">
                Trip Dive Buddies
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allPoolForNewTrip.map((b) => {
                  const selected = newTripBuddies.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleToggleNewTripBuddy(b)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-white text-zinc-600 border-zinc-200'
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
                    value={newTripCustomBuddy}
                    onChange={(e) => setNewTripCustomBuddy(e.target.value)}
                    placeholder="+ Add trip buddy"
                    className="w-32 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 outline-none"
                  />
                  {newTripCustomBuddy.trim() && (
                    <button
                      type="button"
                      onClick={handleAddNewTripCustomBuddy}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>

            {gearCategories.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-200">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                    Trip Gear: {newTripGear.length} Selected
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Only selected gear will show when logging dives on this trip
                  </p>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {gearCategories
                    .filter((cat) => cat.items.length > 0)
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
                                    : 'bg-white text-zinc-600 border-zinc-200'
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

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-500">
                Preview:{' '}
                <strong className="text-zinc-900">
                  {newTripDestination || 'Trip'} {newTripStart.slice(0, 4)} (
                  {formatTripDateRange(newTripStart, newTripEnd)})
                </strong>
              </span>
              <button
                type="button"
                onClick={handleConfirmCreateTrip}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-bold"
              >
                Save Trip
              </button>
            </div>
          </div>
        )}

        {/* Trip Assignment Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
              Trip Folder
            </label>
            {wasAutoMatched && activeTrip && (
              <span className="text-[10px] text-zinc-500 font-medium">
                Auto-matched by dive date
              </span>
            )}
          </div>
          <select
            value={selectedTripId}
            onChange={(e) => {
              const nextTripId = e.target.value;
              setSelectedTripId(nextTripId);
              setWasAutoMatched(false);
              const chosen = trips.find((t) => t.id === nextTripId);
              if (chosen) {
                if (!subLocation.trim()) {
                  setSubLocation(chosen.destination);
                }
                if (chosen.buddies && chosen.buddies.length > 0) {
                  setSelectedBuddies(chosen.buddies);
                }
                if (chosen.gearBrought && chosen.gearBrought.length > 0) {
                  setSelectedGear(chosen.gearBrought);
                }
              }
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 outline-none"
          >
            <option value="">No Trip (Single Dive)</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTripTitle(t)} ({formatTripDateRange(t.startDate, t.endDate)})
              </option>
            ))}
          </select>
        </div>

        {/* Dive Site & Location */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Dive Site
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Flinders Reef"
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs font-semibold text-zinc-950 placeholder-zinc-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Location / Area
            </label>
            <input
              type="text"
              value={subLocation}
              onChange={(e) => setSubLocation(e.target.value)}
              placeholder={
                activeTrip ? `e.g. Tulamben, ${activeTrip.destination}` : 'e.g. Brisbane'
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs font-semibold text-zinc-950 placeholder-zinc-400 outline-none"
            />
          </div>
        </div>

        {/* Date & Time In */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 outline-none"
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
              className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 outline-none"
            />
          </div>
        </div>

        {/* Compact Entry Type (Boat / Shore) & Day / Night Toggles */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500">Entry</span>
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              {(['Boat', 'Shore'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDiveType(type)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    diveType === type
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500">Time</span>
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              {(['Day', 'Night'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDayNight(mode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    dayNight === mode
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEPTH, TIME & SAFETY STOPS */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5" />
          <span>Depth, Time & Stops</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
            <label className="block text-[10px] uppercase font-semibold text-zinc-400">
              Max Depth ({unitSystem === 'metric' ? 'm' : 'ft'})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={maxDepthInput}
              onChange={(e) => setMaxDepthInput(e.target.value)}
              placeholder="22"
              className="w-full mt-1 bg-transparent text-base font-bold text-zinc-950 outline-none"
            />
            <span className="text-[10px] text-zinc-400">
              {formatDepth(maxDepthM, unitSystem)}
            </span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
            <label className="block text-[10px] uppercase font-semibold text-zinc-400">
              Avg Depth ({unitSystem === 'metric' ? 'm' : 'ft'})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={avgDepthInput}
              onChange={(e) => setAvgDepthInput(e.target.value)}
              placeholder="15"
              className="w-full mt-1 bg-transparent text-base font-bold text-zinc-950 outline-none"
            />
            <span className="text-[10px] text-zinc-400">
              {formatDepth(avgDepthM, unitSystem)}
            </span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
            <label className="block text-[10px] uppercase font-semibold text-zinc-400">
              Dive Time (min)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={bottomTimeInput}
              onChange={(e) => setBottomTimeInput(e.target.value)}
              placeholder="55"
              className="w-full mt-1 bg-transparent text-base font-bold text-zinc-950 outline-none"
            />
            <span className="text-[10px] text-zinc-400">Minutes</span>
          </div>
        </div>

        {/* Decompression & Safety Stops Tick-Box + 1..5 Rolling Selector */}
        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggleSafetyStop}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-900 text-left"
          >
            {hasSafetyStop ? (
              <CheckSquare className="w-4 h-4 text-zinc-950 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span>Safety / Decompression Stop</span>
          </button>

          {hasSafetyStop && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                Stops:
              </span>
              <div
                className="inline-flex items-center gap-1 bg-white p-0.5 rounded-lg border border-zinc-200 overflow-x-auto"
                aria-label="Number of safety stops"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSafetyStopsCount(num)}
                    className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center transition-all ${
                      safetyStopsCount === num
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-950'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. WATER CONDITIONS (SALT / FRESH, CURRENT, TEMP & VISIBILITY) */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5" />
          <span>Water Conditions</span>
        </h3>

        {/* Row 1: Salt vs Fresh + Current */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Water Type
            </label>
            <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
              {(['Salt', 'Fresh'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWaterType(type)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    waterType === type
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Current
            </label>
            <select
              value={current}
              onChange={(e) => setCurrent(e.target.value as DiveRecord['current'])}
              className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 outline-none h-[34px]"
            >
              <option value="Calm">Calm / None</option>
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Strong">Strong</option>
            </select>
          </div>
        </div>

        {/* Row 2: Water Temperature & Visibility */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-zinc-400">
                Water Temp ({unitSystem === 'metric' ? '°C' : '°F'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={waterTempInput}
                onChange={(e) => setWaterTempInput(e.target.value)}
                placeholder="26"
                className="w-20 mt-0.5 bg-transparent text-sm font-bold text-zinc-950 outline-none"
              />
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 shrink-0">
              {formatTemp(waterTempC, unitSystem)}
            </span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-zinc-400">
                Visibility ({unitSystem === 'metric' ? 'm' : 'ft'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={visibilityInput}
                onChange={(e) => setVisibilityInput(e.target.value)}
                placeholder="20"
                className="w-20 mt-0.5 bg-transparent text-sm font-bold text-zinc-950 outline-none"
              />
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 shrink-0">
              {formatDepth(visibilityM, unitSystem)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. BREATHING GAS & TANK */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            Breathing Gas & Tank
          </h3>
          <div className="inline-flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
            {(['Air', 'Nitrox'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setGasType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  gasType === type
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Nitrox O2% Accurate Decimal Input + 32% / 36% Shortcuts */}
        {gasType === 'Nitrox' && (
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-zinc-700">
                O₂ Mix (%):
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={nitroxO2Input}
                onChange={(e) => setNitroxO2Input(e.target.value)}
                placeholder="e.g. 31.6"
                className="w-20 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 focus:border-zinc-900 text-xs font-bold text-zinc-950 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                Presets:
              </span>
              {[32, 36].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNitroxO2Input(String(preset))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    Number(nitroxO2Input) === preset
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
            <label className="block text-[10px] uppercase font-semibold text-zinc-400">
              Start Tank ({formatPressure(startPressureBar, unitSystem)})
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={startPressureInput}
              onChange={(e) => setStartPressureInput(e.target.value)}
              placeholder="200"
              className="w-full mt-1 bg-transparent text-sm font-bold text-zinc-950 outline-none"
            />
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
            <label className="block text-[10px] uppercase font-semibold text-zinc-400">
              End Tank ({formatPressure(endPressureBar, unitSystem)})
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={endPressureInput}
              onChange={(e) => setEndPressureInput(e.target.value)}
              placeholder="55"
              className="w-full mt-1 bg-transparent text-sm font-bold text-zinc-950 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. DIVE BUDDIES & GEAR */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950">
              <Users className="w-4 h-4 text-zinc-900" />
              <span>
                {activeTrip
                  ? `Dive Buddies — ${formatTripTitle(activeTrip)}`
                  : 'Dive Buddies'}
              </span>
            </span>

            <button
              type="button"
              onClick={handleToggleSameBuddies}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-950"
            >
              {sameBuddiesAsLast ? (
                <CheckSquare className="w-3.5 h-3.5 text-zinc-950" />
              ) : (
                <Square className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>Same as Last Dive</span>
            </button>
          </div>

          {activeTrip && tripBuddies.length > 0 && (
            <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Pick Buddies from {formatTripTitle(activeTrip)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tripBuddies.map((buddy) => {
                  const checked = selectedBuddies.includes(buddy);
                  return (
                    <div
                      key={buddy}
                      className={`inline-flex items-center rounded-lg border text-xs font-medium transition-all overflow-hidden ${
                        checked
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleBuddy(buddy)}
                        className="inline-flex items-center gap-1 px-2.5 py-1"
                      >
                        {checked && <Check className="w-3 h-3" />}
                        <span>{buddy}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBuddy(buddy)}
                        className={`px-1.5 py-1 border-l ${
                          checked
                            ? 'border-zinc-800 text-zinc-400 hover:text-white'
                            : 'border-zinc-200 text-zinc-400 hover:text-zinc-800'
                        }`}
                        title={`Delete ${buddy}`}
                        aria-label={`Delete ${buddy}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            {activeTrip && otherBuddies.length > 0 && (
              <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                Other Saved Buddies
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(activeTrip ? otherBuddies : Array.from(new Set([...buddyPool, ...selectedBuddies]))).map(
                (buddy) => {
                  const checked = selectedBuddies.includes(buddy);
                  return (
                    <div
                      key={buddy}
                      className={`inline-flex items-center rounded-lg border text-xs font-medium transition-all overflow-hidden ${
                        checked
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleBuddy(buddy)}
                        className="inline-flex items-center gap-1 px-2.5 py-1"
                      >
                        {checked && <Check className="w-3 h-3" />}
                        <span>{buddy}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBuddy(buddy)}
                        className={`px-1.5 py-1 border-l ${
                          checked
                            ? 'border-zinc-800 text-zinc-400 hover:text-white'
                            : 'border-zinc-200 text-zinc-400 hover:text-zinc-800'
                        }`}
                        title={`Delete ${buddy}`}
                        aria-label={`Delete ${buddy}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }
              )}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={customBuddyInput}
                  onChange={(e) => setCustomBuddyInput(e.target.value)}
                  placeholder={activeTrip ? '+ Add buddy to trip' : '+ Add buddy'}
                  className="w-32 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 outline-none"
                />
                {customBuddyInput.trim() && (
                  <button
                    type="button"
                    onClick={handleAddCustomBuddy}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-zinc-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950">
              <Wrench className="w-3.5 h-3.5 text-zinc-900" />
              <span>
                {hasTripPackedGear && activeTrip
                  ? `Trip Gear — ${formatTripTitle(activeTrip)} (${selectedGear.length})`
                  : `Gear Used (${selectedGear.length})`}
              </span>
            </span>

            <div className="flex items-center gap-2.5">
              {hasTripPackedGear && (
                <button
                  type="button"
                  onClick={() => setShowFullLockerOnTrip((prev) => !prev)}
                  className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 underline underline-offset-2"
                >
                  {showFullLockerOnTrip
                    ? 'Show Trip Gear Only'
                    : 'Show All Locker Gear'}
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleSameGear}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-950"
              >
                {sameGearAsLast ? (
                  <CheckSquare className="w-3.5 h-3.5 text-zinc-950" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>Same as Last Dive</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {visibleGearCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5"
              >
                <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                  {cat.name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item) => {
                    const checked = selectedGear.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleGearItem(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                          checked
                            ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                            : 'bg-white text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. DIVE NOTES & MARINE LIFE */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
          Dive Notes & Marine Life
        </h3>

        <textarea
          rows={3}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Write your dive notes (mention any marine life like 'frogfish' or 'turtle' to auto-tag)..."
          className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs text-zinc-800 leading-relaxed outline-none"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="font-semibold text-zinc-700">
              Marine Life Sighted ({spottedCritters.length}):
            </span>
          </div>

          {spottedCritters.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {spottedCritters.map((item) => {
                const sp = allSpecies.find((s) => s.id === item.speciesId);
                if (!sp) return null;
                return (
                  <div
                    key={item.speciesId}
                    className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-zinc-50 border border-zinc-200"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 text-zinc-900">
                        <CritterSilhouette familyId={sp.familyId} className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 truncate">
                        {sp.commonName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCritter(item.speciesId)}
                      className="w-5 h-5 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 shrink-0"
                      aria-label={`Remove ${sp.commonName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-1">
            <select
              value={manualSpeciesId}
              onChange={(e) => setManualSpeciesId(e.target.value)}
              className="flex-1 px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 outline-none"
            >
              {allSpecies.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  + {sp.commonName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddManualCritter}
              className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold shrink-0"
            >
              Add
            </button>
          </div>

          {onCreateSpecies && families.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={customCritterName}
                onChange={(e) => setCustomCritterName(e.target.value)}
                placeholder="Or type any common name (e.g. Brown Cuttlefish)..."
                className="flex-1 px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 outline-none"
              />
              <select
                value={customCritterFamily}
                onChange={(e) =>
                  setCustomCritterFamily(e.target.value as CritterFamilyId)
                }
                aria-label="Marine life icon category"
                className="w-28 px-2 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 outline-none"
              >
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCustomCritter}
                disabled={!customCritterName.trim()}
                className="px-3 py-2 rounded-xl bg-zinc-950 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-semibold shrink-0"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 7. PHOTO & SAVE */}
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
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold"
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
          className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold shadow-sm transition-all shrink-0"
        >
          {isSaving ? 'Saving...' : `Save Dive #${nextDiveNumber}`}
        </button>
      </div>
    </form>
  );
};
