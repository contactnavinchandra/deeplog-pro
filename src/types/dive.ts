export type UnitSystem = 'metric' | 'imperial';

export type TabId = 'dives' | 'log' | 'gear' | 'critters' | 'stats';

export type CritterFamilyId =
  | 'frogfish'
  | 'cuttlefish'
  | 'squid'
  | 'octopus'
  | 'nudibranch'
  | 'wrasse'
  | 'seahorse'
  | 'shrimp'
  | 'moray'
  | 'turtle';

export interface CritterFamilyMeta {
  id: CritterFamilyId;
  name: string;
  taxonomy: string;
  accentColor: string;
  badgeBg: string;
  description: string;
}

export interface CritterSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  familyId: CritterFamilyId;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Holy Grail';
  typicalDepthM: string;
  habitat: string;
  description: string;
}

export interface SpottedCritter {
  speciesId: string;
  count: number;
  highlight?: boolean;
}

export interface VaultPhoto {
  id: string;
  diveNumber: number;
  caption: string;
  timestamp: string;
  /** Private app sandbox WebP data URL (simulating Capacitor Directory.Data) */
  vaultWebpDataUrl: string;
  /** Simulated phone OS gallery path (broken when user deletes phone gallery photos) */
  originalPhoneUri: string;
  /** Original phone photo size in KB (e.g., 4200 KB HEIC/JPEG) */
  originalSizeKB: number;
  /** Compressed WebP vault size in KB (~28-38 KB) */
  vaultSizeKB: number;
  width: number;
  height: number;
  isUserUploaded?: boolean;
}

export interface DiveRecord {
  id: string;
  diveNumber: number;
  siteName: string;
  subLocation: string;
  operator: string;
  date: string;
  timeIn: string;
  maxDepthM: number;
  avgDepthM: number;
  bottomTimeMin: number;
  startPressureBar: number;
  endPressureBar: number;
  tankVolumeL: number;
  gasMix: string;
  o2Percent: number;
  waterTempC: number;
  visibilityM: number;
  entryType: 'Jukung Outrigger' | 'Speedboat Roll' | 'Shore Entry' | 'Negative Drift';
  current: 'Calm' | 'Mild' | 'Moderate' | 'Washing Machine';
  buddies: string[];
  diveGuide: string;
  gearUsed: string[];
  notes: string;
  critters: SpottedCritter[];
  coverPhotoId: string;
  photoIds: string[];
  computerModel: string;
  safetyStopMin: number;
}
