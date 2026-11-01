import React, { useEffect, useMemo, useState } from 'react';
import {
  Smartphone,
  Tablet,
  WifiOff,
  BatteryCharging,
  Signal,
} from 'lucide-react';
import {
  CRITTER_FAMILIES,
  CRITTER_SPECIES,
  INITIAL_DIVES,
  INITIAL_TRIPS,
  buildInitialVaultPhotos,
} from './data/mockDives';
import {
  CritterFamilyId,
  CritterFamilyMeta,
  CritterSpecies,
  DiveCertification,
  DiveRecord,
  DiveTrip,
  GearCategory,
  PhotoStorageMode,
  SpottedCritter,
  TabId,
  UnitSystem,
  VaultPhoto,
} from './types/dive';
import {
  compressPhotoToWebpVault,
  generateVaultWebpForDive,
} from './utils/photoVault';
import { formatTripDateRange, formatTripTitle } from './utils/trips';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { DiveListSidebar } from './components/DiveListSidebar';
import { DiveInspector } from './components/DiveInspector';
import { CritterDexView } from './components/CritterDexView';
import { LogDiveView } from './components/LogDiveView';
import { GearAndCrewView } from './components/GearAndCrewView';
import { StatsAndCalculatorsView } from './components/StatsAndCalculatorsView';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_GEAR_CATEGORIES: GearCategory[] = [
  {
    id: 'cat-photo',
    name: 'Photography Gear',
    items: [
      'Olympus TG-6 + Dual Inon',
      'Olympus TG-6 + SMC-1 Supermacro',
      'Nikon Z6 II + 60mm Macro',
    ],
  },
  {
    id: 'cat-fins',
    name: 'Fins',
    items: ['Scubapro Seawing Nova', 'Mares Avanti Quattro+'],
  },
  {
    id: 'cat-masks',
    name: 'Masks',
    items: ['Tusa Paragon S', 'Scubapro Frameless'],
  },
  {
    id: 'cat-wetsuits',
    name: 'Wetsuits',
    items: ['5mm Fourth Element Proteus', '3mm Fourth Element Shorty'],
  },
  {
    id: 'cat-computers-regs',
    name: 'Computers & Regulators',
    items: ['Shearwater Peregrine TX', 'Apeks XTX200'],
  },
  {
    id: 'cat-torches-acc',
    name: 'Dive Torches & Accessories',
    items: ['BigBlue VL4600P Red Mode', 'Reef Hook', 'SMB + Spool'],
  },
];

const DEFAULT_BUDDY_POOL = [
  'Made Wirawan',
  'Elena Rostova',
  'Marcus Vance',
];

const DEFAULT_CERTIFICATIONS: DiveCertification[] = [
  {
    id: 'cert-rescue',
    agency: 'PADI',
    title: 'Rescue Diver',
    certNumber: '24089112',
    year: '2024',
  },
  {
    id: 'cert-nitrox',
    agency: 'PADI',
    title: 'Enriched Air (Nitrox)',
    certNumber: '23110489',
    year: '2023',
  },
  {
    id: 'cert-aow',
    agency: 'PADI',
    title: 'Advanced Open Water Diver',
    certNumber: '22051904',
    year: '2022',
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dives');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [initialDiveCount, setInitialDiveCount] = useState<number>(214);
  const [photoStorageMode, setPhotoStorageMode] =
    useState<PhotoStorageMode>('app-compressed');
  const [dives, setDives] = useState<DiveRecord[]>(INITIAL_DIVES);
  const [trips, setTrips] = useState<DiveTrip[]>(INITIAL_TRIPS);
  const [speciesList, setSpeciesList] =
    useState<CritterSpecies[]>(CRITTER_SPECIES);
  const [selectedDiveId, setSelectedDiveId] = useState<string>(INITIAL_DIVES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openedTripId, setOpenedTripId] = useState<string | null>(null);
  const [critterSearchQuery, setCritterSearchQuery] = useState<string>('');
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);
  const [inspectorReturnTab, setInspectorReturnTab] = useState<TabId>('dives');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [gearCategories, setGearCategories] = useState<GearCategory[]>(
    DEFAULT_GEAR_CATEGORIES
  );
  const [buddyPool, setBuddyPool] = useState<string[]>(DEFAULT_BUDDY_POOL);
  const [certifications, setCertifications] = useState<DiveCertification[]>(
    DEFAULT_CERTIFICATIONS
  );

  const flatGearLocker = useMemo(
    () => gearCategories.flatMap((c) => c.items),
    [gearCategories]
  );

  const [devicePreviewMode, setDevicePreviewMode] = useState<'mobile' | 'tablet'>('mobile');
  // Start on the clean Logbook list; tapping a dive opens its detail view
  const [mobileDivesSubView, setMobileDivesSubView] = useState<'list' | 'inspector'>('list');

  const [vaultPhotos, setVaultPhotos] = useState<Record<string, VaultPhoto>>(() =>
    buildInitialVaultPhotos()
  );

  const speciesMap = useMemo(() => {
    const map: Record<string, CritterSpecies> = {};
    for (const s of speciesList) {
      map[s.id] = s;
    }
    return map;
  }, [speciesList]);

  const loggedSpeciesCount = useMemo(() => {
    const ids = new Set<string>();
    for (const d of dives) {
      for (const c of d.critters) {
        if (c.count > 0) ids.add(c.speciesId);
      }
    }
    return ids.size;
  }, [dives]);

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
      const assignedTrip = trips.find((t) => t.id === dive.tripId);
      if (
        dive.siteName.toLowerCase().includes(q) ||
        dive.subLocation.toLowerCase().includes(q) ||
        (assignedTrip && assignedTrip.destination.toLowerCase().includes(q)) ||
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
  }, [dives, trips, searchQuery, speciesMap]);

  const selectedDiveIndex = useMemo(
    () => Math.max(0, dives.findIndex((d) => d.id === selectedDiveId)),
    [dives, selectedDiveId]
  );

  const selectedDive = dives[selectedDiveIndex] || dives[0];

  // Highest dive number or initialDiveCount if no dives logged yet
  const careerTotalDives = useMemo(() => {
    if (dives.length === 0) return initialDiveCount;
    return dives.reduce(
      (max, d) => (d.diveNumber > max ? d.diveNumber : max),
      initialDiveCount
    );
  }, [dives, initialDiveCount]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleChangeInitialDiveCount = (newInitialCount: number) => {
    const safeCount = Math.max(0, Math.floor(newInitialCount));
    setInitialDiveCount(safeCount);

    // Re-number all existing dives in chronological order starting at safeCount + 1
    setDives((prev) => {
      const chronological = [...prev].sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        const timeCmp = a.timeIn.localeCompare(b.timeIn);
        if (timeCmp !== 0) return timeCmp;
        return a.diveNumber - b.diveNumber;
      });

      const numberById = new Map<string, number>();
      chronological.forEach((d, idx) => {
        numberById.set(d.id, safeCount + idx + 1);
      });

      return prev
        .map((d) => ({
          ...d,
          diveNumber: numberById.get(d.id) ?? d.diveNumber,
        }))
        .sort((a, b) => b.diveNumber - a.diveNumber);
    });

    setToastMessage(
      `Initial dives set to ${safeCount} (App dives start at #${safeCount + 1})`
    );
  };

  const handleAddCertification = (cert: Omit<DiveCertification, 'id'>) => {
    const created: DiveCertification = {
      ...cert,
      id: `cert-${Date.now()}`,
    };
    setCertifications((prev) => [created, ...prev]);
    setToastMessage(`Added ${cert.agency} ${cert.title}`);
  };

  const handleRemoveCertification = (id: string) => {
    setCertifications((prev) => prev.filter((c) => c.id !== id));
    setToastMessage('Removed certification');
  };

  const handleAddGearCategory = (categoryName: string) => {
    const newCat: GearCategory = {
      id: `cat-${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: categoryName,
      items: [],
    };
    setGearCategories((prev) => [...prev, newCat]);
    setToastMessage(`Created category: ${categoryName}`);
  };

  const handleRemoveGearCategory = (categoryId: string) => {
    setGearCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setToastMessage('Removed gear category');
  };

  const handleAddGearItemToCategory = (
    categoryId: string,
    itemName: string
  ) => {
    setGearCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        if (cat.items.includes(itemName)) return cat;
        return {
          ...cat,
          items: [...cat.items, itemName],
        };
      })
    );
    setToastMessage(`Added ${itemName}`);
  };

  const handleRemoveGearItemFromCategory = (
    categoryId: string,
    itemName: string
  ) => {
    setGearCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((i) => i !== itemName) }
          : cat
      )
    );
  };

  const handleCreateTrip = (
    destination: string,
    startDate: string,
    endDate: string,
    buddies: string[] = [],
    gearBrought: string[] = []
  ): DiveTrip => {
    const newTrip: DiveTrip = {
      id: `trip-${destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      destination,
      startDate,
      endDate,
      buddies,
      gearBrought,
    };

    setTrips((prev) => [newTrip, ...prev]);

    // Ensure any trip buddies are also in the global buddy pool
    if (buddies.length > 0) {
      setBuddyPool((prev) => Array.from(new Set([...prev, ...buddies])));
    }

    // Automatically place any existing single dives within this date range into the new trip
    setDives((prev) =>
      prev.map((d) => {
        if (!d.tripId && d.date >= startDate && d.date <= endDate) {
          return { ...d, tripId: newTrip.id };
        }
        return d;
      })
    );

    setToastMessage(
      `Created trip: ${formatTripTitle(newTrip)} (${formatTripDateRange(startDate, endDate)})`
    );
    return newTrip;
  };

  const handleUpdateTripBuddies = (tripId: string, buddies: string[]) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, buddies } : t))
    );
    setBuddyPool((prev) => Array.from(new Set([...prev, ...buddies])));
  };

  const handleUpdateTripGear = (tripId: string, gearBrought: string[]) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, gearBrought } : t))
    );
  };

  const handleRemoveBuddyFromPool = (buddy: string) => {
    setBuddyPool((prev) => prev.filter((b) => b !== buddy));
    setToastMessage(`Removed ${buddy} from buddies`);
  };

  const handleChangeDiveTrip = (diveId: string, tripId: string | undefined) => {
    setDives((prev) =>
      prev.map((d) => (d.id === diveId ? { ...d, tripId } : d))
    );
    const targetTrip = trips.find((t) => t.id === tripId);
    setToastMessage(
      targetTrip
        ? `Moved dive to ${formatTripTitle(targetTrip)}`
        : 'Set as Single Dive'
    );
  };

  const handleUploadPhotoToDive = async (diveId: string, file: File) => {
    const targetDive = dives.find((d) => d.id === diveId);
    if (!targetDive) return;

    const newPhotoId = `photo-upload-${Date.now()}`;
    let newVaultPhoto: VaultPhoto;

    if (photoStorageMode === 'app-compressed') {
      const compressed = await compressPhotoToWebpVault(file, 35);
      newVaultPhoto = {
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
        storageMode: 'app-compressed',
      };
    } else {
      const objectUrl = URL.createObjectURL(file);
      newVaultPhoto = {
        id: newPhotoId,
        diveNumber: targetDive.diveNumber,
        caption: `${targetDive.siteName} — Dive #${targetDive.diveNumber}`,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        vaultWebpDataUrl: objectUrl,
        originalPhoneUri: `content://media/external/images/media/${file.name}`,
        originalSizeKB: Math.max(1, Math.round(file.size / 1024)),
        vaultSizeKB: 0,
        width: 800,
        height: 600,
        isUserUploaded: true,
        storageMode: 'phone-link',
      };
    }

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
      if (photoStorageMode === 'app-compressed') {
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
          storageMode: 'app-compressed',
        };
      } else {
        const objectUrl = URL.createObjectURL(uploadedFile);
        vaultPhotoEntry = {
          id: photoId,
          diveNumber: newDiveData.diveNumber,
          caption: `${newDiveData.siteName} — Dive #${newDiveData.diveNumber}`,
          timestamp: `${newDiveData.date} ${newDiveData.timeIn}`,
          vaultWebpDataUrl: objectUrl,
          originalPhoneUri: `content://media/external/images/media/${uploadedFile.name}`,
          originalSizeKB: Math.max(1, Math.round(uploadedFile.size / 1024)),
          vaultSizeKB: 0,
          width: 800,
          height: 600,
          isUserUploaded: true,
          storageMode: 'phone-link',
        };
      }
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
        storageMode: 'app-compressed',
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
    const assignedTrip = trips.find((t) => t.id === completeDive.tripId);
    setToastMessage(
      assignedTrip
        ? `Logged Dive #${newDiveData.diveNumber} into ${formatTripTitle(assignedTrip)}`
        : `Logged Single Dive #${newDiveData.diveNumber} (${newDiveData.siteName})`
    );
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

  const handleConvertLinkedPhotosToApp = () => {
    setVaultPhotos((prev) => {
      const next: Record<string, VaultPhoto> = {};
      for (const [id, photo] of Object.entries(prev)) {
        if (photo.storageMode === 'phone-link') {
          next[id] = {
            ...photo,
            storageMode: 'app-compressed',
            vaultSizeKB: 34,
          };
        } else {
          next[id] = photo;
        }
      }
      return next;
    });
    setToastMessage('Compressed phone-linked photos into app data');
  };

  const handleExportBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      unitSystem,
      initialDiveCount,
      photoStorageMode,
      trips,
      dives,
      buddyPool,
      gearCategories,
      certifications,
      vaultPhotos,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deeplog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Exported logbook & photo backup file');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.dives)) setDives(parsed.dives);
        if (Array.isArray(parsed.trips)) setTrips(parsed.trips);
        if (Array.isArray(parsed.buddyPool)) setBuddyPool(parsed.buddyPool);
        if (Array.isArray(parsed.gearCategories)) {
          setGearCategories(parsed.gearCategories);
        }
        if (Array.isArray(parsed.certifications)) {
          setCertifications(parsed.certifications);
        }
        if (typeof parsed.initialDiveCount === 'number') {
          setInitialDiveCount(parsed.initialDiveCount);
        }
        if (parsed.vaultPhotos && typeof parsed.vaultPhotos === 'object') {
          setVaultPhotos(parsed.vaultPhotos);
        }
        if (parsed.unitSystem === 'metric' || parsed.unitSystem === 'imperial') {
          setUnitSystem(parsed.unitSystem);
        }
        if (
          parsed.photoStorageMode === 'app-compressed' ||
          parsed.photoStorageMode === 'phone-link'
        ) {
          setPhotoStorageMode(parsed.photoStorageMode);
        }
        setToastMessage('Restored logbook backup');
      } catch {
        setToastMessage('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSpecies = (
    commonName: string,
    familyId: CritterFamilyId
  ): CritterSpecies => {
    const existing = speciesList.find(
      (s) => s.commonName.toLowerCase() === commonName.toLowerCase()
    );
    if (existing) return existing;

    const created: CritterSpecies = {
      id: `sp-custom-${Date.now()}`,
      commonName,
      scientificName: '',
      familyId,
      rarity: 'Common',
      typicalDepthM: '',
      habitat: '',
      description: '',
    };
    setSpeciesList((prev) => [created, ...prev]);
    return created;
  };

  const handleInspectSpeciesInDex = (speciesId: string) => {
    setExpandedSpeciesId(speciesId);
    setActiveTab('critters');
  };

  const handleSelectDiveFromDex = (diveId: string) => {
    setSelectedDiveId(diveId);
    setInspectorReturnTab('critters');
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
          latestDiveNumber={careerTotalDives}
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
                    trips={trips}
                    buddyPool={buddyPool}
                    gearCategories={gearCategories}
                    selectedDiveId={selectedDive.id}
                    onSelectDive={(id) => {
                      setSelectedDiveId(id);
                      setInspectorReturnTab('dives');
                      setMobileDivesSubView('inspector');
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    unitSystem={unitSystem}
                    vaultPhotos={vaultPhotos}
                    onCreateTrip={handleCreateTrip}
                    onUpdateTripBuddies={handleUpdateTripBuddies}
                    onUpdateTripGear={handleUpdateTripGear}
                    openedTripId={openedTripId}
                    onOpenTrip={setOpenedTripId}
                    careerTotalDives={careerTotalDives}
                  />
                ) : (
                  <DiveInspector
                    dive={selectedDive}
                    trips={trips}
                    onChangeDiveTrip={handleChangeDiveTrip}
                    coverPhoto={coverPhoto}
                    galleryPhotos={galleryPhotos}
                    unitSystem={unitSystem}
                    onUploadPhotoToDive={handleUploadPhotoToDive}
                    speciesMap={speciesMap}
                    familyMap={familyMap}
                    onInspectSpeciesInDex={handleInspectSpeciesInDex}
                    onBackToLogbook={() => {
                      if (inspectorReturnTab !== 'dives') {
                        setActiveTab(inspectorReturnTab);
                      } else {
                        setMobileDivesSubView('list');
                      }
                    }}
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
                      trips={trips}
                      buddyPool={buddyPool}
                      gearCategories={gearCategories}
                      selectedDiveId={selectedDive.id}
                      onSelectDive={setSelectedDiveId}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      unitSystem={unitSystem}
                      vaultPhotos={vaultPhotos}
                      onCreateTrip={handleCreateTrip}
                      onUpdateTripBuddies={handleUpdateTripBuddies}
                      onUpdateTripGear={handleUpdateTripGear}
                      careerTotalDives={careerTotalDives}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <DiveInspector
                      dive={selectedDive}
                      trips={trips}
                      onChangeDiveTrip={handleChangeDiveTrip}
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
              nextDiveNumber={careerTotalDives + 1}
              trips={trips}
              onCreateTrip={handleCreateTrip}
              onUpdateTripBuddies={handleUpdateTripBuddies}
              allSpecies={speciesList}
              families={CRITTER_FAMILIES}
              onCreateSpecies={handleCreateSpecies}
              gearCategories={gearCategories}
              buddyPool={buddyPool}
              onAddBuddyToPool={(b) =>
                setBuddyPool((prev) => (prev.includes(b) ? prev : [...prev, b]))
              }
              onRemoveBuddyFromPool={handleRemoveBuddyFromPool}
              unitSystem={unitSystem}
              onSaveNewDive={handleSaveNewDive}
            />
          )}

          {activeTab === 'gear' && (
            <GearAndCrewView
              dives={dives}
              certifications={certifications}
              onAddCertification={handleAddCertification}
              onRemoveCertification={handleRemoveCertification}
              gearCategories={gearCategories}
              onAddGearCategory={handleAddGearCategory}
              onRemoveGearCategory={handleRemoveGearCategory}
              onAddGearItemToCategory={handleAddGearItemToCategory}
              onRemoveGearItemFromCategory={handleRemoveGearItemFromCategory}
              buddyPool={buddyPool}
              onAddBuddyToPool={(b) =>
                setBuddyPool((prev) => (prev.includes(b) ? prev : [...prev, b]))
              }
              onRemoveBuddyFromPool={handleRemoveBuddyFromPool}
            />
          )}

          {activeTab === 'critters' && (
            <CritterDexView
              families={CRITTER_FAMILIES}
              species={speciesList}
              dives={dives}
              selectedDiveId={selectedDive.id}
              onSelectDiveId={setSelectedDiveId}
              onMergeCritterDelta={handleMergeCritterDelta}
              unitSystem={unitSystem}
              searchQuery={critterSearchQuery}
              onSearchChange={setCritterSearchQuery}
              expandedSpeciesId={expandedSpeciesId}
              onToggleExpandedSpecies={(speciesId) =>
                setExpandedSpeciesId((prev) =>
                  prev === speciesId ? null : speciesId
                )
              }
              onSelectDiveFromDex={handleSelectDiveFromDex}
            />
          )}

          {activeTab === 'stats' && (
            <StatsAndCalculatorsView
              dives={dives}
              unitSystem={unitSystem}
              onSelectDive={(id) => {
                setSelectedDiveId(id);
                setInspectorReturnTab('stats');
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
          critterSpeciesCount={loggedSpeciesCount}
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

        {/* Settings Sheet (Initial Dives + Data & Storage + Measurement Units) */}
        {isSettingsOpen && (
          <SettingsModal
            unitSystem={unitSystem}
            onChangeUnitSystem={setUnitSystem}
            initialDiveCount={initialDiveCount}
            onChangeInitialDiveCount={handleChangeInitialDiveCount}
            photoStorageMode={photoStorageMode}
            onChangePhotoStorageMode={(mode) => {
              setPhotoStorageMode(mode);
              setToastMessage(
                mode === 'app-compressed'
                  ? 'Photos will be compressed & stored safely in app data'
                  : 'Photos will reference your phone gallery only'
              );
            }}
            dives={dives}
            trips={trips}
            buddyPool={buddyPool}
            gearLocker={flatGearLocker}
            vaultPhotos={vaultPhotos}
            onConvertLinkedPhotosToApp={handleConvertLinkedPhotosToApp}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;

