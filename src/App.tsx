import React, { useEffect, useMemo, useState } from 'react';
import {
  Smartphone,
  Tablet,
  WifiOff,
  BatteryCharging,
  Signal,
  X,
  Check,
} from 'lucide-react';
import {
  CRITTER_FAMILIES,
  CRITTER_SPECIES,
  INITIAL_DIVES,
  buildInitialVaultPhotos,
} from './data/mockDives';
import {
  CritterFamilyMeta,
  CritterSpecies,
  DiveRecord,
  SpottedCritter,
  TabId,
  UnitSystem,
  VaultPhoto,
} from './types/dive';
import {
  compressPhotoToWebpVault,
  generateVaultWebpForDive,
} from './utils/photoVault';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { DiveListSidebar } from './components/DiveListSidebar';
import { DiveInspector } from './components/DiveInspector';
import { CritterDexView } from './components/CritterDexView';
import { LogDiveView } from './components/LogDiveView';
import { GearAndCrewView } from './components/GearAndCrewView';
import { StatsAndCalculatorsView } from './components/StatsAndCalculatorsView';

const DEFAULT_GEAR_LOCKER = [
  'Apeks XTX200',
  'Shearwater Peregrine TX',
  '5mm Fourth Element Proteus',
  'Olympus TG-6 + Dual Inon',
  'Olympus TG-6 + SMC-1 Supermacro',
  'Reef Hook',
  'SMB + Spool',
  'BigBlue VL4600P Red Mode',
];

const DEFAULT_BUDDY_POOL = [
  'Made Wirawan',
  'Elena Rostova',
  'Marcus Vance',
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dives');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [dives, setDives] = useState<DiveRecord[]>(INITIAL_DIVES);
  const [selectedDiveId, setSelectedDiveId] = useState<string>(INITIAL_DIVES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dexFamilyFilter, setDexFamilyFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [gearLocker, setGearLocker] = useState<string[]>(DEFAULT_GEAR_LOCKER);
  const [buddyPool, setBuddyPool] = useState<string[]>(DEFAULT_BUDDY_POOL);

  const [devicePreviewMode, setDevicePreviewMode] = useState<'mobile' | 'tablet'>('mobile');
  // Start on the clean Logbook list; tapping a dive opens its detail view
  const [mobileDivesSubView, setMobileDivesSubView] = useState<'list' | 'inspector'>('list');

  const [vaultPhotos, setVaultPhotos] = useState<Record<string, VaultPhoto>>(() =>
    buildInitialVaultPhotos()
  );

  const speciesMap = useMemo(() => {
    const map: Record<string, CritterSpecies> = {};
    for (const s of CRITTER_SPECIES) {
      map[s.id] = s;
    }
    return map;
  }, []);

  const familyMap = useMemo(() => {
    const map: Record<string, CritterFamilyMeta> = {};
    for (const f of CRITTER_FAMILIES) {
      map[f.id] = f;
    }
    return map;
  }, []);

  const filteredDives = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return dives;

    return dives.filter((dive) => {
      if (
        dive.siteName.toLowerCase().includes(q) ||
        dive.subLocation.toLowerCase().includes(q) ||
        dive.diveNumber.toString().includes(q) ||
        `#${dive.diveNumber}`.includes(q) ||
        dive.notes.toLowerCase().includes(q) ||
        dive.buddies.some((b) => b.toLowerCase().includes(q))
      ) {
        return true;
      }

      return dive.critters.some((c) => {
        const sp = speciesMap[c.speciesId];
        return (
          sp &&
          (sp.commonName.toLowerCase().includes(q) ||
            sp.scientificName.toLowerCase().includes(q) ||
            sp.familyId.toLowerCase().includes(q))
        );
      });
    });
  }, [dives, searchQuery, speciesMap]);

  const selectedDiveIndex = useMemo(
    () => Math.max(0, dives.findIndex((d) => d.id === selectedDiveId)),
    [dives, selectedDiveId]
  );

  const selectedDive = dives[selectedDiveIndex] || dives[0];

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleUploadPhotoToDive = async (diveId: string, file: File) => {
    const targetDive = dives.find((d) => d.id === diveId);
    if (!targetDive) return;

    const compressed = await compressPhotoToWebpVault(file, 35);
    const newPhotoId = `photo-upload-${Date.now()}`;
    const newVaultPhoto: VaultPhoto = {
      id: newPhotoId,
      diveNumber: targetDive.diveNumber,
      caption: `${targetDive.siteName} — Dive #${targetDive.diveNumber}`,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      vaultWebpDataUrl: compressed.webpDataUrl,
      originalPhoneUri: `content://media/external/images/media/${file.name}`,
      originalSizeKB: compressed.originalSizeKB,
      vaultSizeKB: compressed.vaultSizeKB,
      width: compressed.width,
      height: compressed.height,
      isUserUploaded: true,
    };

    setVaultPhotos((prev) => ({
      ...prev,
      [newPhotoId]: newVaultPhoto,
    }));

    setDives((prev) =>
      prev.map((d) =>
        d.id === diveId
          ? {
              ...d,
              coverPhotoId: newPhotoId,
              photoIds: [newPhotoId, ...d.photoIds],
            }
          : d
      )
    );

    setToastMessage('Photo added to Dive #' + targetDive.diveNumber);
  };

  const handleSaveNewDive = async (
    newDiveData: Omit<DiveRecord, 'id' | 'coverPhotoId' | 'photoIds'>,
    uploadedFile?: File | null
  ) => {
    const diveId = `dive-${newDiveData.diveNumber}-${Date.now()}`;
    const photoId = `photo-${newDiveData.diveNumber}-${Date.now()}`;

    let vaultPhotoEntry: VaultPhoto;
    if (uploadedFile) {
      const compressed = await compressPhotoToWebpVault(uploadedFile, 35);
      vaultPhotoEntry = {
        id: photoId,
        diveNumber: newDiveData.diveNumber,
        caption: `${newDiveData.siteName} — Dive #${newDiveData.diveNumber}`,
        timestamp: `${newDiveData.date} ${newDiveData.timeIn}`,
        vaultWebpDataUrl: compressed.webpDataUrl,
        originalPhoneUri: `content://media/external/images/media/${uploadedFile.name}`,
        originalSizeKB: compressed.originalSizeKB,
        vaultSizeKB: compressed.vaultSizeKB,
        width: compressed.width,
        height: compressed.height,
        isUserUploaded: true,
      };
    } else {
      const generated = generateVaultWebpForDive(222);
      vaultPhotoEntry = {
        id: photoId,
        diveNumber: newDiveData.diveNumber,
        caption: `${newDiveData.siteName} — Logged at ${newDiveData.maxDepthM}m`,
        timestamp: `${newDiveData.date} ${newDiveData.timeIn}`,
        vaultWebpDataUrl: generated.webpDataUrl,
        originalPhoneUri: `content://media/external/images/media/IMG_BALI_${newDiveData.diveNumber}.HEIC`,
        originalSizeKB: 4680,
        vaultSizeKB: generated.vaultSizeKB,
        width: generated.width,
        height: generated.height,
      };
    }

    const completeDive: DiveRecord = {
      ...newDiveData,
      id: diveId,
      coverPhotoId: photoId,
      photoIds: [photoId],
    };

    setVaultPhotos((prev) => ({
      ...prev,
      [photoId]: vaultPhotoEntry,
    }));

    setDives((prev) => [completeDive, ...prev]);
    setSelectedDiveId(diveId);
    setMobileDivesSubView('inspector');
    setActiveTab('dives');
    setToastMessage(`Logged Dive #${newDiveData.diveNumber} (${newDiveData.siteName})`);
  };

  const handleMergeCritterDelta = (
    diveId: string,
    incomingCritters: SpottedCritter[],
    buddyName: string
  ) => {
    setDives((prev) =>
      prev.map((d) => {
        if (d.id !== diveId) return d;
        const mergedMap = new Map<string, SpottedCritter>();
        for (const existing of d.critters) {
          mergedMap.set(existing.speciesId, { ...existing });
        }
        for (const inc of incomingCritters) {
          const prevEntry = mergedMap.get(inc.speciesId);
          if (!prevEntry) {
            mergedMap.set(inc.speciesId, { ...inc });
          } else {
            mergedMap.set(inc.speciesId, {
              ...prevEntry,
              count: Math.max(prevEntry.count, inc.count),
              highlight: prevEntry.highlight || inc.highlight,
            });
          }
        }
        return {
          ...d,
          critters: Array.from(mergedMap.values()),
        };
      })
    );
    setToastMessage(`Merged ${buddyName}’s sightings`);
  };

  const handleInspectSpeciesInDex = (familyId: string) => {
    setDexFamilyFilter(familyId);
    setActiveTab('critters');
  };

  const handleSelectDiveFromDex = (diveId: string) => {
    setSelectedDiveId(diveId);
    setMobileDivesSubView('inspector');
    setActiveTab('dives');
  };

  const coverPhoto =
    vaultPhotos[selectedDive.coverPhotoId] ||
    Object.values(vaultPhotos)[0];

  const galleryPhotos = selectedDive.photoIds
    .map((pid) => vaultPhotos[pid])
    .filter(Boolean);

  return (
    <div className="h-[100dvh] w-full bg-zinc-200/80 text-zinc-900 flex flex-col items-center justify-start sm:py-2 sm:px-4 overflow-hidden">
      {/* Desktop Preview Frame Switcher Bar */}
      <div className="hidden sm:flex items-center justify-between gap-4 w-full max-w-[412px] mb-1.5 px-1 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-zinc-900" />
          <span>Samsung S24 Ultra (412dp)</span>
        </div>

        <div className="inline-flex items-center bg-white p-0.5 rounded-lg border border-zinc-300 text-[11px] shadow-sm">
          <button
            type="button"
            onClick={() => setDevicePreviewMode('mobile')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              devicePreviewMode === 'mobile'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>S24 Ultra</span>
          </button>
          <button
            type="button"
            onClick={() => setDevicePreviewMode('tablet')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              devicePreviewMode === 'tablet'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Split Deck</span>
          </button>
        </div>
      </div>

      {/* Samsung Galaxy S24 Ultra Chassis on Desktop / Full Safe-Area Container on Phone */}
      <div
        className={`w-full h-full flex flex-col bg-zinc-50 transition-all duration-300 relative overflow-hidden ${
          devicePreviewMode === 'mobile'
            ? 'sm:max-w-[412px] sm:h-[892px] sm:rounded-[18px] sm:border-[6px] sm:border-zinc-900 sm:shadow-2xl'
            : 'max-w-[1380px] sm:rounded-2xl sm:border sm:border-zinc-300 sm:shadow-xl'
        }`}
      >
        {/* Simulated S24 Ultra Status Bar + Punch-Hole Camera (Desktop preview only) */}
        <div className="hidden sm:flex bg-white px-4 pt-2 pb-1.5 items-center justify-between text-[11px] font-medium text-zinc-800 select-none shrink-0 border-b border-zinc-100">
          <span className="font-semibold">09:41</span>
          {devicePreviewMode === 'mobile' && (
            <div className="w-3 h-3 rounded-full bg-zinc-950" title="S24 Ultra Camera Punch-Hole" />
          )}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 text-zinc-600 font-semibold">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
            <Signal className="w-3 h-3 text-zinc-700" />
            <BatteryCharging className="w-3.5 h-3.5 text-zinc-900" />
          </div>
        </div>

        {/* Clean Top App Header */}
        <TopHeader
          activeTab={activeTab}
          latestDiveNumber={dives[0]?.diveNumber || 222}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-3 mt-2 z-40 bg-zinc-950 text-white px-3.5 py-2 rounded-xl shadow-md text-xs font-medium flex items-center justify-between gap-2 shrink-0">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contained Scrollable App Content Viewport */}
        <main className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-3">
          {activeTab === 'dives' && (
            <>
              {devicePreviewMode === 'mobile' ? (
                mobileDivesSubView === 'list' ? (
                  <DiveListSidebar
                    dives={filteredDives}
                    selectedDiveId={selectedDive.id}
                    onSelectDive={(id) => {
                      setSelectedDiveId(id);
                      setMobileDivesSubView('inspector');
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    unitSystem={unitSystem}
                    vaultPhotos={vaultPhotos}
                  />
                ) : (
                  <DiveInspector
                    dive={selectedDive}
                    coverPhoto={coverPhoto}
                    galleryPhotos={galleryPhotos}
                    unitSystem={unitSystem}
                    onUploadPhotoToDive={handleUploadPhotoToDive}
                    speciesMap={speciesMap}
                    familyMap={familyMap}
                    onInspectSpeciesInDex={handleInspectSpeciesInDex}
                    onBackToLogbook={() => setMobileDivesSubView('list')}
                    onPrevDive={
                      selectedDiveIndex < dives.length - 1
                        ? () => setSelectedDiveId(dives[selectedDiveIndex + 1].id)
                        : undefined
                    }
                    onNextDive={
                      selectedDiveIndex > 0
                        ? () => setSelectedDiveId(dives[selectedDiveIndex - 1].id)
                        : undefined
                    }
                  />
                )
              ) : (
                /* SPLIT TABLET / DECK VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-5">
                    <DiveListSidebar
                      dives={filteredDives}
                      selectedDiveId={selectedDive.id}
                      onSelectDive={setSelectedDiveId}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      unitSystem={unitSystem}
                      vaultPhotos={vaultPhotos}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <DiveInspector
                      dive={selectedDive}
                      coverPhoto={coverPhoto}
                      galleryPhotos={galleryPhotos}
                      unitSystem={unitSystem}
                      onUploadPhotoToDive={handleUploadPhotoToDive}
                      speciesMap={speciesMap}
                      familyMap={familyMap}
                      onInspectSpeciesInDex={handleInspectSpeciesInDex}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'log' && (
            <LogDiveView
              latestDive={dives[0]}
              allSpecies={CRITTER_SPECIES}
              gearLocker={gearLocker}
              buddyPool={buddyPool}
              unitSystem={unitSystem}
              onSaveNewDive={handleSaveNewDive}
            />
          )}

          {activeTab === 'gear' && (
            <GearAndCrewView
              dives={dives}
              selectedDiveId={selectedDive.id}
              onSelectDiveId={setSelectedDiveId}
              allSpecies={CRITTER_SPECIES}
              gearLocker={gearLocker}
              onAddGearItem={(item) =>
                setGearLocker((prev) => (prev.includes(item) ? prev : [...prev, item]))
              }
              onRemoveGearItem={(item) =>
                setGearLocker((prev) => prev.filter((g) => g !== item))
              }
              buddyPool={buddyPool}
              onAddBuddyToPool={(b) =>
                setBuddyPool((prev) => (prev.includes(b) ? prev : [...prev, b]))
              }
              onMergeCritterDelta={handleMergeCritterDelta}
              unitSystem={unitSystem}
            />
          )}

          {activeTab === 'critters' && (
            <CritterDexView
              families={CRITTER_FAMILIES}
              species={CRITTER_SPECIES}
              dives={dives}
              initialFamilyFilter={dexFamilyFilter}
              onSelectDiveFromDex={handleSelectDiveFromDex}
            />
          )}

          {activeTab === 'stats' && (
            <StatsAndCalculatorsView
              dives={dives}
              unitSystem={unitSystem}
              onSelectDive={(id) => {
                setSelectedDiveId(id);
                setMobileDivesSubView('inspector');
                setActiveTab('dives');
              }}
            />
          )}
        </main>

        {/* Pinned Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'dives') {
              setMobileDivesSubView('list');
            }
          }}
          diveCount={dives.length}
          critterSpeciesCount={CRITTER_SPECIES.length}
        />

        {/* Simulated Samsung One UI 3-Button System Navigation Bar (Desktop preview only) */}
        {devicePreviewMode === 'mobile' && (
          <div className="hidden sm:flex bg-white border-t border-zinc-200 h-10 px-12 items-center justify-between text-zinc-500 select-none shrink-0">
            <div className="flex gap-0.5">
              <span className="w-0.5 h-3.5 bg-zinc-400 rounded-full" />
              <span className="w-0.5 h-3.5 bg-zinc-400 rounded-full" />
              <span className="w-0.5 h-3.5 bg-zinc-400 rounded-full" />
            </div>
            <div className="w-3.5 h-3.5 rounded-[4px] border-[1.8px] border-zinc-400" />
            <div className="text-sm font-semibold leading-none text-zinc-400">‹</div>
          </div>
        )}

        {/* Settings Sheet (Measurement Units & Preferences) */}
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center">
            <div className="w-full bg-white rounded-t-3xl border-t border-zinc-200 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-950">
                  Preferences & Units
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Measurement System
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitSystem('metric')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      unitSystem === 'metric'
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">Metric</div>
                      <div
                        className={`text-xs mt-0.5 ${
                          unitSystem === 'metric' ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        Meters (m) • Bar • Celsius (°C) • Liters
                      </div>
                    </div>
                    {unitSystem === 'metric' && <Check className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnitSystem('imperial')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      unitSystem === 'imperial'
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">Imperial</div>
                      <div
                        className={`text-xs mt-0.5 ${
                          unitSystem === 'imperial' ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        Feet (ft) • PSI • Fahrenheit (°F) • Cubic Feet
                      </div>
                    </div>
                    {unitSystem === 'imperial' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
